import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { importsFromSource, buildGraph } from './extract.mjs';

const root=path.resolve(process.argv[2]||'.physlib-source');
const lean=process.env.LEAN_BIN||'lean';
const samples=process.argv.includes('--all')?(await buildGraph(root)).modules.map(m=>m.path):['Physlib.lean','PhyslibAlpha.lean','QuantumInfo.lean','Physlib/ClassicalMechanics/EulerLagrange.lean','Physlib/Units/Dimension.lean','PhyslibAlpha/ClassicalMechanics/NortonDome/Basic.lean','QuantumInfo/States/Pure/Braket.lean'];
const existing=[];
for(const p of samples){try{await readFile(path.join(root,p));existing.push(p);}catch(e){if(e.code!=='ENOENT')throw e;console.error(`Sample missing: ${p}`);process.exitCode=1;}}
if(existing.length!==samples.length)process.exit(1);
const toolchain=(await readFile(path.join(root,'lean-toolchain'),'utf8')).trim();
const version=execFileSync(lean,['--version'],{encoding:'utf8'}).trim();
const expected=toolchain.match(/:v(\d+\.\d+\.\d+(?:-[\w.]+)?)/)?.[1];
if(!expected||!version.includes(`version ${expected}`))throw Error(`Lean toolchain mismatch: snapshot ${toolchain}; executable ${version}`);
const revision=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const manifest=JSON.parse(await readFile(path.join(root,'lake-manifest.json'),'utf8'));
const importGraph=manifest.packages.find(p=>p.name==='importGraph')?.rev;
const paths=existing.map(p=>path.join(root,p));
await mkdir('.issue-publish',{recursive:true});const listFile=path.resolve('.issue-publish/lean-import-files.txt');await writeFile(listFile,paths.join('\n'),'utf8');
const output=execFileSync(lean,['--run','scripts/lean-imports.lean','--files-from',listFile],{encoding:'utf8',maxBuffer:20*1024*1024});
const parsed=output.trim().split(/\r?\n/).map(s=>JSON.parse(s));
let differences=0;
for(let i=0;i<existing.length;i++){
  const found=importsFromSource(await readFile(paths[i],'utf8')).map(x=>x.module).filter(x=>x!=='Init').sort();
  const expectedNames=parsed[i].imports.sort();
  if(JSON.stringify(found)!==JSON.stringify(expectedNames)){differences++;console.log(`${existing[i]}\n  scanner: ${JSON.stringify(found)}\n  Lean: ${JSON.stringify(expectedNames)}`);}
  else if(!process.argv.includes('--all')) console.log(`${existing[i]}: ${found.length} explicit imports match`);
}
console.log(`Physlib ${revision}; ${toolchain}; importGraph ${importGraph||'not in manifest'}; ${existing.length} files checked; ${differences} differing files`);
if(differences)process.exitCode=1;
