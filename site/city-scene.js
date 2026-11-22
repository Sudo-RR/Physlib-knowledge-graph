import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { districtFor } from './city-model.js';
import { layoutFullCity } from './city-layout.js';
import { visibleRelations, allMathlibPipelines, relationGroups } from './city-relations.js';
import { fitBox, cityBounds, createCollisionGrid, cameraClearance } from './city-camera.js';
import { buildingStyle, createCityArt } from './city-art.js';

function facade(base,windowColor) {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;
  const ctx=canvas.getContext('2d'),tint=new THREE.Color(base),light=tint.clone().lerp(new THREE.Color(windowColor),.3),windowTint=tint.clone().lerp(new THREE.Color(windowColor),.18),dark=tint.clone().multiplyScalar(.75),glass=ctx.createLinearGradient(0,0,128,0);glass.addColorStop(0,`#${dark.getHexString()}`);glass.addColorStop(.5,`#${light.getHexString()}`);glass.addColorStop(1,`#${tint.getHexString()}`);ctx.fillStyle=glass;ctx.fillRect(0,0,128,256);
  for(let y=6;y<256;y+=16){ctx.fillStyle='rgba(18,36,51,.45)';ctx.fillRect(0,y+11,128,3);for(let x=5;x<128;x+=16){ctx.fillStyle=(x+y)%3===0?`#${light.getHexString()}`:`#${windowTint.getHexString()}`;ctx.fillRect(x,y,9,9);ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(x,y,9,1);}}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function topicColor(id){let hash=0;for(const c of id)hash=(hash*31+c.charCodeAt(0))>>>0;return new THREE.Color().setHSL((hash%360)/360,.83,.54);}
function readable(name){return name==='General'?'General files':name.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/([A-Z])([A-Z][a-z])/g,'$1 $2');}

export function createCityScene(host,city,floors,onSelect,onFloor) {
  const sceneStarted=performance.now();
  const layout=layoutFullCity(city), scene=new THREE.Scene();
  const sky=document.createElement('canvas');sky.width=2;sky.height=256;const skyContext=sky.getContext('2d'),gradient=skyContext.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#345c80');gradient.addColorStop(.55,'#93b8cb');gradient.addColorStop(1,'#f3dac2');skyContext.fillStyle=gradient;skyContext.fillRect(0,0,2,256);scene.background=new THREE.CanvasTexture(sky);scene.background.colorSpace=THREE.SRGBColorSpace;
  const camera=new THREE.PerspectiveCamera(40,1,.1,Math.max(3000,layout.width*8,layout.depth*8)),renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Interactive 3D city. Drag to move, right-drag to turn, scroll to zoom, and use W A S D to move.');
  const overlay=document.createElement('div');overlay.className='city-labels';overlay.setAttribute('aria-hidden','true');host.append(overlay);
  const tooltip=document.createElement('div');tooltip.className='city-hover';tooltip.hidden=true;overlay.append(tooltip);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minPolarAngle=.35;controls.maxPolarAngle=1.48;controls.minDistance=5;controls.maxDistance=Math.max(250,layout.width*3,layout.depth*3);controls.screenSpacePanning=false;controls.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};controls.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_ROTATE};
  controls.listenToKeyEvents(renderer.domElement);
  renderer.domElement.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))transition=null;});
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
  const topicMaterials=new Map(layout.topics.map(topic=>{const base=topicColor(topic.id);return [topic.id,new THREE.MeshBasicMaterial({map:facade(`#${base.getHexString()}`,'#ffffff')})];}));
  const districtTopics=new Map(layout.districts.flatMap(d=>d.nodes.map(node=>[node.id,d.topic])));
  const baseMaterial=node=>topicMaterials.get(districtTopics.get(node.id))||(node.library==='Mathlib'?materials.Mathlib:materials.Physlib);
  const nodeById=new Map(city.nodes.map(n=>[n.id,n])), buildings=new Map(),positions=new Map(),districts=new Map(),labels=[],edges=new THREE.Group(),pipes=new THREE.Group(),hubs=new THREE.Group(),hubLabels=[],aboveScenery=[],belowScenery=[];
  const selectionOutline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),new THREE.LineBasicMaterial({color:0xffffff,depthTest:false}));
  selectionOutline.renderOrder=100;selectionOutline.visible=false;scene.add(selectionOutline);
  function scenery(object,underground=false){scene.add(object);(underground?belowScenery:aboveScenery).push(object);}
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(180,layout.width+160),Math.max(180,layout.depth+160)),new THREE.MeshBasicMaterial({color:0x9bcf9a,transparent:true,opacity:.74,depthWrite:false,side:THREE.DoubleSide}));ground.rotation.x=-Math.PI/2;ground.position.y=-.2;scene.add(ground);
  // Root boundary rings and roads are decorative geography, not dependency edges.
  for(const zone of layout.zones){
    const rim=new THREE.Mesh(new THREE.RingGeometry(zone.radius+5,zone.radius+6.3,96),new THREE.MeshBasicMaterial({color:zone.id==='Mathlib'?0x5caeb0:zone.id==='PhyslibAlpha'?0xb38b51:zone.id==='QuantumInfo'?0x558d78:0x668ab7,transparent:true,opacity:.65,depthWrite:false,side:THREE.DoubleSide}));rim.rotation.x=-Math.PI/2;rim.position.set(zone.x,zone.underground?-2:-.08,zone.z);scenery(rim,zone.underground);
    if(zone.underground)continue;
    const sign=document.createElement('canvas');sign.width=512;sign.height=128;const ctx=sign.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,128);ctx.fillStyle=zone.id==='PhyslibAlpha'?'#8b641f':zone.id==='QuantumInfo'?'#346e58':'#002fa7';ctx.fillRect(0,0,18,128);ctx.fillStyle='#182b39';ctx.font='bold 56px sans-serif';ctx.fillText(zone.id,36,82);const texture=new THREE.CanvasTexture(sign);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture}));sprite.position.set(zone.x-zone.radius+12,9,zone.minZ-3);sprite.scale.set(20,5,1);scenery(sprite);
  }
  for(const topic of layout.topics){
    const color=topicColor(topic.id);if(!topic.underground){const park=new THREE.Mesh(new THREE.CircleGeometry(topic.radius+2,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.36,depthWrite:false,side:THREE.DoubleSide}));park.rotation.x=-Math.PI/2;park.position.set(topic.x,-.15,topic.z);scenery(park);}
    const label=document.createElement('span');label.className='city-district-label city-topic-label';label.style.borderLeftColor=`#${color.getHexString()}`;label.textContent=`${readable(topic.name)} · ${topic.root}`;overlay.append(label);labels.push({id:topic.id,element:label,topic:true,underground:topic.underground,position:new THREE.Vector3(topic.x,topic.underground?-3:3,topic.z)});
  }
  for(const zone of layout.zones){const cities=layout.topics.filter(topic=>topic.root===zone.id);for(let i=1;i<cities.length;i++){const from=cities[i],to=cities.slice(0,i).reduce((best,c)=>Math.hypot(c.x-from.x,c.z-from.z)<Math.hypot(best.x-from.x,best.z-from.z)?c:best,cities[0]),y=zone.underground?-2:.05;const dx=to.x-from.x,dz=to.z-from.z,midpoint=new THREE.Vector3((from.x+to.x)/2-dz*.1,y,(from.z+to.z)/2+dx*.1),curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(from.x,y,from.z),midpoint,new THREE.Vector3(to.x,y,to.z));const road=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.55,6,false),new THREE.MeshBasicMaterial({color:0x788d8b,transparent:true,opacity:.9,depthWrite:false}));scenery(road,zone.underground);const stripe=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)),new THREE.LineDashedMaterial({color:0xf1d99c,dashSize:2,gapSize:2,transparent:true,opacity:.9}));stripe.position.y=.2;stripe.computeLineDistances();scenery(stripe,zone.underground);}}
  for(const district of layout.districts){
    if(!district.underground){const block=new THREE.Mesh(new THREE.CircleGeometry(district.radius,32),new THREE.MeshStandardMaterial({color:0xd2d1bf,transparent:true,opacity:.7,depthWrite:false,roughness:1,side:THREE.DoubleSide}));block.rotation.x=-Math.PI/2;block.position.set(district.x,-.1,district.z);scenery(block);}
    const label=document.createElement('span');label.className='city-district-label';const parts=district.id.split('/');label.textContent=parts.length>2?`${parts[0]} / ${parts.slice(-2).join(' / ')}`:parts.join(' / ');overlay.append(label);
    labels.push({id:district.id,element:label,underground:district.underground,position:new THREE.Vector3(district.x,district.underground?-3:.2,district.z-district.size/2)});districts.set(district.id,district);
  }
  // Trees are environmental landmarks; unlike buildings, they do not represent modules.
  const treePlaces=layout.topics.filter(topic=>!topic.underground).flatMap((topic,index)=>{
    const neighbourhoods=layout.districts.filter(d=>d.topic===topic.id),places=[];
    for(let i=0;i<56;i++){const angle=i*2.39996+index*.4,radius=i<20?topic.radius+2+(i%3)*3:topic.radius*Math.sqrt((i-19)/37),x=topic.x+Math.cos(angle)*radius,z=topic.z+Math.sin(angle)*radius;if(neighbourhoods.every(d=>Math.hypot(x-d.x,z-d.z)>d.radius+2))places.push([x,z]);}
    return places;
  });
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.16,1.1,6),new THREE.MeshStandardMaterial({color:0x705c48,roughness:1}),treePlaces.length),canopies=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.8,1),new THREE.MeshStandardMaterial({color:0x557c68,roughness:1}),treePlaces.length),treeMatrix=new THREE.Matrix4();
  treePlaces.forEach(([x,z],i)=>{treeMatrix.makeTranslation(x,.55,z);trunks.setMatrixAt(i,treeMatrix);treeMatrix.makeTranslation(x,1.6,z);canopies.setMatrixAt(i,treeMatrix);});scenery(trunks);scenery(canopies);
  // The shared art kit is decorative; building bodies remain the picking targets.
  const surfaceArt=createCityArt(city.nodes.filter(node=>node.library!=='Mathlib'),layout.positions,floors);
  const undergroundArt=createCityArt(city.nodes.filter(node=>node.library==='Mathlib'),layout.positions,floors);
  scene.add(surfaceArt,undergroundArt);
  const bodyGeometry=new THREE.BoxGeometry(1,1,1), surfaceGeometry=new THREE.SphereGeometry(.9,10,8);
  for(const [index,node] of city.nodes.entries()){
    const point=layout.positions.get(node.id),data=floors.get(node.id),direction=node.library==='Mathlib'?-1:1;
    const footprint=buildingStyle(node.id),group=new THREE.Group(),body=new THREE.Mesh(bodyGeometry,baseMaterial(node));body.scale.set(footprint.width,data.height,footprint.depth);
    group.position.set(point.x,0,point.z);body.position.y=direction*data.height/2;body.userData={id:node.id};group.add(body);
    const surface=node.library==='Mathlib'?new THREE.Mesh(surfaceGeometry,baseMaterial(node)):null;if(surface){surface.position.y=.75;surface.userData={id:node.id};group.add(surface);}scene.add(group);
    buildings.set(node.id,{group,body,surface,node,direction,footprint});positions.set(node.id,new THREE.Vector3(point.x,direction*data.height,point.z));
  }
  const collisionGrid=createCollisionGrid([...buildings.values()].map(({group,node,direction,footprint})=>{
    const height=floors.get(node.id).height;
    return {min:{x:group.position.x-footprint.width/2,y:Math.min(0,direction*height),z:group.position.z-footprint.depth/2},max:{x:group.position.x+footprint.width/2,y:Math.max(0,direction*height),z:group.position.z+footprint.depth/2},layer:direction<0?'underground':'surface'};
  }));
  const pipelineLinks=allMathlibPipelines(city);
  function pipelineCurve(link){const source=buildings.get(link.from),target=buildings.get(link.to);if(!source||!target)return null;
    const a=source.group.position.clone().add(new THREE.Vector3(0,1.5,0)),b=target.group.position.clone().add(new THREE.Vector3(0,.5,0));
    const height=2.5+Math.min(5,Math.hypot(a.x-b.x,a.z-b.z)*.025);return new THREE.CubicBezierCurve3(a,new THREE.Vector3(a.x,height,a.z),new THREE.Vector3(b.x,height,b.z),b);
  }
  function physicsCurve(link){const source=buildings.get(link.from),target=buildings.get(link.to);if(!source||!target)return null;const bothBelow=source.direction<0&&target.direction<0,ay=bothBelow?-Math.max(2,floors.get(link.from).height*.7):source.direction<0?1.5:Math.max(3,floors.get(link.from).height*.7),by=bothBelow?-Math.max(2,floors.get(link.to).height*.35):target.direction<0?1:Math.max(2,floors.get(link.to).height*.35);const a=source.group.position.clone().add(new THREE.Vector3(0,ay,0)),b=target.group.position.clone().add(new THREE.Vector3(0,by,0)),lift=(bothBelow?-1:1)*Math.min(10,Math.max(3,Math.hypot(a.x-b.x,a.z-b.z)*.045));return new THREE.CubicBezierCurve3(a,a.clone().add(new THREE.Vector3(0,lift,0)),b.clone().add(new THREE.Vector3(0,lift,0)),b);}
  // A single instanced mesh keeps all real file-import pipes visible without one draw call per edge.
  const pipeSegments=[],physLinks=city.edges.filter(edge=>{const from=nodeById.get(edge.from),to=nodeById.get(edge.to);return from&&to&&from.library===to.library;});
  for(const [links,math] of [[pipelineLinks,true],[physLinks,false]])for(const link of links){const curve=math?pipelineCurve(link):physicsCurve(link);if(!curve)continue;const points=curve.getPoints(4);for(let i=1;i<points.length;i++)pipeSegments.push({a:points[i-1],b:points[i],color:math?0x00ded2:i<=2?0xe43ba9:0xffa71a});}
  const network=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,6),new THREE.MeshBasicMaterial({transparent:true,opacity:.035,depthTest:false,depthWrite:false}),pipeSegments.length),part=new THREE.Object3D(),upAxis=new THREE.Vector3(0,1,0);
  pipeSegments.forEach((segment,index)=>{const direction=segment.b.clone().sub(segment.a),length=direction.length();part.position.copy(segment.a).add(segment.b).multiplyScalar(.5);part.quaternion.setFromUnitVectors(upAxis,direction.normalize());part.scale.set(.085,length,.085);part.updateMatrix();network.setMatrixAt(index,part.matrix);network.setColorAt(index,new THREE.Color(segment.color));});network.frustumCulled=false;network.renderOrder=80;scene.add(network,edges,pipes,hubs);
  let selected=null,transition=null,relationMode='imports',showPipes=true,quality='high';const roadTraffic=[],pipeTraffic=[];
  const diagnostics=new URLSearchParams(location.search).has('metrics')?document.createElement('output'):null;
  if(diagnostics){diagnostics.className='city-metrics';diagnostics.setAttribute('aria-label','Rendering metrics');host.append(diagnostics);}
  let metricFrames=0,metricStarted=performance.now(),sceneReady=performance.now()-sceneStarted;
  const fadedMaterials=new Map();
  function fadeMaterial(material){if(!fadedMaterials.has(material)){const faded=material.clone();faded.color.setRGB(.78,.78,.78);fadedMaterials.set(material,faded);}return fadedMaterials.get(material);}
  const selectedMaterials=new Map();
  function selectedMaterial(node){const base=baseMaterial(node);if(!selectedMaterials.has(base)){const selectedBase=base.clone();selectedBase.color.setRGB(1.2,1.2,1.2);selectedMaterials.set(base,selectedBase);}return selectedMaterials.get(base);}
  function setBuildingFocus(){for(const [id,b] of buildings)if(id!==selected){const material=selected?fadeMaterial(baseMaterial(b.node)):baseMaterial(b.node);b.body.material=material;if(b.surface)b.surface.material=material;}}
  const bounds=cityBounds(layout.zones), overviewTarget=new THREE.Vector3((bounds.minX+bounds.maxX)/2,0,(bounds.minZ+bounds.maxZ)/2);
  let underground=false;
  const anchor=layout.positions.get('Physlib.ClassicalMechanics.EulerLagrange')||layout.positions.get(city.nodes.find(n=>n.library==='Physlib')?.id)||{x:0,z:0};
  const homeTarget=new THREE.Vector3(anchor.x,6,anchor.z),homePosition=homeTarget.clone().add(new THREE.Vector3(25,5,32));
  function travel(focus,position){transition={start:performance.now(),from:camera.position.clone(),fromTarget:controls.target.clone(),to:position.clone(),toTarget:focus.clone()};}
  controls.addEventListener('start',()=>{transition=null;});
  function setLayer(value){
    underground=value;
    host.dispatchEvent(new CustomEvent('city-layer-change',{detail:{underground:value}}));
    controls.minPolarAngle=value?1.68:.35;
    controls.maxPolarAngle=value?2.75:1.48;
    ground.visible=!value;
    for(const object of aboveScenery)object.visible=!value;
    for(const object of belowScenery)object.visible=value;
    network.visible=showPipes&&!value;
    pipes.visible=!value;
    showAll();
    if(selected){drawPipes();drawFileLinks();drawHubs(selected);}
  }
  function lookAt(focus,distance){
    distance=Math.max(14,Math.min(controls.maxDistance,distance));
    const sign=underground?-1:1;
    travel(focus,focus.clone().add(new THREE.Vector3(distance*.55,sign*distance*.42,distance*.7)));
  }
  function overview(){
    setLayer(false);
    const direction=new THREE.Vector3(0,1,1).normalize();
    const box={min:{x:bounds.minX,y:0,z:bounds.minZ},max:{x:bounds.maxX,y:30,z:bounds.maxZ}};
    const fit=fitBox(box,direction,camera.fov,camera.aspect);
    const centre=new THREE.Vector3(fit.centre.x,fit.centre.y,fit.centre.z);
    controls.maxDistance=Math.max(controls.maxDistance,fit.distance*1.2);
    travel(centre,centre.clone().addScaledVector(direction,fit.distance));
  }
  function showAll(){for(const b of buildings.values()){b.group.visible=!underground||b.direction<0;if(b.surface)b.surface.visible=!underground;}}
  function focusFolder(folder){showAll();const members=city.nodes.filter(n=>n.module.path.replaceAll('\\','/').startsWith(`${folder}/`));if(!members.length)return;setLayer(folder.startsWith('Mathlib'));const box=new THREE.Box3();for(const n of members)box.expandByObject(buildings.get(n.id).body);const direction=new THREE.Vector3(0,underground?-1:1,1).normalize(),fit=fitBox(box,direction,camera.fov,camera.aspect);const centre=new THREE.Vector3(fit.centre.x,fit.centre.y,fit.centre.z);travel(centre,centre.clone().addScaledVector(direction,fit.distance));}
  function focusBuilding(id){const b=buildings.get(id);if(!b)return;setLayer(b.direction<0);showAll();const height=floors.get(id).height,centre=b.group.position.clone().add(new THREE.Vector3(0,b.direction*height/2,0)),box={min:{x:centre.x-b.footprint.width/2,y:Math.min(0,b.direction*height),z:centre.z-b.footprint.depth/2},max:{x:centre.x+b.footprint.width/2,y:Math.max(0,b.direction*height),z:centre.z+b.footprint.depth/2}},distance=Math.max(18,fitBox(box,{x:1,y:b.direction*.35,z:1},camera.fov,camera.aspect).distance);let best=null;
    // Choose a street-facing angle with as few intervening buildings as possible.
    for(let i=0;i<16;i++){const angle=i*Math.PI/8,dx=Math.cos(angle)*distance,dz=Math.sin(angle)*distance,cameraY=centre.y+b.direction*distance*.35;let score=0;for(const [otherId,other] of buildings){if(otherId===id||other.direction!==b.direction)continue;const ox=other.group.position.x-centre.x,oz=other.group.position.z-centre.z,t=(ox*dx+oz*dz)/(distance*distance);if(t<=.04||t>=1.05)continue;const lateral=Math.hypot(ox-t*dx,oz-t*dz),rayY=centre.y+t*(cameraY-centre.y),level=b.direction*rayY;if(lateral<1.8&&level>=0&&level<floors.get(otherId).height)score+=1+(t>.75?4:0);}if(!best||score<best.score)best={score,position:centre.clone().add(new THREE.Vector3(dx,b.direction*distance*.35,dz))};}
    travel(centre,best.position);
  }
  function clearFloors(building){for(const child of [...building.group.children])if(child!==building.body&&child!==building.surface&&!child.userData.decorative){building.group.remove(child);child.geometry.dispose();}building.body.visible=true;}
  function drawHubs(id){
    for(const object of hubs.children){object.geometry?.dispose();object.material?.dispose();}hubs.clear();for(const label of hubLabels)label.element.remove();hubLabels.length=0;
    const building=buildings.get(id);if(!building)return;const groups=relationGroups(city,id),items=[{name:'Mathlib',count:groups.mathlib.length,color:0x00ded2,shape:'ring'},{name:'Uses',count:groups.uses.length,color:0xe43ba9,shape:'diamond'},{name:'Used by',count:groups.usedBy.length,color:0xffa71a,shape:'cube'}].filter(item=>item.count);
    const origin=building.group.position.clone().add(new THREE.Vector3(0,building.direction*floors.get(id).height*.55,0));
    items.forEach((item,index)=>{const position=origin.clone().add(new THREE.Vector3((index-(items.length-1)/2)*3.2,1.6,3));const geometry=item.shape==='ring'?new THREE.TorusGeometry(.65,.17,8,20):item.shape==='diamond'?new THREE.OctahedronGeometry(.75):new THREE.BoxGeometry(1.1,1.1,1.1);const marker=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:item.color,depthTest:false}));marker.position.copy(position);marker.renderOrder=95;hubs.add(marker);const stem=new THREE.Line(new THREE.BufferGeometry().setFromPoints([origin,position]),new THREE.LineBasicMaterial({color:item.color,transparent:true,opacity:.8,depthTest:false}));stem.renderOrder=94;hubs.add(stem);const element=document.createElement('span');element.className='city-hub-label';element.textContent=`${item.name} · ${item.count}`;element.style.borderColor=`#${item.color.toString(16).padStart(6,'0')}`;overlay.append(element);hubLabels.push({element,position,marker,ring:item.shape==='ring'});});
  }
  function select(id){
    if(selected&&buildings.has(selected)){const previous=buildings.get(selected);clearFloors(previous);previous.body.material=baseMaterial(previous.node);previous.body.renderOrder=0;if(previous.surface){previous.surface.material=baseMaterial(previous.node);previous.surface.renderOrder=0;}}
    selected=id;setBuildingFocus();drawPipes();drawHubs(id);const b=buildings.get(id);selectionOutline.visible=Boolean(b);if(!b)return drawLinks([],false);const selectedHeight=floors.get(id).height;selectionOutline.position.copy(b.group.position).add(new THREE.Vector3(0,b.direction*selectedHeight/2,0));selectionOutline.scale.set(b.footprint.width+.2,selectedHeight+.3,b.footprint.depth+.2);b.body.material=selectedMaterial(b.node);b.body.renderOrder=50;if(b.surface){b.surface.material=selectedMaterial(b.node);b.surface.renderOrder=50;}
    const data=floors.get(id);if(data.floors.length){b.body.visible=false;const h=data.height/data.floors.length;
      for(const floor of data.floors){const mesh=new THREE.Mesh(new THREE.BoxGeometry(b.footprint.width,Math.max(.1,h-.08),b.footprint.depth),selectedMaterial(b.node));mesh.renderOrder=50;mesh.position.y=b.direction*(floor.index+.5)*h;mesh.userData={id,floor:floor.index};b.group.add(mesh);}}
    return drawFileLinks();
  }
  function selectFloor(id,index){const b=buildings.get(id);if(!b||id!==selected)return;for(const mesh of b.group.children)if(mesh!==b.body&&mesh!==b.surface&&!mesh.userData.decorative)mesh.material=mesh.userData.floor===index?materials.floor:selectedMaterial(b.node);}
  function drawPipes(){
    for(const mesh of pipes.children){mesh.geometry.dispose();mesh.material.dispose();}pipes.clear();pipeTraffic.length=0;
    const links=pipelineLinks.filter(edge=>edge.from===selected||edge.to===selected);network.visible=showPipes&&!underground;network.material.opacity=selected ? .02 : .035;if(!showPipes)return links.length;
    for(const link of links){const curve=pipelineCurve(link);if(!curve)continue;
      const pipe=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.48,8,false),new THREE.MeshBasicMaterial({color:0x00ded2,depthTest:false}));pipe.renderOrder=90;pipes.add(pipe);
      if(pipeTraffic.length<24){const car=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),new THREE.MeshBasicMaterial({color:0xc8ffff,depthTest:false}));car.renderOrder=91;pipes.add(car);pipeTraffic.push({object:car,curve,phase:pipeTraffic.length*.17});}
    }return links.length;
  }
  function drawFileLinks(){return drawLinks(city.edges.filter(e=>e.from===selected||e.to===selected),false);}
  function drawLinks(links,dashed){
    for(const item of edges.children){item.geometry?.dispose();item.material?.dispose();}edges.clear();roadTraffic.length=0;
    setBuildingFocus();
    const allCandidates=links.filter(link=>positions.has(link.from)&&positions.has(link.to));
    const candidates=allCandidates.filter(link=>!underground||(buildings.get(link.from).direction<0&&buildings.get(link.to).direction<0));
    const mode=dashed?'both':relationMode,result=visibleRelations(candidates,selected,mode,12),total=visibleRelations(allCandidates,selected,mode,12).total;let drawn=0;
    if(!dashed&&!showPipes)return {drawn,total};
    for(const link of result.links){const from=positions.get(link.from),to=positions.get(link.to),distance=from.distanceTo(to);if(distance<.01)continue;drawn++;
      if(!dashed&&showPipes&&nodeById.get(link.from)?.library==='Physlib'&&nodeById.get(link.to)?.library==='Mathlib')continue;
      const curve=physicsCurve(link);if(!curve)continue;const color=link.from===selected?0xe43ba9:0xffa71a;
      if(dashed){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)),new THREE.LineDashedMaterial({color:0x555b9d,dashSize:1,gapSize:.6,depthTest:false}));line.computeLineDistances();line.renderOrder=90;edges.add(line);}else{const road=new THREE.Mesh(new THREE.TubeGeometry(curve,24,.42,8,false),new THREE.MeshBasicMaterial({color,depthTest:false}));road.renderOrder=90;edges.add(road);const vehicle=new THREE.Mesh(new THREE.SphereGeometry(.55,8,6),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false}));vehicle.renderOrder=91;edges.add(vehicle);roadTraffic.push({object:vehicle,curve,phase:roadTraffic.length*.19});}
      const direction=curve.getTangent(.96).normalize(),cone=new THREE.Mesh(new THREE.ConeGeometry(.55,1.4,8),new THREE.MeshBasicMaterial({color,depthTest:false}));cone.renderOrder=91;cone.position.copy(curve.getPoint(.96));cone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);edges.add(cone);
    }return {drawn,total};
  }
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  renderer.domElement.addEventListener('wheel',()=>{transition=null;},{passive:true});
  renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];renderer.domElement.focus({preventScroll:true});});
  function pick(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const visible=[...buildings.values()].filter(b=>b.group.visible).flatMap(b=>b.group.children.filter(child=>child.visible));return ray.intersectObjects(visible,false)[0];}
  renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4)return;const hit=pick(e);if(hit){const {id,floor}=hit.object.userData;if(id===selected&&Number.isInteger(floor))onFloor(id,floor);else if(id)onSelect(id);}});
  let lastHover=0;renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons||performance.now()-lastHover<100){if(e.buttons)tooltip.hidden=true;return;}lastHover=performance.now();const hit=pick(e);if(!hit){tooltip.hidden=true;renderer.domElement.style.cursor='grab';return;}const {id,floor}=hit.object.userData;tooltip.textContent=Number.isInteger(floor)&&id===selected?`${id} · Floor ${floor+1}`:id;tooltip.hidden=false;tooltip.style.left=`${e.offsetX+12}px`;tooltip.style.top=`${e.offsetY+12}px`;renderer.domElement.style.cursor='pointer';});
  renderer.domElement.addEventListener('pointerleave',()=>{tooltip.hidden=true;});
  const keys=new Set(),clock=new THREE.Clock();
  window.addEventListener('keydown',event=>{if(event.ctrlKey||event.metaKey||event.altKey||/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target.tagName)||event.target.isContentEditable)return;const key=event.key.toLowerCase();if(['w','a','s','d'].includes(key)){event.preventDefault();keys.add(key);transition=null;}});
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
  function move(forward,right){const direction=new THREE.Vector3();camera.getWorldDirection(direction);direction.y=0;if(direction.lengthSq()<.001)direction.set(0,0,-1);direction.normalize();const sideways=new THREE.Vector3().crossVectors(direction,camera.up).normalize();const delta=direction.multiplyScalar(forward).addScaledVector(sideways,right);camera.position.add(delta);controls.target.add(delta);}
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}new ResizeObserver(resize).observe(host);resize();camera.position.copy(homePosition);controls.target.copy(homeTarget);controls.update();
  function updateCamera(){if(transition){const t=Math.min(1,(performance.now()-transition.start)/550),ease=1-(1-t)**3;camera.position.lerpVectors(transition.from,transition.to,ease);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,ease);camera.lookAt(controls.target);if(t===1)transition=null;}else{const targetY=underground?Math.min(-2,controls.target.y):Math.max(2,controls.target.y);camera.position.y+=targetY-controls.target.y;controls.target.y=targetY;controls.update();}const safe=cameraClearance(camera.position,collisionGrid,underground?'underground':'surface');if(safe.x!==camera.position.x||safe.z!==camera.position.z){camera.position.x=safe.x;camera.position.z=safe.z;camera.lookAt(controls.target);}}
  renderer.setAnimationLoop(()=>{const step=Math.min(clock.getDelta(),.05)*Math.max(12,Math.min(120,camera.position.distanceTo(controls.target)*.55));if(keys.size)move((Number(keys.has('w'))-Number(keys.has('s')))*step,(Number(keys.has('d'))-Number(keys.has('a')))*step);updateCamera();for(const item of [...roadTraffic,...pipeTraffic])item.object.position.copy(item.curve.getPoint((performance.now()/6000+item.phase)%1));hubs.visible=Boolean(selected);const showArt=quality!=='low'&&camera.position.distanceTo(controls.target)<180;surfaceArt.visible=showArt&&!underground;undergroundArt.visible=showArt&&underground;renderer.render(scene,camera);if(diagnostics){metricFrames++;const elapsed=performance.now()-metricStarted;if(elapsed>=1000){const info=renderer.info;diagnostics.textContent=`Scene ${Math.round(sceneReady)} ms · ${Math.round(metricFrames*1000/elapsed)} FPS · ${info.render.calls} calls · ${info.render.triangles} triangles · ${info.memory.geometries} geometries · ${info.memory.textures} textures`;metricStarted=performance.now();metricFrames=0;}}const active=nodeById.get(selected),activeDistrict=active&&districtFor(active),occupied=[];
    for(const [index,label] of hubLabels.entries()){if(label.ring)label.marker.quaternion.copy(camera.quaternion);const p=label.position.clone().project(camera),x=(p.x+1)*host.clientWidth/2,y=(1-p.y)*host.clientHeight/2-index*20;label.element.hidden=!hubs.visible||p.z>1||x<0||x>host.clientWidth||y<0||y>host.clientHeight;if(!label.element.hidden)occupied.push({left:x-52,right:x+52,top:y-30,bottom:y+2});label.element.style.transform=`translate(-50%,-130%) translate(${x}px,${y}px)`;}
    for(const label of [...labels].sort((a,b)=>Number(b.id===activeDistrict)-Number(a.id===activeDistrict)||Number(Boolean(b.topic))-Number(Boolean(a.topic)))){const p=label.position.clone().project(camera),x=(p.x+1)*host.clientWidth/2,y=(1-p.y)*host.clientHeight/2,width=Math.min(160,label.element.textContent.length*5.5+14),box={left:x-width/2,right:x+width/2,top:y-10,bottom:y+10};const hidden=Boolean(label.underground)!==(camera.position.y<0)||(!label.topic&&label.id!==activeDistrict)||occupied.length>=6||p.z>1||box.left<0||box.right>host.clientWidth||box.top<0||box.bottom>host.clientHeight||(x>host.clientWidth-170&&y<160)||occupied.some(o=>box.left<o.right&&box.right>o.left&&box.top<o.bottom&&box.bottom>o.top);label.element.hidden=hidden;label.element.classList.toggle('active',label.id===activeDistrict);if(!hidden)occupied.push(box);label.element.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px)`;}
  });
  function zoom(factor){const offset=camera.position.clone().sub(controls.target),distance=Math.max(controls.minDistance,Math.min(controls.maxDistance,offset.length()*factor));travel(controls.target,offset.setLength(distance).add(controls.target));}
  return {select,selectFloor,setRelationMode:mode=>{relationMode=mode;return drawFileLinks();},setPipesVisible:value=>{showPipes=value;drawPipes();return drawFileLinks();},showDeclarationLinks:links=>drawLinks(links,true).drawn,focusFolder,focusBuilding,focusFoundations:()=>{if(selected)focusBuilding(selected);},zoom,move:(forward,right)=>{transition=null;move(forward,right);},reset:()=>{setLayer(false);showAll();travel(homeTarget,homePosition);},overview,setLayer:value=>{setLayer(value);const target=controls.target.clone();target.y=value?-5:5;lookAt(target,30);},setQuality:level=>{quality=level;renderer.setPixelRatio(Math.min(devicePixelRatio,{low:.75,medium:1,high:1.5}[level]||1));resize();},get selected(){return selected;}};
}
