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

export function clampLayerY(y,layer,clearance=1){return layer==='underground'?Math.min(y,-clearance):Math.max(y,clearance);}
