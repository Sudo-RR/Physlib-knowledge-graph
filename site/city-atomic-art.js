import {mixColor} from './city-colors.js';
import * as THREE from 'three';
import {atomicPalette as P,skylineMassing} from './city-atomic-plan.js';
import {projectedHeight,addLodShader} from './city-district-lod.js';

/** Original reusable architecture; bounded batches, shared primitive resources, no per-file GLB. */
export function createAtomicArt(manifest){
 const group=new THREE.Group();group.name='Atomic courtyard architecture';
 const shapes={box:new THREE.BoxGeometry(1,1,1),drum:new THREE.CylinderGeometry(.5,.5,1,6),round:new THREE.CylinderGeometry(.5,.5,1,12),lowDome:new THREE.SphereGeometry(.5,4,3,0,Math.PI*2,0,Math.PI/2),dome:new THREE.SphereGeometry(.5,12,6,0,Math.PI*2,0,Math.PI/2),orb:new THREE.IcosahedronGeometry(.5,1)};
 const material=(color,roughness=.7)=>new THREE.MeshStandardMaterial({color,roughness,metalness:.08});
 const mats={ivory:material(P.ivory),glass:material(['c2','c3','c4'].includes(manifest.visual)?0xffffff:0x39858d,.3),accent:material(0xffffff),ink:material(P.ink),green:material(P.green),amber:material(['c2','c3','c4'].includes(manifest.visual)?0xffffff:P.amber)};
 const batches=new Map(),part=new THREE.Object3D(),color=new THREE.Color(),box=new THREE.Box3(),frustum=new THREE.Frustum(),projection=new THREE.Matrix4();
 const accent=m=>['c2','c3','c4'].includes(manifest.visual)?m.identity.primary:manifest.concept==='metropolis'?P.amber:m.boroughId==='PhyslibAlpha'?P.coral:m.boroughId==='QuantumInfo'?P.orchid:m.architecture.type===0?P.amber:m.architecture.type===2?P.coral:P.teal;
 function add(m,shape,mat,x,y,z,w,h,d,detail=0,tint=null){if(manifest.visual==='c3'){x*=1.13;z*=1.13;w*=1.13;d*=1.13;}const key=[shape,mat,detail].join('/');if(!batches.has(key))batches.set(key,{geometry:shapes[shape],material:mats[mat],detail,items:[]});const angle=m.architecture.rotation||0;part.position.set(m.position.x+x*Math.cos(angle)+z*Math.sin(angle),y,m.position.z+z*Math.cos(angle)-x*Math.sin(angle));part.scale.set(w,h,d);part.rotation.set(0,m.architecture.rotation||0,0);part.updateMatrix();batches.get(key).items.push({id:m.id,matrix:part.matrix.clone(),tint:tint??(mat==='accent'||(['c2','c3','c4'].includes(manifest.visual)&&mat==='amber')?accent(m):['c2','c3','c4'].includes(manifest.visual)&&mat==='glass'?mixColor(m.identity.primary,'#dcebe8',.34):0xffffff)});}
 for(const m of Object.values(manifest.modules)){
  const a=m.architecture,{width:w,depth:d,height:h,type}=manifest.visual==='c4'?skylineMassing(m):a,city=manifest.concept==='metropolis'||manifest.composition==='porcelain';
  if(manifest.visual==='c4'){
   const glass=mixColor(m.identity.primary,'#20495e',.78);
   // Broad podiums and distinct silhouettes persist at city LOD; no layout moves.
   add(m,'box','accent',0,h*.075,0,w,h*.15,d);
   if(type===0){
    add(m,'box','ivory',0,h*.46,0,w*.86,h*.62,d*.86);
    add(m,'box','glass',0,h*.47,0,w*.88,h*.52,d*.88,1,glass);
    add(m,'box','ivory',0,h*.82,0,w*.67,h*.16,d*.7);
    add(m,'box','accent',0,h*.94,0,w*.82,h*.08,d*.82);
    for(const x of [-.31,.31])add(m,'box','ivory',x*w,h*.46,d*.45,w*.12,h*.62,.35,1);
   }else if(type===1){
    add(m,'box','glass',-w*.15,h*.48,0,w*.64,h*.66,d*.88,0,glass);
    add(m,'box','ivory',w*.29,h*.44,0,w*.4,h*.58,d*.72);
    add(m,'box','accent',-w*.15,h*.9,0,w*.68,h*.14,d*.92);
    for(const y of [.35,.62])add(m,'box','ivory',0,h*y,0,w*.98,h*.045,d*.96,1);
   }else if(type===2){
    add(m,'drum','glass',0,h*.52,0,w*.96,h*.74,d*.96,0,glass);
    add(m,'lowDome','accent',0,h*.89,0,w*.98,h*.16,d*.98);
    add(m,'box','ivory',-w*.27,h*.54,0,w*.1,h*.78,d*.8);
   }else{
    add(m,'box','glass',0,h*.39,0,w*.9,h*.48,d*.9,0,glass);
    add(m,'box','glass',-w*.12,h*.73,-d*.08,w*.64,h*.24,d*.64,0,glass);
    add(m,'box','accent',0,h*.64,0,w*.96,h*.035,d*.96);
    add(m,'box','accent',-w*.12,h*.88,-d*.08,w*.73,h*.045,d*.73);
    add(m,'box','ivory',-w*.16,h*.95,-d*.08,w*.46,h*.07,d*.48);
   }
   for(let y=3.2;y<h*.84;y+=3.2)add(m,type===2?'round':'box','ivory',0,y,0,w*(type===3&&y>h*.63?.68:.91),.18,d*(type===3&&y>h*.63?.68:.91),1);
   for(const x of [-.3,0,.3])add(m,'box','accent',x*w,h*.46,d*.455,.2,h*.55,.25,2);
   add(m,'box','ink',0,1.4,d*.48,2.1,2.8,.25,1);
   add(m,'box','ivory',0,3.1,d*.43,w*.72,.3,d*.12,1);
   continue;
  }
  if(manifest.visual==='c3'){
   const garden=manifest.metropolisConcept==='gardens',round=type===0||type===3;
   // Broader plot-filling wings retain the original conservative C2 envelope.
   add(m,round?'drum':'box','accent',0,h*.15,0,w*.96,h*.3,d*.96,1);
   add(m,round?'drum':'box','ivory',0,h*.4,0,w*.78,h*.8,d*.78);
   add(m,round?'round':'box','glass',0,h*.51,0,w*.81,h*.43,d*.81,1,'#24566a');
   if(round||garden){add(m,'lowDome','accent',0,h*.8,0,w,Math.min(3,h*.3),d,0);add(m,'dome','accent',0,h*.8,0,w*.96,Math.min(3,h*.3),d*.96,1);}
   else if(type===1){add(m,'box','accent',-w*.12,h*.87,0,w*.65,h*.2,d*.66);add(m,'round','ivory',-w*.12,h*.98,0,w*.76,.3,d*.76,1);}
   else {add(m,'drum','accent',0,h*.86,0,w,.2,d);add(m,'box','ivory',-w*.3,h*.58,0,w*.16,h*.7,d*.9,1);}
   for(let y=2.1;y<h*.79;y+=2.1)add(m,round?'round':'box','ivory',0,y,0,w*.87,.16,d*.87,2);
   add(m,'box','ink',0,1.1,d*.42,1.5,2.2,.25,1);
   add(m,'round','accent',0,2.65,d*.43,w*.72,.22,d*.38,1);
   for(const x of [-.27,.27])add(m,'box','ivory',x*w,1.25,d*.53,.25,2.5,.25,2);
   add(m,'box','ivory',0,.15,d*.48,w*.77,.3,d*.3,1);
   for(const x of [-.4,.4]){add(m,'box','accent',x*w,.22,d*.48,1.3,.44,1.3,1);add(m,'orb','green',x*w,1.1,d*.48,1.3,1.5,1.3,1);}
   continue;
  }
  // Full, broad masses at every distance; the fine details never define the silhouette.
  add(m,type===0&&!city?'drum':'box','ivory',0,h*.44,0,w*.91,h*.88,d*.91);
  add(m,type===0?'lowDome':type===2?'drum':'box','accent',0,h*.88,0,w,type===0?2.4:type===2?.8:.4,d,0);
  add(m,type===0&&!city?'round':'box','glass',0,h*.42,0,w*.94,h*.66,d*.94,1);
  if(type===0){
   add(m,'dome','accent',0,h*.88+.2,0,w*.77,3,d*.77,1);
   add(m,'round','ivory',0,h*.88,0,w,.4,d,1);
  }else if(type===1){
   add(m,'box','ivory',0,h*.9,0,w*.7,1.3,d*.7,1);
   add(m,'box','accent',0,h*.9+.7,0,w*.78,.3,d*.78,1);
  }else if(type===2){
   add(m,'round','ivory',0,h*.9,0,w*1.04,.7,d*1.04,1);
   add(m,'round','amber',0,h*.94,0,w*.75,.25,d*.75,1);
   add(m,'orb','accent',0,h+.6,0,1.2,1.2,1.2,1);
  }else{
   add(m,'box','ivory',0,h*.91,0,w*1.08,.45,d*1.08,1);
   add(m,'box','accent',0,h*.96,0,w*.76,.2,d*.76,1);
  }
  // Fixed-scale horizontal sunshades and facade bays, only when inspecting nearby.
  const stories=Math.max(2,Math.floor(h/2.1));
  for(let i=1;i<stories;i++)add(m,type===0&&!city?'round':'box','ivory',0,i*h/stories,0,w*.99,.18,d*.99,2);
  for(const x of [-.3,0,.3])add(m,'box','ivory',x*w,h*.43,d*.48,.18,h*.74,.24,2);
  add(m,'box','ink',0,1,d*.48,1.5,2,.2,1);
  add(m,'box','amber',0,2.3,d*.49,w*.58,.18,1.8,1);
  add(m,'box','ivory',0,.18,d*.49,w*.65,.25,1.8,1);
  if(city){add(m,'box','accent',w*.31,h*.3,-d*.2,w*.35,h*.6,d*.6,1);add(m,'round','amber',-w*.32,h*.93,-d*.2,w*.42,.5,d*.42,1);}
  // Planted entrance courts remain inside the audited envelope, away from pipe bands.
  for(const x of [-.38,.38]){add(m,'box','ivory',w*x,.25,d*.5+.3,1.3,.5,1.3,1);add(m,'orb','green',w*x,1.1,d*.5+.3,1.2,1.6,1.2,1);}
 }
 for(const b of batches.values()){const owned=new THREE.BufferGeometry();owned.setIndex(b.geometry.index);for(const [name,attribute] of Object.entries(b.geometry.attributes))owned.setAttribute(name,attribute);owned.setAttribute('instanceLodWeight',new THREE.InstancedBufferAttribute(new Float32Array(b.items.length).fill(1),1));owned.setAttribute('instanceLodStart',new THREE.InstancedBufferAttribute(new Float32Array(b.items.length),1));b.geometry=owned;b.material=addLodShader(b.material);b.mesh=new THREE.InstancedMesh(b.geometry,b.material,b.items.length);b.mesh.frustumCulled=false;b.mesh.castShadow=b.detail>0;b.mesh.receiveShadow=b.detail>0;group.add(b.mesh);b.mesh.count=0;}
 let last=-Infinity,stats={activeChunks:0,totalChunks:manifest.chunks.length,counts:{city:0,district:0,building:0}},visibleIds=new Set();const tiers=new Map(),weights=new Map();
 function update({camera,viewportHeight,quality='medium',selected=null,scope=null,now=performance.now()}){
  if(now-last<80)return stats;const step=Math.min(1,(now-last)/380);last=now;camera.updateMatrixWorld();frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  visibleIds=new Set();const counts={city:0,district:0,building:0};
  for(const m of Object.values(manifest.modules)){if(scope&&!scope.has(m.id))continue;const b=m.decorativeBounds;box.min.set(b.minX,0,b.minZ);box.max.set(b.maxX,m.decorativeHeight,b.maxZ);if(m.id!==selected&&!frustum.intersectsBox(box))continue;visibleIds.add(m.id);
   const pixels=projectedHeight(m.displayHeight,camera.position.distanceTo(new THREE.Vector3(m.position.x,m.displayHeight/2,m.position.z)),camera.fov,viewportHeight),previous=tiers.get(m.id)||0;
   // Stable silhouette across tiers; detail is added only inside generous hysteresis bands.
   const tier=quality==='low'?0:pixels>(m.id===selected?100:240)-(previous===2?30:0)?2:pixels>45-(previous>=1?12:0)?1:0;tiers.set(m.id,tier);const previousWeights=weights.get(m.id)||[1,0,0];weights.set(m.id,[1,...[1,2].map(d=>quality==='low'?0:Math.abs(previousWeights[d]-(tier>=d?1:0))<.015?(tier>=d?1:0):THREE.MathUtils.lerp(previousWeights[d],tier>=d?1:0,step))]);counts[['city','district','building'][tier]]++;
  }
  for(const b of batches.values()){let n=0;for(const item of b.items){if(!visibleIds.has(item.id)||(weights.get(item.id)?.[b.detail]||0)<.002)continue;b.geometry.attributes.instanceLodWeight.setX(n,weights.get(item.id)[b.detail]);b.mesh.setMatrixAt(n,item.matrix);color.set(item.tint);b.mesh.setColorAt(n,color);n++;}b.mesh.count=n;b.mesh.visible=n>0;b.mesh.instanceMatrix.needsUpdate=true;b.geometry.attributes.instanceLodWeight.needsUpdate=true;if(b.mesh.instanceColor)b.mesh.instanceColor.needsUpdate=true;}
  group.userData.settled=[...visibleIds].every(id=>weights.get(id).every(w=>w===0||w===1));
  stats={activeChunks:manifest.chunks.filter(c=>c.moduleIds.some(id=>visibleIds.has(id))).length,totalChunks:manifest.chunks.length,counts,activeCounts:counts,visibleIds};return stats;
 }
 return {group,update,batches,shapes};
}
