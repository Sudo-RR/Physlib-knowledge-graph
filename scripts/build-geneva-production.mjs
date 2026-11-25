import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {parseApiMap} from '../site/geneva-api-maps.js';
import {buildContributorIndex} from '../site/geneva-contributor.js';
import {buildCityV2} from '../site/city-v2-model.js';
import {allocateGeneva,validateAllocation} from '../site/geneva-production-layout.js';
const graph=JSON.parse(await readFile('site/data/graph.json','utf8'));
let declarations=null;
try{declarations=JSON.parse(await readFile('site/data/declarations.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(process.argv.includes('--require-inventory')&&!declarations)throw Error('Production source inventory missing');
const model=buildCityV2(graph,declarations,{area:'all'}),layout=allocateGeneva(model),checks=validateAllocation(model,layout);
const modulePaths=Object.fromEntries(graph.modules.map(m=>[m.id,m.path])),declarationLines=Object.fromEntries((declarations?.declarations||[]).map(d=>[d.id,[d.module,d.line]]));
const declarationRecords=(declarations?.declarations||[]).map(d=>({id:d.id,module:d.module,kind:d.kind,line:d.line??null,name:d.id.startsWith('source:')?d.id.split(':').slice(3).join(':'):d.id}));
if(model.complexes.flatMap(c=>c.moduleIds).length!==graph.modules.length)throw Error('Source module coverage mismatch');
const contributor=buildContributorIndex(graph,model);
// Read the exact Git object, not a potentially modified working-tree document.
const apiMaps=contributor.maps.map(m=>({...parseApiMap(execFileSync('git',['-C','.physlib-source','show',graph.source.revision+':'+m.path],{encoding:'utf8',maxBuffer:8*1024*1024}),m.path),title:m.title,abstract:m.abstract}));
await writeFile('site/data/geneva-production.json',JSON.stringify({model,layout,modulePaths,declarationLines,declarationRecords,contributor,apiMaps}));
console.log('Geneva source allocation',JSON.stringify({...checks,source:model.source.revision,modules:graph.modules.length,decorativeTowers:layout.decorativeTowers.length,decorativeInfill:layout.civic.infill.length}));
