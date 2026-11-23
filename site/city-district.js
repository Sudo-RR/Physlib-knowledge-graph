import * as THREE from 'three';
import {buildingStyle,roofStyle} from './city-art.js';

export const showcaseDirectory='Physlib/Units';
export const showcaseModule='Physlib.Units.ISQDimensionBase';
export const isShowcaseNode=node=>node.module.path.replaceAll('\\','/').startsWith(`${showcaseDirectory}/`);
export const archetypeNames=['Research tower','Terraced laboratory','Rotunda institute'];
export const archetypeFor=id=>roofStyle(id)%3;
export const storyHeight=.72;

/** Presentation-only specification: canonical placement, footprint and height are untouched. */
export function planModularBuilding(node,height){
 if(!Number.isFinite(height)||height<2)throw Error('Showcase height must be at least two units');
 const footprint=buildingStyle(node.id),archetype=archetypeFor(node.id),podium=.62,roof=.86;
 const count=Math.floor((height-podium-roof)/storyHeight);
 const floors=Array.from({length:count},(_,i)=>({y:podium+i*storyHeight,height:storyHeight,
   setback:archetype===1?(i>count*.72?.72:i>count*.4?.86:1):archetype===0&&i>count*.8?.86:1}));
 const serviceHeight=height-podium-roof-count*storyHeight;
 return {moduleId:node.id,height,footprint,archetype,podium,roof,floors,serviceHeight,roofY:height-roof};
}

/** Pure camera poses shared by the procedural control and the showcase. */
export function districtCameraPose(nodes,positions,floors,view='overview'){
 const box=new THREE.Box3();
 for(const node of nodes){const p=positions.get(node.id),s=buildingStyle(node.id);box.expandByPoint(new THREE.Vector3(p.x-s.width/2,0,p.z-s.depth/2));box.expandByPoint(new THREE.Vector3(p.x+s.width/2,floors.get(node.id).height,p.z+s.depth/2));}
 const centre=box.getCenter(new THREE.Vector3());
 if(view==='selected'){
  const p=positions.get(showcaseModule),h=floors.get(showcaseModule).height;
  return {target:[p.x,h*.5,p.z],position:[p.x+35,h*.5+30,p.z+7]};
 }
 const target=view==='medium'?new THREE.Vector3():centre;
 // Derive medium target from real placements, never assume a fixed world offset.
 if(view==='medium'){const p=positions.get(showcaseModule);target.set(p.x-3,9,p.z+1.5);}
 const size=box.getSize(new THREE.Vector3()),scale=Math.max(1,Math.max(size.x,size.z)/55);
 const offset=view==='medium'?new THREE.Vector3(26,34,35):new THREE.Vector3(39,50,54).multiplyScalar(scale);
 return {target:target.toArray(),position:target.clone().add(offset).toArray()};
}

/** A bounded set of shared geometries/materials; hundreds of parts use instancing. */
export function createShowcaseDistrict({nodes,layout,floors,template,makeSign}){
 const root=new THREE.Group();root.name='Physlib/Units modular showcase';
 const box=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(.5,.5,1,24),sphere=new THREE.SphereGeometry(.5,24,12,0,Math.PI*2,0,Math.PI/2);
 const torus=new THREE.TorusGeometry(.5,.035,6,32);torus.rotateX(Math.PI/2);
 const materials={
  ceramic:new THREE.MeshStandardMaterial({color:0xe8e6d7,roughness:.65,metalness:.16}),
  glass:new THREE.MeshStandardMaterial({color:0x244d56,roughness:.25,metalness:.48}),
  copper:new THREE.MeshStandardMaterial({color:0xb87e4d,roughness:.4,metalness:.65}),
  teal:new THREE.MeshStandardMaterial({color:0x6dbfc0,emissive:0x2a7779,emissiveIntensity:.35,roughness:.35,metalness:.3}),
  path:new THREE.MeshStandardMaterial({color:0x788a8b,roughness:.94}),
  paving:new THREE.MeshStandardMaterial({color:0xb6bbae,roughness:.97}),
  green:new THREE.MeshStandardMaterial({color:0x436d61,roughness:.9}),
  earth:new THREE.MeshStandardMaterial({color:0x57675d,roughness:1})
 };
 const batches=new Map(),parts=new Map();
 template.updateMatrixWorld(true);
 template.traverse(object=>{if(object.isMesh)parts.set(object.name,{geometry:object.geometry,material:object.material});});
 for(const name of ['building-window-wide','window-white-wide','building-door','roof-flat-border-straight','roof-flat-detail-a'])if(!parts.has(name))throw Error(`Missing modular kit part: ${name}`);
 const matrix=new THREE.Matrix4(),object=new THREE.Object3D();
 function add(geometry,material,x,y,z,sx=1,sy=1,sz=1,angle=0,id=null){
  const key=`${geometry.uuid}:${material.uuid}`;
  if(!batches.has(key))batches.set(key,{geometry,material,items:[]});
  object.position.set(x,y,z);object.rotation.set(0,angle,0);object.scale.set(sx,sy,sz);object.updateMatrix();
  batches.get(key).items.push({matrix:matrix.copy(object.matrix).clone(),id});
 }
 const primitive=(shape,material,...args)=>add(shape,materials[material],...args);
 const imported=(name,x,y,z,scale,angle,id)=>{const part=parts.get(name);add(part.geometry,part.material,x,y,z,scale,scale,scale,angle,id);};
 const plans=new Map();
 for(const node of nodes){
  const p=layout.positions.get(node.id),plan=planModularBuilding(node,floors.get(node.id).height),{width:w,depth:d}=plan.footprint;
  plans.set(node.id,plan);
  const local=(shape,material,x,y,z,sx,sy,sz,angle=0)=>primitive(shape,material,p.x+x,y,p.z+z,sx,sy,sz,angle,node.id);
  // Low entrance podium; no source height is hidden in an oversized plinth.
  local(box,'ceramic',0,.19,0,w,.38,d);
  local(box,'glass',0,.49,0,w*.84,.24,d*.84);
  imported('building-door',p.x,.15,p.z+d*.25,.68,0,node.id);
  local(box,'copper',0,.64,d*.36,w*.9,.07,d*.24);
  for(const floor of plan.floors){
   const fw=w*floor.setback,fd=d*floor.setback,y=floor.y;
   local(plan.archetype===2?cylinder:box,'glass',0,y+storyHeight/2,0,fw*.86,storyHeight,fd*.86);
   local(plan.archetype===2?cylinder:box,'ceramic',0,y+.045,0,fw,.09,fd);
   if(plan.archetype===2){
    for(let side=0;side<8;side++){const a=side*Math.PI/4;
     imported('window-white-wide',p.x+Math.sin(a)*fw*.435,y+.19,p.z+Math.cos(a)*fd*.435,.62,a,node.id);
    }
   }else{
    for(let side=0;side<4;side++){const a=side*Math.PI/2,span=side%2?fd:fw,reach=(side%2?fw:fd)*.435;
     for(const u of [-span*.23,span*.23])imported('window-white-wide',p.x+Math.cos(a)*u+Math.sin(a)*reach,y+.19,p.z-Math.sin(a)*u+Math.cos(a)*reach,.72,a,node.id);
    }
   }
   for(const x of [-1,1])for(const z of [-1,1])local(box,'ceramic',x*fw*.46,y+storyHeight/2,z*fd*.46,.065,storyHeight,.065);
   if(Math.round((y-plan.podium)/storyHeight)%5===0)local(plan.archetype===2?cylinder:box,'copper',0,y+.12,0,fw,.045,fd);
  }
  const last=plan.roofY;
  local(plan.archetype===2?cylinder:box,'ceramic',0,last-plan.serviceHeight/2,0,w*.7,Math.max(.001,plan.serviceHeight),d*.7);
  local(plan.archetype===2?cylinder:box,'ceramic',0,last+.1,0,w*.9,.2,d*.9);
  if(plan.archetype===2){
   local(sphere,'teal',0,last+.2,0,w*.78,1.15,d*.78);
   local(torus,'copper',0,last+.2,0,w*.88,1,d*.88);
  }else if(plan.archetype===0){
   local(cylinder,'ceramic',0,last+.3,0,w*.7,.24,d*.7);
   local(torus,'teal',0,last+.5,0,w*.9,1,d*.9);
   local(cylinder,'copper',0,last+.52,0,.08,.68,.08);
  }else{
   local(box,'glass',0,last+.34,0,w*.58,.3,d*.58);
   local(box,'ceramic',0,last+.55,0,w*.78,.12,d*.78);
  }
  imported('roof-flat-detail-a',p.x,last+.61,p.z,.4,0,node.id);
  for(const side of [-1,1])imported('roof-flat-border-straight',p.x+side*w*.26,last+.2,p.z+d*.25,.55,0,node.id);
  // Physical docking collar shared by all archetypes; decorative, not an edge.
  local(box,'copper',0,plan.height*.57,d*.4,w*.6,.09,.18);
  local(box,'teal',0,plan.height*.57+.09,d*.4,w*.44,.04,.2);
  // Original asset wall modules become low entrance wings, repeated uniformly.
  for(const side of [-1,1])imported('building-window-wide',p.x+side*w*.28,.05,p.z-d*.22,.55,0,node.id);
  primitive(box,'paving',p.x,.015,p.z,w+.38,.06,d+.38);
  // Modest ground planting; it never claims source status.
  for(const side of [-1,1]){
   primitive(box,'ceramic',p.x+side*(w/2+.12),.15,p.z-d*.25,.18,.26,d*.45);
   primitive(box,'green',p.x+side*(w/2+.12),.34,p.z-d*.25,.16,.22,d*.42);
  }
 }
 // Follow each existing grid and its angle; neither files nor neighbourhoods move.
 for(const district of layout.districts.filter(d=>!layout.manifest&&d.topic===showcaseDirectory)){
  const count=district.nodes.length,side=Math.ceil(Math.sqrt(count)),size=side*3+1;
  primitive(box,'earth',district.x,-.045,district.z,size+.7,.08,size+.7,district.angle);
  for(let i=0;i<=side;i++){
   const u=(i-side/2)*3,cos=Math.cos(district.angle),sin=Math.sin(district.angle);
   primitive(box,'path',district.x+u*cos,.025,district.z+u*sin,.5,.035,size,district.angle);
   primitive(box,'path',district.x-u*sin,.027,district.z+u*cos,size,.035,.5,district.angle);
  }
  if(makeSign){
   const label=makeSign(district.id===showcaseDirectory?'Units':'WithDim',district.id,`${count} source files`);
   label.position.set(district.x,1.5,district.z+size/2+1.1);root.add(label);
  }
 }
 // Trees and lamp poles occupy outer campus margins, not semantic footprints.
 for(const district of layout.districts.filter(d=>!layout.manifest&&d.topic===showcaseDirectory))for(let i=0;i<12;i++){
  const a=i*Math.PI/6,r=district.radius+1.1,x=district.x+Math.cos(a)*r,z=district.z+Math.sin(a)*r;
  primitive(cylinder,'copper',x,.8,z,.08,1.6,.08);
  primitive(sphere,'green',x,1.25,z,1.05,1.1,1.05);
  if(i%3===0){primitive(cylinder,'ceramic',x+.55,1,z,.07,2,.07);primitive(sphere,'teal',x+.55,2,z,.32,.32,.32);}
 }
 for(const batch of batches.values()){
  const mesh=new THREE.InstancedMesh(batch.geometry,batch.material,batch.items.length);
  batch.items.forEach((item,i)=>mesh.setMatrixAt(i,item.matrix));
  mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData={decorative:true,moduleIds:batch.items.map(item=>item.id)};root.add(mesh);
 }
 return {group:root,plans,instanceCount:[...batches.values()].reduce((n,b)=>n+b.items.length,0),batchCount:batches.size};
}
