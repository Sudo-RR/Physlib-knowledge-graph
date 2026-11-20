import { createMathlibIndex } from './mathlib-model.js';

// A deliberately bounded district: a Physics area and the Mathlib modules it imports.
export function buildCity(physlib, mathlib, bridge, {prefix='Physlib.ClassicalMechanics.', limit=60}={}) {
  if (!Number.isInteger(limit) || limit < 1) throw Error('Invalid city limit.');
  const index=createMathlibIndex(physlib,mathlib,bridge);
  const all=physlib.modules.filter(m=>m.id.startsWith(prefix)).sort((a,b)=>a.id.localeCompare(b.id));
  const selected=all.slice(0,limit);
  const gradient=physlib.modules.find(m=>m.id==='Physlib.Mathematics.Calculus.Gradient');
  if(gradient&&!selected.some(m=>m.id===gradient.id))selected.push(gradient);
  const ids=new Set(selected.map(m=>m.id));
  const relevant=bridge.edges.filter(e=>ids.has(e.from));
  const targets=[...new Set(relevant.map(e=>e.to))].sort();
  const mathIds=new Set(targets), nodes=[...selected.map(m=>({id:m.id,library:'Physlib',module:m})),...targets.map(id=>({id,library:'Mathlib',module:index.modules.get(id)}))];
  const edges=[];
  for(const n of nodes) for(const imp of n.module.imports) {
    if ((n.library==='Physlib' && (ids.has(imp.module)||mathIds.has(imp.module))) || (n.library==='Mathlib' && mathIds.has(imp.module))) edges.push({from:n.id,to:imp.module,line:imp.line});
  }
  return {nodes,edges,totalPhyslib:all.length,omittedPhyslib:Math.max(0,all.length-limit),mathlibModules:targets.length};
}

export function cityNeighborhood(city,id) {
  const node=city.nodes.find(n=>n.id===id);if(!node)return null;
  return {node,imports:city.edges.filter(e=>e.from===id),importers:city.edges.filter(e=>e.to===id)};
}
