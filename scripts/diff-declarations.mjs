import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readDeclarationPair } from './declaration-query.mjs';

export function compareDeclarations(before, after) {
  if (before.schemaVersion !== after.schemaVersion) throw Error('Declaration snapshots have incompatible schema versions.');
  const beforeIds = new Map(before.declarations.map(d => [d.id, d]));
  const afterIds = new Map(after.declarations.map(d => [d.id, d]));
  const sorted = set => [...set].sort();
  const edgeKey = e => JSON.stringify([e.from, e.to, e.kind]);
  const oldEdges = new Set(before.dependencies.map(edgeKey)), newEdges = new Set(after.dependencies.map(edgeKey));
  const oldCoverage = new Map(before.coverage.map(c => [c.module, c.status]));
  const newCoverage = new Map(after.coverage.map(c => [c.module, c.status]));
  const coverage = sorted(new Set([...oldCoverage.keys(), ...newCoverage.keys()])).flatMap(module => {
    const from = oldCoverage.get(module) ?? 'unavailable', to = newCoverage.get(module) ?? 'unavailable';
    return from === to ? [] : [{ module, before: from, after: to }];
  });
  const modified = sorted(new Set([...beforeIds.keys()].filter(id => afterIds.has(id)))).flatMap(id => {
    const a = beforeIds.get(id), b = afterIds.get(id), fields = {};
    for (const key of ['module', 'kind', 'statement']) if (a[key] !== b[key]) fields[key] = { before: a[key], after: b[key] };
    return Object.keys(fields).length ? [{ id, fields }] : [];
  });
  return {
    before: before.source, after: after.source,
    declarations: { added: sorted(new Set([...afterIds.keys()].filter(id => !beforeIds.has(id)))), removed: sorted(new Set([...beforeIds.keys()].filter(id => !afterIds.has(id)))), modified },
    dependencies: { added: sorted(new Set([...newEdges].filter(e => !oldEdges.has(e)))).map(e => JSON.parse(e)), removed: sorted(new Set([...oldEdges].filter(e => !newEdges.has(e)))).map(e => JSON.parse(e)) },
    coverage,
    limitations: 'Differences may reflect coverage or extractor changes rather than source changes. A rename appears as a removal and an addition. Unavailable statements are not treated as empty statements.'
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [oldGraph, oldDeclarations, newGraph, newDeclarations] = process.argv.slice(2);
  if (!newDeclarations) throw Error('Usage: node scripts/diff-declarations.mjs <before-graph.json> <before-declarations.json> <after-graph.json> <after-declarations.json>');
  const [before, after] = await Promise.all([readDeclarationPair(oldGraph, oldDeclarations), readDeclarationPair(newGraph, newDeclarations)]);
  console.log(JSON.stringify(compareDeclarations(before.declarations, after.declarations), null, 2));
}
