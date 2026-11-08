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
