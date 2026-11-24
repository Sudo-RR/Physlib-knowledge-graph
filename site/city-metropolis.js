import * as THREE from 'three';
import {mixColor} from './city-colors.js';

export const metropolisVersion=1;
/** Presentation only: C.2 plots, source dimensions and infrastructure remain authoritative. */
export function metropolisManifest(m,concept='spaceage'){
 m.visual='c3';m.metropolisVersion=metropolisVersion;m.metropolisConcept=concept;
 for(const module of Object.values(m.modules))module.presentation='metropolis';
 for(const l of m.landmarks){
  const p=m.parcels.find(p=>p.id===l.districtId),left=l.bounds.minX;
  const width=Math.max(32,Math.min(100,(p.bounds.maxX-p.bounds.minX)*.34,p.bounds.maxX-10-left));
  l.bounds={minX:left,maxX:left+width,minZ:l.position.z-20,maxZ:l.position.z+20};
  l.position.x=left+width/2;l.maxY=Math.max(36,Math.min(100,width*.95));
  l.label=p.label+' · civic centre (not a module)';
  p.civicHeight=l.maxY;
 }
 // Small groves inhabit existing free parks. Reject any contact with a module's
 // inspection margin, river, civic structure or reserved infrastructure band.
 const blocked=[...m.corridors,...m.rivers,...m.crossings,...m.approaches,...m.landmarks];
 const overlap=(a,b)=>a.minX<b.maxX&&a.maxX>b.minX&&a.minZ<b.maxZ&&a.maxZ>b.minZ;
 const groves=[];
 for(const park of m.parks){const b=park.bounds;if(b.maxX-b.minX<18||b.maxZ-b.minZ<18)continue;
  for(const [u,v] of [[.25,.3],[.6,.4],[.38,.7],[.76,.7]]){const x=b.minX+5+(b.maxX-b.minX-10)*u,z=b.minZ+5+(b.maxZ-b.minZ-10)*v,q={minX:x-3,maxX:x+3,minZ:z-3,maxZ:z+3};
   if(blocked.some(o=>overlap(q,o.bounds))||Object.values(m.modules).some(o=>overlap(q,{minX:o.decorativeBounds.minX-3,maxX:o.decorativeBounds.maxX+3,minZ:o.decorativeBounds.minZ-3,maxZ:o.decorativeBounds.maxZ+3})))continue;
   groves.push({id:park.id+'/grove/'+groves.length,kind:'civic-grove',position:{x,z},bounds:q,minY:0,maxY:12,identity:{primary:'#479575'}});
  }
 }
 m.groves=groves;m.obstructions.push(...groves);
 m.surfaceHeight=Math.max(...m.landmarks.map(l=>l.maxY),m.surfaceHeight);
 return m;
}

/** Four nameable civic silhouettes. Shared geometry, instance batches and no selectable IDs. */
export function createMetropolisCentres(manifest){
 const group=new THREE.Group();group.name='Atomic civic centres';
 const shapes={box:new THREE.BoxGeometry(1,1,1),drum:new THREE.CylinderGeometry(.5,.5,1,8),dome:new THREE.SphereGeometry(.5,8,4,0,Math.PI*2,0,Math.PI/2),ring:new THREE.TorusGeometry(.4,.075,4,12),orb:new THREE.OctahedronGeometry(.5)};
 const materials={paper:new THREE.MeshStandardMaterial({color:0xfff7df,roughness:.65}),colour:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.38,metalness:.18}),glass:new THREE.MeshStandardMaterial({color:0x164d62,roughness:.28,metalness:.22})};
 const batches=new Map(),part=new THREE.Object3D(),color=new THREE.Color();
 function add(l,shape,mat,x,y,z,w,h,d,detail=false,tint=l.identity.primary){
  const key=shape+'/'+mat+'/'+detail;if(!batches.has(key))batches.set(key,{shape:shapes[shape],material:materials[mat],items:[],detail});
  const W=l.bounds.maxX-l.bounds.minX,H=l.maxY,D=l.bounds.maxZ-l.bounds.minZ;
  part.position.set(l.position.x+x*W,y*H,l.position.z+z*D);part.rotation.set(0,0,0);part.scale.set(w*W,h*H,d*D);part.updateMatrix();
  batches.get(key).items.push({id:l.id,matrix:part.matrix.clone(),tint:mat==='colour'?tint:'#ffffff'});
 }
 for(const l of manifest.landmarks){
  add(l,'box','paper',0,.035,0,.96,.07,.94);
  const garden=manifest.metropolisConcept==='gardens';
  if(garden||l.shape===1){
   add(l,'drum','glass',0,.18,0,.8,.26,.78);add(l,'dome','colour',0,.31,0,.96,1.12,.94);
   add(l,'drum','paper',0,.32,0,1,.035,.98);
   if(!garden){add(l,'ring','paper',0,.71,0,.7,.52,.32);add(l,'box','colour',0,.48,0,.1,.7,.18);}
  }else if(l.shape===0){
   for(const x of [-.34,.34]){add(l,'box','colour',x,.43,0,.17,.76,.62);add(l,'box','glass',x,.43,.32,.1,.56,.025,true);}
   add(l,'box','paper',0,.82,0,.96,.1,.78);add(l,'dome','colour',0,.87,0,.82,.24,.68);
   add(l,'ring','colour',0,.48,0,.45,.5,.16);
  }else if(l.shape===2){
   add(l,'ring','colour',0,.53,0,1,.87,.44);
   for(const x of [-.32,.32]){add(l,'box','glass',x,.2,0,.3,.26,.78);add(l,'dome','paper',x,.34,0,.34,.22,.88);}
   add(l,'box','paper',0,.12,0,.94,.08,.98);
  }else{
   add(l,'box','glass',0,.22,0,.8,.3,.74);add(l,'box','paper',0,.4,0,.98,.07,.94);
   add(l,'box','colour',-.12,.57,0,.62,.3,.6);add(l,'box','paper',-.12,.74,0,.72,.04,.7);
   add(l,'dome','colour',-.12,.77,0,.65,.43,.62);
  }
  // Broad portico and planted forecourt establish a front, not an antenna on a block.
  for(const x of [-.32,.32])add(l,'box','paper',x,.14,.38,.035,.21,.035,true);
  add(l,'box','colour',0,.25,.36,.77,.035,.22,true);
  for(const x of [-.32,.32])add(l,'box','colour',x,.075,-.4,.18,.05,.1,true,mixColor(l.identity.primary,'#3d9259',.7));
  // Inset planter walls, benches and a contrasting walk join the reserved access.
  add(l,'box','colour',0,.075,.43,.94,.018,.09);
  for(const x of [-.43,.43]){add(l,'box','paper',x,.07,0,.04,.04,.88);add(l,'orb','colour',x,.14,.27,.1,.17,.12,true,'#438961');add(l,'box','glass',x,.09,-.27,.055,.035,.2,true);}
 }
 for(const tree of manifest.groves||[]){const l={...tree,maxY:12};add(l,'orb','colour',0,.63,0,.95,.72,.95,false,'#479575');add(l,'box','paper',0,.24,0,.08,.48,.08,true);}
 const locations=new Map([...manifest.landmarks,...(manifest.groves||[])].map(l=>[l.id,l]));
 for(const b of batches.values()){
  b.mesh=new THREE.InstancedMesh(b.shape,b.material,b.items.length);b.items.forEach((i,n)=>{b.mesh.setMatrixAt(n,i.matrix);b.mesh.setColorAt(n,color.set(i.tint));});b.mesh.computeBoundingSphere();b.mesh.castShadow=false;b.mesh.userData={civic:true,decorative:true};group.add(b.mesh);
 }
 let last=-Infinity;group.userData.update=({camera,quality})=>{const now=performance.now();if(now-last<200)return;last=now;for(const b of batches.values())if(b.detail){let n=0;if(quality!=='low')for(const i of b.items){const l=locations.get(i.id);if(camera.position.distanceTo(new THREE.Vector3(l.position.x,l.maxY/2,l.position.z))>500)continue;b.mesh.setMatrixAt(n,i.matrix);b.mesh.setColorAt(n++,color.set(i.tint));}b.mesh.count=n;b.mesh.instanceMatrix.needsUpdate=true;if(b.mesh.instanceColor)b.mesh.instanceColor.needsUpdate=true;}};
 let disposed=false;group.userData.dispose=()=>{if(disposed)return;disposed=true;for(const b of batches.values())b.mesh.dispose();for(const g of Object.values(shapes))g.dispose();for(const mat of Object.values(materials))mat.dispose();group.clear();};
 group.userData.civicBatches=batches;return group;
}
