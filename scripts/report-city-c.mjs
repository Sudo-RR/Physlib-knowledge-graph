import {readFile,readdir,writeFile,copyFile,mkdir} from 'node:fs/promises';
const out='docs/screenshots/milestone-c';await mkdir(`${out}/runs`,{recursive:true});
const series=process.argv[2]||'C4-final-3',stem=series==='C4-final-3'?'benchmarks':`benchmarks-${series}`;
const records=[],diagnostics=[];
for(const file of (await readdir('dist/city-benchmarks')).sort()){
 const r=JSON.parse(await readFile(`dist/city-benchmarks/${file}`,'utf8'));
 if(r.benchmarkSeries!==series)continue;
 await copyFile(`dist/city-benchmarks/${file}`,`${out}/runs/${file}`);(r.profile==='normal'?records:diagnostics).push({file,...r});
}
const median=xs=>xs.sort((a,b)=>a-b)[Math.floor(xs.length/2)],groups=new Map();
for(const r of records){const key=[r.layoutVersion,r.benchmarkScope,r.quality].join('/');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
const rows=[],incomplete=[];
for(const [key,all] of groups){const eligible=all.filter(r=>r.allFramesForeground),runs=eligible.slice(-3),r=runs[0];if(series==='C4-final-3'&&runs.length!==3){incomplete.push({key,validRuns:eligible.length,excludedInterrupted:all.length-eligible.length});continue;}if(runs.some(r=>!r.allFramesForeground))throw Error(`Focus interruption in ${key}`);
 const endLod=Object.fromEntries(['city','district','building'].map(tier=>[tier,(r.chunkLod?.[tier]||0)+((r.modularActiveLod||r.lod)?.[tier]||0)+(r.inspectionLod?.[tier]||0)]));
 rows.push({key,runs:runs.length,files:runs.map(r=>r.file),fps:median(runs.map(r=>r.fps)),fpsRange:[Math.min(...runs.map(r=>r.fps)),Math.max(...runs.map(r=>r.fps))],p50Ms:median(runs.map(r=>r.p50Ms)),p95Ms:median(runs.map(r=>r.p95Ms)),p99Ms:median(runs.map(r=>r.p99Ms)),worstMs:Math.max(...runs.map(r=>r.maxMs)),calls:[Math.min(...runs.map(r=>r.calls[0])),Math.max(...runs.map(r=>r.calls[1]))],triangles:[Math.min(...runs.map(r=>r.triangleRange[0])),Math.max(...runs.map(r=>r.triangleRange[1]))],chunks:[Math.min(...runs.map(r=>r.activeChunkRange[0])),Math.max(...runs.map(r=>r.activeChunkRange[1]))],totalChunks:r.totalChunks,finalChunkLod:r.chunkLod,endLod,lodCountKind:r.modularActiveLod?'Active, including transitions':'Target tiers (older sampler)',selectedModelCount:r.selectedModelCount,geometries:Math.max(...runs.map(r=>r.geometries)),textures:Math.max(...runs.map(r=>r.textures)),canvas:[r.canvasWidth,r.canvasHeight],viewport:[r.viewportWidth,r.viewportHeight],pixelRatio:r.pixelRatio,cameraPath:r.cameraPath,renderer:r.gpu});
}
await writeFile(`${out}/${stem}.json`,JSON.stringify({series,protocol:series==='C4-final-3'?'Three 12-second foreground runs per published row; incomplete scopes listed separately. Medians of run statistics, ranges include all samples. Software rendering only.':'Earlier implementation series; actual run counts are explicit per row.',rows,incomplete,diagnostics},null,2));
const table=['| Scope / quality | FPS | P50 / P95 / P99 ms | Worst ms | Calls | Triangles | Active chunks | Geometries / textures |','| --- | ---: | --- | ---: | --- | --- | --- | --- |',...rows.map(r=>`| ${r.key} | ${r.fps} | ${r.p50Ms} / ${r.p95Ms} / ${r.p99Ms} | ${r.worstMs} | ${r.calls.join('–')} | ${r.triangles.join('–')} | ${r.chunks.join('–')} / ${r.totalChunks??'n/a'} | ${r.geometries} / ${r.textures} |`)];
await writeFile(`${out}/${stem==='benchmarks'?'performance-table':stem}.md`,table.join('\n')+'\n');console.log(table.join('\n'));
