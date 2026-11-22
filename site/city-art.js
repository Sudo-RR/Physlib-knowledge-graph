import * as THREE from 'three';

// Architectural variation is decorative: it does not claim an API status or
// change the data-derived height, source identity or selectable body.
export function roofStyle(id) {
  let hash=2166136261;
  for(const char of id) hash=Math.imul(hash^char.charCodeAt(0),16777619);
  return (hash>>>0)%4;
}

export function createCityArt(nodes,positions,floors) {
  const group=new THREE.Group();
  const stone=new THREE.MeshStandardMaterial({color:0xf5e7c9,roughness:.85});
  const accent=new THREE.MeshStandardMaterial({color:0x455f70,roughness:.7,metalness:.12});
  const shapes=[
    new THREE.BoxGeometry(2.15,.24,2.15),
    new THREE.CylinderGeometry(.75,1.05,.55,4,1),
    new THREE.CylinderGeometry(.7,1.05,.45,8,1),
    new THREE.ConeGeometry(1.08,.65,4)
  ];
  const roofs=shapes.map(shape=>new THREE.InstancedMesh(shape,stone,nodes.length));
  const entrances=new THREE.InstancedMesh(new THREE.BoxGeometry(.7,1.15,.14),accent,nodes.length);
  const counts=[0,0,0,0],matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(1,1,1);
  const point=new THREE.Vector3();
  let entranceCount=0;
  for(const node of nodes){
    const position=positions.get(node.id),height=floors.get(node.id).height,sign=node.library==='Mathlib'?-1:1,style=roofStyle(node.id);
    point.set(position.x,sign*(height+.12),position.z);
    rotation.setFromAxisAngle(new THREE.Vector3(1,0,0),sign<0?Math.PI:0);
    matrix.compose(point,rotation,scale);roofs[style].setMatrixAt(counts[style]++,matrix);
    // Entrances are ornamental and intentionally omitted underground.
    if(sign>0){point.set(position.x,.6,position.z+1);rotation.identity();matrix.compose(point,rotation,scale);entrances.setMatrixAt(entranceCount++,matrix);}
  }
  roofs.forEach((mesh,index)=>{mesh.count=counts[index];mesh.computeBoundingSphere();group.add(mesh);});
  entrances.count=entranceCount;entrances.computeBoundingSphere();group.add(entrances);
  return group;
}
