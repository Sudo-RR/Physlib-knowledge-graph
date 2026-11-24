// Pure source-to-city adapter. No Three.js dependency and no invented graph edges.
export const roles=['data-structure','relations-instances','interface-definition','lemmas-properties'];
export const roleNames={
 'data-structure':'Key data structures','relations-instances':'Structural relations & instances',
 'interface-definition':'Interface definitions','lemmas-properties':'Lemmas & properties',
 provisional:'Unclassified — construction site'
};
const phys=new Set(['ClassicalMechanics','ClassicalFieldTheory','CondensedMatter','Cosmology','Electromagnetism','FluidDynamics','LatticeQFT','Optics','Particles','ProbabilisticTheory','QFT','QuantumMechanics','Relativity','SpaceAndTime','StatisticalMechanics','StringTheory','Thermodynamics']);
export function areaOf(m){const p=m.path.split('/');return p[0]==='QuantumInfo'?'QuantumInformation':p.length>2&&phys.has(p[1])?p[1]:'SharedFoundations';}
export function roleOf(kind){return ({structure:roles[0],inductive:roles[0],class:roles[1],instance:roles[1],definition:roles[2],def:roles[2],abbrev:roles[2],theorem:roles[3],lemma:roles[3]})[kind]||null;}
const sort=(a,b)=>a.localeCompare(b);
export function buildCityV2(graph,declarations=null,{area='ClassicalMechanics',demo=false}={}){
 if(!Array.isArray(graph?.modules))throw Error('Missing PhysLib modules');
 if(declarations&&(declarations.source?.revision!==graph.source?.revision||declarations.source?.toolchain!==graph.source?.toolchain))throw Error('Declaration snapshot mismatch');
 const availableAreas=[...new Set(graph.modules.map(areaOf))].sort(sort),selected=graph.modules.filter(m=>areaOf(m)===area).sort((a,b)=>sort(a.id,b.id));
 const byId=new Map(graph.modules.map(m=>[m.id,m])),grouped=new Map(),coverage=new Map(),declByModule=new Map();
 if(declarations){for(const c of declarations.coverage||[])coverage.set(c.module,c.status);for(const d of declarations.declarations||[]){if(!declByModule.has(d.module))declByModule.set(d.module,[]);declByModule.get(d.module).push(d);}}
 for(const m of selected){const p=m.path.split('/'),id=p.length>2?p.slice(0,-1).join('/'):(p[0]+'/@root');if(!grouped.has(id))grouped.set(id,[]);grouped.get(id).push(m);}
 const complexes=[];
 for(const [id,modules] of [...grouped].sort(([a],[b])=>sort(a,b))){
  const typed=new Map(roles.map(r=>[r,[]])),unclassified=new Set(),math=new Map();
  for(const m of modules){
   const ds=declByModule.get(m.id)||[];
   if(coverage.get(m.id)!=='complete'||ds.length===0)unclassified.add(m.id);
   for(const d of ds){const role=roleOf(d.kind);if(role)typed.get(role).push(d);else unclassified.add(m.id);}
   for(const imp of m.imports||[])if(imp.module.startsWith('Mathlib.')){if(!math.has(imp.module))math.set(imp.module,new Set());math.get(imp.module).add(m.id);}
  }
  const buildings=[];
  for(const role of roles){const ds=typed.get(role);if(!ds.length)continue;const moduleIds=[...new Set(ds.map(x=>x.module))].sort(sort);buildings.push({id:id+'::'+role,complexId:id,role,status:'classified',evidence:'recorded-declaration-kind',moduleIds,declarationIds:ds.map(x=>x.id),lines:moduleIds.reduce((n,m)=>n+(byId.get(m)?.lineCount||1),0)});}
  if(unclassified.size){const moduleIds=[...unclassified].sort(sort);buildings.push({id:id+'::provisional',complexId:id,role:'provisional',status:'unclassified',evidence:'incomplete-or-unavailable-declaration-coverage',moduleIds,declarationIds:[],lines:moduleIds.reduce((n,m)=>n+(byId.get(m)?.lineCount||1),0)});}
  const mathlib=[...math].sort(([a],[b])=>sort(a,b)).map(([target,sourceModules])=>({target,sourceModules:[...sourceModules].sort(sort)}));
  complexes.push({id,area,library:modules[0].path.split('/')[0],moduleIds:modules.map(x=>x.id),sourceLines:modules.reduce((n,x)=>n+(x.lineCount||1),0),buildings,mathlib,basicModule:modules.find(x=>x.path.endsWith('/Basic.lean'))?.id||null,foundationVerified:false});
 }
 const location=new Map(complexes.flatMap(c=>c.moduleIds.map(id=>[id,c.id]))),bundles=new Map();
 for(const m of selected)for(const imp of m.imports||[]){const from=location.get(m.id),to=location.get(imp.module);if(!to||from===to)continue;const key=from+'|'+to;if(!bundles.has(key))bundles.set(key,{from,to,count:0,imports:[]});const v=bundles.get(key);v.count++;v.imports.push({from:m.id,to:imp.module,line:imp.line||null});}
 const edges=[...bundles.values()].sort((a,b)=>sort(a.from+'|'+a.to,b.from+'|'+b.to));
 if(demo&&complexes.length){const c=complexes[0];for(const role of roles)if(!c.buildings.some(b=>b.role===role))c.buildings.push({id:'DEMO::'+c.id+'::'+role,complexId:c.id,role,status:'demo',evidence:'synthetic-visual-fixture',moduleIds:[c.moduleIds[0]],declarationIds:[],lines:240});}
 return {source:graph.source,area,areas:availableAreas,complexes,edges,demo};
}
export function neighborhood(model,id){return {uses:model.edges.filter(e=>e.from===id),usedBy:model.edges.filter(e=>e.to===id)};}
export function stationData(model,id){const c=model.complexes.find(c=>c.id===id);return c?{complex:id,targets:c.mathlib,totalUnique:c.mathlib.length}:null;}
