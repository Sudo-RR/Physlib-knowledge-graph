import { buildDistricts } from './city-model.js';

const GOLDEN_ANGLE=Math.PI*(3-Math.sqrt(5));

// Pack circles on a deterministic spiral. Their radii include a gap for roads.
function pack(items,gap=4){
  const placed=[];
  for(const item of items){
    let x=0,z=0;
    for(let step=0;step<100000;step++){
      const distance=2.4*Math.sqrt(step),angle=step*GOLDEN_ANGLE;
      x=distance*Math.cos(angle);z=distance*Math.sin(angle);
      if(placed.every(other=>Math.hypot(x-other.x,z-other.z)>=item.radius+other.radius+gap))break;
      if(step===99999)throw Error('Unable to place city area');
    }
    placed.push({...item,x,z});
  }
  return placed;
}

// Topic cities are real second-level source folders, not inferred mathematical clusters.
// Mathlib uses the same folder packing in a shared, underground region.
export function layoutFullCity(city,{spacing=3}={}) {
  const positions=new Map(),districts=[],topics=[],zones=[];
  const groups=buildDistricts(city.nodes);
  const byRoot=new Map();
  for(const group of groups){
    const root=group.nodes[0].id.split('.')[0],parts=group.id.split('/');
    const topic=parts[1]||'General',key=parts[1]?`${root}/${topic}`:root;
    if(!byRoot.has(root))byRoot.set(root,new Map());
    const areas=byRoot.get(root);if(!areas.has(key))areas.set(key,{id:key,name:topic,root,groups:[],count:0});
    areas.get(key).groups.push(group);areas.get(key).count+=group.nodes.length;
  }
  const rootOrder=['Physlib','PhyslibAlpha','QuantumInfo','Mathlib'];
  const roots=[...byRoot.keys()].sort((a,b)=>(rootOrder.indexOf(a)<0?99:rootOrder.indexOf(a))-(rootOrder.indexOf(b)<0?99:rootOrder.indexOf(b))||a.localeCompare(b));
  let zCursor=0,maxWidth=0;
  for(const root of roots){
    const areas=[...byRoot.get(root).values()].sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id));
    const prepared=areas.map(area=>{
      const local=pack(area.groups.map(group=>{const side=Math.ceil(Math.sqrt(group.nodes.length)),size=Math.max(10,side*spacing+4);return {group,size,side,radius:size*Math.SQRT2/2};}).sort((a,b)=>b.radius-a.radius||a.group.id.localeCompare(b.group.id)),3);
      return {...area,local,radius:Math.max(12,...local.map(d=>Math.hypot(d.x,d.z)+d.radius+4))};
    });
    const packed=pack(prepared,14),zoneRadius=Math.max(15,...packed.map(t=>Math.hypot(t.x,t.z)+t.radius));
    const underground=root==='Mathlib',groundDepth=zones.length?zCursor-36:0;
    const zoneZ=underground?(groundDepth?groundDepth/2:zoneRadius):zCursor+zoneRadius;
    zones.push({id:root,minZ:zoneZ-zoneRadius,maxZ:zoneZ+zoneRadius,x:0,z:zoneZ,radius:zoneRadius,underground});
    maxWidth=Math.max(maxWidth,zoneRadius*2);if(!underground)zCursor+=zoneRadius*2+36;
    for(const area of packed){
      const topic={id:area.id,name:area.name,root,count:area.count,x:area.x,z:area.z+zoneZ,radius:area.radius,underground};topics.push(topic);
      for(const [index,local] of area.local.entries()){
        const angle=index*GOLDEN_ANGLE,cos=Math.cos(angle),sin=Math.sin(angle),x=topic.x+local.x,z=topic.z+local.z;
        districts.push({...local.group,x,z,size:local.size,radius:local.radius,angle,topic:topic.id,underground});
        local.group.nodes.forEach((node,i)=>{const dx=(i%local.side-(local.side-1)/2)*spacing,dz=(Math.floor(i/local.side)-(local.side-1)/2)*spacing;positions.set(node.id,{x:x+dx*cos-dz*sin,z:z+dx*sin+dz*cos});});
      }
    }
  }
  const width=maxWidth,depth=zCursor?zCursor-36:(zones[0]?.radius||0)*2,offset=depth/2;
  for(const point of positions.values())point.z-=offset;
  for(const item of [...districts,...topics])item.z-=offset;
  for(const zone of zones){zone.z-=offset;zone.minZ-=offset;zone.maxZ-=offset;}
  return {positions,districts,topics,zones,width,depth};
}
