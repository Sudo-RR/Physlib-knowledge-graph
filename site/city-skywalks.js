import * as THREE from 'three';
import {buildingStyle} from './city-art.js';

/** Only recorded file imports with both endpoints in this showcase are eligible. */
export function selectedSkywalkEdges(edges,ids,selected,mode='imports',limit=3){
 if(mode==='none'||!ids.has(selected))return [];
 return edges.filter(e=>ids.has(e.from)&&ids.has(e.to)&&e.from!==e.to&&
  (mode==='both'?(e.from===selected||e.to===selected):mode==='importers'?e.to===selected:e.from===selected))
  .sort((a,b)=>a.from.localeCompare(b.from)||a.to.localeCompare(b.to)).slice(0,limit);
}

export function skywalkCurve(edge,nodes,positions,floors,manifest=null){
 const from=positions.get(edge.from),to=positions.get(edge.to);
 const a=new THREE.Vector3(from.x,floors.get(edge.from).height-.2,from.z),b=new THREE.Vector3(to.x,floors.get(edge.to).height-.2,to.z);
 const direction=b.clone().sub(a);direction.y=0;direction.normalize();
 const wA=buildingStyle(edge.from),wB=buildingStyle(edge.to);
 const offset=(size)=>Math.min(size.width/(2*Math.max(.001,Math.abs(direction.x))),size.depth/(2*Math.max(.001,Math.abs(direction.z))))+.12;
 a.addScaledVector(direction,offset(wA));b.addScaledVector(direction,-offset(wB));
 if(manifest){
  const ma=manifest.modules[edge.from],mb=manifest.modules[edge.to];
  if(ma&&mb){
   a.addScaledVector(direction,1.3);b.addScaledVector(direction,-1.3);a.y=ma.dock.y;b.y=mb.dock.y;
   const level=Math.max(...Object.values(manifest.modules).map(m=>m.decorativeHeight))+4;
   const corridor=m=>manifest.corridors.find(c=>c.kind==='skywalk'&&c.districtId===m.districtId&&c.bounds.minX<=m.position.x&&c.bounds.maxX>=m.position.x);
   const ca=corridor(ma),cb=corridor(mb),aa=a.clone().setY(level),bb=b.clone().setY(level);
   return new THREE.CatmullRomCurve3([a,aa,new THREE.Vector3(a.x,level,ca?(ca.bounds.minZ+ca.bounds.maxZ)/2:a.z),new THREE.Vector3(b.x,level,cb?(cb.bounds.minZ+cb.bounds.maxZ)/2:b.z),bb,b],false,'centripetal');
  }
 }
 let level=Math.max(a.y,b.y)+.8;
 // Bounded vertical clearance heuristic over actual semantic building envelopes.
 for(const node of nodes){if(node.id===edge.from||node.id===edge.to)continue;
  const p=positions.get(node.id),size=buildingStyle(node.id),dx=b.x-a.x,dz=b.z-a.z;
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));
  if(Math.abs(a.x+dx*t-p.x)<size.width/2+.35&&Math.abs(a.z+dz*t-p.z)<size.depth/2+.35)level=Math.max(level,floors.get(node.id).height+1);
 }
 return new THREE.CatmullRomCurve3([a,a.clone().addScaledVector(direction,.45).setY(level),b.clone().addScaledVector(direction,-.45).setY(level),b],false,'centripetal');
}

/** Ephemeral selected bridges own their materials and geometries. */
export function createSkywalks({edges,nodes,positions,floors,manifest=null}){
 const group=new THREE.Group(),arrows=[];
 const deck=new THREE.MeshStandardMaterial({color:0xdedfd0,roughness:.52,metalness:.25}),rail=new THREE.MeshStandardMaterial({color:0x72c5c2,emissive:0x286d72,emissiveIntensity:.65,roughness:.28,metalness:.4});
 const deckTransforms=[],railTransforms=[],unitBox=new THREE.BoxGeometry(1,1,1),part=new THREE.Object3D();
 for(const edge of edges){
  const curve=skywalkCurve(edge,nodes,positions,floors,manifest);
  const points=curve.getPoints(24);
  // Square-section deck and twin railings retain architectural scale.
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],delta=b.clone().sub(a),centre=a.clone().add(b).multiplyScalar(.5),rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),delta.clone().normalize());
   for(const [x,y,w,h,mat] of [[0,0,.44,.1,deck],[-.23,.27,.035,.44,rail],[.23,.27,.035,.44,rail]]){
    part.position.copy(centre).add(new THREE.Vector3(x,y,0).applyQuaternion(rotation));part.quaternion.copy(rotation);part.scale.set(w,h,delta.length()+.015);part.updateMatrix();
    (mat===deck?deckTransforms:railTransforms).push(part.matrix.clone());
   }
  }
  const arrowMaterial=new THREE.MeshBasicMaterial({color:0xf3bf75}),arrow=new THREE.Mesh(new THREE.ConeGeometry(.13,.4,6),arrowMaterial);
  group.add(arrow);arrows.push({object:arrow,curve});
  // End collars connect to the roof crown and identify the real import endpoints.
  for(const p of [points[0],points.at(-1)]){const mesh=new THREE.Mesh(new THREE.TorusGeometry(.32,.045,6,20),rail);mesh.rotation.x=Math.PI/2;mesh.position.copy(p);group.add(mesh);}
 }
 for(const [transforms,material] of [[deckTransforms,deck],[railTransforms,rail]])if(transforms.length){
  const mesh=new THREE.InstancedMesh(unitBox,material,transforms.length);transforms.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.decorative=true;group.add(mesh);
 }
 return {group,arrows};
}
