// Art-only massing study. Not source buildings, parcels or the G2 road graph.
import {masterplan,contains} from './geneva-g1-geometry.js';
const fronts=[
 ['PhyslibAlpha',70,140,570,107,2],['PhyslibAlpha',50,213,590,185,1],['PhyslibAlpha',40,293,550,265,2],['PhyslibAlpha',60,371,445,310,2],
 ['PhyslibAlpha',206,45,585,66,0],['PhyslibAlpha',140,401,390,337,1],
 ['Physlib',318,448,634,403,2],['Physlib',473,472,900,366,3],['Physlib',595,515,961,454,2],['Physlib',700,567,968,533,1],['Physlib',769,298,981,325,3],
 ['QuantumInfo',91,565,260,587,0],['QuantumInfo',147,634,611,708,1],['QuantumInfo',95,721,699,751,0],['QuantumInfo',395,613,698,678,1]
];
const rnd=seed=>{let s=seed>>>0||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};};
function segmentDistance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],d=dx*dx+dz*dz,t=d?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/d)):0;return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
export function demoMassing(plan=masterplan()){
 const towers=[],random=rnd(20261124);
 for(const [library,x0,z0,x1,z1,density] of fronts){
  const sector=plan.sectors.find(s=>s.id===library),dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len,angle=-Math.atan2(uz,ux);
  let u=9;
  while(u<len-8){
   const w=8+random()*9,d=7+random()*7,r=Math.hypot(w,d)/2+1.5,offset=11+random()*5,side=random()>.5?1:-1;
   const x=x0+ux*u-uz*offset*side,z=z0+uz*u+ux*offset*side;
   u+=w+4+random()*6;
   const safe=Array.from({length:16},(_,i)=>[x+Math.cos(i*Math.PI/8)*r,z+Math.sin(i*Math.PI/8)*r]);
   if(!safe.every(v=>contains(sector.polygon,v))||plan.shorelines.some(s=>s.some((a,i)=>i&&segmentDistance(x,z,s[i-1],a)<r+7))||plan.parks.some(p=>contains(p.polygon,[x,z])||p.polygon.some((a,i)=>segmentDistance(x,z,a,p.polygon[(i+1)%p.polygon.length])<r+3))||plan.bridges.some(b=>segmentDistance(x,z,b.a,b.b)<r+b.width/2+4)||towers.some(t=>Math.hypot(t.x-x,t.z-z)<t.r+r+2))continue;
   const h=12+density*7+Math.pow(random(),1.65)*(37+density*9),style=Math.floor(random()*5);
   towers.push({library,x,z,w,d,h,r,angle,style});
  }
 }
 return towers;
}
