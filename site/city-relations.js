// Import edges point from the importing file to the imported file.
export function visibleRelations(links, selected, mode='imports', limit=12) {
  const seen=new Set(), filtered=[];
  for(const edge of links){
    if(mode==='none'||(mode==='imports'&&edge.from!==selected)||(mode==='importers'&&edge.to!==selected))continue;
    const key=JSON.stringify([edge.from,edge.to]);
    if(!seen.has(key)){seen.add(key);filtered.push(edge);}
  }
  return {links:filtered.slice(0,limit),total:filtered.length};
}

// Only explicit Physlib-family -> Mathlib file imports are pipelines.
export function allMathlibPipelines(city){
  const nodes=new Map(city.nodes.map(node=>[node.id,node]));
  const seen=new Set();
  return city.edges.filter(edge=>{const from=nodes.get(edge.from),to=nodes.get(edge.to),key=JSON.stringify([edge.from,edge.to]);if(!from||from.library!=='Physlib'||to?.library!=='Mathlib'||seen.has(key))return false;seen.add(key);return true;});
}
export function mathlibPipelines(city,selected){
  return allMathlibPipelines(city).filter(edge=>edge.from===selected||edge.to===selected);
}

// The three categories aggregate real file edges; they are not extra Lean declarations.
export function relationGroups(city,selected){
  const nodes=new Map(city.nodes.map(node=>[node.id,node]));
  return {
    mathlib:mathlibPipelines(city,selected),
    uses:city.edges.filter(edge=>edge.from===selected&&nodes.get(edge.to)?.library==='Physlib'),
    usedBy:city.edges.filter(edge=>edge.to===selected&&nodes.get(edge.from)?.library==='Physlib')
  };
}

// Keep camera panning near at least one real surface region, including the roads between them.
export function constrainSurfaceTarget(point,zones,margin=40){
  const regions=zones.filter(zone=>!zone.underground);if(!regions.length)return {...point};
  let best=null;
  for(const region of regions){const dx=point.x-region.x,dz=point.z-region.z,distance=Math.hypot(dx,dz),radius=region.radius+margin;if(distance<=radius)return {...point};const factor=radius/distance,candidate={x:region.x+dx*factor,z:region.z+dz*factor},error=(candidate.x-point.x)**2+(candidate.z-point.z)**2;if(!best||error<best.error)best={...candidate,error};}
  return {x:best.x,z:best.z};
}
