// Experimental interchange boundary. This is not a Lean or lean-vouch adapter.
export const declarationKinds = ['definition', 'structure', 'class', 'instance', 'theorem', 'lemma', 'other'];
export const dependencyKinds = ['statement', 'proof', 'unspecified'];

export function validateDeclarations(snapshot, graph) {
  const errors = [];
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return ['Declaration snapshot must be an object.'];
  if (snapshot.schemaVersion !== 1) errors.push('Unsupported declaration schema version.');
  const src = snapshot.source;
  if (!src || typeof src.revision !== 'string' || src.revision !== graph.source.revision || src.toolchain !== graph.source.toolchain) errors.push('Declaration revision or toolchain does not match the module snapshot.');
  if (!src?.extractor?.name || !src?.extractor?.version) errors.push('Declaration extractor provenance is missing.');
  if (!Array.isArray(snapshot.coverage) || !Array.isArray(snapshot.declarations) || !Array.isArray(snapshot.dependencies)) return [...errors, 'Coverage, declarations and dependencies must be arrays.'];
  const moduleIds = new Set(graph.modules.map(m => m.id)), covered = new Set(), ids = new Set();
  for (const entry of snapshot.coverage) {
    if (!entry || !moduleIds.has(entry.module) || !['complete', 'partial'].includes(entry.status)) { errors.push('Invalid module coverage.'); continue; }
    if (covered.has(entry.module)) errors.push(`Duplicate coverage: ${entry.module}`);
    covered.add(entry.module);
  }
  for (const d of snapshot.declarations) {
    if (!d || typeof d.id !== 'string' || !d.id.trim() || !covered.has(d.module) || !declarationKinds.includes(d.kind) || !(typeof d.statement === 'string' || d.statement === null) || !(d.line === null || (Number.isInteger(d.line) && d.line > 0))) { errors.push('Invalid declaration.'); continue; }
    if (ids.has(d.id)) errors.push(`Duplicate declaration: ${d.id}`);
    ids.add(d.id);
  }
  for (const edge of snapshot.dependencies) {
    if (!edge || !ids.has(edge.from) || typeof edge.to !== 'string' || !edge.to.trim() || !dependencyKinds.includes(edge.kind)) errors.push('Invalid declaration dependency.');
  }
  return errors;
}

export function declarationsForModule(snapshot, moduleId, { query = '', kind = 'all' } = {}) {
  const coverage = snapshot?.coverage.find(c => c.module === moduleId)?.status ?? 'unavailable';
  const all = snapshot?.declarations.filter(d => d.module === moduleId) ?? [];
  const needle = query.trim().toLocaleLowerCase();
  const matches = all.filter(d => (kind === 'all' || d.kind === kind) && (!needle || d.id.toLocaleLowerCase().includes(needle)));
  return { coverage, total: all.length, matches };
}

export function declarationNeighborhood(snapshot, id) {
  return {
    outgoing: snapshot.dependencies.filter(e => e.from === id),
    incoming: snapshot.dependencies.filter(e => e.to === id)
  };
}

// External search results can only be matched to the exact indexed name.
export function resolveDeclarationLink(snapshot, id, sourceRevision = '') {
  if (!snapshot) return {status:'unavailable'};
  if (sourceRevision && sourceRevision !== snapshot.source.revision) return {status:'revision-mismatch'};
  const declaration=snapshot.declarations.find(d=>d.id===id);
  return declaration ? {status:'found',declaration,revisionVerified:!!sourceRevision} : {status:'not-indexed'};
}

// Only accept an exact qualified name in the explicitly cited source file.
// Partial snapshots and notation/instance expressions remain unresolved.
export function resolveMapReferences(graph, snapshot) {
  if (!snapshot) return { resolved: [], candidates: [], unresolved: [] };
  const byPath = new Map(graph.modules.map(m=>[m.path,m.id]));
  const declarations = new Map(snapshot.declarations.map(d=>[d.id,d]));
  const byModule = new Map();
  for(const d of snapshot.declarations){if(!byModule.has(d.module))byModule.set(d.module,[]);byModule.get(d.module).push(d);}
  const covered = new Set(snapshot.coverage.map(c=>c.module));
  const resolved=[], candidates=[], unresolved=[];
  for (const map of graph.maps) for (const ref of map.declarationReferences ?? []) {
    const module=byPath.get(ref.path), d=declarations.get(ref.name);
    const record={map:map.path,title:map.title,...ref};
    if (d && d.module===module) resolved.push({...record,declaration:d.id});
    else {
      const possible=/^[\p{L}\p{N}_'.]+$/u.test(ref.name)?(byModule.get(module) ?? []).filter(x=>x.id.endsWith(`.${ref.name}`)):[];
      if(possible.length===1)candidates.push({...record,declaration:possible[0].id});
      unresolved.push({...record,reason:!module?'missing file':!covered.has(module)?'module not indexed':possible.length>1?'ambiguous name':'name not resolved'});
    }
  }
  return {resolved,candidates,unresolved};
}
