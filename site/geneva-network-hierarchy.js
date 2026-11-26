// Presentation-only aggregation over existing directed complex edges.
import {networkRows} from './geneva-beam-network.js';
export const networkLimits=Object.freeze({macro:20,macroUtility:24,meso:40,mesoUtility:80,microDirection:14});
const district=t=>String(t.library||'')+'|'+t.area;
const cmp=(a,b)=>a.localeCompare(b);
export function networkScope(layout,{zoom=1,focusX=0,focusZ=0,filter='all',selected=null,declaration=false}={}){
 if(selected)return {level:declaration?'declaration':'micro',district:null};
 if(!layout||zoom<2.4&&filter==='all')return {level:'macro',district:null};
 const nearest=[...layout.sites].filter(t=>filter==='all'||t.area===filter).sort((a,b)=>Math.hypot(a.x-focusX-500,a.z-focusZ-400)-Math.hypot(b.x-focusX-500,b.z-focusZ-400)||cmp(a.id,b.id))[0];
 return {level:'meso',district:nearest?district(nearest):null};
}
export function networkProjection(model,layout,{filter='all',channel='both',selected=null,scope={level:'macro',district:null}}={}){
 const all=networkRows(model,layout,filter,channel,selected),sky=all.filter(r=>!r.utility),utilities=all.filter(r=>r.utility),sites=new Map((layout?.sites||[]).map(t=>[t.id,t]));
 const endpoints=r=>[district(sites.get(r.from.complexId||r.from.id)||r.from),district(sites.get(r.to.complexId||r.to.id)||r.to)];
 const byDist=new Map();for(const b of layout?.buildings||[]){const k=district(b);if(!byDist.has(k))byDist.set(k,[]);byDist.get(k).push(b);}
 const gateways=new Map();function gateway(k,fallback){if(!gateways.has(k)){const bs=byDist.get(k)||[fallback],x=bs.reduce((v,b)=>v+b.x,0)/bs.length,z=bs.reduce((v,b)=>v+b.z,0)/bs.length;gateways.set(k,[...bs].sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z)||cmp(a.id,b.id))[0]);}return gateways.get(k);}
 let rows=[],local=[],internal=0,groups=0;
 if(scope.level==='macro'){
  const bundles=new Map();
  for(const row of sky){const [a,b]=endpoints(row);if(a===b){internal++;continue;}const [lo,hi]=[a,b].sort(cmp),id=JSON.stringify([lo,hi]);if(!bundles.has(id))bundles.set(id,{id:'district:'+id,from:gateway(lo,a===lo?row.from:row.to),to:gateway(hi,b===hi?row.to:row.from),key:'aggregate',aggregate:true,focused:false,utility:false,districts:[lo,hi],members:[],forward:0,reverse:0});const g=bundles.get(id);g.members.push(row.id);if(a===lo)g.forward++;else g.reverse++;}
  groups=bundles.size;rows=[...bundles.values()].sort((a,b)=>b.members.length-a.members.length||cmp(a.id,b.id)).slice(0,networkLimits.macro);
  // Overview keeps a sparse sample of actual utility routes (one per station).
  // All stations retain their beacons, even when their paths are not drawn.
  const seen=new Set();local=[...utilities].sort((a,b)=>cmp(a.id,b.id)).filter(r=>{if(seen.has(r.to.id))return false;seen.add(r.to.id);return true;}).slice(0,networkLimits.macroUtility);
 }else if(scope.level==='meso'){
  rows=sky.filter(r=>endpoints(r).includes(scope.district)).sort((a,b)=>{const ai=endpoints(a).every(k=>k===scope.district),bi=endpoints(b).every(k=>k===scope.district);return Number(bi)-Number(ai)||Math.hypot(a.from.x-a.to.x,a.from.z-a.to.z)-Math.hypot(b.from.x-b.to.x,b.from.z-b.to.z)||cmp(a.id,b.id);}).slice(0,networkLimits.meso);
  local=utilities.filter(r=>district(r.from)===scope.district).sort((a,b)=>cmp(a.id,b.id)).slice(0,networkLimits.mesoUtility);
 }else{
  if(scope.level==='micro')for(const direction of ['out','in'])rows.push(...sky.filter(r=>r.focused&&r.key===direction).slice(0,networkLimits.microDirection));
  local=utilities.filter(r=>r.focused);
 }
 const represented=rows.reduce((n,r)=>n+(r.members?.length||1),0);
 return {rows:[...rows,...local],stats:{level:scope.level,district:scope.district,skyTotal:sky.length,skyRepresented:represented,skyHidden:sky.length-represented,skyRoutes:rows.length,internal,groups,utilityTotal:utilities.length,utilityShown:local.length}};
}
export function networkSummary(s){return (s.level==='macro'?'City · '+s.skyRoutes+' aggregate corridors':s.level==='meso'?'District · '+(s.district||'none').split('|').at(-1)+' · '+s.skyRoutes+' local links':s.level==='declaration'?'Declaration · module skywalks hidden':'Complex · '+s.skyRoutes+' incident links')+' · '+s.skyRepresented+'/'+s.skyTotal+' complex edges represented · '+s.skyHidden+' hidden · '+s.utilityShown+'/'+s.utilityTotal+' utility routes';}
