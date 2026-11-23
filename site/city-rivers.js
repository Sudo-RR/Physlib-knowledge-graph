import * as THREE from 'three';
export function createGeography(manifest){
 const group=new THREE.Group();group.name='Borough terrain and civic streets';
 const box=new THREE.BoxGeometry(1,1,1),mats=new Map(),slabs=new Map();
 // Terrain is unlit map colour. Shadow-receiving plots and architecture retain lighting;
 // shading every distant street fragment was the close-view software-renderer bottleneck.
 function material(color){if(!mats.has(color))mats.set(color,new THREE.MeshBasicMaterial({color}));return mats.get(color);}
 function slab(bounds,y,h,color,angle=0){const object=new THREE.Object3D();object.position.set((bounds.minX+bounds.maxX)/2,y,(bounds.minZ+bounds.maxZ)/2);object.scale.set(bounds.maxX-bounds.minX,h,bounds.maxZ-bounds.minZ);object.rotation.z=angle;object.updateMatrix();if(!slabs.has(color))slabs.set(color,[]);slabs.get(color).push(object.matrix.clone());}
 function polygon(points,y,color){const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),material(color));mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.receiveShadow=true;group.add(mesh);}
 const palettes=[0xa7b6a2,0xb5b5a1,0x9eb4b1];
 manifest.boroughs.forEach((b,i)=>{
  slab(b.bounds,-.6,1,palettes[i]);
 });
 for(const p of manifest.parcels){if(p.depth===1)polygon(p.polygon,.015,0xc6c7b5);else if(p.depth<=3)slab(p.bounds,p.depth===2?.025:.04,.035,p.depth===2?0xb9c0b3:0xafb9af);}
 const paving=new THREE.InstancedMesh(box,new THREE.MeshStandardMaterial({color:0xd7d9c9,roughness:.94}),Object.keys(manifest.modules).length),matrix=new THREE.Matrix4(),object=new THREE.Object3D();
 Object.values(manifest.modules).forEach((m,i)=>{const b=m.decorativeBounds;object.position.set(m.position.x,.07,m.position.z);object.scale.set(b.maxX-b.minX+.6,.1,b.maxZ-b.minZ+.6);object.updateMatrix();matrix.copy(object.matrix);paving.setMatrixAt(i,matrix);});paving.computeBoundingSphere();paving.receiveShadow=true;group.add(paving);
 const streetVertices=[],streetIndices=[];
 for(const c of manifest.corridors){if(c.kind==='street'){const q=c.bounds,i=streetVertices.length/3;streetVertices.push(q.minX,.075,q.minZ,q.maxX,.075,q.minZ,q.maxX,.075,q.maxZ,q.minX,.075,q.maxZ);streetIndices.push(i,i+2,i+1,i,i+3,i+2);}if(c.kind==='pipe-service')slab(c.bounds,.045,.04,0x99b8ac);}
 const streets=new THREE.BufferGeometry();streets.setAttribute('position',new THREE.Float32BufferAttribute(streetVertices,3));streets.setIndex(streetIndices);streets.computeBoundingSphere();const streetMesh=new THREE.Mesh(streets,material(0x7b8c88));streetMesh.name='Connected civic street network';group.add(streetMesh);
 for(const r of manifest.rivers){
  slab(r.bounds,-.4,.45,0x7e9b91);
  const vertices=[],indices=[];
  r.centerline.forEach((p,i)=>{vertices.push(p.x-r.width/2,-.08,p.z,p.x+r.width/2,-.08,p.z);if(i){const k=i*2;indices.push(k-2,k-1,k,k-1,k+1,k);}});
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
  const water=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x326e83,side:THREE.DoubleSide}));water.name=r.id;group.add(water);
 }
 for(const c of manifest.crossings){slab(c.bounds,1,.5,0xdddcca);for(const z of [c.bounds.minZ,c.bounds.maxZ])slab({...c.bounds,minZ:z-.12,maxZ:z+.12},1.7,.8,0x6faeaf);}
 for(const a of manifest.approaches)slab(a.bounds,.55,.25,0xdddcca,a.slope);
 // Sparse civic landmarks occupy explicitly unused borough entrance margins.
 for(const [i,b] of manifest.boroughs.entries()){
  const x=b.bounds.minX+13,z=13;
  slab({minX:x-4,maxX:x+4,minZ:z-4,maxZ:z+4},.05,.2,0xd7d9c9);
  const landmark=new THREE.Mesh(i===2?new THREE.OctahedronGeometry(2):new THREE.CylinderGeometry(1.2,1.8,4,6),new THREE.MeshStandardMaterial({color:i===1?0xb78a62:0x619da0,roughness:.8}));landmark.position.set(x,2.5,z);group.add(landmark);
 }
 for(const [color,transforms] of slabs){const mesh=new THREE.InstancedMesh(box,material(color),transforms.length);transforms.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.computeBoundingSphere();mesh.receiveShadow=true;mesh.userData={decorative:true,civic:true};group.add(mesh);}
 return group;
}
