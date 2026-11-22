import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { buildFullCity } from '../site/city-model.js';
import { layoutFullCity } from '../site/city-layout.js';
import { buildFloorIndex } from '../site/city-floors.js';

const dir=process.argv[2]||'site/data',samples=Number(process.argv[3]||3);
if(!Number.isInteger(samples)||samples<1||samples>20)throw Error('Usage: node scripts/benchmark-city.mjs [snapshot-directory] [samples 1-20]');
const start=performance.now();
const raw=await Promise.all(['graph.json','mathlib.json','mathlib-bridge.json'].map(file=>readFile(`${dir}/${file}`,'utf8')));
const [physlib,mathlib,bridge]=raw.map(JSON.parse),parseMs=performance.now()-start;
const timings=[];let city,layout;
for(let i=0;i<samples+1;i++){
  const started=performance.now();
  city=buildFullCity(physlib,mathlib,bridge);
  const modelMs=performance.now()-started;
  layout=layoutFullCity(city);
  const layoutMs=performance.now()-started-modelMs;
  buildFloorIndex(city.nodes);
  const floorsMs=performance.now()-started-modelMs-layoutMs;
  if(i)timings.push({modelMs,layoutMs,floorsMs});
}
const median=key=>timings.map(item=>item[key]).sort((a,b)=>a-b)[Math.floor(timings.length/2)];
console.log(JSON.stringify({
  physlibRevision:physlib.source.revision,mathlibRevision:mathlib.source.revision,
  node:process.version,nodes:city.nodes.length,edges:city.edges.length,districts:layout.districts.length,
  bytes:raw.reduce((sum,text)=>sum+Buffer.byteLength(text),0),samples,readAndParseMs:parseMs,
  medianMs:{model:median('modelMs'),layout:median('layoutMs'),floors:median('floorsMs')},
  processMaxResidentBytes:process.resourceUsage().maxRSS*1024,
  limitation:'Node process measurements only; excludes browser rendering, GPU time, browser memory and time to interactive.'
},null,2));
