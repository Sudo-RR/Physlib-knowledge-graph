import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateGraph } from './validate.mjs';
import { validateDeclarations, declarationNeighborhood } from '../site/declarations.js';

export async function readDeclarationPair(graphFile, declarationFile) {
  const [graph, declarations] = await Promise.all([graphFile, declarationFile].map(async file => JSON.parse(await readFile(file, 'utf8'))));
  const graphErrors = validateGraph(graph);
  if (graphErrors.length) throw Error(`Invalid module snapshot:\n${graphErrors.join('\n')}`);
  const errors = validateDeclarations(declarations, graph);
  if (errors.length) throw Error(`Invalid declaration snapshot:\n${errors.join('\n')}`);
  return { graph, declarations };
}

export function queryDeclaration(graph, snapshot, id) {
  const declaration = snapshot.declarations.find(d => d.id === id);
  if (!declaration) return null;
  const coverage = snapshot.coverage.find(c => c.module === declaration.module);
  return {
    source: { moduleSnapshot: graph.source, declarationSnapshot: snapshot.source },
    declaration, coverage: coverage.status,
    ...declarationNeighborhood(snapshot, id),
    limitations: 'Edges are recorded dependencies only; missing edges or declarations do not prove absence of use.'
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [graphFile, declarationFile, id] = process.argv.slice(2);
  if (!id) throw Error('Usage: node scripts/declaration-query.mjs <graph.json> <declarations.json> <declaration ID>');
  const { graph, declarations } = await readDeclarationPair(graphFile, declarationFile);
  const result = queryDeclaration(graph, declarations, id);
  if (!result) { console.error('Declaration not found in this snapshot; coverage may be incomplete.'); process.exitCode = 1; }
  else console.log(JSON.stringify(result, null, 2));
}
