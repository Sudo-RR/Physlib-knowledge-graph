/** Isolated diagnostic variants. None changes canonical graph or camera movement. */
export const renderProfiles=['normal','legacy','city','district','building','quarter','flat','clear','no-overlay','live-shadows','sync'];
export function profileOptions(name){
 const profile=renderProfiles.includes(name)?name:'normal';
 return {name:profile,forceLod:['city','district','building'].includes(profile)?profile:null,
  pixelScale:profile==='quarter'?.5:1,clearOnly:profile==='clear',flat:profile==='flat',
  overlay:profile!=='no-overlay',liveShadows:profile==='live-shadows',sync:profile==='sync'};
}
export function summarizePhaseTimings(samples){
 const result={};
 for(const key of ['updateMs','renderSubmitMs','overlayMs','finishWaitMs']){
  const values=samples.map(s=>s[key]).filter(Number.isFinite).sort((a,b)=>a-b);
  if(values.length)result[key]={median:Number(values[Math.floor(values.length/2)].toFixed(3)),p95:Number(values[Math.ceil(values.length*.95)-1].toFixed(3))};
 }
 return result;
}
