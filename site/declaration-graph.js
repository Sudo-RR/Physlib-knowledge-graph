// Bounded breadth-first exploration of recorded declaration edges. It does not
// infer edges from module imports or claim unrecorded edges do not exist.
export function declarationGraph(snapshot, id, { depth = 1, limit = 24 } = {}) {
  const indexed = new Set(snapshot.declarations.map(d=>d.id));
  if (!indexed.has(id)) return null;
  const byDirection = { importer:new Map(), import:new Map() };
  for (const edge of snapshot.dependencies) {
    for (const [role, from, to] of [['import',edge.from,edge.to],['importer',edge.to,edge.from]]) {
      if (!byDirection[role].has(from)) byDirection[role].set(from,[]);
      byDirection[role].get(from).push(to);
    }
  }
  const selected = new Map([[id,{id,role:'selected',distance:0}]]), omitted = new Set();
  for (const role of ['importer','import']) {
    const visited=new Set([id]), queue=[{id,distance:0}];
    let admitted=0;
    for(let i=0;i<queue.length;i++) {
      const current=queue[i]; if(current.distance>=depth)continue;
      for(const next of [...new Set(byDirection[role].get(current.id) ?? [])].sort()) {
        if(visited.has(next))continue;visited.add(next);
        if(admitted>=limit && !selected.has(next)){omitted.add(next);continue;}
        if(!selected.has(next)){selected.set(next,{id:next,role,distance:current.distance+1});admitted++;}
        if(indexed.has(next))queue.push({id:next,distance:current.distance+1});
      }
    }
  }
  const nodes=[...selected.values()].map(n=>({...n,indexed:indexed.has(n.id)}));
  const edges=snapshot.dependencies.filter(e=>selected.has(e.from)&&selected.has(e.to));
  return {nodes,edges,omitted:[...omitted].filter(x=>!selected.has(x)).length,depth};
}
