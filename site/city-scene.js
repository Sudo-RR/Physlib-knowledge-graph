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
  const layout=layoutFullCity(city), scene=new THREE.Scene();scene.background=new THREE.Color(0xe9edf1);
  const camera=new THREE.PerspectiveCamera(40,1,.1,3000),renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
  const overlay=document.createElement('div');overlay.className='city-labels';overlay.setAttribute('aria-hidden','true');host.append(overlay);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI-.03;controls.minDistance=3;controls.maxDistance=1500;
  scene.add(new THREE.HemisphereLight(0xe8f3ff,0x566372,2.1));
  const sun=new THREE.DirectionalLight(0xfff5e6,2.7);sun.position.set(-80,160,90);scene.add(sun);
  const materials={
    Physlib:new THREE.MeshStandardMaterial({map:facade('#2d4f73','#cce4f5'),roughness:.42,metalness:.32}),
    Mathlib:new THREE.MeshStandardMaterial({map:facade('#384a5b','#a9c4d5'),roughness:.5,metalness:.28}),
    selected:new THREE.MeshStandardMaterial({map:facade('#234985','#e5f1ff'),roughness:.35,metalness:.4}),
    floor:new THREE.MeshStandardMaterial({color:0x76bdff,roughness:.3,metalness:.3})
  };
  const nodeById=new Map(city.nodes.map(n=>[n.id,n])), buildings=new Map(),positions=new Map(),districts=new Map(),labels=[],edges=new THREE.Group();
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(100,layout.width+20),Math.max(100,layout.depth+20)),new THREE.MeshBasicMaterial({color:0xbacbd8,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}));ground.rotation.x=-Math.PI/2;ground.position.y=-.05;scene.add(ground);
  for(const district of layout.districts){
    const block=new THREE.Mesh(new THREE.BoxGeometry(district.size,.15,district.size),new THREE.MeshStandardMaterial({color:0xa9b7c2,transparent:true,opacity:.24,depthWrite:false,roughness:1}));block.position.set(district.x,-.11,district.z);scene.add(block);
    const label=document.createElement('span');label.className='city-district-label';label.textContent=district.id.split('/').slice(-2).join(' / ');overlay.append(label);
    labels.push({id:district.id,element:label,position:new THREE.Vector3(district.x,.2,district.z-district.size/2)});districts.set(district.id,district);
  }
  for(const node of city.nodes){
    const point=layout.positions.get(node.id),data=floors.get(node.id),direction=node.library==='Mathlib'?-1:1;
    const group=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(1.9,data.height,1.9),materials[node.library]);
    group.position.set(point.x,0,point.z);body.position.y=direction*data.height/2;body.userData={id:node.id};group.add(body);scene.add(group);
    buildings.set(node.id,{group,body,node,direction});positions.set(node.id,new THREE.Vector3(point.x,direction*data.height,point.z));
  }
  scene.add(edges);let mode='city',selected=null,currentDistance=Math.max(layout.width,layout.depth,90)*1.15;
  const extent=Math.max(layout.width,layout.depth,90),fitTarget=new THREE.Vector3(0,0,0);
  function setView(next,focus=controls.target.clone(),distance=currentDistance){mode=next;currentDistance=distance;controls.target.copy(focus);const offset=next==='map'?new THREE.Vector3(0,distance,.01):next==='section'?new THREE.Vector3(distance*.15,distance*.08,distance):new THREE.Vector3(distance*.55,distance*.65,distance*.7);camera.position.copy(focus).add(offset);controls.update();}
  function focusFolder(folder){const members=city.nodes.filter(n=>n.module.path.replaceAll('\\','/').startsWith(`${folder}/`));if(!members.length)return;const points=members.map(n=>positions.get(n.id)),centre=points.reduce((a,p)=>a.add(p),new THREE.Vector3()).divideScalar(points.length);let radius=10;for(const p of points)radius=Math.max(radius,p.distanceTo(centre));setView(mode,centre,Math.max(25,radius*3));}
  function focusBuilding(id){const b=buildings.get(id);if(!b)return;const height=floors.get(id).height,centre=b.group.position.clone().add(new THREE.Vector3(0,b.direction*height/2,0)),distance=Math.max(12,height*2.1);setView(mode,centre,distance);if(b.direction<0&&mode==='city'){camera.position.copy(centre).add(new THREE.Vector3(distance*.55,-distance*.5,distance*.7));controls.update();}}
  function clearFloors(building){for(const child of [...building.group.children])if(child!==building.body){building.group.remove(child);child.geometry.dispose();}building.body.visible=true;}
  function select(id){
    if(selected&&buildings.has(selected)){const previous=buildings.get(selected);clearFloors(previous);previous.body.material=materials[previous.node.library];}
    selected=id;const b=buildings.get(id);if(!b)return;b.body.material=materials.selected;
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
  renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
  renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const visible=[...buildings.values()].flatMap(b=>b.group.children.filter(child=>child.visible));const hit=ray.intersectObjects(visible,false)[0];if(hit){const {id,floor}=hit.object.userData;if(id===selected&&Number.isInteger(floor))onFloor(id,floor);else if(id)onSelect(id);}});
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}new ResizeObserver(resize).observe(host);resize();setView('city',fitTarget);
  renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);const active=nodeById.get(selected),activeDistrict=active&&districtFor(active),occupied=[];
    for(const label of [...labels].sort((a,b)=>Number(b.id===activeDistrict)-Number(a.id===activeDistrict))){const p=label.position.clone().project(camera),x=(p.x+1)*host.clientWidth/2,y=(1-p.y)*host.clientHeight/2,width=Math.min(160,label.element.textContent.length*5.5+14),box={left:x-width/2,right:x+width/2,top:y-10,bottom:y+10};const hidden=occupied.length>=8||p.z>1||box.left<0||box.right>host.clientWidth||box.top<0||box.bottom>host.clientHeight||(x>host.clientWidth-170&&y<160)||occupied.some(o=>box.left<o.right&&box.right>o.left&&box.top<o.bottom&&box.bottom>o.top);label.element.hidden=hidden;label.element.classList.toggle('active',label.id===activeDistrict);if(!hidden)occupied.push(box);label.element.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px)`;}
  });
  function zoom(factor){camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);currentDistance=camera.position.distanceTo(controls.target);controls.update();}
  return {select,selectFloor,showDeclarationLinks:links=>drawLinks(links,true).drawn,focusFolder,focusBuilding,setView,zoom,reset:()=>setView(mode,fitTarget,extent*1.15),get selected(){return selected;}};
}
