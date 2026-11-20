import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { importsFromSource } from './extract.mjs';
import { validateGraph } from './validate.mjs';

const git = (root, ...args) => execFileSync('git', ['-C', root, ...args], { encoding:'utf8' }).trim();
const checkClean = root => { if (git(root, 'status', '--porcelain')) throw Error(`Checkout has uncommitted changes: ${root}`); };

async function leanFiles(root, relative = 'Mathlib') {
  const files = [];
  for (const entry of await readdir(path.join(root, relative), { withFileTypes:true })) {
    const rel = `${relative}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await leanFiles(root, rel));
    else if (entry.isFile() && entry.name.endsWith('.lean')) files.push(rel);
  }
  return files;
}

export async function readMathlibPin(physlibRoot) {
  const physlib = path.resolve(physlibRoot);
  const manifest = JSON.parse(await readFile(path.join(physlib, 'lake-manifest.json'), 'utf8'));
  const pin = manifest.packages?.find(p => p.name === 'mathlib');
  if (!pin || !/^[0-9a-f]{40}$/.test(pin.rev || '') || !/^https:\/\/github\.com\/leanprover-community\/mathlib4(?:\.git)?\/?$/i.test(pin.url || '')) throw Error('Physlib manifest has no supported, pinned Mathlib source.');
  return pin.rev;
}

export async function buildMathlibGraph(physlibRoot) {
  const physlib = path.resolve(physlibRoot), mathlib = path.join(physlib, '.lake', 'packages', 'mathlib');
  const pin = await readMathlibPin(physlib);
  const actualRoot = path.resolve(git(mathlib, 'rev-parse', '--show-toplevel'));
  const samePath = process.platform === 'win32' ? actualRoot.toLowerCase() === mathlib.toLowerCase() : actualRoot === mathlib;
  if (!samePath) throw Error('Mathlib checkout is missing or is not a separate Git repository.');
  checkClean(physlib); checkClean(mathlib);
  const physlibRevision = git(physlib, 'rev-parse', 'HEAD'), revision = git(mathlib, 'rev-parse', 'HEAD');
  if (revision !== pin) throw Error(`Mathlib checkout ${revision} does not match Physlib manifest ${pin}.`);
  const toolchain = (await readFile(path.join(physlib, 'lean-toolchain'), 'utf8')).trim();
  const mathlibToolchain = (await readFile(path.join(mathlib, 'lean-toolchain'), 'utf8')).trim();
  if (toolchain !== mathlibToolchain) throw Error('Physlib and Mathlib toolchains do not match.');
  const files = (await leanFiles(mathlib)).concat('Mathlib.lean').sort();
  const modules = [];
  // Bounded parallel reads avoid opening thousands of files at once on large checkouts.
  for (let i = 0; i < files.length; i += 32) {
    const batch = files.slice(i, i + 32);
    const texts = await Promise.all(batch.map(file => readFile(path.join(mathlib, file), 'utf8')));
    for (let j = 0; j < batch.length; j++) {
      const file = batch[j];
      modules.push({ id:file.slice(0,-5).replaceAll('/','.'), path:file, library:'Mathlib', imports:importsFromSource(texts[j]) });
    }
  }
  const ids = new Set(modules.map(m=>m.id)), unresolvedLocalImports = [], externalImports = [];
  for (const m of modules) for (const imp of m.imports) {
    const entry = { source:m.id, target:imp.module, line:imp.line };
    if (imp.module.split('.')[0] === 'Mathlib') { if (!ids.has(imp.module)) unresolvedLocalImports.push(entry); }
    else externalImports.push(entry);
  }
  if (git(physlib,'rev-parse','HEAD') !== physlibRevision || git(mathlib,'rev-parse','HEAD') !== revision) throw Error('A checkout changed during extraction.');
  checkClean(physlib); checkClean(mathlib);
  const result = {
    schemaVersion:1,
    source:{repository:'https://github.com/leanprover-community/mathlib4',revision,generatedAt:new Date().toISOString(),toolchain,localRoots:['Mathlib'],extractor:{name:'mathlib-source-scan',version:'1.0.0'},method:'explicit source import scan',physlibRevision},
    counts:{modules:modules.length,maps:0,imports:modules.reduce((n,m)=>n+m.imports.length,0),unresolvedLocalImports:unresolvedLocalImports.length,externalImports:externalImports.length,unresolvedMapReferences:0},
    modules,maps:[],unresolvedLocalImports,externalImports,unresolvedMapReferences:[]
  };
  const errors = validateGraph(result);
  if (errors.length) throw Error(`Mathlib snapshot is invalid:\n${errors.join('\n')}`);
  return result;
}

// A bridge is valid only for the Physlib revision that selected this Mathlib pin.
export function buildMathlibBridge(physlib, mathlib) {
  const errors = [...validateGraph(physlib), ...validateGraph(mathlib)];
  if (errors.length) throw Error(`Invalid input snapshot:\n${errors.join('\n')}`);
  if (physlib.source.repository !== 'https://github.com/leanprover-community/physlib' || mathlib.source.physlibRevision !== physlib.source.revision || mathlib.source.toolchain !== physlib.source.toolchain || mathlib.source.repository !== 'https://github.com/leanprover-community/mathlib4') throw Error('Mathlib snapshot is not paired with this Physlib revision and toolchain.');
  const ids = new Set(mathlib.modules.map(m=>m.id)), edges = [], unresolved = [];
  for (const m of physlib.modules) for (const imp of m.imports) if (imp.module.split('.')[0] === 'Mathlib') {
    const edge = { from:m.id, to:imp.module, line:imp.line };
    (ids.has(imp.module) ? edges : unresolved).push(edge);
  }
  return { schemaVersion:1, source:{physlibRevision:physlib.source.revision,mathlibRevision:mathlib.source.revision,toolchain:physlib.source.toolchain}, edges, unresolved };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [root='.physlib-source', physlibFile='site/data/graph.json', mathlibFile='site/data/mathlib.json', bridgeFile='site/data/mathlib-bridge.json'] = process.argv.slice(2);
  const physlib = JSON.parse(await readFile(physlibFile,'utf8'));
  const mathlib = await buildMathlibGraph(root), bridge = buildMathlibBridge(physlib,mathlib);
  await mkdir(path.dirname(path.resolve(mathlibFile)),{recursive:true});
  await mkdir(path.dirname(path.resolve(bridgeFile)),{recursive:true});
  await writeFile(mathlibFile,JSON.stringify(mathlib));
  await writeFile(bridgeFile,JSON.stringify(bridge));
  console.log(`Mathlib ${mathlib.source.revision}: ${mathlib.modules.length} modules, ${mathlib.counts.imports} imports; ${bridge.edges.length} Physlib imports resolved, ${bridge.unresolved.length} unresolved.`);
}
