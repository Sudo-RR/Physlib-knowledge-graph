import {contains} from './geneva-g1-geometry.js';
import {pointSegment} from './geneva-civic-fabric.js';
// Monotone display transformation. Raw source height is retained separately.
export function architecturalHeight(h){return 2.7+27*Math.pow(Math.max(0,h-5)/89,2);}
export function architecturalLayout(layout){
 if(!layout)return layout;
 return {...layout,buildings:layout.buildings.map(b=>({...b,sourceHeight:b.h,h:architecturalHeight(b.h)}))};
}
const rng=(x,z,s)=>{let h=Math.imul(x+71,73856093)^Math.imul(z+19,19349663)^Math.imul(s,83492791);h=Math.imul(h^(h>>>16),0x45d9f3b);return (h>>>0)/4294967296;};
const edges=poly=>poly.map((a,i)=>[a,poly[(i+1)%poly.length]]);
// Dense, neutral urban lots; deliberately non-semantic. Spatial index keeps
// clearance checks cheap and avoids altering reserved source parcels.
export function urbanInfill(plan,layout,civic){
 const cell=16,grid=new Map();
 function put(x,z,r){for(let i=Math.floor((x-r)/cell);i<=Math.floor((x+r)/cell);i++)for(let j=Math.floor((z-r)/cell);j<=Math.floor((z+r)/cell);j++){const k=i+','+j;if(!grid.has(k))grid.set(k,[]);grid.get(k).push({x,z,r});}}
 function clear(x,z,r){for(let i=Math.floor((x-r)/cell);i<=Math.floor((x+r)/cell);i++)for(let j=Math.floor((z-r)/cell);j<=Math.floor((z+r)/cell);j++)for(const o of grid.get(i+','+j)||[])if(Math.hypot(o.x-x,o.z-z)<o.r+r)return false;return true;}
 for(const t of [...layout.sites,...layout.decorativeTowers,...civic.infill])put(t.x,t.z,Math.max(t.r||0,Math.hypot(t.w,t.d)*.57)+.8);
 for(const t of civic.trees)put(t.x,t.z,t.r+.4);for(const t of civic.plazas)put(t.x,t.z,t.r+1);
 for(const r of [...civic.roads,...plan.bridges]){const dx=r.b[0]-r.a[0],dz=r.b[1]-r.a[1],n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/2));for(let i=0;i<=n;i++)put(r.a[0]+dx*i/n,r.a[1]+dz*i/n,r.width/2+1);}
 const extra=[],bankEdges=new Map(plan.sectors.map(s=>[s.id,edges(s.polygon)])),parks=plan.parks.map(p=>({polygon:p.polygon,edges:edges(p.polygon)}));
 for(let z=5;z<plan.frame.height;z+=7)for(let x=5;x<plan.frame.width;x+=7){
  const px=x+(rng(x,z,1)-.5)*3,pz=z+(rng(x,z,2)-.5)*3,w=3.8+rng(x,z,3)*3,d=3.4+rng(x,z,4)*3,r=Math.hypot(w,d)*.57+.6;
  if(rng(x,z,5)<.20||!clear(px,pz,r))continue;
  const q=[px,pz],bank=plan.sectors.find(s=>contains(s.polygon,q));
  if(!bank||bankEdges.get(bank.id).some(([a,b])=>pointSegment(q,a,b)<r))continue;
  if(parks.some(p=>contains(p.polygon,q)||p.edges.some(([a,b])=>pointSegment(q,a,b)<r)))continue;
  const h=2.3+Math.pow(rng(x,z,6),2)*9;
  extra.push({library:bank.id,x:px,z:pz,w,d,h,r,angle:0,style:Math.floor(rng(x,z,7)*5),decorative:true});put(px,pz,r);
 }
 return extra;
}
