// Qualified declaration navigation. Module ownership is exact; role placement is
// explicitly inferred, never an identity join to a lexical declaration.
export function declarationLocator(production,index){
 const complexes=new Map(production.model.complexes.map(c=>[c.id,c])),owner=production.contributor?.owner||{};
 function locate(id){
  const row=index.nodes.get(id);if(!row||!index.local.has(id))return null;
  const complex=complexes.get(owner[row.module]);if(!complex||!complex.moduleIds.includes(row.module))return null;
  const role=({thm:'lemmas-properties',inductive:'data-structure',ctor:'data-structure'})[row.kind];
  const candidates=role?complex.buildings.filter(b=>b.role===role&&b.moduleIds.includes(row.module)):[];
  const building=candidates.length===1?candidates[0].id:null;
  return {id,module:row.module,complex:complex.id,building,placement:building?'inferred-role':'module-owner'};
 }
 function neighborhood(id){
  const origin=locate(id);if(!origin)return null;
  const groups=new Map(),totals={out:0,in:0,external:0,sameComplex:0,unmapped:0};
  for(const [direction,edges,key] of [['out',index.uses.get(id)||[],'to'],['in',index.usedBy.get(id)||[],'from']])for(const e of edges){
   totals[direction]++;const target=locate(e[key]);if(!target){if(index.local.has(e[key]))totals.unmapped++;else totals.external++;continue;}
   if(target.complex===origin.complex){totals.sameComplex++;continue;}
   const k=JSON.stringify([direction,target.complex]);if(!groups.has(k))groups.set(k,{direction,complex:target.complex,count:0,kinds:{},representative:target.id});
   const g=groups.get(k);g.count++;g.kinds[e.kind]=(g.kinds[e.kind]||0)+1;
  }
  return {origin,totals,groups:[...groups.values()].sort((a,b)=>b.count-a.count||a.complex.localeCompare(b.complex)||a.direction.localeCompare(b.direction))};
 }
 function search(query,kind='all',limit=80){
  const q=query.trim().toLowerCase();if(!q)return {total:0,rows:[]};
  const rows=[];let total=0;
  for(const id of index.local){const d=index.nodes.get(id);if((kind==='all'||d.kind===kind)&&(id.toLowerCase().includes(q)||d.module.toLowerCase().includes(q))){total++;if(rows.length<limit)rows.push(d);}}
  return {total,rows};
 }
 return {locate,neighborhood,search};
}
