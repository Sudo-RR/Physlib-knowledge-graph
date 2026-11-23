import * as THREE from 'three';
import {createChunkIndex} from './city-spatial-index.js';
import {chooseLod,projectedHeight} from './city-district-lod.js';
/** Cheap pooled geometry is partitioned by directory chunks, never a city-wide full kit. */
export function createChunkArt(manifest,materials){
 const group=new THREE.Group(),index=createChunkIndex(manifest.chunks),box=new THREE.BoxGeometry(1,1,1),roof=new THREE.CylinderGeometry(.5,.5,1,6),part=new THREE.Object3D(),frustum=new THREE.Frustum(),matrix=new THREE.Matrix4();
 const cityMeshes=new Map(manifest.boroughs.map(b=>{const mesh=new THREE.InstancedMesh(box,materials[b.id],b.count);mesh.frustumCulled=false;group.add(mesh);return [b.id,mesh];}));
 const records=manifest.chunks.map(chunk=>{
  const body=new THREE.InstancedMesh(box,materials[chunk.boroughId],chunk.moduleIds.length),crowns=new THREE.InstancedMesh(roof,materials.Physlib,chunk.moduleIds.length);
  chunk.moduleIds.forEach((id,i)=>{const m=manifest.modules[id],p=m.position;part.position.set(p.x,m.semanticHeight/2,p.z);part.scale.set(m.footprint.width,m.semanticHeight,m.footprint.depth);part.updateMatrix();body.setMatrixAt(i,part.matrix);part.position.y=m.semanticHeight+.15;part.scale.set(m.footprint.width*.85,.3,m.footprint.depth*.85);part.updateMatrix();crowns.setMatrixAt(i,part.matrix);});
  body.computeBoundingSphere();crowns.computeBoundingSphere();group.add(body,crowns);
  const b=chunk.bounds;return {chunk,body,crowns,box:new THREE.Box3(new THREE.Vector3(b.minX,0,b.minZ),new THREE.Vector3(b.maxX,chunk.height,b.maxZ)),tier:'city'};
 });
 let last=-Infinity,stats={activeChunks:0,totalChunks:records.length,counts:{city:0,district:0,building:0}};
 function update({camera,viewportHeight,quality,selected,excluded=new Set(),scope=null,now=performance.now()}){
  if(now-last<150)return stats;last=now;camera.updateMatrixWorld();frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  let activeChunks=0;const counts={city:0,district:0,building:0},visibleIds=new Set(),cityCounts=new Map(manifest.boroughs.map(b=>[b.id,0]));
  for(const r of records){const visible=(!scope||r.chunk.moduleIds.some(id=>scope.has(id)))&&(frustum.intersectsBox(r.box)||r.chunk.moduleIds.includes(selected));r.body.visible=r.crowns.visible=visible;
   if(!visible)continue;activeChunks++;let count=0;const centre=r.box.getCenter(new THREE.Vector3()),pixels=projectedHeight(r.chunk.height,camera.position.distanceTo(centre),camera.fov,viewportHeight);r.tier=chooseLod(pixels,{quality,previous:r.tier});
   // Generic shells retain the exact body; Units and selected full art replace only decorative display.
   for(const id of r.chunk.moduleIds){visibleIds.add(id);if(excluded.has(id))continue;const m=manifest.modules[id],p=m.position;part.position.set(p.x,m.semanticHeight/2,p.z);part.scale.set(m.footprint.width,m.semanticHeight,m.footprint.depth);part.updateMatrix();if(r.tier==='city'){const mesh=cityMeshes.get(m.boroughId),i=cityCounts.get(m.boroughId);mesh.setMatrixAt(i,part.matrix);cityCounts.set(m.boroughId,i+1);}else{r.body.setMatrixAt(count,part.matrix);part.position.y=m.semanticHeight+.15;part.scale.set(m.footprint.width*.85,.3,m.footprint.depth*.85);part.updateMatrix();r.crowns.setMatrixAt(count,part.matrix);count++;}counts[r.tier==='building'?'district':r.tier]++;}
   r.body.count=r.crowns.count=count;r.body.instanceMatrix.needsUpdate=r.crowns.instanceMatrix.needsUpdate=true;
   // A small shared roof is omitted in the city silhouette tier and Low.
   r.crowns.visible=visible&&r.tier!=='city'&&quality!=='low';
  }
  for(const [id,mesh] of cityMeshes){mesh.count=cityCounts.get(id);mesh.visible=mesh.count>0;mesh.instanceMatrix.needsUpdate=true;}
  stats={activeChunks,totalChunks:records.length,counts,visibleIds};return stats;
 }
 return {group,update,index};
}
