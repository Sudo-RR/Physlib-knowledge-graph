// These paths use only recorded declaration edges. Missing proof edges or
// unindexed declarations can hide a real path.
export function createDeclarationPathIndex(snapshot) {
  const declarations = new Map(snapshot.declarations.map(d=>[d.id,d]));
  const outgoing = new Map(), incoming = new Map();
  for(const edge of snapshot.dependencies) {
    if(!declarations.has(edge.from)||!declarations.has(edge.to))continue;
    if(!outgoing.has(edge.from))outgoing.set(edge.from,[]);
    if(!incoming.has(edge.to))incoming.set(edge.to,[]);
    outgoing.get(edge.from).push(edge);incoming.get(edge.to).push(edge);
  }
  return {declarations,outgoing,incoming};
}

export function findDeclarationPath(index,from,to,{direction='dependencies',limit=2000}={}) {
  if(!index.declarations.has(from)||!index.declarations.has(to))return {status:'missing'};
  if(!['dependencies','dependents'].includes(direction)||!Number.isInteger(limit)||limit<1)throw Error('Invalid path options.');
  const previous=new Map([[from,null]]),queue=[from],edges=direction==='dependencies'?index.outgoing:index.incoming;
  let truncated=false;
  for(let i=0;i<queue.length;i++){
    const current=queue[i];
    if(current===to){const nodes=[],pathEdges=[];for(let n=to;n!==null;){nodes.push(n);const step=previous.get(n);if(step){pathEdges.push(step.edge);n=step.parent;}else n=null;}return {status:'found',nodes:nodes.reverse(),edges:pathEdges.reverse()};}
    for(const edge of edges.get(current)??[]){const next=direction==='dependencies'?edge.to:edge.from;if(previous.has(next))continue;if(previous.size>=limit){truncated=true;continue;}previous.set(next,{parent:current,edge});queue.push(next);}
  }
  return {status:truncated?'truncated':'no-path'};
}

export function findDeclarationDependents(index,id,{depth=2,limit=100}={}) {
  if(!index.declarations.has(id))return {status:'missing',nodes:[],truncated:false};
  if(!Number.isInteger(depth)||depth<1||!Number.isInteger(limit)||limit<1)throw Error('Invalid reachability options.');
  const seen=new Set([id]),queue=[{id,distance:0}],nodes=[];let truncated=false;
  for(let i=0;i<queue.length;i++){
    const current=queue[i];if(current.distance>=depth)continue;
    for(const edge of index.incoming.get(current.id)??[]){const next=edge.from;if(seen.has(next))continue;seen.add(next);if(nodes.length>=limit){truncated=true;continue;}const item={id:next,distance:current.distance+1,via:edge};nodes.push(item);queue.push(item);}
  }
  return {status:'ok',nodes,truncated,depth};
}
