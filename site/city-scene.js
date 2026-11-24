import {contrast} from './city-colors.js';
const contrastSafeLabel=c=>contrast(c,'#ffffff')>contrast(c,'#000000')?'#ffffff':'#000000';
import {createAtomicArt} from './city-atomic-art.js';
import {atomicCameraPose,reviewCameraOffset} from './city-atomic-plan.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { districtFor } from './city-model.js';
import { layoutFullCity } from './city-layout.js';
import { visibleRelations, allMathlibPipelines, relationGroups } from './city-relations.js';
import { fitBox, cityBounds, createCollisionGrid, layerDestination } from './city-camera.js';
import { createNavigationController } from './city-navigation.js';
import { clearDisposableGroup,clearCachedArt,canonicalPickTargets } from './city-resources.js';
import { buildingStyle, createCityArt } from './city-art.js';
import { assetFixtureModuleId, createAssetRegistry, attachBuildingAsset } from './city-asset-registry.js';
import {showcaseDirectory,showcaseModule,isShowcaseNode,createShowcaseDistrict,districtCameraPose} from './city-district.js';
import {selectedSkywalkEdges,createSkywalks} from './city-skywalks.js';
import {summarizeFrames} from './city-benchmark.js';
import {createLodShowcase,makeFacadeAtlas,projectedHeight} from './city-district-lod.js';
import {profileOptions,summarizePhaseTimings} from './city-render-profile.js';
import {createGeography} from './city-rivers.js';
import {createChunkArt} from './city-chunk-art.js';

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
  const sizeParam=new URLSearchParams(location.search).get('benchSize');if(sizeParam){const [w,h]=sizeParam.split(',').map(Number);if(w>=300&&w<=1600&&h>=200&&h<=1000){host.parentElement.style.cssText+=`width:${w}px;height:${h}px;flex:0 0 ${h}px`;}}

  const parameters=new URLSearchParams(location.search),districtMode=parameters.get('district');
  if(!parameters.has('visual')&&!districtMode&&!parameters.has('assetFixture')&&parameters.get('layout')!=='legacy')parameters.set('visual','c4');
  const skyline=parameters.get('visual')==='c4';
  const urban=parameters.get('layout')!=='legacy',metropolis=urban&&parameters.get('visual')==='c3',chromatic=urban&&['c2','c3','c4'].includes(parameters.get('visual')),atomic=urban&&['c1','c2','c3','c4'].includes(parameters.get('visual'));
  host.closest('body')?.classList.toggle('atomic-city',atomic);document.body.classList.toggle('chromatic-city',chromatic);document.body.classList.toggle('city-debug',parameters.has('metrics'));
  const canonicalFloors=floors; if(atomic)floors=new Map([...floors].map(([id,d])=>[id,{...d}]));
  const showcaseEnabled=!atomic&&(districtMode==='units'||(urban&&districtMode!=='procedural')),comparisonEnabled=['units','procedural'].includes(districtMode);
  const renderProfile=profileOptions(parameters.get('profile'));
  const fixtureEnabled=!comparisonEnabled&&parameters.get('assetFixture')==='kenney-tower';
  const showcaseNodes=city.nodes.filter(isShowcaseNode),showcaseIds=new Set(showcaseNodes.map(n=>n.id));
  let initialRenderedMs=null,citySettledMs=null;
  let showcase=null,bridgePresentation=null,districtFirstVisible=null,districtCompleted=null,benchmark=null,lodStats=null,inspectionStats=null,lastShadowVersion=-1;
  let districtScope=comparisonEnabled,geographicFocus=null;
  const layout=layoutFullCity(city,{legacy:!urban,floors:canonicalFloors,visual:skyline?'c4':metropolis?'c3':chromatic?'c2':atomic?'c1':null,composition:parameters.get('composition')||'vivid',concept:parameters.get('concept')||(metropolis?'spaceage':'campus')}), scene=new THREE.Scene();
  if(atomic)for(const [id,m] of Object.entries(layout.manifest.modules))floors.get(id).height=m.displayHeight;
  const sky=document.createElement('canvas');sky.width=2;sky.height=256;const skyContext=sky.getContext('2d'),gradient=skyContext.createLinearGradient(0,0,0,256);gradient.addColorStop(0,atomic?'#d8eee5':'#345c80');gradient.addColorStop(.55,atomic?'#f2ecda':'#93b8cb');gradient.addColorStop(1,'#f3dac2');skyContext.fillStyle=gradient;skyContext.fillRect(0,0,2,256);scene.background=new THREE.CanvasTexture(sky);scene.background.colorSpace=THREE.SRGBColorSpace;
  const camera=new THREE.PerspectiveCamera(40,1,.1,Math.max(3000,layout.width*8,layout.depth*8)),renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1)*renderProfile.pixelScale);renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Interactive city. Drag or use two fingers on a trackpad to pan; pinch or use the zoom buttons to zoom. Right-drag to rotate slightly. Use W A S D to move.');
  const overlay=document.createElement('div');overlay.className='city-labels';overlay.setAttribute('aria-hidden','true');host.append(overlay);
  const tooltip=document.createElement('div');tooltip.className='city-hover';tooltip.hidden=true;overlay.append(tooltip);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.zoomSpeed=.65;controls.minPolarAngle=.2;controls.maxPolarAngle=.95;controls.minDistance=5;controls.maxDistance=Math.max(250,layout.width*3,layout.depth*3);controls.screenSpacePanning=false;controls.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};controls.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_ROTATE};
  scene.add(new THREE.HemisphereLight(0xe8f3ff,0x566372,2.1));
  const sun=new THREE.DirectionalLight(0xfff5e6,2.7);sun.position.set(-80,160,90);scene.add(sun);
  if(showcaseEnabled||atomic){
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
    const p=layout.positions.get(showcaseModule)||layout.positions.get(showcaseNodes[0]?.id)||{x:0,z:0};sun.position.set(p.x-25,55,p.z+18);sun.target.position.set(p.x,0,p.z);scene.add(sun.target);
    sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;sun.shadow.camera.near=1;sun.shadow.camera.far=110;sun.shadow.normalBias=.045;
  }
  const materials={
    Physlib:new THREE.MeshStandardMaterial({map:facade('#2d4f73','#cce4f5'),roughness:.42,metalness:.32}),
    PhyslibAlpha:new THREE.MeshStandardMaterial({map:facade('#80663e','#f5dfab'),roughness:.42,metalness:.32}),
    QuantumInfo:new THREE.MeshStandardMaterial({map:facade('#46695c','#c2e3d5'),roughness:.42,metalness:.32}),
    Mathlib:new THREE.MeshStandardMaterial({map:facade('#384a5b','#a9c4d5'),roughness:.5,metalness:.28}),
    selected:new THREE.MeshStandardMaterial({map:facade('#234985','#e5f1ff'),roughness:.35,metalness:.4}),
    related:new THREE.MeshStandardMaterial({map:facade('#337f91','#e0ffff'),roughness:.4,metalness:.25}),
    floor:new THREE.MeshStandardMaterial({color:0x76bdff,roughness:.3,metalness:.3}),
    fixtureFloor:new THREE.MeshBasicMaterial({color:0x76bdff,wireframe:true,depthTest:false})
  };
  const topicMaterials=new Map((urban?[]:layout.topics).map(topic=>{const base=topicColor(topic.id);return [topic.id,new THREE.MeshBasicMaterial({map:facade(`#${base.getHexString()}`,'#ffffff')})];}));
  const districtTopics=new Map(layout.districts.flatMap(d=>d.nodes.map(node=>[node.id,d.topic])));
  const baseMaterial=node=>topicMaterials.get(districtTopics.get(node.id))||(materials[node.id.split('.')[0]]||materials.Physlib);
  const nodeById=new Map(city.nodes.map(n=>[n.id,n])), buildings=new Map(),positions=new Map(),districts=new Map(),labels=[],edges=new THREE.Group(),pipes=new THREE.Group(),hubs=new THREE.Group(),hubLabels=[],aboveScenery=[],belowScenery=[];
  const selectionOutline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1)),new THREE.LineBasicMaterial({color:chromatic?0x17243a:0xffffff,depthTest:false}));
  selectionOutline.renderOrder=100;selectionOutline.visible=false;scene.add(selectionOutline);
  function scenery(object,underground=false,local=false){object.userData.showcaseLocal=local;scene.add(object);(underground?belowScenery:aboveScenery).push(object);}
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(180,layout.width+160),Math.max(180,layout.depth+160)),new THREE.MeshBasicMaterial({color:0x9bcf9a,transparent:true,opacity:.74,depthWrite:false,side:THREE.DoubleSide}));ground.rotation.x=-Math.PI/2;ground.position.y=-.2;scene.add(ground);
  if(urban)ground.visible=false;
  if(!urban){
  // Root boundary rings and roads are decorative geography, not dependency edges.
  for(const zone of layout.zones){
    const rim=new THREE.Mesh(new THREE.RingGeometry(zone.radius+5,zone.radius+6.3,96),new THREE.MeshBasicMaterial({color:zone.id==='Mathlib'?0x5caeb0:zone.id==='PhyslibAlpha'?0xb38b51:zone.id==='QuantumInfo'?0x558d78:0x668ab7,transparent:true,opacity:.65,depthWrite:false,side:THREE.DoubleSide}));rim.rotation.x=-Math.PI/2;rim.position.set(zone.x,zone.underground?-2:-.08,zone.z);scenery(rim,zone.underground);
    if(zone.underground)continue;
    const sign=document.createElement('canvas');sign.width=512;sign.height=128;const ctx=sign.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,128);ctx.fillStyle=zone.id==='PhyslibAlpha'?'#8b641f':zone.id==='QuantumInfo'?'#346e58':'#002fa7';ctx.fillRect(0,0,18,128);ctx.fillStyle='#182b39';ctx.font='bold 56px sans-serif';ctx.fillText(zone.id,36,82);const texture=new THREE.CanvasTexture(sign);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture}));sprite.position.set(zone.x-zone.radius+12,9,zone.minZ-3);sprite.scale.set(20,5,1);scenery(sprite);
  }
  for(const topic of layout.topics){
    const color=topicColor(topic.id);if(!topic.underground){const park=new THREE.Mesh(new THREE.CircleGeometry(topic.radius+2,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.36,depthWrite:false,side:THREE.DoubleSide}));park.rotation.x=-Math.PI/2;park.position.set(topic.x,-.15,topic.z);scenery(park,false,topic.id===showcaseDirectory);}
    const label=document.createElement('span');label.className='city-district-label city-topic-label';label.style.borderLeftColor=`#${color.getHexString()}`;label.textContent=`${readable(topic.name)} · ${topic.root}`;overlay.append(label);labels.push({id:topic.id,element:label,topic:true,underground:topic.underground,position:new THREE.Vector3(topic.x,topic.underground?-3:3,topic.z)});
  }
  for(const zone of layout.zones){const cities=layout.topics.filter(topic=>topic.root===zone.id);for(let i=1;i<cities.length;i++){const from=cities[i],to=cities.slice(0,i).reduce((best,c)=>Math.hypot(c.x-from.x,c.z-from.z)<Math.hypot(best.x-from.x,best.z-from.z)?c:best,cities[0]),y=zone.underground?-2:.05;const dx=to.x-from.x,dz=to.z-from.z,midpoint=new THREE.Vector3((from.x+to.x)/2-dz*.1,y,(from.z+to.z)/2+dx*.1),curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(from.x,y,from.z),midpoint,new THREE.Vector3(to.x,y,to.z));const road=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.55,6,false),new THREE.MeshBasicMaterial({color:0x788d8b,transparent:true,opacity:.9,depthWrite:false}));scenery(road,zone.underground);const stripe=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)),new THREE.LineDashedMaterial({color:0xf1d99c,dashSize:2,gapSize:2,transparent:true,opacity:.9}));stripe.position.y=.2;stripe.computeLineDistances();scenery(stripe,zone.underground);}}
  for(const district of layout.districts){
    if(!district.underground){const block=new THREE.Mesh(new THREE.CircleGeometry(district.radius,32),new THREE.MeshStandardMaterial({color:0xd2d1bf,transparent:true,opacity:.7,depthWrite:false,roughness:1,side:THREE.DoubleSide}));block.rotation.x=-Math.PI/2;block.position.set(district.x,-.1,district.z);scenery(block,false,district.topic===showcaseDirectory);}
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
  if(comparisonEnabled){const topic=layout.topics.find(t=>t.id===showcaseDirectory),localTrees=treePlaces.filter(([x,z])=>Math.hypot(x-topic.x,z-topic.z)<topic.radius+8);
    for(const [original,y] of [[trunks,.55],[canopies,1.6]]){const mesh=new THREE.InstancedMesh(original.geometry,original.material,localTrees.length);localTrees.forEach(([x,z],i)=>{treeMatrix.makeTranslation(x,y,z);mesh.setMatrixAt(i,treeMatrix);});mesh.computeBoundingSphere();scenery(mesh,false,true);}
  }
  }else{
    const geography=createGeography(layout.manifest);scenery(geography,false,true);
    for(const borough of layout.manifest.boroughs){const label=document.createElement('span');label.className='city-district-label city-topic-label';label.textContent=borough.id+' · '+borough.count+' files';overlay.append(label);labels.push({id:borough.id,borough:true,topic:true,element:label,underground:false,position:new THREE.Vector3((borough.bounds.minX+borough.bounds.maxX)/2,50,borough.bounds.maxZ*.5)});}
    for(const parcel of layout.manifest.parcels){districts.set(parcel.id,layout.districts.find(d=>d.id===parcel.id));if(parcel.depth>1)continue;const label=document.createElement("span");label.className="city-district-label";if(chromatic){label.style.backgroundColor=parcel.identity.ground;label.style.color=contrastSafeLabel(parcel.identity.ground);label.style.borderColor=parcel.identity.dark;label.dataset.districtColor=parcel.identity.primary;}label.textContent=chromatic?(parcel.id.endsWith('/@root')?'Root Modules':parcel.label):parcel.id.endsWith('/@root')?parcel.boroughId+' / Root Modules':parcel.id;overlay.append(label);labels.push({id:parcel.id,element:label,topic:true,underground:false,position:new THREE.Vector3(parcel.bounds.minX+10,2,parcel.bounds.minZ+5)});}
  }
  // The shared art kit is decorative; building bodies remain the picking targets.
  const surfaceArt=createCityArt(urban?[]:city.nodes.filter(node=>node.library!=='Mathlib'),layout.positions,floors);
  const undergroundArt=createCityArt(city.nodes.filter(node=>node.library==='Mathlib'),layout.positions,floors);
  scene.add(surfaceArt,undergroundArt);
  const scopedProceduralArt=comparisonEnabled&&!urban?createCityArt(showcaseNodes,layout.positions,floors):null;
  if(scopedProceduralArt)scene.add(scopedProceduralArt);
  const bodyGeometry=new THREE.BoxGeometry(1,1,1), surfaceGeometry=new THREE.SphereGeometry(.9,10,8);
  for(const [index,node] of city.nodes.entries()){
    const point=layout.positions.get(node.id),data=floors.get(node.id),direction=node.library==='Mathlib'?-1:1;
    const footprint=atomic&&direction>0?layout.manifest.modules[node.id].footprint:buildingStyle(node.id),group=new THREE.Group(),body=new THREE.Mesh(bodyGeometry,baseMaterial(node));body.scale.set(footprint.width,data.height,footprint.depth);
    group.position.set(point.x,0,point.z);body.position.y=direction*data.height/2;body.userData={id:node.id,canonicalHit:urban&&direction>0};if(urban&&direction>0)body.visible=false;group.add(body);
    const surface=node.library==='Mathlib'?new THREE.Mesh(surfaceGeometry,baseMaterial(node)):null;if(surface){surface.position.y=.75;surface.userData={id:node.id};group.add(surface);}scene.add(group);
    buildings.set(node.id,{group,body,surface,node,direction,footprint});positions.set(node.id,new THREE.Vector3(point.x,direction*data.height,point.z));
  }
  const districtStatus=(comparisonEnabled||urban)?document.createElement('output'):null;
  if(districtStatus){districtStatus.hidden=atomic;districtStatus.className='city-asset-status';districtStatus.setAttribute('role','status');host.append(districtStatus);districtStatus.dataset.state=showcaseEnabled?'loading':'control';districtStatus.textContent=showcaseEnabled?'Loading Units modular architecture…':'Procedural control · Physlib/Units · unchanged source placements';}
  function replaceSurfaceArt(excluded){
    const geometries=new Set(),artMaterials=new Set();surfaceArt.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)artMaterials.add(object.material);object.dispose?.();});
    for(const geometry of geometries)geometry.dispose();for(const material of artMaterials)material.dispose();surfaceArt.clear();
    surfaceArt.add(createCityArt(urban?[]:city.nodes.filter(n=>n.library!=='Mathlib'&&!excluded.has(n.id)),layout.positions,floors));
  }
  function makeDistrictSign(title,path,count){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#153b43';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#b87e4d';ctx.fillRect(0,0,14,256);ctx.fillStyle='#e8e6d7';ctx.font='bold 98px monospace';ctx.fillText(title,42,112);ctx.font='32px monospace';ctx.fillText(path,44,174);ctx.fillStyle='#80c5c2';ctx.font='28px monospace';ctx.fillText(count,44,222);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));sprite.scale.set(6,1.5,1);return sprite;
  }
  let sharedTemplate=null,sharedAtlas=null,inspectionArt=null,inspectionId=null;
  function updateInspectionArt(id){
    if(atomic||!urban||!sharedTemplate||!id||showcaseIds.has(id)||!layout.manifest.modules[id]||floors.get(id).height<2)return;
    if(inspectionId===id)return;
    if(inspectionArt){scene.remove(inspectionArt.group);clearCachedArt(inspectionArt.group,sharedTemplate);}
    inspectionId=id;inspectionArt=createLodShowcase({nodes:[nodeById.get(id)],layout,floors,template:sharedTemplate,localShadows:urban,atlas:sharedAtlas});scene.add(inspectionArt.group);
  }
  if(showcaseEnabled)void createAssetRegistry().load('district-kit',document.baseURI).then(template=>{
    sharedTemplate=template;sharedAtlas=makeFacadeAtlas();
    showcase=renderProfile.name==='legacy'?createShowcaseDistrict({nodes:showcaseNodes,layout,floors,template,makeSign:makeDistrictSign}):createLodShowcase({nodes:showcaseNodes,layout,floors,template,makeSign:makeDistrictSign,localShadows:urban,atlas:sharedAtlas});scene.add(showcase.group);
    renderer.shadowMap.needsUpdate=true;
    const hitMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,colorWrite:false,depthWrite:false});
    for(const node of showcaseNodes){const building=buildings.get(node.id);building.hitMaterial=hitMaterial;building.body.material=hitMaterial;}
    replaceSurfaceArt(showcaseIds);
    districtStatus.dataset.state='assembled';districtStatus.textContent=`Units · ${showcaseNodes.length} source files · three architectural variants · module imports only`;
    if(selected)select(selected);
  }).catch(error=>{districtStatus.dataset.state='fallback';districtStatus.textContent='Modular kit unavailable · procedural Units retained · source inspection available';console.warn('Optional Units kit:',error.message);});
  // Opt-in smoke test: one real module, with all graph data and navigation intact.
  if(fixtureEnabled){
    const status=document.createElement('output');status.className='city-asset-status';
    status.setAttribute('role','status');host.append(status);
    const building=buildings.get(assetFixtureModuleId);
    if(!building)status.textContent='Asset fixture unavailable: module absent from snapshot.';
    else void attachBuildingAsset({registry:createAssetRegistry(),key:'kenney-tower',baseUrl:document.baseURI,
      building,height:floors.get(assetFixtureModuleId).height,onStatus:(state,result)=>{
        status.dataset.state=state;
        status.textContent=state==='ready'?'Asset fixture · Kenney tower · CC0 · '+assetFixtureModuleId:
          state==='loading'?'Loading optional Kenney building fixture…':'Asset unavailable · procedural building retained; source inspection available.';
        if(state!=='ready')return;
        // Semantic body stays raycastable but does not hide the fitted art.
        building.hitMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false});
        building.body.material=building.hitMaterial;
        if(result.pedestalHeight>.001){
          const pedestal=new THREE.Mesh(bodyGeometry,baseMaterial(building.node));
          pedestal.scale.set(building.footprint.width,result.pedestalHeight,building.footprint.depth);
          pedestal.position.y=result.pedestalHeight/2;pedestal.userData={id:building.node.id,decorative:true};
          building.group.add(pedestal);
        }
        // Remove this module's old roof/entrance without changing other instances.
        scene.remove(surfaceArt);
        const replacement=createCityArt(city.nodes.filter(node=>node.library!=='Mathlib'&&node.id!==assetFixtureModuleId),layout.positions,floors);
        const geometries=new Set(),artMaterials=new Set();
        surfaceArt.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)artMaterials.add(object.material);object.dispose?.();});
        for(const geometry of geometries)geometry.dispose();for(const material of artMaterials)material.dispose();
        surfaceArt.clear();
        surfaceArt.add(replacement);scene.add(surfaceArt);
        if(selected===assetFixtureModuleId)select(selected);
      }});
  }
  const staticCollisionBoxes=[...buildings.values()].map(({group,node,direction,footprint})=>{
    if(urban&&direction>0&&layout.manifest.modules[node.id]){const m=layout.manifest.modules[node.id],b=m.decorativeBounds;return {min:{x:b.minX,y:0,z:b.minZ},max:{x:b.maxX,y:m.decorativeHeight,z:b.maxZ},layer:'surface'};}
    const height=floors.get(node.id).height;
    return {min:{x:group.position.x-footprint.width/2,y:Math.min(0,direction*height),z:group.position.z-footprint.depth/2},max:{x:group.position.x+footprint.width/2,y:Math.max(0,direction*height),z:group.position.z+footprint.depth/2},layer:direction<0?'underground':'surface'};
  }).concat(urban?layout.manifest.obstructions.map(o=>({min:{x:o.bounds.minX,y:o.minY,z:o.bounds.minZ},max:{x:o.bounds.maxX,y:o.maxY,z:o.bounds.maxZ},layer:'surface'})):[]);
  const collisionGrid=createCollisionGrid(staticCollisionBoxes);
  function updateSkywalkCollision(curves=[]){if(!chromatic)return;const segments=[];for(const curve of curves){const p=curve.getPoints(48);for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i];segments.push({min:{x:Math.min(a.x,b.x)-.4,y:Math.min(a.y,b.y)-.2,z:Math.min(a.z,b.z)-.4},max:{x:Math.max(a.x,b.x)+.4,y:Math.max(a.y,b.y)+.8,z:Math.max(a.z,b.z)+.4},layer:'surface'});}}const next=createCollisionGrid([...staticCollisionBoxes,...segments]);collisionGrid.cells=next.cells;}
  const pipelineLinks=allMathlibPipelines(city);
  function pipelineCurve(link){const source=buildings.get(link.from),target=buildings.get(link.to);if(!source||!target)return null;
    const a=source.group.position.clone().add(new THREE.Vector3(0,1.5,0)),b=target.group.position.clone().add(new THREE.Vector3(0,.5,0));
    const height=2.5+Math.min(5,Math.hypot(a.x-b.x,a.z-b.z)*.025);return new THREE.CubicBezierCurve3(a,new THREE.Vector3(a.x,height,a.z),new THREE.Vector3(b.x,height,b.z),b);
  }
  function physicsCurve(link){const source=buildings.get(link.from),target=buildings.get(link.to);if(!source||!target)return null;const bothBelow=source.direction<0&&target.direction<0,ay=bothBelow?-Math.max(2,floors.get(link.from).height*.7):source.direction<0?1.5:Math.max(3,floors.get(link.from).height*.7),by=bothBelow?-Math.max(2,floors.get(link.to).height*.35):target.direction<0?1:Math.max(2,floors.get(link.to).height*.35);const a=source.group.position.clone().add(new THREE.Vector3(0,ay,0)),b=target.group.position.clone().add(new THREE.Vector3(0,by,0)),lift=(bothBelow?-1:1)*Math.min(10,Math.max(3,Math.hypot(a.x-b.x,a.z-b.z)*.045));return new THREE.CubicBezierCurve3(a,a.clone().add(new THREE.Vector3(0,lift,0)),b.clone().add(new THREE.Vector3(0,lift,0)),b);}
  // A single instanced mesh keeps all real file-import pipes visible without one draw call per edge.
  const pipeSegments=[],physLinks=city.edges.filter(edge=>{const from=nodeById.get(edge.from),to=nodeById.get(edge.to);return from&&to&&from.library===to.library;});
  for(const [links,math] of (urban?[]:[[pipelineLinks,true],[physLinks,false]]))for(const link of links){const curve=math?pipelineCurve(link):physicsCurve(link);if(!curve)continue;const points=curve.getPoints(4);for(let i=1;i<points.length;i++)pipeSegments.push({a:points[i-1],b:points[i],color:math?0x00ded2:i<=2?0xe43ba9:0xffa71a});}
  const network=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,6),new THREE.MeshBasicMaterial({transparent:true,opacity:.035,depthTest:false,depthWrite:false}),pipeSegments.length),part=new THREE.Object3D(),upAxis=new THREE.Vector3(0,1,0);
  pipeSegments.forEach((segment,index)=>{const direction=segment.b.clone().sub(segment.a),length=direction.length();part.position.copy(segment.a).add(segment.b).multiplyScalar(.5);part.quaternion.setFromUnitVectors(upAxis,direction.normalize());part.scale.set(.085,length,.085);part.updateMatrix();network.setMatrixAt(index,part.matrix);network.setColorAt(index,new THREE.Color(segment.color));});network.frustumCulled=false;network.renderOrder=80;scene.add(network,edges,pipes,hubs);
  let selected=null,relationMode='imports',showPipes=true,quality='medium';const roadTraffic=[],pipeTraffic=[];
  const diagnostics=new URLSearchParams(location.search).has('metrics')?document.createElement('output'):null;
  if(diagnostics){diagnostics.className='city-metrics';diagnostics.setAttribute('aria-label','Rendering metrics');host.append(diagnostics);}
  let metricFrames=0,metricStarted=performance.now(),sceneReady=performance.now()-sceneStarted;
  let lastMetricFrame=performance.now();const frameTimes=[];
  const districtControls=(comparisonEnabled||parameters.has('metrics'))?document.createElement('div'):null;
  let benchmarkAnchor=null,benchmarkOutput=null,benchmarkDetails=null,benchmarkDownload=null,bridgeInfo=null;
  if(districtControls){
    districtControls.className='city-district-controls';districtControls.setAttribute('aria-label','Units district views');
    for(const [view,label] of [['overview','District overview'],['medium','District close view'],['selected','Building view']]){
      const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>focusShowcaseView(view));districtControls.append(button);
    }
    if(parameters.has('metrics')){const button=document.createElement('button');button.type='button';button.textContent='Benchmark camera motion';button.addEventListener('click',startBenchmark);districtControls.append(button);benchmarkOutput=document.createElement('output');benchmarkOutput.className='city-benchmark-result';benchmarkOutput.setAttribute('aria-live','polite');host.append(benchmarkOutput);}
    host.append(districtControls);
    if(parameters.has('metrics')){benchmarkDownload=document.createElement('a');benchmarkDownload.className='city-benchmark-download';benchmarkDownload.textContent='Save benchmark JSON';benchmarkDownload.hidden=true;districtControls.append(benchmarkDownload);}
    if(parameters.has('metrics')){const details=document.createElement('details');details.className='city-benchmark-details';const summary=document.createElement('summary');summary.textContent='Benchmark JSON';benchmarkDetails=document.createElement('pre');benchmarkDetails.setAttribute('aria-label','Benchmark JSON result');details.append(summary,benchmarkDetails);host.append(details);}
    bridgeInfo=document.createElement('div');bridgeInfo.className='city-skywalk-info';bridgeInfo.hidden=true;host.append(bridgeInfo);
  }
  const fadedMaterials=new Map();
  function fadeMaterial(material){if(!fadedMaterials.has(material)){const faded=material.clone();faded.color.setRGB(.78,.78,.78);fadedMaterials.set(material,faded);}return fadedMaterials.get(material);}
  const selectedMaterials=new Map();
  function selectedMaterial(node){const base=baseMaterial(node);if(!selectedMaterials.has(base)){const selectedBase=base.clone();selectedBase.color.setRGB(1.2,1.2,1.2);selectedMaterials.set(base,selectedBase);}return selectedMaterials.get(base);}
  function setBuildingFocus(){for(const [id,b] of buildings)if(id!==selected){const material=selected?fadeMaterial(baseMaterial(b.node)):baseMaterial(b.node);b.body.material=b.hitMaterial||material;if(b.surface)b.surface.material=material;}}
  // Overview needs the actual city extent plus a small border; panning itself
  // has no artificial circular zones or invisible walls.
  const bounds=urban?layout.manifest.bounds:cityBounds(layout.zones.filter(z=>!z.underground),12);
  let underground=false;
  const anchor=layout.positions.get('Physlib.ClassicalMechanics.EulerLagrange')||layout.positions.get(city.nodes.find(n=>n.library==='Physlib')?.id)||{x:0,z:0};
  const homeTarget=new THREE.Vector3(anchor.x,2,anchor.z),homePosition=homeTarget.clone().add(new THREE.Vector3(5,50,18));
  const navigation=createNavigationController({camera,controls,element:renderer.domElement,collisionGrid,isUnderground:()=>underground,worldBounds:urban?layout.manifest.bounds:null});
  if(renderProfile.flat)scene.overrideMaterial=new THREE.MeshBasicMaterial({color:0x7b9b99});
  renderer.shadowMap.autoUpdate=renderProfile.liveShadows;
  const travel=(...args)=>{if(districtControls)districtControls.dataset.settled='false';navigation.travel(...args);};
  function setLayer(value){
    underground=value;
    host.dispatchEvent(new CustomEvent('city-layer-change',{detail:{underground:value}}));
    controls.minPolarAngle=value?2.19:.2;
    controls.maxPolarAngle=value?2.94:.95;
    ground.visible=!value&&!urban;
    for(const object of aboveScenery)object.visible=!value;
    for(const object of belowScenery)object.visible=value;
    network.visible=!urban&&showPipes&&!value&&!comparisonEnabled;
    pipes.visible=!value;
    showAll();
    if(selected){drawPipes();drawFileLinks();drawHubs(selected);}
  }
  function lookAt(focus,distance){
    distance=Math.max(14,Math.min(controls.maxDistance,distance));
    const sign=underground?-1:1;
    travel(focus,focus.clone().add(new THREE.Vector3(distance*.55,sign*distance*.8,distance*.7)));
  }
  function focusShowcaseView(view='overview'){if(!showcaseNodes.length)return;
    if(atomic&&view!=='overview'){districtScope=true;focusBuilding(showcaseModule);return;}
    if(atomic){districtScope=false;focusFolder('Physlib/Units');return;}
    interruptBenchmark();
    districtScope=true;setLayer(false);const pose=districtCameraPose(showcaseNodes,layout.positions,floors,view);
    travel(new THREE.Vector3(...pose.target),new THREE.Vector3(...pose.position));
    if(districtControls){districtControls.dataset.pose=JSON.stringify(pose);districtControls.dataset.view=view;districtControls.dataset.settled='false';}
  }
  function startBenchmark(){
    const requestedPath=parameters.get('cameraPath');const fixedPath=requestedPath?JSON.parse(requestedPath):null;
    const pose=fixedPath|| (urban&&!comparisonEnabled?{target:controls.target.toArray()}:districtCameraPose(showcaseNodes,layout.positions,floors,'overview'));
    benchmarkAnchor??={radius:fixedPath?.radius??(urban&&!comparisonEnabled?Math.max(45,camera.position.distanceTo(controls.target)*.65):45),target:pose.target};benchmark={radius:benchmarkAnchor.radius,start:performance.now(),last:performance.now(),step:-1,samples:[],target:new THREE.Vector3(...benchmarkAnchor.target)};
    benchmarkOutput.textContent='Moving-camera benchmark running · 12 seconds';benchmarkOutput.removeAttribute('data-result');
  }
  function interruptBenchmark(){if(benchmark){benchmark=null;benchmarkOutput.textContent='Camera benchmark interrupted';navigation.cancel();}}
  renderer.domElement.addEventListener('pointerdown',interruptBenchmark);
  renderer.domElement.addEventListener('wheel',interruptBenchmark,{passive:true});
  renderer.domElement.addEventListener('keydown',interruptBenchmark);
  function overview(){geographicFocus=null;
    districtScope=false;setLayer(false);
    const direction=new THREE.Vector3(0,chromatic?.82:1,1).normalize();
    const box={min:{x:bounds.minX,y:0,z:bounds.minZ},max:{x:bounds.maxX,y:urban?layout.manifest.surfaceHeight:30,z:bounds.maxZ}};
    const fit=fitBox(box,direction,camera.fov,camera.aspect,chromatic?1.04:1.15);
    const centre=new THREE.Vector3(fit.centre.x,fit.centre.y,fit.centre.z);
    controls.maxDistance=Math.max(controls.maxDistance,fit.distance*1.2);
    travel(centre,centre.clone().addScaledVector(direction,fit.distance));
  }
  function travelLayer(value){
    setLayer(value);
    const destination=layerDestination(buildings,pipelineLinks,selected,value,controls.target);
    const building=buildings.get(destination);
    const target=building?building.group.position.clone():controls.target.clone();
    target.y=value?-5:5;
    lookAt(target,30);
  }
  function showAll(){for(const [id,b] of buildings){b.group.visible=(underground?b.direction<0:b.direction>0||!urban)&&(!districtScope||underground||showcaseIds.has(id));if(b.surface)b.surface.visible=!underground;}}
  function focusFolder(folder){geographicFocus=folder;if(chromatic)for(const object of aboveScenery)object.userData.setScope?.(folder);districtScope=false;showAll();if(urban&&!folder.startsWith('Mathlib')){const parcel=layout.manifest.parcels.find(p=>p.id===folder)||layout.manifest.boroughs.find(p=>p.id===folder)||layout.manifest.crossings.find(p=>p.id===folder);if(parcel){setLayer(false);let b=parcel.bounds;if(atomic&&!chromatic&&parcel.moduleIds?.length){const ms=parcel.moduleIds.map(id=>layout.manifest.modules[id]);b={minX:Math.min(...ms.map(m=>m.decorativeBounds.minX))-3,maxX:Math.max(...ms.map(m=>m.decorativeBounds.maxX))+3,minZ:Math.min(...ms.map(m=>m.decorativeBounds.minZ))-3,maxZ:Math.max(...ms.map(m=>m.decorativeBounds.maxZ))+3};}const direction=metropolis?new THREE.Vector3(.65,.52,1):new THREE.Vector3(.25,1,1),height=metropolis?(parcel.civicHeight||layout.manifest.surfaceHeight):layout.manifest.surfaceHeight;const fit=fitBox({min:{x:b.minX,y:0,z:b.minZ},max:{x:b.maxX,y:height,z:b.maxZ}},direction,camera.fov,camera.aspect,metropolis?1.04:1.15);const centre=new THREE.Vector3(fit.centre.x,fit.centre.y,fit.centre.z);travel(centre,centre.clone().add(direction.normalize().multiplyScalar(fit.distance)));return;}} const members=city.nodes.filter(n=>n.module.path.replaceAll('\\','/').startsWith(`${folder}/`));if(!members.length)return;setLayer(folder.startsWith('Mathlib'));const box=new THREE.Box3();for(const n of members)box.expandByObject(buildings.get(n.id).body);const direction=new THREE.Vector3(0,underground?-1:1,1).normalize(),fit=fitBox(box,direction,camera.fov,camera.aspect);const centre=new THREE.Vector3(fit.centre.x,fit.centre.y,fit.centre.z);travel(centre,centre.clone().addScaledVector(direction,fit.distance));}
  function focusBuilding(id){if(parameters.has('reviewOffset')){const b=buildings.get(id),off=reviewCameraOffset(parameters.get('reviewOffset'));if(b&&Array.isArray(off)&&off.length===3&&off.every(Number.isFinite)){const t=b.group.position.clone().add(new THREE.Vector3(0,floors.get(id).height*.5,0));travel(t,t.clone().add(new THREE.Vector3(...off)));return;}}if(atomic&&layout.manifest.modules[id]){setLayer(false);showAll();const pose=atomicCameraPose(layout.manifest.modules[id],[...Object.values(layout.manifest.modules),...(layout.manifest.landmarks||[]).map(l=>({id:l.id,position:l.position,decorativeBounds:l.bounds,decorativeHeight:l.maxY}))],camera.aspect,parameters.get('districtView'));travel(new THREE.Vector3(...pose.target),new THREE.Vector3(...pose.position));return;}const b=buildings.get(id);if(!b)return;setLayer(b.direction<0);showAll();const height=floors.get(id).height,centre=b.group.position.clone().add(new THREE.Vector3(0,b.direction*height/2,0)),box={min:{x:centre.x-b.footprint.width/2,y:Math.min(0,b.direction*height),z:centre.z-b.footprint.depth/2},max:{x:centre.x+b.footprint.width/2,y:Math.max(0,b.direction*height),z:centre.z+b.footprint.depth/2}},distance=Math.max(18,fitBox(box,{x:1,y:b.direction*1.2,z:1},camera.fov,camera.aspect).distance);let best=null;
    // Choose a street-facing angle with as few intervening buildings as possible.
    for(let i=0;i<16;i++){const angle=i*Math.PI/8,dx=Math.cos(angle)*distance,dz=Math.sin(angle)*distance,cameraY=centre.y+b.direction*distance*.85;let score=0;for(const [otherId,other] of buildings){if(otherId===id||other.direction!==b.direction)continue;const ox=other.group.position.x-centre.x,oz=other.group.position.z-centre.z,t=(ox*dx+oz*dz)/(distance*distance);if(t<=.04||t>=1.05)continue;const lateral=Math.hypot(ox-t*dx,oz-t*dz),rayY=centre.y+t*(cameraY-centre.y),level=b.direction*rayY;if(lateral<1.8&&level>=0&&level<floors.get(otherId).height)score+=1+(t>.75?4:0);}if(!best||score<best.score)best={score,position:centre.clone().add(new THREE.Vector3(dx,b.direction*distance*.85,dz))};}
    travel(centre,best.position);
  }
  function clearFloors(building){for(const child of [...building.group.children])if(child!==building.body&&child!==building.surface&&!child.userData.decorative){building.group.remove(child);child.geometry.dispose();}building.body.visible=!(urban&&building.direction>0);}
  function drawHubs(id){
    clearDisposableGroup(hubs);for(const label of hubLabels)label.element.remove();hubLabels.length=0;
    if((urban||comparisonEnabled)&&showcaseIds.has(id))return;
    const building=buildings.get(id);if(!building)return;const groups=relationGroups(city,id),items=[{name:'Mathlib',count:groups.mathlib.length,color:0x00ded2,shape:'ring'},{name:'Uses',count:groups.uses.length,color:0xe43ba9,shape:'diamond'},{name:'Used by',count:groups.usedBy.length,color:0xffa71a,shape:'cube'}].filter(item=>item.count);
    const origin=building.group.position.clone().add(new THREE.Vector3(0,building.direction*floors.get(id).height*.55,0));
    items.forEach((item,index)=>{const position=origin.clone().add(new THREE.Vector3((index-(items.length-1)/2)*3.2,1.6,3));const geometry=item.shape==='ring'?new THREE.TorusGeometry(.65,.17,8,20):item.shape==='diamond'?new THREE.OctahedronGeometry(.75):new THREE.BoxGeometry(1.1,1.1,1.1);const marker=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:item.color,depthTest:false}));marker.position.copy(position);marker.renderOrder=95;hubs.add(marker);const stem=new THREE.Line(new THREE.BufferGeometry().setFromPoints([origin,position]),new THREE.LineBasicMaterial({color:item.color,transparent:true,opacity:.8,depthTest:false}));stem.renderOrder=94;hubs.add(stem);const element=document.createElement('span');element.className='city-hub-label';element.textContent=`${item.name} · ${item.count}`;element.style.borderColor=`#${item.color.toString(16).padStart(6,'0')}`;overlay.append(element);hubLabels.push({element,position,marker,ring:item.shape==='ring'});});
  }
  function select(id){
    interruptBenchmark();
    if(comparisonEnabled){districtScope=!id||showcaseIds.has(id);showAll();}
    if(selected&&buildings.has(selected)){const previous=buildings.get(selected);clearFloors(previous);previous.body.material=previous.hitMaterial||baseMaterial(previous.node);previous.body.renderOrder=0;if(previous.surface){previous.surface.material=baseMaterial(previous.node);previous.surface.renderOrder=0;}}
    selected=id;if(chromatic)for(const object of aboveScenery)object.userData.setScope?.(layout.manifest.modules[id]?.districtId);if(atomic&&layout.manifest.modules[id]){const p=layout.manifest.modules[id].position;sun.position.set(p.x-25,55,p.z+18);sun.target.position.set(p.x,0,p.z);renderer.shadowMap.needsUpdate=true;}updateInspectionArt(id);setBuildingFocus();drawPipes();drawHubs(id);const b=buildings.get(id);selectionOutline.visible=Boolean(b);if(!b)return drawLinks([],false);const selectedHeight=floors.get(id).height;selectionOutline.position.copy(b.group.position).add(new THREE.Vector3(0,b.direction*selectedHeight/2,0));selectionOutline.scale.set(b.footprint.width+.2,selectedHeight+.3,b.footprint.depth+.2);b.body.material=selectedMaterial(b.node);b.body.renderOrder=50;if(b.surface){b.surface.material=selectedMaterial(b.node);b.surface.renderOrder=50;}
    if(b.hitMaterial)b.body.material=b.hitMaterial;
    const data=floors.get(id);if(data.floors.length){b.body.visible=false;const h=data.height/data.floors.length;
      for(const floor of data.floors){const mesh=new THREE.Mesh(new THREE.BoxGeometry(b.footprint.width,Math.max(.1,h-.08),b.footprint.depth),b.hitMaterial?b.hitMaterial:selectedMaterial(b.node));mesh.renderOrder=50;mesh.position.y=b.direction*(floor.index+.5)*h;mesh.userData={id,floor:floor.index,canonicalHit:urban&&b.direction>0};if(urban&&b.direction>0)mesh.visible=false;b.group.add(mesh);}}
    return drawFileLinks();
  }
  function selectFloor(id,index){const b=buildings.get(id);if(!b||id!==selected)return;for(const mesh of b.group.children)if(mesh!==b.body&&mesh!==b.surface&&!mesh.userData.decorative){mesh.material=b.hitMaterial?(mesh.userData.floor===index?materials.fixtureFloor:b.hitMaterial):(mesh.userData.floor===index?materials.floor:selectedMaterial(b.node));if(urban&&b.direction>0)mesh.visible=mesh.userData.floor===index;}}
  function drawPipes(){
    clearDisposableGroup(pipes);pipeTraffic.length=0;
    const links=pipelineLinks.filter(edge=>edge.from===selected||edge.to===selected);network.visible=!urban&&showPipes&&!underground&&!comparisonEnabled;network.material.opacity=selected ? .02 : .035;if(!showPipes||(atomic&&!underground)||(comparisonEnabled&&showcaseIds.has(selected)))return links.length;
    for(const link of links){const curve=pipelineCurve(link);if(!curve)continue;
      const pipe=new THREE.Mesh(new THREE.TubeGeometry(curve,32,.48,8,false),new THREE.MeshBasicMaterial({color:0x00ded2,depthTest:false}));pipe.renderOrder=90;pipes.add(pipe);
      if(pipeTraffic.length<24){const car=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),new THREE.MeshBasicMaterial({color:0xc8ffff,depthTest:false}));car.renderOrder=91;pipes.add(car);pipeTraffic.push({object:car,curve,phase:pipeTraffic.length*.17});}
    }return links.length;
  }
  function drawFileLinks(){return drawLinks(city.edges.filter(e=>e.from===selected||e.to===selected),false);}
  function drawLinks(links,dashed){
    clearDisposableGroup(edges);roadTraffic.length=0;
    if(bridgePresentation){clearDisposableGroup(bridgePresentation.group);scene.remove(bridgePresentation.group);bridgePresentation=null;}
    if(showcaseEnabled)renderer.shadowMap.needsUpdate=true;
    if(chromatic)updateSkywalkCollision();if(bridgeInfo){bridgeInfo.hidden=true;bridgeInfo.replaceChildren();}
    setBuildingFocus();
    const allCandidates=links.filter(link=>positions.has(link.from)&&positions.has(link.to));
    const candidates=allCandidates.filter(link=>!underground||(buildings.get(link.from).direction<0&&buildings.get(link.to).direction<0));
    const mode=dashed?'both':relationMode,result=visibleRelations(candidates,selected,mode,12),total=visibleRelations(allCandidates,selected,mode,12).total;let drawn=0;
    if(!dashed&&!showPipes)return {drawn,total};
    if((urban&&!underground||comparisonEnabled&&showcaseIds.has(selected))&&!dashed){
      const surfaceIds=urban?new Set(Object.keys(layout.manifest.modules)):showcaseIds;const localEdges=selectedSkywalkEdges(city.edges,surfaceIds,selected,mode).filter(e=>!urban||Math.hypot(layout.positions.get(e.from).x-layout.positions.get(e.to).x,layout.positions.get(e.from).z-layout.positions.get(e.to).z)<240);
      if(showcase||urban){bridgePresentation=createSkywalks({edges:localEdges,nodes:urban?city.nodes.filter(n=>n.library!=='Mathlib'):showcaseNodes,positions:layout.positions,floors,manifest:layout.manifest});scene.add(bridgePresentation.group);if(chromatic)updateSkywalkCollision(bridgePresentation.arrows.map(a=>a.curve));}
      else for(const edge of localEdges){const curve=physicsCurve(edge);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,24,.12,6,false),new THREE.MeshBasicMaterial({color:0x509a9e}));edges.add(mesh);}
      if(bridgeInfo&&localEdges.length){
        bridgeInfo.hidden=false;const title=document.createElement('strong');title.textContent=`${localEdges.length} selected module import${localEdges.length===1?'':'s'}`;bridgeInfo.append(title);
        for(const edge of localEdges){const row=document.createElement('div');row.textContent=`${edge.from.split('.').at(-1)} → ${edge.to.split('.').at(-1)} · import line ${edge.line}`;bridgeInfo.append(row);}
      }
      if(urban&&bridgeInfo&&total>localEdges.length){bridgeInfo.hidden=false;const notice=document.createElement('div');notice.textContent=`${total-localEdges.length} further imports: exact destinations remain in the inspector (long / underground routes).`;bridgeInfo.append(notice);}
      return {drawn:localEdges.length,total};
    }
    for(const link of result.links){const from=positions.get(link.from),to=positions.get(link.to),distance=from.distanceTo(to);if(distance<.01)continue;drawn++;
      if(!dashed&&showPipes&&nodeById.get(link.from)?.library==='Physlib'&&nodeById.get(link.to)?.library==='Mathlib')continue;
      const curve=physicsCurve(link);if(!curve)continue;const color=link.from===selected?0xe43ba9:0xffa71a;
      if(dashed){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)),new THREE.LineDashedMaterial({color:0x555b9d,dashSize:1,gapSize:.6,depthTest:false}));line.computeLineDistances();line.renderOrder=90;edges.add(line);}else{const road=new THREE.Mesh(new THREE.TubeGeometry(curve,24,.42,8,false),new THREE.MeshBasicMaterial({color,depthTest:false}));road.renderOrder=90;edges.add(road);const vehicle=new THREE.Mesh(new THREE.SphereGeometry(.55,8,6),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false}));vehicle.renderOrder=91;edges.add(vehicle);roadTraffic.push({object:vehicle,curve,phase:roadTraffic.length*.19});}
      const direction=curve.getTangent(.96).normalize(),cone=new THREE.Mesh(new THREE.ConeGeometry(.55,1.4,8),new THREE.MeshBasicMaterial({color,depthTest:false}));cone.renderOrder=91;cone.position.copy(curve.getPoint(.96));cone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);edges.add(cone);
    }return {drawn,total};
  }
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];renderer.domElement.focus({preventScroll:true});});
  function pick(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const visible=canonicalPickTargets(buildings);return ray.intersectObjects(visible,false)[0];}
  renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4)return;const hit=pick(e);if(hit){const {id,floor}=hit.object.userData;if(id===selected&&Number.isInteger(floor))onFloor(id,floor);else if(id)onSelect(id);}});
  let lastHover=0;renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons||performance.now()-lastHover<100){if(e.buttons)tooltip.hidden=true;return;}lastHover=performance.now();const hit=pick(e);if(!hit){tooltip.hidden=true;renderer.domElement.style.cursor='grab';return;}const {id,floor}=hit.object.userData;if(chromatic&&layout.manifest.modules[id]){tooltip.style.borderColor=layout.manifest.modules[id].identity.primary;tooltip.dataset.district=layout.manifest.modules[id].districtId;}tooltip.textContent=Number.isInteger(floor)&&id===selected?`${id} · Floor ${floor+1}`:id;tooltip.hidden=false;tooltip.style.left=`${e.offsetX+12}px`;tooltip.style.top=`${e.offsetY+12}px`;renderer.domElement.style.cursor='pointer';});
  renderer.domElement.addEventListener('pointerleave',()=>{tooltip.hidden=true;});
  if(!renderProfile.overlay){overlay.style.visibility='hidden';if(diagnostics)diagnostics.hidden=true;if(districtStatus)districtStatus.hidden=true;if(bridgeInfo)bridgeInfo.style.visibility='hidden';const current=document.querySelector('#current-selection');if(current)current.style.visibility='hidden';}
  const atomicArt=atomic?createAtomicArt(layout.manifest):null;if(atomicArt)scene.add(atomicArt.group);
  const chunkArt=urban&&!atomic?createChunkArt(layout.manifest,materials):null;let chunkStats=null,lastChunkVisibility=null;
  if(chunkArt)scene.add(chunkArt.group);
  const hiddenBody=new THREE.MeshBasicMaterial({transparent:true,opacity:0,colorWrite:false,depthWrite:false});
  if(urban)for(const b of buildings.values())if(b.direction>0){b.hitMaterial=hiddenBody;b.body.material=hiddenBody;}
  const keys=new Set(),clock=new THREE.Clock();
  window.addEventListener('keydown',event=>{if(event.ctrlKey||event.metaKey||event.altKey||/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target.tagName)||event.target.isContentEditable)return;const key=event.key.toLowerCase();if(key==='home'){event.preventDefault();setLayer(false);showAll();travel(homeTarget,homePosition);return;}if(['w','a','s','d'].includes(key)){event.preventDefault();keys.add(key);navigation.cancel();}});
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}new ResizeObserver(resize).observe(host);resize();camera.position.copy(homePosition);controls.target.copy(homeTarget);controls.update();
  const renderFrame=()=>{
    const frameStarted=performance.now();let renderSubmitMs=0,finishWaitMs=0;
    if(benchmark){
      const elapsed=performance.now()-benchmark.start,stepIndex=Math.floor(elapsed/600);
      if(stepIndex!==benchmark.step&&elapsed<12000){benchmark.step=stepIndex;const angle=stepIndex*Math.PI/10;const radius=benchmark.radius;
        travel(benchmark.target,benchmark.target.clone().add(new THREE.Vector3(Math.cos(angle)*radius,radius*.82,Math.sin(angle)*radius)));}
    }
    const step=Math.min(clock.getDelta(),.05)*Math.max(12,Math.min(120,camera.position.distanceTo(controls.target)*.55));if(keys.size)navigation.move((Number(keys.has('w'))-Number(keys.has('s')))*step,(Number(keys.has('d'))-Number(keys.has('a')))*step);navigation.update();host.dataset.settled=String(!navigation.flying);if(!navigation.flying&&atomic){const pose=JSON.stringify({position:camera.position.toArray(),target:controls.target.toArray(),width:renderer.domElement.width,height:renderer.domElement.height,fov:camera.fov});if(host.dataset.camera!==pose)host.dataset.camera=pose;}for(const item of [...roadTraffic,...pipeTraffic])item.object.position.copy(item.curve.getPoint((performance.now()/6000+item.phase)%1));hubs.visible=Boolean(selected)&&!atomic;const showArt=quality!=='low'&&camera.position.distanceTo(controls.target)<180;surfaceArt.visible=showArt&&!underground&&!districtScope;if(scopedProceduralArt)scopedProceduralArt.visible=showArt&&!underground&&districtScope&&!showcase;for(const object of aboveScenery){object.visible=!underground&&(!districtScope||object.userData.showcaseLocal);if(chromatic&&!underground)object.userData.update?.({camera,quality,distance:camera.position.distanceTo(controls.target)});}undergroundArt.visible=showArt&&underground;if(showcase){showcase.group.visible=!underground;if(showcase.update&&!underground)lodStats=showcase.update({camera,viewportHeight:host.clientHeight,quality,selected,now:performance.now(),force:renderProfile.forceLod});if(lodStats&&lodStats.shadowVersion>=0&&lodStats.shadowVersion!==lastShadowVersion){lastShadowVersion=lodStats.shadowVersion;renderer.shadowMap.needsUpdate=true;}}
    if(bridgePresentation){bridgePresentation.group.visible=!underground&&showPipes;const anchor=buildings.get(selected)?.group.position;const bridgePixels=anchor?projectedHeight(1,camera.position.distanceTo(anchor),camera.fov,host.clientHeight):0;for(const child of bridgePresentation.group.children){if(child.isInstancedMesh&&child.material.emissive)child.visible=quality!=='low'&&bridgePixels>12;else if(child.geometry?.type==='TorusGeometry')child.visible=quality!=='low'&&bridgePixels>16;}for(const item of bridgePresentation.arrows){item.object.visible=bridgePixels>7;const t=(performance.now()/5000)%1;item.object.position.copy(item.curve.getPoint(t)).add(new THREE.Vector3(0,.4,0));item.object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),item.curve.getTangent(t).normalize());}}
    if(inspectionArt){inspectionArt.group.visible=!underground&&inspectionId===selected;inspectionStats=inspectionArt.update({camera,viewportHeight:host.clientHeight,quality,selected,now:performance.now()});} if(chunkArt){chunkArt.group.visible=!underground;const excluded=new Set(showcase?showcaseIds:[]);if(inspectionArt&&inspectionId===selected)excluded.add(selected);chunkStats=chunkArt.update({camera,viewportHeight:host.clientHeight,quality,selected,excluded,scope:districtScope?showcaseIds:null});if(!underground&&chunkStats?.visibleIds&&chunkStats!==lastChunkVisibility)for(const [id,b] of buildings)if(b.direction>0)b.group.visible=chunkStats.visibleIds.has(id)&&(!districtScope||showcaseIds.has(id));lastChunkVisibility=chunkStats;}
    if(atomicArt){atomicArt.group.visible=!underground;chunkStats=atomicArt.update({camera,viewportHeight:host.clientHeight,quality,selected,scope:districtScope?showcaseIds:null});lodStats=chunkStats;host.dataset.lodSettled=String(atomicArt.group.userData.settled);}
    const updateMs=performance.now()-frameStarted,renderStarted=performance.now();
    if(renderProfile.clearOnly){renderer.info.reset();renderer.clear();}else renderer.render(scene,camera);
    renderSubmitMs=performance.now()-renderStarted;if(initialRenderedMs===null&&renderer.info.render.triangles>0)initialRenderedMs=performance.now();if(citySettledMs===null&&!navigation.flying&&(atomic?host.dataset.lodSettled==='true':!showcase||lodStats?.shadowVersion>=0))citySettledMs=performance.now();
    if(renderProfile.sync){const finishStart=performance.now();renderer.getContext().finish();finishWaitMs=performance.now()-finishStart;}
    const overlayStarted=performance.now();
    if((showcase||atomicArt)&&districtFirstVisible===null&&!underground){districtFirstVisible=performance.now();districtCompleted=districtFirstVisible;districtStatus.dataset.state='ready';districtStatus.dataset.firstVisibleMs=String(Math.round(districtFirstVisible));districtStatus.dataset.completedMs=String(Math.round(districtCompleted));if(atomic)districtStatus.hidden=true;if(parameters.has('metrics'))districtStatus.textContent+=' · visible '+Math.round(districtFirstVisible)+' ms';}

    if(diagnostics&&renderProfile.overlay){const now=performance.now();frameTimes.push(now-lastMetricFrame);lastMetricFrame=now;metricFrames++;const elapsed=now-metricStarted;if(elapsed>=1000){if(districtControls){districtControls.dataset.settled=String(!navigation.flying);districtControls.dataset.lod=JSON.stringify(lodStats);districtControls.dataset.inspectionLod=JSON.stringify(inspectionArt?.group.visible?inspectionStats:null);districtControls.dataset.chunks=JSON.stringify(chunkStats?{active:chunkStats.activeChunks,total:chunkStats.totalChunks,counts:chunkStats.counts}:null);districtControls.dataset.camera=JSON.stringify({position:camera.position.toArray(),target:controls.target.toArray(),width:renderer.domElement.width,height:renderer.domElement.height,quality});}const sorted=frameTimes.sort((a,b)=>a-b),p95=sorted[Math.ceil(sorted.length*.95)-1],max=sorted.at(-1),info=renderer.info;diagnostics.textContent=`Scene ${Math.round(sceneReady)} ms · ${Math.round(metricFrames*1000/elapsed)} FPS · P95 ${p95.toFixed(1)} ms · Max ${max.toFixed(1)} ms · ${info.render.calls} calls · ${info.render.triangles} triangles · ${info.memory.geometries} geometries · ${info.memory.textures} textures`;metricStarted=now;metricFrames=0;frameTimes.length=0;}}const active=nodeById.get(selected),activeDistrict=geographicFocus||active&&(layout.manifest?.modules[selected]?.districtId||districtFor(active)),occupied=[],overlayWidth=host.clientWidth,overlayHeight=host.clientHeight;
    if(renderProfile.overlay)for(const [index,label] of hubLabels.entries()){if(label.ring)label.marker.quaternion.copy(camera.quaternion);const p=label.position.clone().project(camera),x=(p.x+1)*overlayWidth/2,y=(1-p.y)*overlayHeight/2-index*20;label.element.hidden=!hubs.visible||p.z>1||x<0||x>overlayWidth||y<0||y>overlayHeight;if(!label.element.hidden)occupied.push({left:x-52,right:x+52,top:y-30,bottom:y+2});label.element.style.transform=`translate(-50%,-130%) translate(${x}px,${y}px)`;}
    if(renderProfile.overlay)for(const label of [...labels].sort((a,b)=>Number(b.id===activeDistrict)-Number(a.id===activeDistrict)||Number(Boolean(b.topic))-Number(Boolean(a.topic)))){const p=label.position.clone().project(camera),x=(p.x+1)*overlayWidth/2,y=(1-p.y)*overlayHeight/2+(label.id==='QuantumInfo'?28:0),width=Math.min(160,label.element.textContent.length*5.5+14),box={left:x-width/2,right:x+width/2,top:y-10,bottom:y+10};const hidden=(urban&&(camera.position.distanceTo(controls.target)>900&&!geographicFocus? !label.borough : Boolean(label.borough)))||(districtScope&&!underground&&!label.id.startsWith(showcaseDirectory))||Boolean(label.underground)!==(camera.position.y<0)||(!label.topic&&label.id!==activeDistrict)||occupied.length>=6||p.z>1||box.left<0||box.right>overlayWidth||box.top<0||box.bottom>overlayHeight||(!label.borough&&x>overlayWidth-170&&y<160)||(!label.borough&&occupied.some(o=>box.left<o.right&&box.right>o.left&&box.top<o.bottom&&box.bottom>o.top));label.element.hidden=hidden;label.element.classList.toggle('active',label.id===activeDistrict);if(!hidden)occupied.push(box);label.element.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px)`;}
    if(benchmark){const now=performance.now(),info=renderer.info;benchmark.samples.push({ms:now-benchmark.last,calls:info.render.calls,geometries:info.memory.geometries,textures:info.memory.textures,triangles:info.render.triangles,activeChunks:chunkStats?.activeChunks??0,updateMs,renderSubmitMs,finishWaitMs,overlayMs:performance.now()-overlayStarted,foreground:document.visibilityState==='visible'&&document.hasFocus()});benchmark.last=now;
      if(now-benchmark.start>=12000){const result=summarizeFrames(benchmark.samples,now-benchmark.start);const gl=renderer.getContext(),gpuInfo=gl.getExtension('WEBGL_debug_renderer_info');Object.assign(result,{benchmarkSeries:'C3-final',cinematic:document.body.classList.contains('explore-city'),initialRenderedMs:Math.round(initialRenderedMs),citySettledMs:Math.round(citySettledMs),visual:skyline?'c4':metropolis?'c3':chromatic?'c2':atomic?'c1':'c',composition:layout.manifest?.composition||null,selectedModule:selected,cameraPath:{target:benchmark.target.toArray(),radius:benchmark.radius,steps:20,stepMs:600},benchmarkScope:parameters.get('folder')||districtMode||'surface',inspectionLod:inspectionArt?.group.visible?inspectionStats?.activeCounts:null,modularActiveLod:showcase?.group.visible?lodStats?.activeCounts:null,selectedModelCount:(inspectionArt?.group.visible?inspectionStats?.activeCounts.building||0:0)+(showcase?.group.visible?lodStats?.activeCounts.building||0:0),layoutVersion:layout.manifest?.layoutVersion||1,activeChunks:chunkStats?.activeChunks??null,totalChunks:chunkStats?.totalChunks??null,chunkLod:chunkStats?.counts??null,profile:renderProfile.name,lod:lodStats?.counts||null,lodTransitions:lodStats?.transitions||0,phaseTimings:summarizePhaseTimings(benchmark.samples),gpuTimerAvailable:Boolean(gl.getExtension('EXT_disjoint_timer_query_webgl2')),activeChunkRange:[Math.min(...benchmark.samples.map(s=>s.activeChunks)),Math.max(...benchmark.samples.map(s=>s.activeChunks))],triangleRange:[Math.min(...benchmark.samples.map(s=>s.triangles)),Math.max(...benchmark.samples.map(s=>s.triangles))],mode:districtMode,quality,canvasWidth:renderer.domElement.width,canvasHeight:renderer.domElement.height,viewportWidth:innerWidth,viewportHeight:innerHeight,pixelRatio:renderer.getPixelRatio(),browser:navigator.userAgent,gpu:gpuInfo?gl.getParameter(gpuInfo.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),firstVisibleMs:districtFirstVisible===null?null:Math.round(districtFirstVisible),completedMs:districtCompleted===null?null:Math.round(districtCompleted)});result.finalFrameTriangles=info.render.triangles;if(parameters.get('collect')==='1'&&['127.0.0.1','localhost'].includes(location.hostname))void fetch('/__city-benchmark',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)}).catch(()=>{});if(benchmarkDetails)benchmarkDetails.textContent=JSON.stringify(result);if(benchmarkDownload){if(benchmarkDownload.href.startsWith('blob:'))URL.revokeObjectURL(benchmarkDownload.href);benchmarkDownload.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));benchmarkDownload.download='physlib-city-benchmark-b1-'+renderProfile.name+'-'+districtMode+'-'+quality+'-'+Date.now()+'.json';benchmarkDownload.hidden=false;}benchmarkOutput.dataset.result=JSON.stringify(result);benchmarkOutput.textContent='Moving camera · '+result.fps+' FPS · P95 '+result.p95Ms+' ms · P99 '+result.p99Ms+' ms · '+result.calls.join('–')+' calls';benchmark=null;}}
  };
  renderer.setAnimationLoop(renderFrame);
  return {manifest:layout.manifest,reviewPose:p=>{if(!p||![p.target,p.position].every(a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite)))return false;travel(new THREE.Vector3(...p.target),new THREE.Vector3(...p.position));return true;},pause:()=>{interruptBenchmark();renderer.setAnimationLoop(null);},resume:()=>{clock.getDelta();lastMetricFrame=metricStarted=performance.now();metricFrames=0;frameTimes.length=0;renderer.setAnimationLoop(renderFrame);},focusShowcaseView,select,selectFloor,setRelationMode:mode=>{relationMode=mode;return drawFileLinks();},setPipesVisible:value=>{showPipes=value;drawPipes();return drawFileLinks();},showDeclarationLinks:links=>drawLinks(links,true).drawn,focusFolder,focusBuilding,focusFoundations:()=>{if(selected)focusBuilding(selected);},zoom:navigation.zoom,move:navigation.move,reset:()=>{setLayer(false);showAll();travel(homeTarget,homePosition);},overview,setLayer:travelLayer,setQuality:level=>{quality=level;renderer.shadowMap.enabled=(showcaseEnabled||atomic)&&level!=='low';renderer.shadowMap.needsUpdate=true;renderer.setPixelRatio(Math.min(devicePixelRatio,{low:.75,medium:1,high:1.5}[level]||1)*renderProfile.pixelScale);resize();},get selected(){return selected;}};
}
