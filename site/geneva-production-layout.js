// Source-backed Geneva allocation using reserved, clearance-tested civic envelopes.
// No fabricated mathematical objects. Decorative geometry remains separate.
import {masterplan,contains} from './geneva-g1-geometry.js';
import {demoMassing} from './geneva-g1-massing.js';
import {civicFabric,pointSegment} from './geneva-civic-fabric.js';
export const subjectColors={ClassicalMechanics:'#d46b50',ClassicalFieldTheory:'#b47691',CondensedMatter:'#6a9e79',Cosmology:'#8c7fbe',Electromagnetism:'#d1a74a',FluidDynamics:'#54a8c1',LatticeQFT:'#b78dbc',Optics:'#e6a166',Particles:'#b17c6a',ProbabilisticTheory:'#8ba965',QFT:'#9b79cd',QuantumMechanics:'#6595c1',Relativity:'#bb7192',SpaceAndTime:'#7894bb',StatisticalMechanics:'#a6ab64',StringTheory:'#ca91b1',Thermodynamics:'#db9356',QuantumInformation:'#5ca9a4',SharedFoundations:'#aab3bf'};
const styleFor={'data-structure':0,'relations-instances':3,'interface-definition':2,'lemmas-properties':1,provisional:4};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),stable=(a,b)=>a.localeCompare(b);
export function allocateGeneva(model,plan=masterplan(),base=demoMassing(plan),fabric=civicFabric(plan,base)){
 const sites=[],buildings=[],stations=[],boroughs=[],used=new Set(),allSlots=[...base.map((s,i)=>({...s,key:'tower:'+i,landmark:true})),...fabric.infill.map((s,i)=>({...s,key:'infill:'+i,landmark:false}))];
 for(const bank of plan.sectors){
  const cs=model.complexes.filter(c=>c.library===bank.id),pool=allSlots.filter(s=>s.library===bank.id);
  if(cs.length>pool.length)throw Error('Insufficient Geneva sites for '+bank.id+': '+cs.length+' > '+pool.length);
  const groups=new Map();for(const c of cs){if(!groups.has(c.area))groups.set(c.area,[]);groups.get(c.area).push(c);}
  const free=new Set(pool),anchors=[];
  for(const [area,items] of [...groups].sort((a,b)=>b[1].length-a[1].length||stable(a[0],b[0]))){
   const candidates=[...free];
   // Seed a subject in a high-capacity local neighbourhood, then grow
   // around that centre. Existing road/park buffers remain untouched.
   let anchor=candidates[0],best=-Infinity;
   for(const s of candidates){const near=candidates.filter(t=>dist(s,t)<95).length,separation=anchors.length?Math.min(120,...anchors.map(t=>dist(t,s))):0,score=near+separation/12+(s.landmark?2:0);if(score>best){best=score;anchor=s;}}
   anchors.push(anchor);
   const chosen=candidates.sort((a,b)=>dist(a,anchor)-dist(b,anchor)||stable(a.key,b.key)).slice(0,items.length);
   chosen.forEach(s=>free.delete(s));
   // Larger source complexes preferentially occupy larger envelopes.
   chosen.sort((a,b)=>Number(b.landmark)-Number(a.landmark)||b.w*b.d-a.w*a.d||stable(a.key,b.key));
   items.sort((a,b)=>b.sourceLines-a.sourceLines||stable(a.id,b.id));
   boroughs.push({library:bank.id,area,x:chosen.reduce((n,t)=>n+t.x,0)/chosen.length,z:chosen.reduce((n,t)=>n+t.z,0)/chosen.length,count:chosen.length,color:subjectColors[area]||subjectColors.SharedFoundations});
   for(let i=0;i<items.length;i++){
    const c=items[i],s=chosen[i];used.add(s.key);
    const site={...s,id:c.id,area:c.area,library:c.library};sites.push(site);
    const count=c.buildings.length,cols=count<=2?2:3,rows=Math.ceil((count+1)/cols),cw=s.w/cols,cd=s.d/rows;
    // Largest building first, preserving the source role ID, not its array index.
    const ordered=[...c.buildings].sort((a,b)=>b.lines-a.lines||stable(a.id,b.id));
    function cell(j){const x=((j%cols)+.5)*cw-s.w/2,z=(Math.floor(j/cols)+.5)*cd-s.d/2,cos=Math.cos(s.angle),sin=Math.sin(s.angle);return {x:s.x+cos*x+sin*z,z:s.z-sin*x+cos*z};}
    for(let j=0;j<ordered.length;j++){const b=ordered[j],w=cw*.82,d=cd*.80;
     // Monotonic source volume, not rank or mathematical importance.
     const volume=Math.max(1,b.lines),h=Math.min(94,5+9*Math.log2(1+volume/12));
     buildings.push({...cell(j),id:b.id,complexId:c.id,library:c.library,area:c.area,role:b.role,status:b.status,w,d,h,r:Math.hypot(w,d)/2,angle:s.angle,style:styleFor[b.role]??4,color:subjectColors[c.area]||subjectColors.SharedFoundations});
    }
    const st=cell(ordered.length);stations.push({...st,id:c.id+'::mathlib-station',complexId:c.id,library:c.library,area:c.area,w:cw*.68,d:cd*.68,h:2.1,angle:s.angle});
   }
  }
 }
 if(sites.length!==model.complexes.length)throw Error('Unknown library or missing complex');
 const decorativeTowers=allSlots.filter(s=>s.landmark&&!used.has(s.key)),remainingInfill=allSlots.filter(s=>!s.landmark&&!used.has(s.key));
 return {version:'geneva-source-1',source:model.source,sites,buildings,stations,boroughs,decorativeTowers,civic:{...fabric,infill:remainingInfill}};
}
export function validateAllocation(model,layout,plan=masterplan()){
 const unique=(a)=>new Set(a.map(x=>x.id)).size===a.length;
 if(!unique(layout.sites)||!unique(layout.buildings)||!unique(layout.stations))throw Error('Duplicate semantic identity');
 const sites=new Map(layout.sites.map(x=>[x.id,x])),buildings=new Map(layout.buildings.map(x=>[x.id,x])),stations=new Map(layout.stations.map(x=>[x.complexId,x]));
 if(sites.size!==model.complexes.length||stations.size!==sites.size||buildings.size!==model.complexes.reduce((n,c)=>n+c.buildings.length,0))throw Error('Incomplete source allocation');
 for(const c of model.complexes){
  const s=sites.get(c.id),bank=plan.sectors.find(b=>b.id===c.library);if(!s||s.library!==c.library||s.area!==c.area||!contains(bank.polygon,[s.x,s.z]))throw Error('Wrong complex bank/subject');
  const pieces=[...c.buildings.map(b=>{const p=buildings.get(b.id);if(!p||p.complexId!==c.id||p.role!==b.role)throw Error('Missing role '+b.id);return p;}),stations.get(c.id)];
  for(const t of pieces){const dx=t.x-s.x,dz=t.z-s.z,cos=Math.cos(s.angle),sin=Math.sin(s.angle),u=cos*dx-sin*dz,v=sin*dx+cos*dz;if(Math.abs(u)+t.w*.56>s.w/2+1e-6||Math.abs(v)+t.d*.56>s.d/2+1e-6)throw Error('Footprint outside reserved site '+c.id);}
  for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++){const a=pieces[i],b=pieces[j],dx=a.x-b.x,dz=a.z-b.z,u=Math.abs(Math.cos(s.angle)*dx-Math.sin(s.angle)*dz),v=Math.abs(Math.sin(s.angle)*dx+Math.cos(s.angle)*dz);if(u<(a.w+b.w)*.54-1e-6&&v<(a.d+b.d)*.54-1e-6)throw Error('Role footprint overlap '+c.id);}
 }
 return {complexes:sites.size,buildings:buildings.size,stations:stations.size,boroughs:layout.boroughs.length};
}
