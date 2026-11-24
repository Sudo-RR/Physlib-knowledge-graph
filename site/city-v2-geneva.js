// Stylised Geneva geography, not GIS data. North = negative Z.
// Canonical complex IDs, library provenance and graph edges are unchanged.
export const sectorSpecs=[
 {library:'PhyslibAlpha',name:'Rive Droite',subtitle:'PhyslibAlpha'},
 {library:'Physlib',name:'Rive Gauche',subtitle:'Physlib'},
 {library:'QuantumInfo',name:'Outre-Arve',subtitle:'QuantumInfo'}
];
const PITCH=148, RHONE=38, ARVE=28, QUAY=22, SETBACK=86;
const stable=(a,b)=>a.localeCompare(b);
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return (h>>>0)/4294967295;};
// Seeded dart throwing with a spatial index. Subject clusters grow into the
// sampled sites instead of occupying rectangular row-major blocks.
function rng(seed){let x=(Math.floor(hash(seed)*4294967295)>>>0)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
export function genevaLayout(complexes,{seed='geneva-1'}={}){
 const groups=sectorSpecs.map(spec=>({...spec,complexes:complexes.filter(c=>c.library===spec.library).sort((a,b)=>stable(a.area,b.area)||stable(a.id,b.id))}));
 if(groups.reduce((n,g)=>n+g.complexes.length,0)!==complexes.length)throw Error('Unknown source library in Geneva layout');
 const total=complexes.length,columns=Math.max(3,Math.ceil(Math.sqrt(Math.max(1,total)*1.5)));
 for(const g of groups){g.cols=Math.max(1,Math.min(columns,Math.ceil(Math.sqrt(Math.max(1,g.complexes.length)*2.2))));g.rows=Math.ceil(g.complexes.length/g.cols);}
 const width=Math.max(600,...groups.map(g=>g.cols*PITCH*1.25))+440;
 const core=width/2-80, confluence=-width/2-180;
 const rhone=x=>-width*.07*Math.sin(x/width*2.8)+24*Math.sin(x/width*8.4)-.035*x;
 const mainRows=Math.max(1,groups[1].rows);
 const depthFor=g=>Math.max(90,(g.rows-1)*PITCH*2.35+105);
 const gap=RHONE+ARVE+2*QUAY+2*SETBACK+depthFor(groups[1])+110;
 const arve=x=>rhone(x)+gap*Math.max(0,Math.min(1,(x-confluence)/(confluence*-1-core))) *(1+.065*Math.sin(x/width*5)/Math.max(1,mainRows)) + Math.max(0,x-core)*.22;
 // A lake-like widening at the eastern edge, beyond the developed core.
 const rhoneWidth=x=>RHONE+Math.max(0,x-core-30)*.28;
 const arveWidth=x=>ARVE+5*Math.sin(x/width*4);
 const places=new Map(),streets=[],sectors=[],boroughs=[];
 for(const [si,g] of groups.entries()){
  const shift=si===2?width*.07:si===0?-width*.025:width*.015;
  const span=Math.max(80,(g.cols-1)*PITCH*1.25+100),depth=depthFor(g);
  const left=Math.max(-width/2+110,shift-span/2),right=Math.min(core-35,shift+span/2);
  const random=rng(seed+'|'+g.library),samples=[],bins=new Map(),clearance=136;
  const bankZ=x=>si===2?arve(x)+arveWidth(x)+QUAY:rhone(x)+(si===0?-1:1)*(rhoneWidth(x)+QUAY);
  function fits(x,z){
   for(const sx of [x-64,x,x+64]){
    const n=rhone(sx)-rhoneWidth(sx),r=rhone(sx)+rhoneWidth(sx),a=arve(sx)-arveWidth(sx),b=arve(sx)+arveWidth(sx);
    if((si===0?n-z-64:si===1?Math.min(z-64-r,a-z-64):z-64-b)<6)return false;
   }
   const ix=Math.floor(x/clearance),iz=Math.floor(z/clearance);
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const p of bins.get((ix+dx)+','+(iz+dz))||[])if(Math.abs(x-p.x)<clearance&&Math.abs(z-p.z)<clearance)return false;
   return true;
  }
  for(let attempt=0;samples.length<g.complexes.length&&attempt<Math.max(10000,g.complexes.length*1200);attempt++){
   const x=left+random()*(right-left),t=random()*depth,z=bankZ(x)+(si===0?-1:1)*(SETBACK+t);
   if(!fits(x,z))continue;
   const p={x,z,t};samples.push(p);
   const k=Math.floor(x/clearance)+','+Math.floor(z/clearance);if(!bins.has(k))bins.set(k,[]);bins.get(k).push(p);
  }
  if(samples.length!==g.complexes.length)throw Error('Unable to fit irregular plots for '+g.library);
  const subjects=new Map();for(const c of g.complexes){if(!subjects.has(c.area))subjects.set(c.area,[]);subjects.get(c.area).push(c);}
  const free=new Set(samples),grid=[];
  for(const [area,cs] of [...subjects].sort((a,b)=>b[1].length-a[1].length||stable(a[0],b[0]))){
   const pool=[...free],anchor=pool[Math.floor(random()*pool.length)];
   const ranked=pool.sort((a,b)=>Math.hypot(a.x-anchor.x,a.z-anchor.z)-Math.hypot(b.x-anchor.x,b.z-anchor.z));
   cs.forEach((c,i)=>{const q=ranked[i];free.delete(q);const p={id:c.id,area,library:c.library,x:q.x,z:q.z,t:q.t};places.set(c.id,p);grid.push(p);});
  }
  const roadPoint=p=>({x:p.x-43,z:p.z-41});
  // The local road network grows from nearby sites, not a rectangular grid.
  const connections=new Set(),link=(i,j,width=9)=>{const k=Math.min(i,j)+':'+Math.max(i,j);if(connections.has(k))return;connections.add(k);streets.push({a:roadPoint(grid[i]),b:roadPoint(grid[j]),width});};
  const dist=(p,q)=>Math.hypot(p.x-q.x,p.z-q.z);
  if(grid.length){
   const seen=new Set([0]),best=grid.map((p,i)=>({i:0,d:i?dist(p,grid[0]):0}));
   while(seen.size<grid.length){let j=-1;for(let i=0;i<grid.length;i++)if(!seen.has(i)&&(j<0||best[i].d<best[j].d))j=i;
    link(best[j].i,j,10);seen.add(j);
    for(let i=0;i<grid.length;i++)if(!seen.has(i)){const d=dist(grid[i],grid[j]);if(d<best[i].d)best[i]={i:j,d};}
   }
   // Select a few short cross-streets to create loops rather than a pure tree.
   for(let i=0;i<grid.length;i++){const nearest=grid.map((p,j)=>({j,d:dist(p,grid[i])})).filter(q=>q.j!==i).sort((a,b)=>a.d-b.d).slice(0,2);for(const q of nearest)if(q.d<245&&hash(seed+'|'+grid[i].id+'|'+grid[q.j].id)>.28)link(i,q.j,8);}
   const quays=[...grid].sort((a,b)=>a.t-b.t).slice(0,Math.max(1,Math.ceil(Math.sqrt(grid.length))));
   for(const p of quays){const a=roadPoint(p);streets.push({a,b:{x:a.x,z:bankZ(a.x)},width:10});}
   if(si===1){const p=[...grid].sort((a,b)=>b.t-a.t)[0],a=roadPoint(p);streets.push({a,b:{x:a.x,z:arve(a.x)-arveWidth(a.x)-QUAY},width:9});}
  }
  const avg=grid.length?{x:grid.reduce((n,p)=>n+p.x,0)/grid.length,z:grid.reduce((n,p)=>n+p.z,0)/grid.length}:{x:shift,z:si===0?rhone(shift)-150:si===1?(rhone(shift)+arve(shift))/2:arve(shift)+150};
  sectors.push({library:g.library,name:g.name,subtitle:g.subtitle,...avg,count:grid.length});
  const areas=new Map();for(const p of grid){if(!areas.has(p.area))areas.set(p.area,[]);areas.get(p.area).push(p);}
  for(const [area,ps] of areas){const minX=Math.min(...ps.map(p=>p.x))-64,maxX=Math.max(...ps.map(p=>p.x))+64,minZ=Math.min(...ps.map(p=>p.z))-64,maxZ=Math.max(...ps.map(p=>p.z))+64;boroughs.push({area,library:g.library,x:(minX+maxX)/2,z:(minZ+maxZ)/2,w:maxX-minX,d:maxZ-minZ});}
 }
 const bridges=[];
 for(const fraction of [-.29,.04,.31]){
  const x=width*fraction;bridges.push({river:'Rhône',x,z1:rhone(x)-rhoneWidth(x)-QUAY,z2:rhone(x)+rhoneWidth(x)+QUAY,width:15});
 }
 for(const fraction of [-.08,.28]){
  const x=width*fraction;bridges.push({river:'Arve',x,z1:arve(x)-arveWidth(x)-QUAY,z2:arve(x)+arveWidth(x)+QUAY,width:13});
 }
 const points=[...places.values()];
 const minX=Math.min(confluence-100,...points.map(p=>p.x-80)),maxX=Math.max(width/2+220,...points.map(p=>p.x+80));
 const minZ=Math.min(-200,...points.map(p=>p.z-80)),maxZ=Math.max(gap+200,...points.map(p=>p.z+80));
 const center={x:(minX+maxX)/2,z:(minZ+maxZ)/2};
 return {places,boroughs,sectors,streets,bridges,width,core,confluence,rhone,arve,rhoneWidth,arveWidth,center,maxX:maxX-minX,maxZ:maxZ-minZ,minX,minZ,extentX:maxX,extentZ:maxZ};
}
