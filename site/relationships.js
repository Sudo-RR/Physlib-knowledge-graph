// A direct-import neighborhood. Importers point toward the selected module;
// imports point away from it. API-map references are a separate relation.
export function neighborhood(module, allModules, maps, limit = 24, mapLimit = 6) {
  const moduleById = new Map(allModules.map(item => [item.id, item]));
  const incoming = allModules.filter(item => item.imports.some(imp => imp.module === module.id));
  const outgoing = module.imports;
  const mapRefs = maps.filter(item => item.references.includes(module.path));
  const incomingShown = incoming.slice(0, limit);
  const outgoingShown = outgoing.slice(0, limit);
  const mapShown = mapRefs.slice(0, mapLimit);
  return {
    incoming, outgoing, mapRefs,
    nodes: [
      { id: module.id, role: 'selected', library: module.library },
      ...incomingShown.map(item => ({ id: item.id, role: 'importer', library: item.library })),
      ...outgoingShown.map(item => ({ id: item.module, role: 'import', library: moduleById.get(item.module)?.library || 'external' })),
      ...mapShown.map(item => ({ id: `map:${item.path}`, role: 'map', title: item.title }))
    ],
    edges: [
      ...incomingShown.map(item => ({ from: item.id, to: module.id, kind: 'import' })),
      ...outgoingShown.map(item => ({ from: module.id, to: item.module, kind: 'import' })),
      ...mapShown.map(item => ({ from: `map:${item.path}`, to: module.id, kind: 'api-map' }))
    ],
    truncated: { incoming: incoming.length > incomingShown.length, outgoing: outgoing.length > outgoingShown.length, maps: mapRefs.length > mapShown.length }
  };
}

// Breadth-first search over local module imports only; not declaration usage.
export function findImportPath(modules, from, to, direction = 'imports') {
  const byId = new Map(modules.map(m=>[m.id,m]));
  if(!byId.has(from)||!byId.has(to))return null;
  const adjacency=new Map(modules.map(m=>[m.id,[]]));
  for(const m of modules)for(const edge of m.imports)if(byId.has(edge.module)) {
    if(direction==='importers') adjacency.get(edge.module).push(m.id);
    else adjacency.get(m.id).push(edge.module);
  }
  const previous=new Map([[from,null]]), queue=[from];
  for(let index=0;index<queue.length;index++){
    const current=queue[index];if(current===to){const path=[];for(let n=to;n!==null;n=previous.get(n))path.push(n);return path.reverse();}
    for(const next of adjacency.get(current))if(!previous.has(next)){previous.set(next,current);queue.push(next);}
  }
  return null;
}
