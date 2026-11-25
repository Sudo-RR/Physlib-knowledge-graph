// Reproduce the normalized snapshot from the successful workflow's raw output.
import {readFile,writeFile,rm,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizePilot,FULL_ROOTS} from './elaborated-pilot.mjs';
import {indexElaborated} from '../site/geneva-elaborated.js';
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export function verifiedCompanion(rawBytes,provenance,graph,production,runId){
 if(!/^[0-9]+$/.test(String(runId)))throw Error('Invalid source workflow run ID');
 if(!production.mathlibRevision||provenance.mathlibRevision!==production.mathlibRevision)throw Error('Mathlib revision mismatch');
 if(JSON.stringify(provenance.roots)!==JSON.stringify(FULL_ROOTS))throw Error('Only the full three-library scope can be published');
 if(provenance.rawSha256!==sha256(rawBytes))throw Error('Raw extraction hash mismatch');
 const snapshot=normalizePilot(JSON.parse(rawBytes),graph,provenance);
 const index=indexElaborated(snapshot,production);
 const bytes=Buffer.from(JSON.stringify(snapshot));
 if(bytes.length>150*1024*1024)throw Error('Browser snapshot size limit exceeded');
 const manifest={schemaVersion:1,status:'available',source:snapshot.source,runId:String(runId),sha256:sha256(bytes),bytes:bytes.length,counts:{declarations:index.local.size,dependencies:snapshot.dependencies.length,externalTargets:snapshot.externalTargets.length,modulesWithRecords:[...index.coverage.values()].filter(c=>c.count>0).length,scopedModules:index.coverage.size}};
 return {bytes,manifest};
}
async function main(){
 const [mode,arg,runId]=process.argv.slice(2),dir='site/data',productionPath=path.join(dir,'geneva-production.json'),snapshotPath=path.join(dir,'geneva-elaborated.json'),manifestPath=path.join(dir,'geneva-elaborated-manifest.json');
 const production=JSON.parse(await readFile(productionPath,'utf8'));
 if(mode==='prepare'){
  if(!/^[0-9a-f]{40}$/.test(arg||''))throw Error('Missing pinned Mathlib revision');
  production.mathlibRevision=arg;await writeFile(productionPath,JSON.stringify(production));
  await rm(snapshotPath,{force:true});await writeFile(manifestPath,JSON.stringify({schemaVersion:1,status:'unavailable',source:{physlibRevision:production.model.source.revision,toolchain:production.model.source.toolchain,mathlibRevision:arg},reason:'No successful full extraction matches this city revision yet.'}));return;
 }
 if(mode!=='publish')throw Error('Expected prepare or publish');
 const graph=JSON.parse(await readFile(path.join(dir,'graph.json'),'utf8'));
 const provenance=JSON.parse(await readFile(path.join(arg,'provenance.json'),'utf8'));
 const {bytes,manifest}=verifiedCompanion(await readFile(path.join(arg,'raw.json')),provenance,graph,production,runId);
 await writeFile(snapshotPath+'.tmp',bytes);await rename(snapshotPath+'.tmp',snapshotPath);
 await writeFile(manifestPath+'.tmp',JSON.stringify(manifest));await rename(manifestPath+'.tmp',manifestPath);
 console.log('Published elaborated companion',JSON.stringify(manifest));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error('Elaborated companion rejected:',e.message);process.exitCode=1;});
