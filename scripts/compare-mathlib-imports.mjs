import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rmdir, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { importsFromSource } from './extract.mjs';

const root=path.resolve(process.argv[2]||'.physlib-source/.lake/packages/mathlib');
const graph=JSON.parse(await readFile(process.argv[3]||'site/data/mathlib.json','utf8'));
const revision=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(revision!==graph.source.revision)throw Error('Mathlib snapshot revision does not match checkout.');
if(execFileSync('git',['-C',root,'status','--porcelain'],{encoding:'utf8'}).trim())throw Error('Mathlib checkout is not clean.');
const lean=process.env.LEAN_BIN||'lean', version=execFileSync(lean,['--version'],{encoding:'utf8'}).trim(), expected=graph.source.toolchain.match(/:v(.+)$/)?.[1];
if(!expected||!version.includes(`version ${expected}`))throw Error(`Lean toolchain mismatch: ${version}`);
const all=process.argv.includes('--all');
const samples=all?graph.modules.map(m=>m.path):['Mathlib.lean','Mathlib/Analysis/Calculus/Gradient/Basic.lean','Mathlib/LinearAlgebra/GeneralLinearGroup/Basic.lean','Mathlib/Algebra/Group/Defs.lean'];
const paths=samples.map(p=>path.join(root,p));
const temporary=await mkdtemp(path.join(os.tmpdir(),'mathlib-import-check-')),listFile=path.join(temporary,'files.txt');
try{
  await writeFile(listFile,paths.join('\n'),'utf8');
  const output=execFileSync(lean,['--run','scripts/lean-imports.lean','--files-from',listFile],{encoding:'utf8',maxBuffer:50*1024*1024});
  const parsed=output.trim().split(/\r?\n/).map(s=>JSON.parse(s));
  if(parsed.length!==paths.length)throw Error('Lean parser returned an unexpected number of files.');
  let differences=0;
  for(let i=0;i<paths.length;i++){
    const found=importsFromSource(await readFile(paths[i],'utf8')).map(x=>x.module).filter(x=>x!=='Init').sort(),expectedNames=parsed[i].imports.sort();
    if(JSON.stringify(found)!==JSON.stringify(expectedNames)){differences++;console.log(`${samples[i]}\n  scanner: ${JSON.stringify(found)}\n  Lean: ${JSON.stringify(expectedNames)}`);}
    else if(!all)console.log(`${samples[i]}: ${found.length} imports match`);
  }
  console.log(`Mathlib ${revision}; ${graph.source.toolchain}; ${paths.length} files checked; ${differences} differing files.`);
  if(differences)process.exitCode=1;
}finally{await unlink(listFile).catch(e=>{if(e.code!=='ENOENT')throw e;});await rmdir(temporary);}
