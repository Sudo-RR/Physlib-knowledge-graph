import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rmdir, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { adaptLeanVouch, supportedVouchRevision } from './adapt-lean-vouch.mjs';
import { validateGraph } from './validate.mjs';

const [rootArg, graphFile, vouchArg, outputFile, ...modules] = process.argv.slice(2);
if (!outputFile || !modules.length) throw Error('Usage: node scripts/run-lean-vouch.mjs <physlib-checkout> <module-graph.json> <lean-vouch-checkout> <output.json> <Lean.module> [Lean.module ...]');
if (modules.some(m=>!/^\p{L}[\p{L}\p{N}_'.]*$/u.test(m))) throw Error('Invalid Lean module name.');
const root = path.resolve(rootArg), vouch = path.resolve(vouchArg), output = path.resolve(outputFile);
const git = (dir, ...args) => execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();
function cleanRevision(dir) {
  const rev=git(dir,'rev-parse','HEAD');
  if(git(dir,'status','--porcelain')) throw Error(`Checkout has uncommitted changes: ${dir}`);
  return rev;
}
const physlibRevision=cleanRevision(root), vouchRevision=cleanRevision(vouch);
if(vouchRevision!==supportedVouchRevision) throw Error(`Unsupported lean-vouch revision ${vouchRevision}; expected ${supportedVouchRevision}.`);
const graph=JSON.parse(await readFile(graphFile,'utf8'));
const graphErrors=validateGraph(graph);
if(graphErrors.length) throw Error(`Invalid module snapshot:\n${graphErrors.join('\n')}`);
if(graph.source.revision!==physlibRevision) throw Error('Module snapshot does not match the Physlib checkout.');
const indexedModules=new Set(graph.modules.map(m=>m.id));
if(modules.some(m=>!indexedModules.has(m))) throw Error('Every requested module must be present in the module snapshot.');
const toolchain=(await readFile(path.join(root,'lean-toolchain'),'utf8')).trim();
if(graph.source.toolchain!==toolchain) throw Error('Module snapshot does not match the Physlib toolchain.');
const temporary=await mkdtemp(path.join(os.tmpdir(),'physlib-vouch-'));
const rawFile=path.join(temporary,'graph.json');
try {
  console.error(`Building ${modules.join(', ')} at ${physlibRevision}. This can take substantial time and disk space.`);
  execFileSync('lake',['build',...modules.map(m=>`+${m}`)],{cwd:root,stdio:'inherit'});
  console.error('Extracting declaration graph with lean-vouch.');
  execFileSync('lake',['env','lean','--run',path.join(vouch,'lean_vouch','graph','DeclGraph.lean'),...modules],{cwd:root,stdio:'inherit',env:{...process.env,LEAN_VOUCH_GRAPH:rawFile,LEAN_VOUCH_PROGRESS:'1'}});
  if(cleanRevision(root)!==physlibRevision || cleanRevision(vouch)!==vouchRevision) throw Error('A source checkout changed during extraction.');
  const bytes=await readFile(rawFile), rawHash=createHash('sha256').update(bytes).digest('hex');
  const adapted=adaptLeanVouch(JSON.parse(bytes),graph,{physlibRevision,toolchain,vouchRevision,graphSha256:rawHash},rawHash);
  await writeFile(output,JSON.stringify(adapted));
  console.log(`Wrote ${adapted.declarations.length} declarations and ${adapted.dependencies.length} dependencies to ${output}.`);
} finally {
  await unlink(rawFile).catch(e=>{if(e.code!=='ENOENT')throw e;});
  await rmdir(temporary);
}
