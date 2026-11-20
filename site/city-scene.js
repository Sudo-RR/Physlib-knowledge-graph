import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { districtFor } from './city-model.js';
import { layoutFullCity } from './city-layout.js';

function facade(base,windowColor) {
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,64,128);
  for(let y=4;y<128;y+=12)for(let x=5;x<64;x+=12){ctx.fillStyle=(x+y)%3===0?windowColor:'#8ca0b0';ctx.fillRect(x,y,6,7);ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(x,y,6,1);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export function createCityScene(host,city,floors,onSelect,onFloor) {
  const layout=layoutFullCity(city), scene=new THREE.Scene();
  const sky=document.createElement('canvas');sky.width=2;sky.height=256;const skyContext=sky.getContext('2d'),gradient=skyContext.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#799cb6');gradient.addColorStop(.65,'#c1d5df');gradient.addColorStop(1,'#e6e9dd');skyContext.fillStyle=gradient;skyContext.fillRect(0,0,2,256);scene.background=new THREE.CanvasTexture(sky);scene.background.colorSpace=THREE.SRGBColorSpace;
  const camera=new THREE.PerspectiveCamera(40,1,.1,3000),renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Interactive 3D city. Drag to look around, right-drag to pan, scroll to zoom, and use W A S D to move.');
  const overlay=document.createElement('div');overlay.className='city-labels';overlay.setAttribute('aria-hidden','true');host.append(overlay);
  const tooltip=document.createElement('div');tooltip.className='city-hover';tooltip.hidden=true;overlay.append(tooltip);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI-.03;controls.minDistance=3;controls.maxDistance=1500;
  controls.listenToKeyEvents(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xe8f3ff,0x566372,2.1));
  const sun=new THREE.DirectionalLight(0xfff5e6,2.7);sun.position.set(-80,160,90);scene.add(sun);
  const materials={
    Physlib:new THREE.MeshStandardMaterial({map:facade('#2d4f73','#cce4f5'),roughness:.42,metalness:.32}),
    Mathlib:new THREE.MeshStandardMaterial({map:facade('#384a5b','#a9c4d5'),roughness:.5,metalness:.28}),
    selected:new THREE.MeshStandardMaterial({map:facade('#234985','#e5f1ff'),roughness:.35,metalness:.4}),
    floor:new THREE.MeshStandardMaterial({color:0x76bdff,roughness:.3,metalness:.3})
  };
  const nodeById=new Map(city.nodes.map(n=>[n.id,n])), buildings=new Map(),positions=new Map(),districts=new Map(),labels=[],edges=new THREE.Group();
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(180,layout.width+120),Math.max(180,layout.depth+120)),new THREE.MeshStandardMaterial({color:0x708b82,transparent:true,opacity:.82,depthWrite:false,roughness:1,side:THREE.DoubleSide}));ground.rotation.x=-Math.PI/2;ground.position.y=-.2;scene.add(ground);
  for(const district of layout.districts){
    const block=new THREE.Mesh(new THREE.BoxGeometry(district.size,.15,district.size),new THREE.MeshStandardMaterial({color:0xb9bcb1,transparent:true,opacity:.8,depthWrite:false,roughness:1}));block.position.set(district.x,-.1,district.z);scene.add(block);
    const label=document.createElement('span');label.className='city-district-label';label.textContent=district.id.split('/').slice(-2).join(' / ');overlay.append(label);
    labels.push({id:district.id,element:label,position:new THREE.Vector3(district.x,.2,district.z-district.size/2)});districts.set(district.id,district);
  }
  // Trees are environmental landmarks; unlike buildings, they do not represent modules.
  const treePlaces=layout.districts.slice(0,80).flatMap(d=>[[d.x-d.size/2-1,d.z-d.size/2-1],[d.x+d.size/2+1,d.z+d.size/2+1]]);
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.16,1.1,6),new THREE.MeshStandardMaterial({color:0x705c48,roughness:1}),treePlaces.length),canopies=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.8,1),new THREE.MeshStandardMaterial({color:0x557c68,roughness:1}),treePlaces.length),treeMatrix=new THREE.Matrix4();
  treePlaces.forEach(([x,z],i)=>{treeMatrix.makeTranslation(x,.55,z);trunks.setMatrixAt(i,treeMatrix);treeMatrix.makeTranslation(x,1.6,z);canopies.setMatrixAt(i,treeMatrix);});scene.add(trunks,canopies);
  for(const node of city.nodes){
    const point=layout.positions.get(node.id),data=floors.get(node.id),direction=node.library==='Mathlib'?-1:1;
    const group=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(1.9,data.height,1.9),materials[node.library]);
    group.position.set(point.x,0,point.z);body.position.y=direction*data.height/2;body.userData={id:node.id};group.add(body);scene.add(group);
    buildings.set(node.id,{group,body,node,direction});positions.set(node.id,new THREE.Vector3(point.x,direction*data.height,point.z));
  }
  scene.add(edges);let selected=null,transition=null;
  const anchor=layout.positions.get('Physlib.ClassicalMechanics.EulerLagrange')||layout.positions.get(city.nodes.find(n=>n.library==='Physlib')?.id)||{x:0,z:0};
  const homeTarget=new THREE.Vector3(anchor.x,6,anchor.z),homePosition=homeTarget.clone().add(new THREE.Vector3(25,5,32));
  function travel(focus,position){transition={start:performance.now(),from:camera.position.clone(),fromTarget:controls.target.clone(),to:position.clone(),toTarget:focus.clone()};}
  controls.addEventListener('start',()=>{transition=null;});
  function lookAt(focus,distance,below=false){travel(focus,focus.clone().add(new THREE.Vector3(distance*.55,(below?-.18:.18)*distance,distance*.75)));}
  function showAll(){for(const b of buildings.values())b.group.visible=true;}
  function focusFolder(folder){showAll();const members=city.nodes.filter(n=>n.module.path.replaceAll('\\','/').startsWith(`${folder}/`));if(!members.length)return;const points=members.map(n=>positions.get(n.id)),centre=points.reduce((a,p)=>a.add(p),new THREE.Vector3()).divideScalar(points.length);let radius=10;for(const p of points)radius=Math.max(radius,p.distanceTo(centre));lookAt(centre,Math.max(25,radius*2),members.every(n=>n.library==='Mathlib'));}
  function focusBuilding(id){const b=buildings.get(id);if(!b)return;showAll();const height=floors.get(id).height,centre=b.group.position.clone().add(new THREE.Vector3(0,b.direction*height/2,0)),distance=Math.max(12,height*2.1);lookAt(centre,distance,b.direction<0);}
  function clearFloors(building){for(const child of [...building.group.children])if(child!==building.body){building.group.remove(child);child.geometry.dispose();}building.body.visible=true;}
  function select(id){
    if(selected&&buildings.has(selected)){const previous=buildings.get(selected);clearFloors(previous);previous.body.material=materials[previous.node.library];}
    selected=id;const b=buildings.get(id);if(!b)return drawLinks([],false);b.body.material=materials.selected;
    const data=floors.get(id);if(data.floors.length){b.body.visible=false;const h=data.height/data.floors.length;
      for(const floor of data.floors){const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.9,Math.max(.1,h-.08),1.9),materials.selected);mesh.position.y=b.direction*(floor.index+.5)*h;mesh.userData={id,floor:floor.index};b.group.add(mesh);}}
    return drawLinks(city.edges.filter(e=>e.from===id||e.to===id),false);
  }
  function selectFloor(id,index){const b=buildings.get(id);if(!b||id!==selected)return;for(const mesh of b.group.children)if(mesh!==b.body)mesh.material=mesh.userData.floor===index?materials.floor:materials.selected;}
  function drawLinks(links,dashed){
    for(const item of edges.children)item.dispose();edges.clear();const pairs=new Set();let drawn=0;
    for(const link of links){if(!positions.has(link.from)||!positions.has(link.to))continue;const key=JSON.stringify([link.from,link.to]);if(pairs.has(key))continue;pairs.add(key);
      if(drawn>=80)continue;const from=positions.get(link.from),to=positions.get(link.to),vector=to.clone().sub(from);if(vector.length()<.01)continue;drawn++;
      const arrow=new THREE.ArrowHelper(vector.clone().normalize(),from,vector.length(),dashed?0x49576c:0x0055c9,1,.5);
      if(dashed){arrow.line.material.dispose();arrow.line.material=new THREE.LineDashedMaterial({color:0x49576c,dashSize:1,gapSize:.6,depthTest:false});arrow.line.computeLineDistances();}
      arrow.line.material.depthTest=false;arrow.cone.material.depthTest=false;arrow.line.renderOrder=100;arrow.cone.renderOrder=100;edges.add(arrow);
    }return {drawn,total:pairs.size};
  }
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];renderer.domElement.focus({preventScroll:true});});
  function pick(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const visible=[...buildings.values()].filter(b=>b.group.visible).flatMap(b=>b.group.children.filter(child=>child.visible));return ray.intersectObjects(visible,false)[0];}
  renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4)return;const hit=pick(e);if(hit){const {id,floor}=hit.object.userData;if(id===selected&&Number.isInteger(floor))onFloor(id,floor);else if(id)onSelect(id);}});
  let lastHover=0;renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons||performance.now()-lastHover<100){if(e.buttons)tooltip.hidden=true;return;}lastHover=performance.now();const hit=pick(e);if(!hit){tooltip.hidden=true;renderer.domElement.style.cursor='grab';return;}const {id,floor}=hit.object.userData;tooltip.textContent=Number.isInteger(floor)&&id===selected?`${id} · Floor ${floor+1}`:id;tooltip.hidden=false;tooltip.style.left=`${e.offsetX+12}px`;tooltip.style.top=`${e.offsetY+12}px`;renderer.domElement.style.cursor='pointer';});
  renderer.domElement.addEventListener('pointerleave',()=>{tooltip.hidden=true;});
  const keys=new Set(),clock=new THREE.Clock();
  window.addEventListener('keydown',event=>{if(event.ctrlKey||event.metaKey||event.altKey||/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target.tagName)||event.target.isContentEditable)return;const key=event.key.toLowerCase();if(['w','a','s','d','q','e'].includes(key)){event.preventDefault();keys.add(key);transition=null;}});
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
  function move(forward,right,up=0){const direction=new THREE.Vector3();camera.getWorldDirection(direction);direction.y=0;if(direction.lengthSq()<.001)direction.set(0,0,-1);direction.normalize();const sideways=new THREE.Vector3().crossVectors(direction,camera.up).normalize();const delta=direction.multiplyScalar(forward).addScaledVector(sideways,right).add(new THREE.Vector3(0,up,0));camera.position.add(delta);controls.target.add(delta);}
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}new ResizeObserver(resize).observe(host);resize();camera.position.copy(homePosition);controls.target.copy(homeTarget);controls.update();
  renderer.setAnimationLoop(()=>{const step=Math.min(clock.getDelta(),.05)*18;if(keys.size)move((Number(keys.has('w'))-Number(keys.has('s')))*step,(Number(keys.has('d'))-Number(keys.has('a')))*step,(Number(keys.has('e'))-Number(keys.has('q')))*step);if(transition){const t=Math.min(1,(performance.now()-transition.start)/550),ease=1-(1-t)**3;camera.position.lerpVectors(transition.from,transition.to,ease);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,ease);if(t===1)transition=null;}controls.update();renderer.render(scene,camera);const active=nodeById.get(selected),activeDistrict=active&&districtFor(active),occupied=[];
    for(const label of [...labels].sort((a,b)=>Number(b.id===activeDistrict)-Number(a.id===activeDistrict))){const p=label.position.clone().project(camera),x=(p.x+1)*host.clientWidth/2,y=(1-p.y)*host.clientHeight/2,width=Math.min(160,label.element.textContent.length*5.5+14),box={left:x-width/2,right:x+width/2,top:y-10,bottom:y+10};const hidden=occupied.length>=8||p.z>1||box.left<0||box.right>host.clientWidth||box.top<0||box.bottom>host.clientHeight||(x>host.clientWidth-170&&y<160)||occupied.some(o=>box.left<o.right&&box.right>o.left&&box.top<o.bottom&&box.bottom>o.top);label.element.hidden=hidden;label.element.classList.toggle('active',label.id===activeDistrict);if(!hidden)occupied.push(box);label.element.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px)`;}
  });
  function zoom(factor){const position=camera.position.clone().sub(controls.target).multiplyScalar(factor).add(controls.target);travel(controls.target,position);}
  return {select,selectFloor,showDeclarationLinks:links=>drawLinks(links,true).drawn,focusFolder,focusBuilding,zoom,move:(forward,right)=>{transition=null;move(forward,right);},reset:()=>{showAll();travel(homeTarget,homePosition);},get selected(){return selected;}};
}
