import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {buildGraph} from './extract.mjs';
import {validateGraph} from './validate.mjs';
import {summarizeHistory,compareHistory} from '../site/geneva-history-core.js';
const root=path.resolve(process.argv[2]||'.physlib-source'),current=JSON.parse(await readFile('site/data/graph.json','utf8')),output=process.argv[3]||'site/data/geneva-history.json';
const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',maxBuffer:16*1024*1024}).trim();
if(git('rev-parse','HEAD')!==current.source.revision)throw Error('History/current revision mismatch');
const end=new Date(git('show','-s','--format=%cI',current.source.revision)),samples=[],missing=[],graphs=[],seen=new Set();
for(let week=5;week>=0;week--){
 const date=new Date(end.getTime()-week*7*86400000).toISOString(),revision=week===0?current.source.revision:git('rev-list','--first-parent','-1','--before='+date,current.source.revision);
 if(!revision){missing.push({date,reason:'No commit at cutoff'});continue;}
 if(seen.has(revision)){missing.push({date,revision,reason:'Duplicate sampled commit'});continue;}
 seen.add(revision);let graph=current,tmp;
 try{
  if(revision!==current.source.revision){tmp=await mkdtemp(path.join(os.tmpdir(),'physlib-history-'));git('worktree','add','--detach',tmp,revision);graph=await buildGraph(tmp);}
  const errors=validateGraph(graph);if(errors.length)throw Error(errors.join('; '));if(graph.source.revision!==revision)throw Error('Revision mismatch');
  samples.push({...summarizeHistory(graph),cutoff:date,committedAt:git('show','-s','--format=%cI',revision)});graphs.push(graph);
 }catch(e){if(week===0)throw e;missing.push({date,revision,reason:String(e.message).slice(0,500)});}
 finally{if(tmp){try{git('worktree','remove','--force',tmp);}catch(e){console.warn('Worktree cleanup:',e.message);}await rm(tmp,{recursive:true,force:true});}}
}
if(!samples.some(s=>s.revision===current.source.revision)){samples.push({...summarizeHistory(current),cutoff:end.toISOString(),committedAt:end.toISOString()});graphs.push(current);}
await writeFile(output,JSON.stringify({version:1,revision:current.source.revision,sampling:'Six weekly first-parent cutoffs relative to indexed commit time; duplicate commits omitted',samples,missing,intervals:graphs.slice(1).map((g,i)=>compareHistory(graphs[i],g))}));
console.log('History samples:',samples.length,'intervals:',Math.max(0,samples.length-1),'omitted:',missing.length);
