// Contributor queries on explicit source imports and API-map file references.
// No declaration/proof usage is inferred from reachability.
export function buildContributorIndex(graph,model){
 const modules=Object.fromEntries(graph.modules.map(m=>[m.id,{path:m.path,imports:(m.imports||[]).map(i=>({to:i.module,line:i.line,kind:i.kind||'import'}))}]));
 const byPath=new Map(graph.modules.map(m=>[m.path,m.id]));
 const maps=(graph.maps||[]).map(m=>({path:m.path,title:m.title,abstract:m.abstract||'',references:m.references.map(path=>({path,module:byPath.get(path)||null}))}));
 const owner=Object.fromEntries(model.complexes.flatMap(c=>c.moduleIds.map(id=>[id,c.id])));
 if(Object.keys(owner).length!==graph.modules.length||Object.keys(modules).some(id=>!owner[id]))throw Error('Contributor index module coverage mismatch');
 return {revision:graph.source.revision,modules,maps,owner};
}
export function createContributorQueries(index){
 const ids=Object.keys(index.modules).sort(),known=new Set(ids),out=new Map(),incoming=new Map(),mapByModule=new Map();
 for(const id of ids){out.set(id,[]);incoming.set(id,[]);}
 for(const id of ids)for(const i of index.modules[id].imports)if(known.has(i.to)){
  const edge={from:id,to:i.to,line:i.line,kind:i.kind};out.get(id).push(edge);incoming.get(i.to).push(edge);
 }
 for(const m of index.maps)for(const r of m.references)if(r.module&&known.has(r.module)){
  if(!mapByModule.has(r.module))mapByModule.set(r.module,[]);mapByModule.get(r.module).push(m);
 }
 for(const edges of [...out.values(),...incoming.values()])edges.sort((a,b)=>a.from.localeCompare(b.from)||a.to.localeCompare(b.to)||a.line-b.line);
 function walk(start,{direction='uses',depth=4,limit=100}={}){
  if(!known.has(start))throw Error('Unknown module '+start);
  if(!['uses','usedBy'].includes(direction)||!Number.isInteger(depth)||depth<0||depth>20||!Number.isInteger(limit)||limit<1||limit>10000)throw Error('Invalid query bounds');
  const reverse=direction==='usedBy',adj=reverse?incoming:out,seen=new Map([[start,{id:start,depth:0,parent:null,edge:null}]]),queue=[start];
  let depthLimited=false,nodeLimited=false;
  for(let i=0;i<queue.length;i++){const id=queue[i],record=seen.get(id);for(const edge of adj.get(id)){
   const next=reverse?edge.from:edge.to;if(seen.has(next))continue;
   if(record.depth>=depth){depthLimited=true;continue;}
   if(seen.size-1>=limit){nodeLimited=true;continue;}
   seen.set(next,{id:next,depth:record.depth+1,parent:id,edge});queue.push(next);
  }}
  return {records:queue.slice(1).map(id=>seen.get(id)),depthLimited,nodeLimited,seen};
 }
 function path(from,to,options={}){
  if(!known.has(to))throw Error('Unknown target '+to);
  const result=walk(from,{direction:'uses',depth:options.depth??12,limit:options.limit??5000});
  if(!result.seen.has(to))return {found:false,depthLimited:result.depthLimited,nodeLimited:result.nodeLimited,edges:[]};
  const edges=[];let at=to;while(at!==from){const r=result.seen.get(at);edges.push(r.edge);at=r.parent;}
  return {found:true,edges:edges.reverse(),depthLimited:result.depthLimited,nodeLimited:result.nodeLimited};
 }
 function relatedMaps(moduleIds){const found=new Map();for(const id of moduleIds)for(const m of mapByModule.get(id)||[]){if(!found.has(m.path))found.set(m.path,{...m,matchingModules:[]});const a=found.get(m.path).matchingModules;if(!a.includes(id))a.push(id);}return [...found.values()].sort((a,b)=>a.path.localeCompare(b.path));}
 return {ids,path,walk,relatedMaps};
}
