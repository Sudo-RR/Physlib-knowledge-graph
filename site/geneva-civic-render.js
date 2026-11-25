// Original civic rendering inspired by SynthCity ground/storefront layer.
// Instanced decorative scene: not mathematical nodes, no graph edges.
export function renderCivicFabric(THREE,scene,civic,facades,surfaces){
 const group=new THREE.Group();group.name='decorative civic infrastructure';scene.add(group);
 const mat=(c,r=.8)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
 const asphalt=mat('#484f57'),curb=mat('#969da0'),mark=mat('#e1e4e3'),roof=mat('#aeb7bd'),stone=mat('#bfc7ca'),garden=mat('#54705a'),trunk=mat('#655e55'),leaf=[mat('#46624e'),mat('#607c61'),mat('#779077')],metal=mat('#78838b',.45);
 asphalt.map=surfaces.asphalt;
 const lit=new THREE.MeshStandardMaterial({color:'#ffb879',emissive:'#ff6a00',emissiveIntensity:.8});
 const box=new THREE.BoxGeometry(1,1,1),round=new THREE.CylinderGeometry(.5,.5,1,10),sphere=new THREE.IcosahedronGeometry(.5,1);
 const simpleRound=new THREE.CylinderGeometry(.5,.5,1,6),simpleSphere=new THREE.IcosahedronGeometry(.5,0),switchable=[];
 const batches=new Map(),dummy=new THREE.Object3D();
 function part(geo,m,x,y,z,w,h,d,angle=0){
  dummy.position.set(x-500,y,z-400);dummy.rotation.set(0,angle,0);dummy.scale.set(w,h,d);dummy.updateMatrix();const k=geo.uuid+'|'+m.uuid;
  if(!batches.has(k))batches.set(k,{geo,m,matrices:[]});batches.get(k).matrices.push(dummy.matrix.clone());
 }
 function line(a,b,width,y,m){const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);if(l<.01)return;part(box,m,(a[0]+b[0])/2,y,(a[1]+b[1])/2,width,.08,l+.3,Math.atan2(dx,dz));}
 // Every route segment shares its junction coordinates. Round caps avoid
 // small gaps at bends, and a thin pavement apron gives roads real edges.
 const joints=new Map();
 for(const r of civic.roads){line(r.a,r.b,r.width+.5,.12,curb);line(r.a,r.b,r.width,.18,asphalt);
  for(const q of [r.a,r.b])joints.set(q.join(','),q);
  if(r.kind==='arterial'&&Math.hypot(r.a[0]-r.b[0],r.a[1]-r.b[1])>4){const a=r.a,b=r.b,lerp=f=>[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];line(lerp(.28),lerp(.65),.16,.25,mark);}
 }
 for(const [x,z] of joints.values()){part(round,curb,x,.12,z,5.5,.08,5.5);part(round,asphalt,x,.18,z,5,.08,5);}
 for(const t of civic.infill){const {x,z,w,d,h,angle,style}=t;
  part(box,stone,x,.3,z,w*1.02,.6,d*1.02,angle);
  part(box,facades[style],x,h*.5+.4,z,w,h,d,angle);
  part(box,roof,x,h+.55,z,w*1.05,.38,d*1.05,angle);
  if(style===1||style===3)part(box,metal,x,h+1,z,w*.34,.65,d*.35,angle);
 }
 for(const q of civic.plazas){part(round,q.kind==='garden'?garden:stone,q.x,.22,q.z,q.r*1.95,.22,q.r*1.95);
  if(q.kind==='square'){part(round,metal,q.x,.65,q.z,q.r*.7,.8,q.r*.7);part(round,stone,q.x,1.3,q.z,q.r*.2,1.2,q.r*.2);}
 }
 for(let i=0;i<civic.trees.length;i++){const t=civic.trees[i];part(round,trunk,t.x,t.h*.29,t.z,.55,t.h*.58,.55);part(sphere,leaf[i%3],t.x,t.h*.72,t.z,t.r*1.85,t.h*.75,t.r*1.85);}
 // Sparse amber road markers on arterial centerlines: no new real light objects.
 // These are flush road markings, not poles or obstacles within traffic lanes.
 for(let i=0;i<civic.roads.length;i+=9){const r=civic.roads[i];if(r.kind!=='arterial')continue;const x=(r.a[0]+r.b[0])/2,z=(r.a[1]+r.b[1])/2;part(round,lit,x,.24,z,.38,.1,.38);}
 for(const {geo,m,matrices} of batches.values()){const mesh=new THREE.InstancedMesh(geo,m,matrices.length);matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;group.add(mesh);if(geo===round||geo===sphere)switchable.push({mesh,full:geo,simple:geo===round?simpleRound:simpleSphere});}
 let detailed=true;
 return {group,setDetail(next){if(next===detailed)return;detailed=next;for(const {mesh,full,simple} of switchable){mesh.geometry=next?full:simple;mesh.boundingSphere=null;mesh.boundingBox=null;}}};
}
