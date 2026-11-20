import { createMathlibIndex } from './mathlib-model.js';

// A deliberately bounded district: a Physics area and the Mathlib modules it imports.
export function buildCity(physlib, mathlib, bridge, {prefix='Physlib.ClassicalMechanics.', limit=60}={}) {
  if (!Number.isInteger(limit) || limit < 1) throw Error('Invalid city limit.');
  const all=physlib.modules.filter(m=>m.id.startsWith(prefix)).sort((a,b)=>a.id.localeCompare(b.id));
  const selected=all.slice(0,limit);
  const gradient=physlib.modules.find(m=>m.id==='Physlib.Mathematics.Calculus.Gradient');
  if(gradient&&!selected.some(m=>m.id===gradient.id))selected.push(gradient);
  return cityFromModules(physlib,mathlib,bridge,selected,{totalPhyslib:all.length,omittedPhyslib:Math.max(0,all.length-limit)});
}

function cityFromModules(physlib,mathlib,bridge,selected,counts={}) {
  const index=createMathlibIndex(physlib,mathlib,bridge);
  const ids=new Set(selected.map(m=>m.id));
  const relevant=bridge.edges.filter(e=>ids.has(e.from));
  const targets=[...new Set(relevant.map(e=>e.to))].sort();
  const mathIds=new Set(targets), nodes=[...selected.map(m=>({id:m.id,library:'Physlib',module:m})),...targets.map(id=>({id,library:'Mathlib',module:index.modules.get(id)}))];
  const edges=[];
  for(const n of nodes) for(const imp of n.module.imports) {
    if ((n.library==='Physlib' && (ids.has(imp.module)||mathIds.has(imp.module))) || (n.library==='Mathlib' && mathIds.has(imp.module))) edges.push({from:n.id,to:imp.module,line:imp.line});
  }
  return {nodes,edges,...counts,mathlibModules:targets.length};
}

// A small, reproducible review slice: two anchor files and their local neighbours.
export function buildReviewCity(physlib,mathlib,bridge) {
  const anchors=['Physlib.Mathematics.Calculus.Gradient','Physlib.ClassicalMechanics.EulerLagrange'];
  const byId=new Map(physlib.modules.map(m=>[m.id,m]));
  const ids=new Set(anchors.filter(id=>byId.has(id)));
  for(const id of anchors) for(const imp of byId.get(id)?.imports??[]) if(byId.has(imp.module)) ids.add(imp.module);
  for(const m of physlib.modules) if(m.id.startsWith('Physlib.ClassicalMechanics.') && m.imports.some(i=>i.module===anchors[0])) ids.add(m.id);
  const selected=[...ids].sort().map(id=>byId.get(id));
  return cityFromModules(physlib,mathlib,bridge,selected,{totalPhyslib:selected.length,omittedPhyslib:0});
}

// Include every Physlib-family module and each directly imported Mathlib module.
export function buildFullCity(physlib,mathlib,bridge) {
  return cityFromModules(physlib,mathlib,bridge,physlib.modules,{totalPhyslib:physlib.modules.length,omittedPhyslib:0});
}

// Group by real directory path; the district key is not a dependency cluster.
export function districtFor(node) {
  const parts=node.module.path.replaceAll('\\','/').split('/').slice(0,-1);
  return parts.slice(0,Math.min(parts.length,3)).join('/') || node.id.split('.')[0];
}

export function buildDistricts(nodes) {
  const groups=new Map();
  for(const node of nodes){const id=districtFor(node);if(!groups.has(id))groups.set(id,{id,library:node.library,nodes:[]});groups.get(id).nodes.push(node);}
  return [...groups.values()].sort((a,b)=>a.library.localeCompare(b.library)||a.id.localeCompare(b.id));
}

export function cityNeighborhood(city,id) {
  const node=city.nodes.find(n=>n.id===id);if(!node)return null;
  return {node,imports:city.edges.filter(e=>e.from===id),importers:city.edges.filter(e=>e.to===id)};
}
