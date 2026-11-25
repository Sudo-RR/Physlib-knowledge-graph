import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
export function mergeMetadata(snapshot,rows,rawSha256){
 if(snapshot.format!=='physlib-elaborated-pilot'||!Array.isArray(rows)||!/^[a-f0-9]{64}$/.test(rawSha256))throw Error('Invalid metadata input');
 const declarations=new Map(snapshot.declarations.map(d=>[d.id,d])),byId=new Map();
 const refs=xs=>Array.isArray(xs)&&xs.every(x=>typeof x.id==='string'&&x.id&&typeof x.module==='string');
 for(const row of rows){
  const d=declarations.get(row.id);
  if(!d||d.module!==row.module||byId.has(row.id)||!(row.statement===null||typeof row.statement==='string')||typeof row.valueAvailable!=='boolean'||!refs(row.typeReferences)||!refs(row.valueReferences))throw Error('Invalid metadata identity or fields '+row.id);
  if(!row.valueAvailable&&row.valueReferences.length)throw Error('Unavailable value has references');
  const range=row.range;
  if(range!==null&&(!range||!['line','column','endLine','endColumn'].every(k=>Number.isInteger(range[k])&&range[k]>=0)||range.line<1||range.endLine<range.line||(range.endLine===range.line&&range.endColumn<range.column)))throw Error('Invalid exact range '+row.id);
  byId.set(row.id,row);
 }
 if(byId.size!==declarations.size)throw Error('Native environment identity coverage mismatch: '+byId.size+'/'+declarations.size);
 const enriched=snapshot.declarations.map(d=>{const r=byId.get(d.id);return {...d,statement:r.statement,line:r.range?.line??null,range:r.range,directReferences:{type:r.typeReferences,value:r.valueReferences,valueAvailable:r.valueAvailable}};});
 const summary={matched:enriched.length,signatures:enriched.filter(d=>d.statement).length,ranges:enriched.filter(d=>d.range).length,typeReferences:enriched.reduce((n,d)=>n+d.directReferences.type.length,0),valueReferences:enriched.reduce((n,d)=>n+d.directReferences.value.length,0),valuesAvailable:enriched.filter(d=>d.directReferences.valueAvailable).length};
 if(!summary.signatures||!summary.ranges||!summary.typeReferences||!summary.valueReferences)throw Error('Native metadata pilot has no usable signature/range/reference evidence');
 return {...snapshot,source:{...snapshot.source,metadata:{method:'Lean environment exact-name metadata and direct expression constants',rawSha256,summary}},declarations:enriched};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [input,raw,output]=process.argv.slice(2);if(!output)throw Error('Expected snapshot, native raw, output');
 const bytes=await readFile(raw),snapshot=JSON.parse(await readFile(input,'utf8'));
 const result=mergeMetadata(snapshot,JSON.parse(bytes),createHash('sha256').update(bytes).digest('hex'));
 await writeFile(output,JSON.stringify(result));console.log('NATIVE METADATA SUMMARY',JSON.stringify(result.source.metadata));
}
