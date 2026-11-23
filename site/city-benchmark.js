/** Frame intervals include JS, browser scheduling and presentation; these are not GPU times. */
export function summarizeFrames(samples,durationMs){
 const sorted=samples.map(s=>s.ms).sort((a,b)=>a-b);
 if(!sorted.length)return null;
 const percentile=p=>sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)];
 return {frames:sorted.length,durationMs:Math.round(durationMs),fps:Number((sorted.length*1000/durationMs).toFixed(1)),
  p50Ms:Number(percentile(.5).toFixed(2)),p95Ms:Number(percentile(.95).toFixed(2)),p99Ms:Number(percentile(.99).toFixed(2)),maxMs:Number(sorted.at(-1).toFixed(2)),
  calls:[Math.min(...samples.map(s=>s.calls)),Math.max(...samples.map(s=>s.calls))],
  geometries:Math.max(...samples.map(s=>s.geometries)),textures:Math.max(...samples.map(s=>s.textures)),
  ...(samples.every(s=>typeof s.foreground==='boolean')?{foregroundFrames:samples.filter(s=>s.foreground).length,allFramesForeground:samples.every(s=>s.foreground)}:{})};
}
