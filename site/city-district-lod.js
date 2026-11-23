import * as THREE from 'three';
import {createShowcaseDistrict,planModularBuilding,storyHeight} from './city-district.js';

export const lodTiers=['city','district','building'];
export function projectedHeight(height,distance,fov,viewportHeight){
 return height*viewportHeight/(2*Math.tan(fov*Math.PI/360)*Math.max(.1,distance));
}
/** Screen-space thresholds have hysteresis; Low caps detail at an architectural shell. */
export function chooseLod(pixels,{quality='medium',selected=false,previous='city'}={}){
 const cityThreshold=quality==='low'?250:145;
 if(quality!=='low'&&pixels>(selected?175:440)-(previous==='building'?25:0))return 'building';
 if(selected&&pixels>95)return 'district';
 return pixels>cityThreshold-(previous==='district'?20:0)?'district':'city';
}
export function advanceLod(weights,target,dt){
 const destination=lodTiers.indexOf(target),step=Math.min(1,Math.max(0,dt)/.38);
 const remaining=1-weights[destination],amount=Math.min(step,remaining);
 if(remaining<=step+1e-8)return weights.map((_,index)=>index===destination?1:0);
 return weights.map((value,index)=>index===destination?value+amount:value*(remaining-amount)/remaining);
}

// Each screen pixel belongs to exactly one tier throughout a transition.
export function addLodShader(material,{atlas=false}={}){
 const copy=material.clone();
 copy.onBeforeCompile=shader=>{
  shader.vertexShader='attribute float instanceLodWeight;\nattribute float instanceLodStart;\nvarying vec2 vLodInterval;\n'+(atlas?'attribute float instanceStories;\n':'')+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLodInterval=vec2(instanceLodStart,instanceLodWeight);');
  if(atlas)shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv.y *= instanceStories;\n#endif');
  shader.fragmentShader='varying vec2 vLodInterval;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
    if(vLodInterval.y<0.999){
      float lodNoise=fract(52.9829189*fract(dot(floor(gl_FragCoord.xy),vec2(0.06711056,0.00583715))));
      if(lodNoise<vLodInterval.x||lodNoise>=vLodInterval.x+vLodInterval.y)discard;
    }`);
 };
 copy.customProgramCacheKey=()=>atlas?'physlib-lod-atlas-v1':'physlib-lod-v1';
 return copy;
}

export function makeFacadeAtlas(){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#e8e6d7';ctx.fillRect(0,0,256,128);
 ctx.fillStyle='#173e49';ctx.fillRect(7,13,242,103);
 // Two window bays with painted recess/shadow, mullions and a warm sill.
 for(const x of [16,140]){ctx.fillStyle='#102e39';ctx.fillRect(x,24,100,76);ctx.fillStyle='#3a6872';ctx.fillRect(x+5,28,90,64);ctx.fillStyle='#9cb5b2';ctx.fillRect(x+5,28,90,4);ctx.fillStyle='#e0e2d6';ctx.fillRect(x+46,28,5,65);ctx.fillStyle='#b87e4d';ctx.fillRect(x,98,100,5);}
 ctx.fillStyle='#a7aaa0';ctx.fillRect(0,119,256,4);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=2;
 return texture;
}

/** Geometry attributes are shared; only per-instance LOD attributes are owned by a batch. */
function batchGeometry(source,capacity){
 const geometry=new THREE.BufferGeometry();geometry.setIndex(source.index);
 for(const [name,attribute] of Object.entries(source.attributes))geometry.setAttribute(name,attribute);
 geometry.setAttribute('instanceLodWeight',new THREE.InstancedBufferAttribute(new Float32Array(capacity),1));
 geometry.setAttribute('instanceLodStart',new THREE.InstancedBufferAttribute(new Float32Array(capacity),1));
 geometry.setAttribute('instanceStories',new THREE.InstancedBufferAttribute(new Float32Array(capacity).fill(1),1));
 geometry.boundingBox=source.boundingBox?.clone()||null;
 return geometry;
}

/** Full kit resources stay cached. Only nearby/selected detail instances reach the GPU. */
export function createLodShowcase({nodes,layout,floors,template,makeSign,atlas=null,localShadows=false}){
 const detailed=createShowcaseDistrict({nodes,layout,floors,template,makeSign});
 const group=new THREE.Group(),batches=[],states=new Map(),materialCache=new Map(),signs=[];
 const box=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(.5,.5,1,12),cityCylinder=new THREE.CylinderGeometry(.5,.5,1,8);
 const dome=new THREE.SphereGeometry(.5,12,6,0,Math.PI*2,0,Math.PI/2),cityDome=new THREE.SphereGeometry(.5,8,4,0,Math.PI*2,0,Math.PI/2);
 const porcelain=new THREE.MeshStandardMaterial({color:0xe8e6d7,roughness:.65,metalness:.16});
 const glass=new THREE.MeshStandardMaterial({color:0x284c56,roughness:.4,metalness:.3});
 const teal=new THREE.MeshStandardMaterial({color:0x6dbfc0,roughness:.4,metalness:.25});
 const copper=new THREE.MeshStandardMaterial({color:0xb87e4d,roughness:.5,metalness:.35});
 const shell=new THREE.MeshStandardMaterial({color:0xffffff,map:atlas,roughness:.55,metalness:.2});
 function material(source,usesAtlas){const key=source.uuid+Boolean(usesAtlas);if(!materialCache.has(key))materialCache.set(key,addLodShader(source,{atlas:usesAtlas}));return materialCache.get(key);}
 function batch(geometry,sourceMaterial,items,tier,usesAtlas=false){
  if(!items.length)return;
  const geo=batchGeometry(geometry,items.length),mesh=new THREE.InstancedMesh(geo,material(sourceMaterial,usesAtlas),items.length);
  mesh.count=0;mesh.visible=false;mesh.castShadow=['city','district','building'].includes(tier);mesh.receiveShadow=!localShadows||tier==='building'||tier==='ground';mesh.frustumCulled=false;
  mesh.userData={decorative:true,lodTier:tier};group.add(mesh);batches.push({mesh,items,tier});
 }
 for(const mesh of [...detailed.group.children]){
  if(!mesh.isInstancedMesh){detailed.group.remove(mesh);signs.push(mesh);group.add(mesh);continue;}
  const building=[],ground=[],props=[],matrix=new THREE.Matrix4();
  for(let i=0;i<mesh.count;i++){
   mesh.getMatrixAt(i,matrix);const id=mesh.userData.moduleIds[i],item={id,matrix:matrix.clone(),stories:1};
   if(id)building.push(item);else if(Math.abs(matrix.elements[5])>.15)props.push(item);else ground.push(item);
  }
  batch(mesh.geometry,mesh.material,building,'building');batch(mesh.geometry,mesh.material,ground,'ground');batch(mesh.geometry,mesh.material,props,'props');
  // Release only the unused instance buffer; cached geometry/materials remain owned by the kit.
  mesh.dispose();
 }
 const shellBatches=new Map(),object=new THREE.Object3D();
 function part(shape,mat,id,x,y,z,sx,sy,sz,tier,usesAtlas=false){
  const key=[shape.uuid,mat.uuid,tier,usesAtlas].join(':');if(!shellBatches.has(key))shellBatches.set(key,{shape,mat,tier,usesAtlas,items:[]});
  object.position.set(x,y,z);object.rotation.set(0,0,0);object.scale.set(sx,sy,sz);object.updateMatrix();
  shellBatches.get(key).items.push({id,matrix:object.matrix.clone(),stories:sy/storyHeight});
 }
 for(const node of nodes){
  const plan=detailed.plans.get(node.id),p=layout.positions.get(node.id),{width:w,depth:d}=plan.footprint;
  states.set(node.id,{target:'city',weights:[1,0,0],centre:new THREE.Vector3(p.x,plan.height/2,p.z),height:plan.height});
  for(const tier of ['city','district']){
   const shape=plan.archetype===2?(tier==='city'?cityCylinder:cylinder):box;
   const emit=(geometry,mat,x,y,z,sx,sy,sz,usesAtlas=false)=>part(geometry,mat,node.id,p.x+x,y,p.z+z,sx,sy,sz,tier,usesAtlas);
   emit(box,porcelain,0,.24,0,w,.48,d);
   emit(box,glass,0,.54,0,w*.86,.16,d*.86);
   // Collapse contiguous equal-setback stories into one shell, preserving physical UV pitch.
   const segments=[];
   for(const floor of plan.floors){const last=segments.at(-1);if(last&&last.setback===floor.setback)last.height+=storyHeight;else segments.push({...floor});}
   for(const segment of segments)emit(shape,tier==='district'?shell:glass,0,segment.y+segment.height/2,0,w*segment.setback*.93,segment.height,d*segment.setback*.93,tier==='district');
   if(plan.serviceHeight>0)emit(shape,porcelain,0,plan.roofY-plan.serviceHeight/2,0,w*.7,plan.serviceHeight,d*.7);
   emit(shape,porcelain,0,plan.roofY+.1,0,w*.9,.2,d*.9);
   if(plan.archetype===2)emit(tier==='city'?cityDome:dome,teal,0,plan.roofY+.2,0,w*.78,1.15,d*.78);
   else if(plan.archetype===0){emit(tier==='city'?cityCylinder:cylinder,porcelain,0,plan.roofY+.31,0,w*.7,.24,d*.7);emit(box,copper,0,plan.height-.25,0,.06,.5,.06);}
   else{emit(box,glass,0,plan.roofY+.34,0,w*.58,.3,d*.58);emit(box,porcelain,0,plan.roofY+.55,0,w*.78,.12,d*.78);}
   if(tier==='district'){
    // A few actual fins/canopies maintain depth around the painted window bays.
    for(const x of [-1,1])emit(box,porcelain,x*w*.46,plan.roofY/2,0,.07,plan.roofY,d*.93);
    emit(box,copper,0,.64,d*.36,w*.9,.07,d*.24);
    emit(box,teal,0,plan.height*.57,d*.4,w*.44,.08,.2);
   }
  }
 }
 for(const value of shellBatches.values())batch(value.shape,value.mat,value.items,value.tier,value.usesAtlas);
 let lastNow=null,lastSignature='',transitionCount=0,initial=true;
 const scratch=new THREE.Vector3();
 function update({camera,viewportHeight,quality='medium',selected=null,now=performance.now(),force=null}){
  const dt=lastNow===null?1:Math.min(.1,(now-lastNow)/1000);lastNow=now;
  let changed=false;const counts={city:0,district:0,building:0},activeCounts={city:0,district:0,building:0};
  for(const [id,state] of states){
   const pixels=projectedHeight(state.height,camera.position.distanceTo(state.centre),camera.fov,viewportHeight);
   const target=force&&lodTiers.includes(force)?force:chooseLod(pixels,{quality,selected:id===selected,previous:state.target});
   if(target!==state.target){state.target=target;transitionCount++;}
   const next=advanceLod(state.weights,target,dt);if(next.some((v,i)=>Math.abs(v-state.weights[i])>.00001))changed=true;
   state.weights=next;state.pixels=pixels;counts[target]++;lodTiers.forEach((tier,i)=>{if(next[i]>.002)activeCounts[tier]++;});
  }
  const signature=quality+':'+Boolean(force)+':'+Math.round(camera.position.x/3)+':'+Math.round(camera.position.y/3)+':'+Math.round(camera.position.z/3);
  if(signature!==lastSignature){changed=true;lastSignature=signature;}
  if(changed||initial)for(const {mesh,items,tier} of batches){
   const weights=mesh.geometry.attributes.instanceLodWeight,starts=mesh.geometry.attributes.instanceLodStart,stories=mesh.geometry.attributes.instanceStories;let count=0;
   for(const item of items){
    let weight=1,start=0;
    if(item.id){const state=states.get(item.id),index=lodTiers.indexOf(tier);weight=state.weights[index];start=state.weights.slice(0,index).reduce((a,b)=>a+b,0);}
    else if(tier==='props'){
     scratch.setFromMatrixPosition(item.matrix);const height=Math.max(.2,Math.abs(item.matrix.elements[5]));
     const pixels=projectedHeight(height,camera.position.distanceTo(scratch),camera.fov,viewportHeight);
     weight=quality==='low'?0:THREE.MathUtils.smoothstep(pixels,14,26);
    }
    if(weight<.002)continue;
    mesh.setMatrixAt(count,item.matrix);weights.setX(count,weight);starts.setX(count,start);stories.setX(count,item.stories);count++;
   }
   mesh.count=count;mesh.visible=count>0;mesh.instanceMatrix.needsUpdate=true;weights.needsUpdate=starts.needsUpdate=stories.needsUpdate=true;
  }
  initial=false;
  for(const sign of signs){scratch.copy(sign.position);const pixels=projectedHeight(1.5,camera.position.distanceTo(scratch),camera.fov,viewportHeight);sign.visible=pixels>10;if(sign.material)sign.material.opacity=THREE.MathUtils.smoothstep(pixels,10,23);}
  return {counts,activeCounts,transitions:transitionCount,shadowVersion:[...states.values()].every(s=>s.weights.some(w=>w===1))?transitionCount:-1,triangles:batches.reduce((n,{mesh})=>n+(mesh.visible?mesh.count*(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3:0),0)};
 }
 return {group,plans:detailed.plans,update,states,batches,instanceCount:detailed.instanceCount,batchCount:batches.length};
}
