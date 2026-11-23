import {readdir,readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
const root='docs/screenshots/milestone-b1';
await mkdir(`${root}/runs`,{recursive:true});
const records=[];
for(const file of (await readdir('dist/city-benchmarks')).sort()){
 const data=JSON.parse(await readFile(`dist/city-benchmarks/${file}`,'utf8'));
 await copyFile(`dist/city-benchmarks/${file}`,`${root}/runs/${file}`);
 records.push({file,...data});
}
const median=xs=>xs.sort((a,b)=>a-b)[Math.floor(xs.length/2)];
const comparisons=[];
for(const [mode,quality] of [['procedural','medium'],['units','medium'],['units','low']]){
 const runs=records.filter(r=>r.mode===mode&&r.quality===quality&&r.profile==='normal').slice(-3);
 if(runs.length!==3||runs.some(r=>!r.allFramesForeground))throw Error('Three foreground runs required');
 comparisons.push({mode,quality,files:runs.map(r=>r.file),fps:median(runs.map(r=>r.fps)),p50Ms:median(runs.map(r=>r.p50Ms)),p95Ms:median(runs.map(r=>r.p95Ms)),p99Ms:median(runs.map(r=>r.p99Ms)),worstMs:Math.max(...runs.map(r=>r.maxMs)),calls:[Math.min(...runs.map(r=>r.calls[0])),Math.max(...runs.map(r=>r.calls[1]))],triangles:[Math.min(...runs.map(r=>r.triangleRange[0])),Math.max(...runs.map(r=>r.triangleRange[1]))],geometries:runs[0].geometries,textures:runs[0].textures,firstVisibleMs:runs[0].firstVisibleMs,completedMs:runs[0].completedMs});
}
const diagnostics=records.filter(r=>r.profile!=='normal');
await writeFile(`${root}/benchmarks.json`,JSON.stringify({renderer:records[0].gpu,protocol:'Three foreground 12-second runs per comparison; medians of run statistics. First two normal Medium runs are warmup/pre-optimisation and excluded. Diagnostic profiles are one run each, exploratory.',comparisons,diagnostics},null,2));
console.log(JSON.stringify({comparisons,diagnostics:diagnostics.map(r=>({profile:r.profile,fps:r.fps,p95:r.p95Ms,phases:r.phaseTimings}))},null,2));
