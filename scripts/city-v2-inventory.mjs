// Lightweight source inventory, not an elaborated Lean declaration graph.
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {stripComments} from './extract.mjs';
export function scanDeclarations(module,text){
 const result=[];
 const lines=stripComments(text).split(/\r?\n/);
 // Conservative top-level command recognition; anonymous instances and multiline
 // attributes/commands can be missed. Do not claim complete coverage.
 const re=/^(?:(?:public|private|protected|noncomputable|unsafe|partial|local|scoped)\s+)*(structure|inductive|class|instance|def|abbrev|theorem|lemma)\s+([^\s(:={\[]+)/u;
 for(let i=0;i<lines.length;i++){
  const m=lines[i].match(re);if(!m||!/^[\p{L}_«][\p{L}\p{N}_'.«»]*$/u.test(m[2]))continue;
  const kind=({def:'definition',abbrev:'definition',inductive:'structure'})[m[1]]||m[1];
  result.push({id:'source:'+module.id+':'+(i+1)+':'+m[2],module:module.id,kind,line:i+1,statement:null});
 }
 return result;
}
export async function inventory(root,graph){
 const revision=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 if(revision!==graph.source.revision)throw Error('Source revision mismatch');
 if(execFileSync('git',['-C',root,'status','--porcelain'],{encoding:'utf8'}).trim())throw Error('Source checkout not clean');
 const declarations=[];
 for(const m of graph.modules)declarations.push(...scanDeclarations(m,await readFile(resolve(root,m.path),'utf8')));
 return {schemaVersion:1,source:{...graph.source,extractor:{name:'city-v2-source-inventory',version:'1'},method:'partial lexical command inventory; no proof dependencies'},coverage:graph.modules.map(m=>({module:m.id,status:'partial'})),declarations,dependencies:[]};
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname){
 const root=process.argv[2]||'.physlib-source',graph=JSON.parse(await readFile('site/data/graph.json','utf8'));
 const data=await inventory(root,graph);await writeFile('site/data/declarations.json',JSON.stringify(data));console.log('Partial source inventory:',data.declarations.length,'commands');
}
