// Stream native JSON lines, enforce exact qualified identity + module, and
// compact repeated references per module. No inferred ranges or guessed joins.
import {createReadStream} from 'node:fs';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const sha=b=>createHash('sha256').update(b).digest('hex');
const MAX_SHARD=24*1024*1024,MAX_TOTAL=700*1024*1024;
export const sourceKeys=['physlibRevision','mathlibRevision','toolchain','extractorRevision','rawSha256'];
export function validateNativeRow(row,wanted){
 const d=wanted.get(row.id),refs=xs=>Array.isArray(xs)&&xs.every(x=>x&&typeof x.id==='string'&&x.id&&typeof x.module==='string'&&x.module);
 if(!d||d.module!==row.module||!(row.statement===null||typeof row.statement==='string')||typeof row.valueAvailable!=='boolean'||!refs(row.typeReferences)||!refs(row.valueReferences)||(!row.valueAvailable&&row.valueReferences.length))throw Error('Invalid native declaration '+row.id);
 const r=row.range;if(r!==null&&(!r||!['line','column','endLine','endColumn'].every(k=>Number.isInteger(r[k])&&r[k]>=0)||r.line<1||r.endLine<r.line||(r.endLine===r.line&&r.endColumn<r.column)))throw Error('Invalid exact range '+row.id);
 return d;
}
export function createModuleShard(module){
 const refs=[],lookup=new Map(),rows=[];
 function intern(x){const k=JSON.stringify([x.id,x.module]);if(!lookup.has(k)){lookup.set(k,refs.length);refs.push([x.id,x.module]);}return lookup.get(k);}
 return {add(row){rows.push([row.id,row.statement,row.range,row.valueAvailable,row.typeReferences.map(intern),row.valueReferences.map(intern)]);},finish(){return {schemaVersion:1,module,refs,rows};}};
}
export async function packNative(snapshot,dir,out,runId){
 const provenance=JSON.parse(await readFile(path.join(dir,'provenance.json'),'utf8'));
 if(sourceKeys.some(k=>typeof provenance[k]!=='string'||provenance[k]!==snapshot.source[k])||JSON.stringify(provenance.roots)!==JSON.stringify(['Physlib','PhyslibAlpha','QuantumInfo']))throw Error('Native evidence source mismatch');
 const expected=(await readFile(path.join(dir,'native.sha256'),'utf8')).trim().match(/^([a-f0-9]{64})\s+native\.jsonl$/)?.[1];if(!expected)throw Error('Native hash missing');
 const wanted=new Map(snapshot.declarations.map(d=>[d.id,d]));if(wanted.size!==snapshot.declarations.length)throw Error('Duplicate base declarations');
 const seen=new Set(),groups=new Map(),hash=createHash('sha256'),counts={matched:0,signatures:0,ranges:0,valuesAvailable:0,typeReferences:0,valueReferences:0};
 const input=createReadStream(path.join(dir,'native.jsonl'));input.on('data',b=>hash.update(b));
 for await(const line of createInterface({input,crlfDelay:Infinity})){
  if(!line.trim())continue;const row=JSON.parse(line);validateNativeRow(row,wanted);if(seen.has(row.id))throw Error('Duplicate native identity '+row.id);seen.add(row.id);
  if(!groups.has(row.module))groups.set(row.module,createModuleShard(row.module));groups.get(row.module).add(row);
  counts.matched++;counts.signatures+=Number(!!row.statement);counts.ranges+=Number(!!row.range);counts.valuesAvailable+=Number(row.valueAvailable);counts.typeReferences+=row.typeReferences.length;counts.valueReferences+=row.valueReferences.length;
 }
 if(hash.digest('hex')!==expected||seen.size!==wanted.size||!counts.signatures||!counts.ranges||!counts.typeReferences||!counts.valueReferences)throw Error('Native integrity or coverage mismatch '+seen.size+'/'+wanted.size);
 const modules=Object.create(null);let totalBytes=0;
 if(out){await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});}
 for(const [module,group] of groups){const shard=group.finish(),bytes=Buffer.from(JSON.stringify(shard)),digest=sha(bytes);totalBytes+=bytes.length;if(bytes.length>MAX_SHARD||totalBytes>MAX_TOTAL)throw Error('Native publication size budget exceeded');
  modules[module]={sha256:digest,bytes:bytes.length,count:shard.rows.length};
  if(out)await writeFile(path.join(out,digest+'.json'),bytes);
 }
 const manifest={schemaVersion:1,source:Object.fromEntries(sourceKeys.map(k=>[k,provenance[k]])),nativeSha256:expected,runId:String(runId||''),counts,totalBytes,modules};
 if(out)await writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest));
 console.log('NATIVE FULL METADATA SUMMARY',JSON.stringify({counts,totalBytes,modules:groups.size,source:manifest.source}));
 return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [mode,snapshotPath,dir,out,runId]=process.argv.slice(2);
 if(!['validate','publish'].includes(mode)||!dir||(mode==='publish'&&(!out||!/^\d+$/.test(runId||''))))throw Error('Expected validate <snapshot> <dir> or publish <snapshot> <dir> <out> <runId>');
 await packNative(JSON.parse(await readFile(snapshotPath,'utf8')),dir,mode==='publish'?out:null,runId);
}
