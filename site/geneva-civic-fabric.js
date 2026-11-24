// Civic layer for the illustrative Geneva city. No Lean identities or edges.
import {masterplan,contains} from './geneva-g1-geometry.js';
import {demoMassing} from './geneva-g1-massing.js';
const STEP=8,ROAD=5,HALF=ROAD/2;
const random=(x,z,s=0)=>{let h=Math.imul(Math.floor(x*17)+s,73856093)^Math.imul(Math.floor(z*19)-s,19349663);h=Math.imul(h^(h>>>16),0x45d9f3b);return (h>>>0)/4294967296;};
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function pointSegment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l)):0;return distance(p,[a[0]+t*dx,a[1]+t*dy]);}
const edges=p=>p.map((a,i)=>[a,p[(i+1)%p.length]]);
const boundaryDistance=(p,poly)=>Math.min(...edges(poly).map(([a,b])=>pointSegment(p,a,b)));
function landClear(plan,sector,p,r){return contains(sector.polygon,p)&&boundaryDistance(p,sector.polygon)>=r&&plan.parks.every(k=>!contains(k.polygon,p)&&boundaryDistance(p,k.polygon)>=r);}
function towerClear(towers,p,r){return towers.every(t=>distance(p,[t.x,t.z])>=t.r+r);}
function safeSegment(a,b,test){const steps=Math.max(1,Math.ceil(distance(a,b)/2));for(let i=0;i<=steps;i++){const f=i/steps;if(!test([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]))return false;}return true;}
export function civicFabric(plan=masterplan(),towers=demoMassing(plan)){
 const roads=[],infill=[],trees=[],plazas=[],diagnostics=[];
 const key=(i,j)=>i+','+j;
 for(const sector of plan.sectors){
  const st=towers.filter(t=>t.library===sector.id),nodes=new Map(),links=new Map(),used=new Set();
  const clear=(p,r=HALF+.45)=>landClear(plan,sector,p,r)&&towerClear(st,p,r);
  for(let i=1;i<plan.frame.width/STEP;i++)for(let j=1;j<plan.frame.height/STEP;j++){
   const p=[i*STEP+(random(i,j,4)-.5)*3,j*STEP+(random(i,j,8)-.5)*3];
   if(clear(p))nodes.set(key(i,j),{id:key(i,j),i,j,p});
  }
  for(const n of nodes.values()){const adj=[];for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const m=nodes.get(key(n.i+di,n.j+dj));if(m&&safeSegment(n.p,m.p,clear))adj.push(m.id);}links.set(n.id,adj);}
  // Largest connected routable component; bridge approaches must reach it.
  const unseen=new Set(nodes.keys()),components=[];
  while(unseen.size){const first=unseen.values().next().value,component=[first];unseen.delete(first);for(let i=0;i<component.length;i++)for(const k of links.get(component[i]))if(unseen.delete(k))component.push(k);components.push(component);}
  components.sort((a,b)=>b.length-a.length);const main=components[0]||[],mainSet=new Set(main);
  if(!main.length){diagnostics.push(sector.id+': no routable component');continue;}
  const nearest=(p,predicate=()=>true)=>{let best=null,d=Infinity;for(const id of main){const n=nodes.get(id),v=distance(n.p,p);if(v<d&&predicate(n)){d=v;best=n;}}return best;};
  const added=new Set();
  function road(a,b,kind='local',width=ROAD){if(distance(a,b)<.01)return;const id=[a.join(','),b.join(',')].sort().join('|');if(added.has(id))return;added.add(id);roads.push({library:sector.id,a,b,width,kind});}
  function connect(start,goal=null,kind='local'){
   if(!start||!mainSet.has(start.id))return false;
   if(!used.size){used.add(start.id);return true;}
   if(!goal&&used.has(start.id))return true;
   const queue=[start.id],prev=new Map([[start.id,null]]);let end=null;
   for(let i=0;i<queue.length;i++){const id=queue[i];if(goal?id===goal.id:used.has(id)){end=id;break;}for(const n of links.get(id)){if(!prev.has(n)){prev.set(n,id);queue.push(n);}}}
   if(end===null)return false;
   for(let at=end;at!==null;){used.add(at);const before=prev.get(at);if(before!==null)road(nodes.get(at).p,nodes.get(before).p,kind);at=before;}return true;
  }
  const landings=plan.bridges.filter(b=>b.from===sector.id||b.to===sector.id).map(b=>({id:b.id,p:b.from===sector.id?b.a:b.b}));
  for(const l of landings){const n=nearest(l.p,n=>safeSegment(l.p,n.p,clear));if(!n){diagnostics.push('Unconnected bridge '+l.id+' '+sector.id);continue;}connect(n,null,'arterial');road(l.p,n.p,'approach');}
  // Build long connected corridors first, using an irregular coarse lattice of targets.
  for(let y=25;y<plan.frame.height;y+=47)for(let x=25;x<plan.frame.width;x+=52){
   const q=[x+(random(x,y,21)-.5)*22,y+(random(x,y,13)-.5)*22];if(!contains(sector.polygon,q))continue;const n=nearest(q);if(n&&distance(n.p,q)<32)connect(n);
  }
  // Add short cycle closures to avoid a tree of cul-de-sacs.
  for(const id of [...used]){const n=nodes.get(id);if(random(n.i,n.j,9)>.18)continue;const adjacent=links.get(id).filter(k=>used.has(k));for(const k of adjacent)road(n.p,nodes.get(k).p,'local');}
  // Add street access near existing towers where there is a safe route.
  for(const t of st){const n=nearest([t.x,t.z]);if(n&&distance(n.p,[t.x,t.z])<t.r+24)connect(n);}
  const bankRoads=roads.filter(r=>r.library===sector.id);
  const roadDist=p=>Math.min(Infinity,...bankRoads.map(e=>pointSegment(p,e.a,e.b)-e.width/2));
  const occupied=[];
  const free=(p,r)=>landClear(plan,sector,p,r)&&towerClear(st,p,r+1)&&roadDist(p)>=r+1&&plan.bridges.every(b=>pointSegment(p,b.a,b.b)>r+b.width/2+1)&&occupied.every(o=>distance(p,o.p)>o.r+r+1);
  // Low-rise street-front infill. Jittered candidates, not a uniform extra tower grid.
  for(let z=8;z<plan.frame.height;z+=10)for(let x=8;x<plan.frame.width;x+=10){
   const p=[x+(random(x,z,31)-.5)*7,z+(random(x,z,32)-.5)*7],d=roadDist(p);if(d<4||d>17||random(x,z,33)<.21)continue;
   const w=4.8+random(x,z,34)*5.2,h=3.5+random(x,z,35)*11,dpth=4.5+random(x,z,36)*4,r=Math.hypot(w,dpth)/2+.65;
   if(!free(p,r))continue;let near=null,best=Infinity;for(const e of bankRoads){const dd=pointSegment(p,e.a,e.b);if(dd<best){best=dd;near=e;}}if(!near)continue;
   const angle=-Math.atan2(near.b[1]-near.a[1],near.b[0]-near.a[0]);occupied.push({p,r});infill.push({library:sector.id,x:p[0],z:p[1],w,d:dpth,h,r,angle,style:Math.floor(random(x,z,37)*5)});
  }
  // Landscaped pocket squares in the remaining open block interiors.
  for(let z=18;z<plan.frame.height;z+=34)for(let x=18;x<plan.frame.width;x+=37){
   const p=[x+(random(x,z,41)-.5)*17,z+(random(x,z,42)-.5)*17],r=5+random(x,z,43)*5;if(roadDist(p)>21||!free(p,r)||random(x,z,44)>.5)continue;
   occupied.push({p,r});plazas.push({library:sector.id,x:p[0],z:p[1],r,kind:random(x,z,45)>.45?'garden':'square'});
  }
  // Street trees and remaining green space. Trees deliberately smaller than buildings.
  for(let z=8;z<plan.frame.height;z+=13)for(let x=8;x<plan.frame.width;x+=13){
   const p=[x+(random(x,z,51)-.5)*9,z+(random(x,z,52)-.5)*9],r=1.5+random(x,z,53)*1.4;
   if(!free(p,r)||roadDist(p)>30||random(x,z,54)>.65)continue;occupied.push({p,r});trees.push({x:p[0],z:p[1],r,h:3.5+random(x,z,55)*4});
  }
 }
 // Park trees: keep protected spaces green rather than built over.
 for(const park of plan.parks){const xs=park.polygon.map(p=>p[0]),zs=park.polygon.map(p=>p[1]);for(let x=Math.min(...xs)+5;x<Math.max(...xs);x+=10)for(let z=Math.min(...zs)+5;z<Math.max(...zs);z+=10){const p=[x+(random(x,z,61)-.5)*5,z+(random(x,z,62)-.5)*5],r=2+random(x,z,63);if(contains(park.polygon,p)&&boundaryDistance(p,park.polygon)>r+1)trees.push({x:p[0],z:p[1],r,h:5+random(x,z,64)*4});}}
 return {roads,infill,trees,plazas,diagnostics};
}
