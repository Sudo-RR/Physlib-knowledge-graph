// Orthographic LOD policy. World-space grouping never changes semantic IDs.
export const detailThreshold={low:2.5,medium:1.65,high:1.15};
export function districtKey(t){return t.area?JSON.stringify([t.library||'',t.area]):'civic';}
export function districtBounds(towers){
 const result=new Map();
 for(const t of towers){
  const k=districtKey(t),b=result.get(k)||{minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity};
  b.minX=Math.min(b.minX,t.x);b.maxX=Math.max(b.maxX,t.x);
  b.minZ=Math.min(b.minZ,t.z);b.maxZ=Math.max(b.maxZ,t.z);result.set(k,b);
 }
 return result;
}
export function distanceToBounds(x,z,b){
 return Math.hypot(Math.max(b.minX-x,0,x-b.maxX),Math.max(b.minZ-z,0,z-b.maxZ));
}
export function detailPlan(bounds,{mode='auto',quality='medium',pixelsPerUnit,focusX,focusZ,viewRadius,selectedKey=null}){
 const detail=new Set();
 if(mode==='full')return {detail:new Set(bounds.keys()),civicDetail:true};
 const threshold=detailThreshold[quality]??detailThreshold.medium;
 if(!Number.isFinite(pixelsPerUnit)||pixelsPerUnit<=0)return {detail,civicDetail:false};
 for(const [key,b] of bounds){
  const selected=key===selectedKey;
  if(pixelsPerUnit>=(selected?threshold*.75:threshold)&&distanceToBounds(focusX,focusZ,b)<=viewRadius)detail.add(key);
 }
 return {detail,civicDetail:pixelsPerUnit>=threshold};
}
