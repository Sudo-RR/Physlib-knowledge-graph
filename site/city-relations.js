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
