import { buildDistricts } from './city-model.js';

// Physlib districts follow folders. Shared Mathlib imports sit near the average
// position of their Physlib importers, with collision-free basement grid cells.
export function layoutFullCity(city,{spacing=3, shelfWidth=220}={}) {
  const positions=new Map(),districts=[];
  const groups=buildDistricts(city.nodes.filter(n=>n.library==='Physlib'));
  let x=0,z=0,rowDepth=0,maxX=0,root=null,zone=null;
  const zones=[];
  for(const group of groups){
    const groupRoot=group.nodes[0].id.split('.')[0];
    if(groupRoot!==root){if(root!==null){z+=rowDepth+26;x=0;rowDepth=0;}root=groupRoot;zone={id:root,minZ:z,maxZ:z};zones.push(zone);}
    const side=Math.ceil(Math.sqrt(group.nodes.length)),size=Math.max(10,side*spacing+4);
    if(x>0 && x+size>shelfWidth){z+=rowDepth+5;x=0;rowDepth=0;}
    const district={...group,x:x+size/2,z:z+size/2,size};districts.push(district);
    group.nodes.forEach((node,i)=>positions.set(node.id,{x:x+2+(i%side)*spacing,z:z+2+Math.floor(i/side)*spacing}));
    x+=size+5;rowDepth=Math.max(rowDepth,size);maxX=Math.max(maxX,x-5);
    zone.maxZ=Math.max(zone.maxZ,z+size);
  }
  const width=maxX,depth=z+rowDepth;
  for(const point of positions.values()){point.x-=width/2;point.z-=depth/2;}
  for(const district of districts){district.x-=width/2;district.z-=depth/2;}
  for(const region of zones){region.minZ-=depth/2;region.maxZ-=depth/2;}
  const importers=new Map(), mathIds=new Set(city.nodes.filter(node=>node.library==='Mathlib').map(node=>node.id));
  for(const edge of city.edges)if(positions.has(edge.from)&&mathIds.has(edge.to)){
    if(!importers.has(edge.to))importers.set(edge.to,[]);importers.get(edge.to).push(positions.get(edge.from));
  }
  const occupied=new Set();
  for(const node of city.nodes.filter(n=>n.library==='Mathlib').sort((a,b)=>a.id.localeCompare(b.id))){
    const sources=importers.get(node.id)??[],centre=sources.reduce((p,n)=>({x:p.x+n.x,z:p.z+n.z}),{x:0,z:0});
    const cx=Math.round((sources.length?centre.x/sources.length:0)/spacing),cz=Math.round((sources.length?centre.z/sources.length:0)/spacing);
    let found=false;
    for(let radius=0;!found;radius++)for(let dx=-radius;dx<=radius&&!found;dx++)for(let dz=-radius;dz<=radius&&!found;dz++){
      if(Math.max(Math.abs(dx),Math.abs(dz))!==radius)continue;const gx=cx+dx,gz=cz+dz,key=`${gx},${gz}`;
      if(!occupied.has(key)){occupied.add(key);positions.set(node.id,{x:gx*spacing,z:gz*spacing});found=true;}
    }
  }
  return {positions,districts,zones,width,depth};
}
