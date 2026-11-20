import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// The provenance file is a producer assertion; this adapter does not run Lean.
export function adaptResultCity(raw, physlib, mathlib, provenance, sha256) {
  if(provenance?.physlibRevision!==physlib?.source?.revision || provenance?.mathlibRevision!==mathlib?.source?.revision || mathlib?.source?.physlibRevision!==physlib?.source?.revision || provenance?.toolchain!==physlib?.source?.toolchain || mathlib?.source?.toolchain!==physlib?.source?.toolchain || provenance?.rawSha256!==sha256) throw Error('Incompatible or incomplete extraction provenance.');
  if(provenance.extractorRevision!=='2ee55ff6e521eabe71ecddac797e12f64448a5b6' || !Array.isArray(provenance.includedPrefixes) || !provenance.includedPrefixes.length) throw Error('Unsupported result-graph version or scope.');
  if(!Array.isArray(raw?.roots)||!Array.isArray(raw?.nodes)||!Array.isArray(raw?.edges))throw Error('Invalid result-graph data.');
  if(JSON.stringify(raw.roots)!==JSON.stringify(provenance.roots))throw Error('Result graph roots do not match the provenance.');
  const physModules=new Set(physlib.modules.map(m=>m.id)), mathModules=new Set(mathlib.modules.map(m=>m.id)), nodes=new Map();
  for(const n of raw.nodes){if(!n||typeof n.name!=='string'||typeof n.module!=='string'||nodes.has(n.name))throw Error('Invalid or duplicate result-graph node.');nodes.set(n.name,n);}
  const declarations=raw.nodes.filter(n=>physModules.has(n.module)).map(n=>({id:n.name,module:n.module,kind:n.kind}));
  const targets=new Map(), edges=[];
  for(const e of raw.edges){const from=nodes.get(e.tgt),to=nodes.get(e.src);if(!from||!to||!['statement','proof'].includes(e.kind))throw Error('Invalid result-graph edge.');if(!physModules.has(from.module)||!mathModules.has(to.module))continue;targets.set(to.name,{id:to.name,module:to.module,kind:to.kind});edges.push({from:from.name,to:to.name,kind:e.kind==='statement'?'statement':'value'});}
  return {schemaVersion:1,source:{physlibRevision:physlib.source.revision,mathlibRevision:mathlib.source.revision,toolchain:physlib.source.toolchain,extractor:'result-graph',extractorRevision:provenance.extractorRevision,rawSha256:sha256,roots:raw.roots,includedPrefixes:provenance.includedPrefixes,provenance:'producer assertion'},coverage:'partial',declarations,targets:[...targets.values()],edges};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [rawPath,physPath,mathPath,provenancePath,out]=process.argv.slice(2);if(!out)throw Error('Usage: node scripts/adapt-result-city.mjs raw.json graph.json mathlib.json provenance.json output.json');
  const rawText=await readFile(rawPath,'utf8'),hash=createHash('sha256').update(rawText).digest('hex');
  const read=async f=>JSON.parse(await readFile(f,'utf8'));
  const result=adaptResultCity(JSON.parse(rawText),await read(physPath),await read(mathPath),await read(provenancePath),hash);
  await writeFile(out,JSON.stringify(result));console.log(`Wrote ${result.declarations.length} Physlib declarations and ${result.edges.length} Mathlib relationships.`);
}
