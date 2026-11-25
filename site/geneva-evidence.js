// Source-path activity and attributed review marks are separate evidence.
const day=86400000;
export const palettes={
 freshness:{recent:['#53d8ad','0–30 days'],warm:['#f6c76b','31–90 days'],older:['#ab99e5','Over 90 days'],unknown:['#a0a6ad','Unknown']},
 review:{reject:['#f17d83','Recorded rejection'],question:['#f6c76b','Recorded question'],agree:['#53d8ad','Recorded agreement'],unknown:['#a0a6ad','No mapped marks']}
};
export function parseSourceHistory(log,modules){
 const byPath=new Map(modules.map(m=>[m.path,m.id])),result=Object.create(null);let commit=null;
 for(const raw of log.split('\0')){
  const item=raw.replace(/^\n/,'');if(!item)continue;
  const header=item.match(/^@@([0-9a-f]{40}) (.+)$/);
  if(header){if(!Number.isFinite(Date.parse(header[2])))throw Error('Invalid Git commit date');commit={sha:header[1],date:header[2]};continue;}
  const id=byPath.get(item);if(id&&commit&&!Object.hasOwn(result,id))result[id]=commit;
 }
 return result;
}
export function mapReviewMarks(files,modules){
 const known=new Set(modules.map(m=>m.id)),marks=Object.create(null);let unmapped=0,invalid=0,acceptedFiles=0;
 for(const {path,data} of files){
  if(data?.format!==3||typeof data.name!=='string'||!data.marks||typeof data.marks!=='object'||Array.isArray(data.marks)){invalid++;continue;}
  acceptedFiles++;
  for(const [key,value] of Object.entries(data.marks)){
   if(!['agree','question','reject'].includes(value?.status))continue;
   const id=key.startsWith('module ')?key.slice(7):null;
   // Lexical names are not reliable fully qualified declaration identities.
   if(!id||!known.has(id)){unmapped++;continue;}
   (marks[id]??=[]).push({reviewer:data.name,reviewerId:path.split('/').at(-1).replace(/\.json$/,''),path,status:value.status,date:typeof value.date==='string'?value.date:null});
  }
 }
 return {marks,unmapped,invalid,acceptedFiles};
}
export function complexEvidence(production,c){
 const evidence=production.evidence;
 if(!evidence||evidence.version!==1||evidence.revision!==production.model.source.revision)return {activity:[],marks:[],freshness:'unknown',review:'unknown',missing:c.moduleIds.length,available:false};
 const activity=c.moduleIds.flatMap(module=>evidence.activity[module]?[{module,...evidence.activity[module]}]:[]);
 const marks=c.moduleIds.flatMap(module=>(evidence.review.marks[module]||[]).map(mark=>({module,...mark})));
 const missing=c.moduleIds.length-activity.length;
 // First-parent path activity uses commit dates, not Lean fingerprints.
 const latest=activity.reduce((best,row)=>!best||Date.parse(row.date)>Date.parse(best.date)?row:best,null);
 const age=latest?Math.floor((Date.parse(evidence.asOf)-Date.parse(latest.date))/day):NaN;
 const freshness=missing||!Number.isFinite(age)||age<0?'unknown':age<=30?'recent':age<=90?'warm':'older';
 const review=['reject','question','agree'].find(status=>marks.some(mark=>mark.status===status))||'unknown';
 return {activity,marks,latest,age,missing,freshness,review,available:true};
}
