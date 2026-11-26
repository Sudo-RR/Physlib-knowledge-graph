// Art-only projection. Never mutate the canonical allocation or module ownership.
import {parcelDistance} from './geneva-topdown-plan.js';
export const rolePatterns=Object.freeze({'data-structure':1,'relations-instances':2,'interface-definition':3,'lemmas-properties':4,provisional:0});
export function rolePattern(t){return rolePatterns[t.role]??0;}
export function breathingCity(layout,model){
 if(!layout)return layout;
 const sites=layout.sites,byId=new Map((model?.complexes||[]).map(c=>[c.id,c]));
 const boundary=new Set();
 for(const s of sites)if(sites.some(t=>t.library===s.library&&t.area!==s.area&&parcelDistance(t,s.x,s.z)<Math.hypot(s.w,s.d)/2+16))boundary.add(s.id);
 const nearBoundary=t=>{const close=sites.filter(s=>s.library===t.library&&parcelDistance(s,t.x,t.z)<Math.hypot(t.w,t.d)/2+18);return new Set(close.map(s=>s.area)).size>1;};
 const buildings=layout.buildings.map(t=>{const c=byId.get(t.complexId),b=c?.buildings.find(b=>b.id===t.id),scale=boundary.has(t.complexId)?.76:.84;return {...t,w:t.w*scale,d:t.d*scale,r:t.r*scale,basicBearing:!!c?.basicModule&&!!b?.moduleIds.includes(c.basicModule)};});
 const stations=layout.stations.map(t=>({...t,w:t.w*.84,d:t.d*.84}));
 const infill=layout.civic.infill.filter(t=>!nearBoundary(t)),decorativeTowers=layout.decorativeTowers.filter(t=>!nearBoundary(t));
 return {...layout,buildings,stations,decorativeTowers,civic:{...layout.civic,infill},breathing:{boundaryComplexes:boundary.size,removedInfill:layout.civic.infill.length-infill.length,removedDecorative:layout.decorativeTowers.length-decorativeTowers.length}};
}
