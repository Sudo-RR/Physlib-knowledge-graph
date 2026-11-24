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
export function genevaLayout(complexes){
 const groups=sectorSpecs.map(spec=>({...spec,complexes:complexes.filter(c=>c.library===spec.library).sort((a,b)=>stable(a.area,b.area)||stable(a.id,b.id))}));
 if(groups.reduce((n,g)=>n+g.complexes.length,0)!==complexes.length)throw Error('Unknown source library in Geneva layout');
 const total=complexes.length,columns=Math.max(3,Math.ceil(Math.sqrt(Math.max(1,total)*1.5)));
 for(const g of groups){g.cols=Math.max(1,Math.min(columns,Math.ceil(Math.sqrt(Math.max(1,g.complexes.length)*2.2))));g.rows=Math.ceil(g.complexes.length/g.cols);}
 const width=Math.max(600,...groups.map(g=>g.cols*PITCH))+260;
 const core=width/2-80, confluence=-width/2-180;
 const rhone=x=>-width*.07*Math.sin(x/width*2.8)+24*Math.sin(x/width*8.4)-.035*x;
 const mainRows=Math.max(1,groups[1].rows);
 const gap=RHONE+ARVE+2*QUAY+2*SETBACK+(mainRows-1)*PITCH+50;
 const arve=x=>rhone(x)+gap*Math.max(0,Math.min(1,(x-confluence)/(confluence*-1-core))) *(1+.065*Math.sin(x/width*5)/Math.max(1,mainRows)) + Math.max(0,x-core)*.22;
 // A lake-like widening at the eastern edge, beyond the developed core.
 const rhoneWidth=x=>RHONE+Math.max(0,x-core-30)*.28;
 const arveWidth=x=>ARVE+5*Math.sin(x/width*4);
 const places=new Map(),streets=[],sectors=[],boroughs=[];
 for(const [si,g] of groups.entries()){
  const shift=si===2?width*.11:si===0?-width*.035:width*.02;
  const left=shift-(g.cols-1)*PITCH/2;
  const grid=[];
  g.complexes.forEach((c,i)=>{
   const row=Math.floor(i/g.cols),col=row%2?g.cols-1-i%g.cols:i%g.cols;
   const x=left+col*PITCH+(hash(c.id)-.5)*14+(row%2?7:-7);
   const bank=si===2?arve(x)+arveWidth(x):rhone(x)+(si===0?-rhoneWidth(x):rhoneWidth(x));
   const z=bank+(si===0?-1:1)*(QUAY+SETBACK+row*PITCH)+(hash(c.id+'z')-.5)*14;
   const p={id:c.id,area:c.area,library:c.library,x,z,row,col};
   places.set(c.id,p);grid.push(p);
  });
  const roadPoint=p=>({x:p.x-43,z:p.z-41});
  // Row streets and adjacent-row avenues. No street is a dependency.
  for(const p of grid)for(const q of grid){
   if((p.row===q.row&&q.col===p.col+1)||(q.row===p.row+1&&p.col===q.col)){
    const a=roadPoint(p),b=roadPoint(q);
    streets.push({a,b,width:p.row===q.row?10:8});
   }
  }
  // A continuous quayside spine connects every occupied column to the river.
  const bankName=si===2?'arve':'rhone',side=si===0?-1:1;
  const bankZ=x=>(bankName==='arve'?arve(x)+arveWidth(x):rhone(x)+side*rhoneWidth(x))+side*QUAY;
  for(const p of grid.filter(p=>p.row===0)){const a=roadPoint(p);streets.push({a,b:{x:a.x,z:bankZ(a.x)},width:10});}
  if(si===1){
   // Southern quay access: run from the last occupied plot in each column.
   const last=new Map();for(const p of grid)if(!last.has(p.col)||last.get(p.col).row<p.row)last.set(p.col,p);
   for(const p of last.values()){const a=roadPoint(p);streets.push({a,b:{x:a.x,z:arve(a.x)-arveWidth(a.x)-QUAY},width:9});}
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
