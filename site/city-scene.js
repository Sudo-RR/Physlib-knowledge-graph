import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { districtFor } from './city-model.js';
import { layoutFullCity } from './city-layout.js';
import { visibleRelations, allMathlibPipelines } from './city-relations.js';

function facade(base,windowColor) {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;
  const ctx=canvas.getContext('2d'),glass=ctx.createLinearGradient(0,0,128,0);glass.addColorStop(0,base);glass.addColorStop(.5,'#41596e');glass.addColorStop(1,base);ctx.fillStyle=glass;ctx.fillRect(0,0,128,256);
  for(let y=6;y<256;y+=16){ctx.fillStyle='rgba(18,36,51,.58)';ctx.fillRect(0,y+11,128,3);for(let x=5;x<128;x+=16){ctx.fillStyle=(x+y)%3===0?windowColor:'#8ca8b8';ctx.fillRect(x,y,9,9);ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(x,y,9,1);}}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function topicColor(id){let hash=0;for(const c of id)hash=(hash*31+c.charCodeAt(0))>>>0;return new THREE.Color().setHSL((hash%360)/360,.46,.52);}
function readable(name){return name==='General'?'General files':name.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/([A-Z])([A-Z][a-z])/g,'$1 $2');}

export function createCityScene(host,city,floors,onSelect,onFloor) {
  const layout=layoutFullCity(city), scene=new THREE.Scene();
  const sky=document.createElement('canvas');sky.width=2;sky.height=256;const skyContext=sky.getContext('2d'),gradient=skyContext.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#345c80');gradient.addColorStop(.55,'#93b8cb');gradient.addColorStop(1,'#f3dac2');skyContext.fillStyle=gradient;skyContext.fillRect(0,0,2,256);scene.background=new THREE.CanvasTexture(sky);scene.background.colorSpace=THREE.SRGBColorSpace;
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
    PhyslibAlpha:new THREE.MeshStandardMaterial({map:facade('#80663e','#f5dfab'),roughness:.42,metalness:.32}),
    QuantumInfo:new THREE.MeshStandardMaterial({map:facade('#46695c','#c2e3d5'),roughness:.42,metalness:.32}),
    Mathlib:new THREE.MeshStandardMaterial({map:facade('#384a5b','#a9c4d5'),roughness:.5,metalness:.28}),
    selected:new THREE.MeshStandardMaterial({map:facade('#234985','#e5f1ff'),roughness:.35,metalness:.4}),
    related:new THREE.MeshStandardMaterial({map:facade('#337f91','#e0ffff'),roughness:.4,metalness:.25}),
    floor:new THREE.MeshStandardMaterial({color:0x76bdff,roughness:.3,metalness:.3})
  };
  const topicMaterials=new Map(layout.topics.map(topic=>{const base=new THREE.Color(topic.root==='PhyslibAlpha'?0x66513e:topic.root==='QuantumInfo'?0x31564b:0x273f59).lerp(topicColor(topic.id),.55);return [topic.id,new THREE.MeshStandardMaterial({map:facade(`#${base.getHexString()}`,'#d4e9f1'),roughness:.43,metalness:.28})];}));
  const districtTopics=new Map(layout.districts.flatMap(d=>d.nodes.map(node=>[node.id,d.topic])));
  const baseMaterial=node=>topicMaterials.get(districtTopics.get(node.id))||(node.library==='Mathlib'?materials.Mathlib:materials.Physlib);
  const nodeById=new Map(city.nodes.map(n=>[n.id,n])), buildings=new Map(),positions=new Map(),districts=new Map(),labels=[],edges=new THREE.Group(),pipes=new THREE.Group(),aboveScenery=[],belowScenery=[];
  function scenery(object,underground=false){scene.add(object);(underground?belowScenery:aboveScenery).push(object);}
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(180,layout.width+120),Math.max(180,layout.depth+120)),new THREE.MeshStandardMaterial({color:0x657f79,transparent:true,opacity:.72,depthWrite:false,roughness:1,side:THREE.DoubleSide}));ground.rotation.x=-Math.PI/2;ground.position.y=-.2;scene.add(ground);
  // Root boundary rings and roads are decorative geography, not dependency edges.
  for(const zone of layout.zones){
    const rim=new THREE.Mesh(new THREE.RingGeometry(zone.radius+5,zone.radius+6.3,96),new THREE.MeshBasicMaterial({color:zone.id==='Mathlib'?0x5caeb0:zone.id==='PhyslibAlpha'?0xb38b51:zone.id==='QuantumInfo'?0x558d78:0x668ab7,transparent:true,opacity:.65,depthWrite:false,side:THREE.DoubleSide}));rim.rotation.x=-Math.PI/2;rim.position.set(zone.x,zone.underground?-2:-.08,zone.z);scenery(rim,zone.underground);
    if(zone.underground)continue;
    const sign=document.createElement('canvas');sign.width=512;sign.height=128;const ctx=sign.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,128);ctx.fillStyle=zone.id==='PhyslibAlpha'?'#8b641f':zone.id==='QuantumInfo'?'#346e58':'#002fa7';ctx.fillRect(0,0,18,128);ctx.fillStyle='#182b39';ctx.font='bold 56px sans-serif';ctx.fillText(zone.id,36,82);const texture=new THREE.CanvasTexture(sign);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture}));sprite.position.set(zone.x-zone.radius+12,9,zone.minZ-3);sprite.scale.set(20,5,1);scenery(sprite);
  }
  for(const topic of layout.topics){
    const color=topicColor(topic.id);if(!topic.underground){const park=new THREE.Mesh(new THREE.CircleGeometry(topic.radius+2,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.36,depthWrite:false,side:THREE.DoubleSide}));park.rotation.x=-Math.PI/2;park.position.set(topic.x,-.15,topic.z);scenery(park);}
    const label=document.createElement('span');label.className='city-district-label city-topic-label';label.style.borderLeftColor=`#${color.getHexString()}`;label.textContent=`${readable(topic.name)} · ${topic.root}`;overlay.append(label);labels.push({id:topic.id,element:label,topic:true,underground:topic.underground,position:new THREE.Vector3(topic.x,topic.underground?-4:3,topic.z)});
  }
  for(const zone of layout.zones){const cities=layout.topics.filter(topic=>topic.root===zone.id);for(let i=1;i<cities.length;i++){const from=cities[i],to=cities.slice(0,i).reduce((best,c)=>Math.hypot(c.x-from.x,c.z-from.z)<Math.hypot(best.x-from.x,best.z-from.z)?c:best,cities[0]),y=zone.underground?-2:.05;const midpoint=new THREE.Vector3((from.x+to.x)/2,y,(from.z+to.z)/2),curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(from.x,y,from.z),midpoint,new THREE.Vector3(to.x,y,to.z));const road=new THREE.Mesh(new THREE.TubeGeometry(curve,20,.32,5,false),new THREE.MeshBasicMaterial({color:0xcdd4c8,transparent:true,opacity:.8,depthWrite:false}));scenery(road,zone.underground);}}
  for(const district of layout.districts){
    if(!district.underground){const block=new THREE.Mesh(new THREE.CircleGeometry(district.radius,32),new THREE.MeshStandardMaterial({color:0xd2d1bf,transparent:true,opacity:.7,depthWrite:false,roughness:1,side:THREE.DoubleSide}));block.rotation.x=-Math.PI/2;block.position.set(district.x,-.1,district.z);scenery(block);}
    const label=document.createElement('span');label.className='city-district-label';const parts=district.id.split('/');label.textContent=parts.length>2?`${parts[0]} / ${parts.slice(-2).join(' / ')}`:parts.join(' / ');overlay.append(label);
    labels.push({id:district.id,element:label,underground:district.underground,position:new THREE.Vector3(district.x,district.underground?-3:.2,district.z-district.size/2)});districts.set(district.id,district);
  }
  // Trees are environmental landmarks; unlike buildings, they do not represent modules.
  const treePlaces=layout.districts.filter(d=>!d.underground).slice(0,80).flatMap(d=>[[d.x-d.size/2-1,d.z-d.size/2-1],[d.x+d.size/2+1,d.z+d.size/2+1]]);
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.16,1.1,6),new THREE.MeshStandardMaterial({color:0x705c48,roughness:1}),treePlaces.length),canopies=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.8,1),new THREE.MeshStandardMaterial({color:0x557c68,roughness:1}),treePlaces.length),treeMatrix=new THREE.Matrix4();
  treePlaces.forEach(([x,z],i)=>{treeMatrix.makeTranslation(x,.55,z);trunks.setMatrixAt(i,treeMatrix);treeMatrix.makeTranslation(x,1.6,z);canopies.setMatrixAt(i,treeMatrix);});scenery(trunks);scenery(canopies);
  for(const node of city.nodes){
    const point=layout.positions.get(node.id),data=floors.get(node.id),direction=node.library==='Mathlib'?-1:1;
    const group=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(1.9,data.height,1.9),baseMaterial(node));
    group.position.set(point.x,0,point.z);body.position.y=direction*data.height/2;body.userData={id:node.id};group.add(body);scene.add(group);
    buildings.set(node.id,{group,body,node,direction});positions.set(node.id,new THREE.Vector3(point.x,direction*data.height,point.z));
  }
  const pipelineLinks=allMathlibPipelines(city);
  function pipelineCurve(link){const source=buildings.get(link.from),target=buildings.get(link.to);if(!source||!target)return null;
    const a=source.group.position.clone().add(new THREE.Vector3(0,-.5,0)),b=target.group.position.clone().add(new THREE.Vector3(0,-Math.max(1,floors.get(link.to).height*.5),0));
    const depth=-Math.max(3,Math.min(9,Math.hypot(a.x-b.x,a.z-b.z)*.035));return new THREE.CubicBezierCurve3(a,new THREE.Vector3(a.x,depth,a.z),new THREE.Vector3(b.x,depth,b.z),b);
  }
  const segments=[];for(const link of pipelineLinks){const curve=pipelineCurve(link);if(!curve)continue;const points=curve.getPoints(16);for(let i=1;i<points.length;i++)segments.push(...points[i-1].toArray(),...points[i].toArray());}
  const networkGeometry=new THREE.BufferGeometry();networkGeometry.setAttribute('position',new THREE.Float32BufferAttribute(segments,3));
  const network=new THREE.LineSegments(networkGeometry,new THREE.LineBasicMaterial({color:0x39e2df,transparent:true,opacity:.16,depthWrite:false}));network.frustumCulled=false;scene.add(network,edges,pipes);
  let selected=null,transition=null,relationMode='imports',showPipes=true;
  const fadedMaterials=new Map();
  function fadeMaterial(material){if(!fadedMaterials.has(material)){const faded=material.clone();faded.transparent=true;faded.opacity=.12;faded.depthWrite=false;fadedMaterials.set(material,faded);}return fadedMaterials.get(material);}
  function setBuildingFocus(){for(const [id,b] of buildings)if(id!==selected)b.body.material=selected?fadeMaterial(baseMaterial(b.node)):baseMaterial(b.node);}
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
    if(selected&&buildings.has(selected)){const previous=buildings.get(selected);clearFloors(previous);previous.body.material=baseMaterial(previous.node);}
    selected=id;setBuildingFocus();drawPipes();const b=buildings.get(id);if(!b)return drawLinks([],false);b.body.material=materials.selected;
    const data=floors.get(id);if(data.floors.length){b.body.visible=false;const h=data.height/data.floors.length;
      for(const floor of data.floors){const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.9,Math.max(.1,h-.08),1.9),materials.selected);mesh.position.y=b.direction*(floor.index+.5)*h;mesh.userData={id,floor:floor.index};b.group.add(mesh);}}
    return drawFileLinks();
  }
  function selectFloor(id,index){const b=buildings.get(id);if(!b||id!==selected)return;for(const mesh of b.group.children)if(mesh!==b.body)mesh.material=mesh.userData.floor===index?materials.floor:materials.selected;}
  function drawPipes(){
    for(const mesh of pipes.children){mesh.geometry.dispose();mesh.material.dispose();}pipes.clear();
    const links=pipelineLinks.filter(edge=>edge.from===selected||edge.to===selected);network.visible=showPipes;network.material.opacity=selected ? .025 : .16;if(!showPipes)return links.length;
    for(const link of links){const curve=pipelineCurve(link);if(!curve)continue;
      const pipe=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.18,6,false),new THREE.MeshBasicMaterial({color:0x34e5e3,transparent:true,opacity:.86,depthTest:false}));pipe.renderOrder=90;pipes.add(pipe);
    }return links.length;
  }
  function drawFileLinks(){return drawLinks(city.edges.filter(e=>e.from===selected||e.to===selected),false);}
  function drawLinks(links,dashed){
    for(const item of edges.children){item.geometry?.dispose();item.material?.dispose();}edges.clear();
    setBuildingFocus();
    const candidates=links.filter(link=>positions.has(link.from)&&positions.has(link.to));
    const result=visibleRelations(candidates,selected,dashed?'both':relationMode,12);let drawn=0;
    for(const link of result.links){const from=positions.get(link.from),to=positions.get(link.to),distance=from.distanceTo(to);if(distance<.01)continue;drawn++;
      if(!dashed&&showPipes&&link.from===selected&&nodeById.get(link.to)?.library==='Mathlib')continue;
      const middle=from.clone().add(to).multiplyScalar(.5);middle.y+=(from.y<0&&to.y<0?-1:1)*Math.min(12,Math.max(2,distance*.12));
      const curve=new THREE.QuadraticBezierCurve3(from,middle,to),geometry=new THREE.BufferGeometry().setFromPoints(curve.getPoints(32));
      const line=new THREE.Line(geometry,dashed?new THREE.LineDashedMaterial({color:0x235d70,dashSize:1,gapSize:.6}):new THREE.LineBasicMaterial({color:link.from===selected?0x0055c9:0xb36b16}));if(dashed)line.computeLineDistances();edges.add(line);
      const direction=curve.getTangent(.96).normalize(),cone=new THREE.Mesh(new THREE.ConeGeometry(.36,1,8),new THREE.MeshBasicMaterial({color:link.from===selected?0x0055c9:0xb36b16}));cone.position.copy(curve.getPoint(.96));cone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);edges.add(cone);
    }return {drawn,total:result.total};
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
  renderer.setAnimationLoop(()=>{const step=Math.min(clock.getDelta(),.05)*18;if(keys.size)move((Number(keys.has('w'))-Number(keys.has('s')))*step,(Number(keys.has('d'))-Number(keys.has('a')))*step,(Number(keys.has('e'))-Number(keys.has('q')))*step);if(transition){const t=Math.min(1,(performance.now()-transition.start)/550),ease=1-(1-t)**3;camera.position.lerpVectors(transition.from,transition.to,ease);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,ease);if(t===1)transition=null;}controls.update();const underground=camera.position.y<0;ground.material.opacity=underground ? .12 : .72;for(const object of aboveScenery)object.visible=!underground;for(const object of belowScenery)object.visible=underground;renderer.render(scene,camera);const active=nodeById.get(selected),activeDistrict=active&&districtFor(active),occupied=[];
    for(const label of [...labels].sort((a,b)=>Number(b.id===activeDistrict)-Number(a.id===activeDistrict)||Number(Boolean(b.topic))-Number(Boolean(a.topic)))){const p=label.position.clone().project(camera),x=(p.x+1)*host.clientWidth/2,y=(1-p.y)*host.clientHeight/2,width=Math.min(160,label.element.textContent.length*5.5+14),box={left:x-width/2,right:x+width/2,top:y-10,bottom:y+10};const hidden=Boolean(label.underground)!==(camera.position.y<0)||(!label.topic&&label.id!==activeDistrict)||occupied.length>=6||p.z>1||box.left<0||box.right>host.clientWidth||box.top<0||box.bottom>host.clientHeight||(x>host.clientWidth-170&&y<160)||occupied.some(o=>box.left<o.right&&box.right>o.left&&box.top<o.bottom&&box.bottom>o.top);label.element.hidden=hidden;label.element.classList.toggle('active',label.id===activeDistrict);if(!hidden)occupied.push(box);label.element.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px)`;}
  });
  function zoom(factor){const position=camera.position.clone().sub(controls.target).multiplyScalar(factor).add(controls.target);travel(controls.target,position);}
  return {select,selectFloor,setRelationMode:mode=>{relationMode=mode;return drawFileLinks();},setPipesVisible:value=>{showPipes=value;drawPipes();return drawFileLinks();},showDeclarationLinks:links=>drawLinks(links,true).drawn,focusFolder,focusBuilding,focusFoundations:()=>{const building=buildings.get(selected);if(!building)return;const focus=building.group.position.clone().add(new THREE.Vector3(0,-3,0));travel(focus,focus.clone().add(new THREE.Vector3(22,-12,30)));},zoom,move:(forward,right)=>{transition=null;move(forward,right);},reset:()=>{showAll();travel(homeTarget,homePosition);},get selected(){return selected;}};
}
