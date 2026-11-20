// Build indexes once: the Mathlib snapshot is substantially larger than Physlib.
export function createMathlibIndex(physlib, mathlib, bridge) {
  if (!physlib?.source || !mathlib?.source || !bridge?.source || !Array.isArray(mathlib.modules) || !Array.isArray(bridge.edges) || !Array.isArray(bridge.unresolved)) throw Error('Mathlib snapshot data is incomplete.');
  if (physlib.source.repository !== 'https://github.com/leanprover-community/physlib' || mathlib.source.repository !== 'https://github.com/leanprover-community/mathlib4' || mathlib.source.physlibRevision !== physlib.source.revision || bridge.source.physlibRevision !== physlib.source.revision || bridge.source.mathlibRevision !== mathlib.source.revision || mathlib.source.toolchain !== physlib.source.toolchain || bridge.source.toolchain !== physlib.source.toolchain) throw Error('The Physlib and Mathlib snapshots do not match.');
  const modules = new Map(mathlib.modules.map(m=>[m.id,m]));
  const physlibModules = new Map(physlib.modules.map(m=>[m.id,m]));
  const incoming = new Map(), cross = new Map();
  for(const m of mathlib.modules) for(const imp of m.imports) {
    if (!modules.has(imp.module)) continue;
    if(!incoming.has(imp.module))incoming.set(imp.module,[]);
    incoming.get(imp.module).push({module:m.id,line:imp.line});
  }
  for(const e of bridge.edges) {
    if(!modules.has(e.to)||!physlibModules.get(e.from)?.imports.some(i=>i.module===e.to&&i.line===e.line))throw Error('The Physlib–Mathlib bridge contains an invalid reference.');
    if(!cross.has(e.to))cross.set(e.to,[]);
    cross.get(e.to).push({module:e.from,line:e.line});
  }
  const sort=(a,b)=>a.module.localeCompare(b.module)||a.line-b.line;
  for(const values of [...incoming.values(),...cross.values()])values.sort(sort);
  return {modules,physlibModules,incoming,cross};
}

export function mathlibNeighborhood(index, id, limit = 24, physlibLimit = 12) {
  const module=index.modules.get(id);if(!module)return null;
  const imports=module.imports, importers=index.incoming.get(id)??[], physlibImporters=index.cross.get(id)??[];
  return {module,imports,importers,physlibImporters,shown:{imports:imports.slice(0,limit),importers:importers.slice(0,limit),physlibImporters:physlibImporters.slice(0,physlibLimit)}};
}
