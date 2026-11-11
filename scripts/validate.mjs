import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Unresolved source references are explicit diagnostics, not invalid graph edges.
export function validateGraph(g) {
  const errors = [];
  if (!g || typeof g !== 'object' || Array.isArray(g)) return ['Snapshot must be an object.'];
  if (g.schemaVersion !== 1) errors.push('Unsupported schema version.');
  if (!g.source || !/^https:\/\/github\.com\//.test(g.source.repository || '') || !/^[0-9a-f]{40}$/.test(g.source.revision || '') || !Number.isFinite(Date.parse(g.source.generatedAt || '')) || !g.source.toolchain || !g.source.extractor?.name || !g.source.extractor?.version) errors.push('Missing or invalid source metadata.');
  for (const key of ['modules', 'maps', 'unresolvedLocalImports', 'externalImports', 'unresolvedMapReferences']) if (!Array.isArray(g[key])) errors.push(`${key} must be an array.`);
  if (errors.length) return errors;
  const ids = new Set(), paths = new Set();
  for (const m of g.modules) {
    if (!m || typeof m.id !== 'string' || !m.id || typeof m.path !== 'string' || !m.path.endsWith('.lean') || typeof m.library !== 'string' || !Array.isArray(m.imports)) { errors.push('Invalid module.'); continue; }
    if (ids.has(m.id)) errors.push(`Duplicate module ID: ${m.id}`); ids.add(m.id);
    if (paths.has(m.path)) errors.push(`Duplicate module path: ${m.path}`); paths.add(m.path);
    for (const i of m.imports) if (!i || typeof i.module !== 'string' || !i.module || !Number.isInteger(i.line) || i.line < 1 || typeof i.kind !== 'string') errors.push(`Invalid import in ${m.id}.`);
  }
  const mapPaths = new Set();
  for (const m of g.maps) {
    if (!m || typeof m.path !== 'string' || !m.path.endsWith('/API-map.md') || typeof m.title !== 'string' || typeof m.abstract !== 'string' || !Array.isArray(m.references) || m.references.some(p => typeof p !== 'string' || !p.endsWith('.lean'))) { errors.push('Invalid API map.'); continue; }
    if (m.declarationReferences !== undefined && (!Array.isArray(m.declarationReferences) || m.declarationReferences.some(r => !r || !m.references.includes(r.path) || typeof r.name !== 'string' || !r.name || !Number.isInteger(r.line) || r.line < 1))) errors.push(`Invalid declaration references in ${m.path}.`);
    if (mapPaths.has(m.path)) errors.push(`Duplicate API map path: ${m.path}`); mapPaths.add(m.path);
  }
  const roots = new Set(['Physlib', 'PhyslibAlpha', 'QuantumInfo']);
  const expectedLocal = [], expectedExternal = [], expectedMaps = [];
  for (const m of g.modules) if (m && Array.isArray(m.imports)) for (const i of m.imports) {
    if (!i || typeof i.module !== 'string') continue;
    const entry = { source: m.id, target: i.module, line: i.line };
    if (!roots.has(i.module.split('.')[0])) expectedExternal.push(entry);
    else if (!ids.has(i.module)) expectedLocal.push(entry);
  }
  for (const m of g.maps) if (m && Array.isArray(m.references)) for (const p of m.references) if (!paths.has(p)) expectedMaps.push({ map: m.path, path: p });
  for (const [key, expected] of [['unresolvedLocalImports', expectedLocal], ['externalImports', expectedExternal], ['unresolvedMapReferences', expectedMaps]]) {
    const canonical = arr => arr.map(x => JSON.stringify(x)).sort().join('\n');
    if (canonical(g[key]) !== canonical(expected)) errors.push(`${key} does not match source references.`);
  }
  const counts = { modules: g.modules.length, maps: g.maps.length, imports: g.modules.reduce((n,m)=>n+(Array.isArray(m?.imports)?m.imports.length:0),0), unresolvedLocalImports: expectedLocal.length, externalImports: expectedExternal.length, unresolvedMapReferences: expectedMaps.length };
  for (const [key, n] of Object.entries(counts)) if (g.counts?.[key] !== n) errors.push(`Incorrect count: ${key}.`);
  if (!g.modules.length) errors.push('Snapshot has no modules.');
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const graph = JSON.parse(await readFile(process.argv[2] || 'site/data/graph.json', 'utf8'));
  const errors = validateGraph(graph);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Snapshot valid.');
}
