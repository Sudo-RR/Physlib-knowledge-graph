import * as THREE from 'three';

// Architectural variation is decorative: it does not claim an API status or
// change the data-derived height, source identity or selectable body.
export function roofStyle(id) {
  let hash=2166136261;
  for(const char of id) hash=Math.imul(hash^char.charCodeAt(0),16777619);
  return (hash>>>0)%4;
}

// Footprints vary independently of height. None denotes a declaration kind.
export function buildingStyle(id) {
  return [
    {name:'tower',width:1.5,depth:1.5},
    {name:'mid-rise',width:1.85,depth:1.7},
    {name:'institute',width:2.2,depth:2.0},
    {name:'pavilion',width:1.8,depth:2.1}
  ][roofStyle(id)];
}

// Available for an explicitly supplied construction status, not used for
// current files: their snapshot does not contain a verified status field.
export function createConstructionSite(width, height, depth) {
  if(![width,height,depth].every(value=>Number.isFinite(value)&&value>0))throw Error('Construction dimensions must be positive');
  const group=new THREE.Group();
  const frame=new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(width,height,depth)),
    new THREE.LineBasicMaterial({color:0xffa521})
  );
  const deck=new THREE.Mesh(
    new THREE.BoxGeometry(width+.18,.16,depth+.18),
    new THREE.MeshStandardMaterial({color:0xffc453,roughness:.8})
  );
  frame.position.y=height/2;deck.position.y=height*.48;
  group.add(frame,deck);
  return group;
}

export function createCityArt(nodes,positions,floors,{constructionIds=new Set()}={}) {
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
    const position=positions.get(node.id),height=floors.get(node.id).height,sign=node.library==='Mathlib'?-1:1,style=roofStyle(node.id),footprint=buildingStyle(node.id);
    if(constructionIds.has(node.id)){
      const scaffold=createConstructionSite(footprint.width,height,footprint.depth);
      scaffold.position.set(position.x,0,position.z);scaffold.scale.y=sign;group.add(scaffold);
      continue;
    }
    scale.set(footprint.width/1.9,1,footprint.depth/1.9);
    point.set(position.x,sign*(height+.12),position.z);
    rotation.setFromAxisAngle(new THREE.Vector3(1,0,0),sign<0?Math.PI:0);
    matrix.compose(point,rotation,scale);roofs[style].setMatrixAt(counts[style]++,matrix);
    // Entrances are ornamental and intentionally omitted underground.
    if(sign>0){point.set(position.x,.6,position.z+footprint.depth/2+.05);rotation.identity();scale.set(1,1,1);matrix.compose(point,rotation,scale);entrances.setMatrixAt(entranceCount++,matrix);}
  }
  roofs.forEach((mesh,index)=>{mesh.count=counts[index];mesh.computeBoundingSphere();group.add(mesh);});
  entrances.count=entranceCount;entrances.computeBoundingSphere();group.add(entrances);
  return group;
}
