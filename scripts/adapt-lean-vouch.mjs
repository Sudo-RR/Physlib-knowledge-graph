import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { validateGraph } from './validate.mjs';
import { validateDeclarations } from '../site/declarations.js';

// The adapter deliberately targets this inspected lean-vouch source revision.
export const supportedVouchRevision = 'b235856d959bdd7c20df734af35d8bad579d6a4c';

export function adaptLeanVouch(raw, graph, provenance, rawHash) {
  if (validateGraph(graph).length) throw Error('Invalid module snapshot.');
  if (provenance.vouchRevision !== supportedVouchRevision) throw Error('Unsupported lean-vouch revision; review its output semantics before adapting.');
  if (provenance.physlibRevision !== graph.source.revision || provenance.toolchain !== graph.source.toolchain) throw Error('Provenance does not match the module snapshot.');
  if (provenance.graphSha256 !== rawHash) throw Error('lean-vouch graph does not match the provenance hash.');
  if (raw.format !== 1 || typeof raw.lean !== 'string' || !raw.modules || typeof raw.modules !== 'object' || Array.isArray(raw.modules) || !raw.declarations || typeof raw.declarations !== 'object' || Array.isArray(raw.declarations)) throw Error('Unsupported lean-vouch graph format.');
  const version = graph.source.toolchain.match(/:v(.+)$/)?.[1];
  if (!version || raw.lean !== version) throw Error(`lean-vouch graph uses Lean ${raw.lean}; expected ${version || graph.source.toolchain}.`);
  const moduleIds = new Set(graph.modules.map(m => m.id));
  const coverage = Object.keys(raw.modules).filter(m => moduleIds.has(m)).sort().map(module => ({module, status:'partial'}));
  const covered = new Set(coverage.map(c=>c.module));
  const kinds = {def:'definition','partial def':'definition',theorem:'theorem',structure:'structure',instance:'instance'};
  const declarations = [], dependencies = [];
  for (const [id, item] of Object.entries(raw.declarations)) {
    if (!item || typeof item !== 'object' || typeof item.module !== 'string' || typeof item.kind !== 'string' || !Array.isArray(item.deps) || !Array.isArray(item.uses) || [...item.deps,...item.uses].some(d=>typeof d !== 'string' || !d)) throw Error(`Malformed lean-vouch declaration: ${id}`);
    if (!covered.has(item.module)) throw Error(`Declaration ${id} belongs to a module absent from both snapshots: ${item.module}`);
    const line = Array.isArray(item.lines) && Number.isInteger(item.lines[0]) && item.lines[0] > 0 ? item.lines[0] : null;
    if (item.signature !== undefined && typeof item.signature !== 'string') throw Error(`Malformed signature: ${id}`);
    if (item.doc !== undefined && typeof item.doc !== 'string') throw Error(`Malformed docstring: ${id}`);
    declarations.push({id,module:item.module,kind:kinds[item.kind] || 'other',statement:item.signature ?? null,line,upstreamKind:item.kind,docstring:item.doc ?? null});
    for (const target of new Set([...item.deps,...item.uses])) dependencies.push({from:id,to:target,kind:'unspecified'});
  }
  declarations.sort((a,b)=>a.id.localeCompare(b.id));
  dependencies.sort((a,b)=>a.from.localeCompare(b.from)||a.to.localeCompare(b.to));
  const result = {schemaVersion:1,source:{revision:graph.source.revision,toolchain:graph.source.toolchain,extractor:{name:'lean-vouch',version:provenance.vouchRevision},graphSha256:rawHash,roots:Array.isArray(raw.roots)?raw.roots:[]},coverage,declarations,dependencies};
  const errors = validateDeclarations(result,graph);
  if (errors.length) throw Error(`Adapted declaration snapshot is invalid:\n${errors.join('\n')}`);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [rawFile, graphFile, provenanceFile, outputFile] = process.argv.slice(2);
  if (!outputFile) throw Error('Usage: node scripts/adapt-lean-vouch.mjs <lean-vouch-graph.json> <module-graph.json> <provenance.json> <output.json>');
  const [bytes, graphText, provenanceText] = await Promise.all([rawFile,graphFile,provenanceFile].map(f=>readFile(f)));
  const output = adaptLeanVouch(JSON.parse(bytes), JSON.parse(graphText), JSON.parse(provenanceText), createHash('sha256').update(bytes).digest('hex'));
  await writeFile(outputFile,JSON.stringify(output));
  console.log(`Adapted ${output.declarations.length} declarations and ${output.dependencies.length} recorded dependencies.`);
}
