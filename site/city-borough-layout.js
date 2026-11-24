import {metropolisManifest} from './city-metropolis.js';
import {chromaticManifest} from './city-chromatic-layout.js';
import {atomicPlan,atomicBounds} from './city-atomic-plan.js';
import {buildHierarchy,surfaceRoots} from './city-hierarchy.js';
import {buildingStyle,roofStyle} from './city-art.js';
import {buildFloorIndex} from './city-floors.js';

export const planning=Object.freeze({minBuildingGap:4,relativeGap:1,streetClearance:5,orbitClearance:3,heightSetback:.25,skywalkRightOfWay:2,pipeRightOfWay:1.5,landscapeSetback:3,riverbankSetback:12,riverWidth:100,parcelMargin:12,districtGap:24,courtyardVariation:.6});
export const rectangle=(x,z,w,d)=>({minX:x,minZ:z,maxX:x+w,maxZ:z+d});
export const overlaps=(a,b,t=1e-6)=>a.minX<b.maxX-t&&a.maxX>b.minX+t&&a.minZ<b.maxZ-t&&a.maxZ>b.minZ+t;
const translated=(b,x,z)=>({minX:b.minX+x,maxX:b.maxX+x,minZ:b.minZ+z,maxZ:b.maxZ+z});
export function decorativeEnvelope(id,height){const s=buildingStyle(id);return {width:s.width+1.6,depth:s.depth+1.6,height:height+1.2};}

/** Shelf packing preserves sorted local rows; growth expands parcels, never squeezes buildings. */
function shelves(items,gap,minWidth=0){
 const target=Math.ceil(Math.max(minWidth,Math.sqrt(items.reduce((n,i)=>n+(i.w+gap)*(i.d+gap),0))*1.18,...items.map(i=>i.w))/64)*64;
 let x=0,z=0,row=0,w=0;const placements=[];
 for(const item of items){if(x&&x+item.w>target){z+=row+gap;x=0;row=0;}placements.push({...item,x,z});x+=item.w+gap;row=Math.max(row,item.d);w=Math.max(w,x-gap);}
 return {w:Math.max(minWidth,w),d:z+row,placements};
}
export function createBoroughManifest(city,{floors=buildFloorIndex(city.nodes),config={},visual=null,concept='campus',composition='vivid'}={}){
 const skyline=visual==='c4',chromatic=['c2','c3','c4'].includes(visual),atomic=['c1','c2','c3','c4'].includes(visual),p={...planning,...(atomic?{relativeGap:.35,heightSetback:.08,parcelMargin:9,districtGap:16}:{}),...config},hierarchy=buildHierarchy(city.nodes),nodes=new Map(city.nodes.map(n=>[n.id,n]));
 const modules={},parcels=[],corridors=[],chunks=[],boroughs=[],rivers=[],crossings=[];
 let surfaceHeight=Math.max(5,...city.nodes.filter(n=>n.library!=='Mathlib').map(n=>floors.get(n.id).height+1.2));
 function measure(dir){
  const items=dir.children.map(c=>({id:c.id,dir:c,...measure(c)}));
  if(dir.files.length){
   const specs=dir.files.map(id=>{const rawHeight=floors.get(id).height,plan=atomic?atomicPlan(nodes.get(id),rawHeight,skyline?'skyscraper':concept):null,height=plan?.height??rawHeight,s=plan?{width:plan.width,depth:plan.depth}:buildingStyle(id),d=plan?(chromatic?{width:Math.max(plan.width,plan.depth)*1.35+2,depth:Math.max(plan.width,plan.depth)*1.35+2,height:plan.height+1.8}:atomicBounds(plan)):decorativeEnvelope(id,height),gap=Math.max(p.minBuildingGap,p.relativeGap*s.width,p.orbitClearance,(skyline?Math.min(height,20):height)*p.heightSetback)+(chromatic?2:0);
    return {id,w:d.width+gap*2,d:d.depth+gap*2,semantic:s,decorative:d,height,gap,plan,rawHeight};});
   const local=chromatic?chromaticCourts(specs,p.streetClearance+p.skywalkRightOfWay+p.pipeRightOfWay,dir.count):atomic?atomicCourts(specs,p.streetClearance+p.skywalkRightOfWay+p.pipeRightOfWay):shelves(specs,p.streetClearance+p.skywalkRightOfWay+p.pipeRightOfWay);
   items.unshift({id:dir.id+'/@files',files:true,w:local.w,d:local.d,local});
  }
  const pack=shelves(items,p.districtGap,24);return {w:pack.w+p.parcelMargin*2,d:pack.d+p.parcelMargin*2,pack};
 }
 function place(dir,measure,x,z,boroughId,districtId){
  const bounds=rectangle(x,z,measure.w,measure.d);
  parcels.push({id:dir.id,label:dir.name,depth:dir.depth,boroughId,districtId,count:dir.count,bounds,moduleIds:descendants(dir)});
  corridors.push({id:dir.id+'/@access',kind:'street',boroughId,districtId,bounds:rectangle(x+2,z+2,p.streetClearance,measure.d-4),minY:0,maxY:.1});
  for(const row of new Set(measure.pack.placements.map(item=>item.z)))corridors.push({id:`${dir.id}/@front/${row}`,kind:'street',boroughId,districtId,bounds:rectangle(x+2,z+p.parcelMargin+row-p.streetClearance,measure.w-4,p.streetClearance),minY:0,maxY:.1});
  for(const item of measure.pack.placements){const ix=x+p.parcelMargin+item.x,iz=z+p.parcelMargin+item.z;
   if(item.dir){corridors.push({id:item.id+'/@entry',kind:'street',boroughId,districtId,bounds:rectangle(ix+2,iz-p.streetClearance,p.streetClearance,p.streetClearance+7),minY:0,maxY:.1});place(item.dir,item,ix,iz,boroughId,districtId);continue;}
   const ids=[];
   for(const cell of item.local.placements){const id=cell.id,cx=ix+cell.x+cell.w/2+(cell.offsetX||0)+(roofStyle(id)-1.5)*p.courtyardVariation/3,cz=iz+cell.z+cell.d/2+(cell.offsetZ||0)+((id.length%3)-1)*p.courtyardVariation/3;ids.push(id);
    const decorative=rectangle(cx-cell.decorative.width/2,cz-cell.decorative.depth/2,cell.decorative.width,cell.decorative.depth);
    const plot=rectangle(ix+cell.x,iz+cell.z,cell.w,cell.d);
    modules[id]={id,sourcePath:nodes.get(id).module.path,boroughId,districtId,parcelId:dir.id,directoryPath:nodes.get(id).module.path.replaceAll('\\','/').split('/').slice(0,-1).join('/'),position:{x:cx,y:0,z:cz},footprint:chromatic?{width:cell.semantic.width*Math.abs(Math.cos(cell.rotation||0))+cell.semantic.depth*Math.abs(Math.sin(cell.rotation||0)),depth:cell.semantic.depth*Math.abs(Math.cos(cell.rotation||0))+cell.semantic.width*Math.abs(Math.sin(cell.rotation||0))}:cell.semantic,semanticHeight:cell.rawHeight,displayHeight:cell.height,architecture:cell.plan?{...cell.plan,rotation:chromatic?cell.rotation:Math.floor(cell.localIndex/3)%2?Math.PI:0,motif:cell.motif}:null,decorativeHeight:cell.decorative.height,decorativeBounds:decorative,plotBounds:plot,clearance:cell.gap,dock:{bounds:rectangle(decorative.minX-1,decorative.minZ-1,cell.decorative.width+2,cell.decorative.depth+2),y:cell.decorative.height+.5}};
   }
   // Bands run along the public edge of each row; they are NOT graph edges.
   const rows=[...new Set(item.local.placements.map(c=>c.z))];
   for(const row of rows){const rowCells=item.local.placements.filter(c=>c.z===row),end=Math.max(...rowCells.map(c=>c.z+c.d));
    for(const [kind,width,offset] of [['skywalk',p.skywalkRightOfWay,0],['pipe-service',p.pipeRightOfWay,p.skywalkRightOfWay],['street',p.streetClearance,p.skywalkRightOfWay+p.pipeRightOfWay]]){
     corridors.push({id:`${item.id}/${row}/${kind}`,kind,boroughId,districtId,bounds:rectangle(kind==='street'?x+2:ix,iz+end+offset,item.local.w+(kind==='street'?ix-x-2:0),width),minY:kind==='skywalk'?Math.max(...rowCells.map(c=>c.height))+2:kind==='pipe-service'?-1:0,maxY:kind==='skywalk'?surfaceHeight+6:.1});
    }
   }
   for(let i=0;i<ids.length;i+=24){const moduleIds=ids.slice(i,i+24),bs=moduleIds.map(id=>modules[id].plotBounds);chunks.push({id:`${item.id}/${i/24}`,districtId,boroughId,moduleIds,bounds:{minX:Math.min(...bs.map(b=>b.minX)),maxX:Math.max(...bs.map(b=>b.maxX)),minZ:Math.min(...bs.map(b=>b.minZ)),maxZ:Math.max(...bs.map(b=>b.maxZ))},height:Math.max(...moduleIds.map(id=>modules[id].decorativeHeight))});}
  }
 }
 function descendants(dir){return [...dir.files,...dir.children.flatMap(descendants)];}
 const measureDistrict=dir=>{const m=measure(dir);return chromatic?{...m,w:Math.max(72,m.w),d:m.d+60}:m;};
 const prepared=hierarchy.roots.map(root=>{const districts=root.children.map(dir=>({id:dir.id,dir,...measureDistrict(dir)}));
  if(root.files.length){const dir={...root,id:root.id+'/@root',name:'Core / Root Modules',children:[],depth:1,count:root.files.length};districts.unshift({id:dir.id,dir,...measureDistrict(dir)});}
  return {root,pack:shelves(districts,p.districtGap,180)};});
 const depth=Math.max(220,...prepared.map(b=>b.pack.d+p.parcelMargin*4));let cursor=0;
 for(const {root,pack} of prepared){const width=pack.w+p.parcelMargin*4,bounds=rectangle(cursor,0,width,depth),districtIds=[];
  for(const side of ['west','east'])corridors.push({id:root.id+'/perimeter/'+side,kind:'street',boroughId:root.id,districtId:null,bounds:rectangle(side==='west'?cursor+3:cursor+width-8,3,p.streetClearance,depth-6),minY:0,maxY:.1});
  for(const row of new Set(pack.placements.length?pack.placements.map(item=>item.z):[0]))corridors.push({id:root.id+'/boulevard/'+row,kind:'street',boroughId:root.id,districtId:null,bounds:rectangle(cursor+3,p.parcelMargin*2+row-p.streetClearance,width-6,p.streetClearance),minY:0,maxY:.1});
  for(const item of pack.placements){const x=cursor+p.parcelMargin*2+item.x,z=p.parcelMargin*2+item.z;corridors.push({id:item.id+'/@borough-entry',kind:'street',boroughId:root.id,districtId:item.id,bounds:rectangle(x+2,z-p.streetClearance,p.streetClearance,p.streetClearance+7),minY:0,maxY:.1});place(item.dir,item,x,z,root.id,item.id);const parcel=parcels.find(q=>q.id===item.id);parcel.polygon=[[x-7,z-6],[x+item.w+7,z-6],[x+item.w,z+item.d+6],[x,z+item.d+6]];districtIds.push(item.id);}
  boroughs.push({id:root.id,count:root.count,empty:root.count===0,bounds,polygon:[[cursor,0],[cursor+width,0],[cursor+width,depth],[cursor,depth]],districtIds});
  cursor+=width;
  if(root.id!==surfaceRoots.at(-1)){const riverWidth=p.riverWidth+p.riverbankSetback*2,centre=cursor+riverWidth/2;
   const river={id:`river-${rivers.length+1}`,between:[root.id,surfaceRoots[surfaceRoots.indexOf(root.id)+1]],width:p.riverWidth,bank:p.riverbankSetback,bounds:rectangle(cursor,-20,riverWidth,depth+40),centerline:Array.from({length:17},(_,i)=>({x:centre+Math.sin(i*Math.PI/8)*3,z:-20+(depth+40)*i/16}))};rivers.push(river);
   crossings.push({id:`civic-bridge-${rivers.length}`,kind:'public-navigation-bridge',bounds:rectangle(cursor-2,depth*.52-3,riverWidth+4,6),y:1});cursor+=riverWidth;
  }
 }
 const obstructions=crossings.flatMap(c=>[c.bounds.minZ,c.bounds.maxZ].map((z,i)=>({id:c.id+'/rail-'+i,kind:'civic-rail',bounds:rectangle(c.bounds.minX,z-.12,c.bounds.maxX-c.bounds.minX,.24),minY:1.3,maxY:2.1})));
 const approaches=crossings.flatMap(c=>[{id:c.id+'/west-approach',kind:'civic-approach',bounds:rectangle(c.bounds.minX-10,c.bounds.minZ,10,6),slope:.1},{id:c.id+'/east-approach',kind:'civic-approach',bounds:rectangle(c.bounds.maxX,c.bounds.minZ,10,6),slope:-.1}]);
 for(const b of boroughs)obstructions.push({id:b.id+'/landmark',kind:'civic-landmark',bounds:rectangle(b.bounds.minX+11,11,4,4),minY:0,maxY:5});
 if(atomic)surfaceHeight=Math.max(5,...Object.values(modules).map(m=>m.decorativeHeight));
 const blocks=[];if(atomic)for(const parcel of parcels){const local=Object.values(modules).filter(m=>m.parcelId===parcel.id);for(let i=0;i<local.length;i+=6){const ms=local.slice(i,i+6),bs=ms.map(m=>m.plotBounds);blocks.push({id:parcel.id+'/visual-court-'+i/6,synthetic:true,directoryPath:ms[0].directoryPath,moduleIds:ms.map(m=>m.id),bounds:{minX:Math.min(...bs.map(b=>b.minX)),maxX:Math.max(...bs.map(b=>b.maxX)),minZ:Math.min(...bs.map(b=>b.minZ)),maxZ:Math.max(...bs.map(b=>b.maxZ))}});}}
 const courtyards=[];if(atomic)for(const block of blocks){const ms=block.moduleIds.map(id=>modules[id]),rows=[...new Set(ms.map(m=>m.plotBounds.minZ))].sort((a,b)=>a-b);if(rows.length>1){const front=ms.filter(m=>m.plotBounds.minZ===rows[0]),end=Math.max(...front.map(m=>m.plotBounds.maxZ)),bounds=rectangle(block.bounds.minX,end+8.5,block.bounds.maxX-block.bounds.minX,8);courtyards.push({id:block.id,kind:'landscaped-civic-court',synthetic:true,directoryPath:block.directoryPath,bounds});}}
 const parks=[];if(atomic)for(const parcel of parcels.filter(p=>p.depth===1)){const b=parcel.bounds,ms=parcel.moduleIds.map(id=>modules[id].plotBounds),cs=corridors.filter(c=>c.districtId===parcel.id).map(c=>c.bounds),stepX=(b.maxX-b.minX-8)/8,stepZ=(b.maxZ-b.minZ-8)/8;for(let row=0;row<8;row++){let start=null;for(let col=0;col<=8;col++){const q=rectangle(b.minX+4+col*stepX,b.minZ+4+row*stepZ,stepX,stepZ),free=col<8&&![...ms,...cs].some(a=>overlaps(a,q));if(free&&start===null)start=col;if(!free&&start!==null){parks.push({id:parcel.id+'/park/'+row+'/'+start,bounds:rectangle(b.minX+4+start*stepX,b.minZ+4+row*stepZ,(col-start)*stepX,stepZ)});start=null;}}}}
 const manifest={layoutVersion:atomic?4:3,parks,courtyards,visual:atomic?'c1':'c',concept,blocks,serviceCorridors:corridors.filter(c=>c.kind==='pipe-service'),skywalkCorridors:corridors.filter(c=>c.kind==='skywalk'),roofDockingZones:Object.values(modules).map(m=>({id:m.id,...m.dock})),config:p,hierarchy,boroughs,parcels,modules,chunks,corridors,rivers,crossings,approaches,obstructions,surfaceHeight:surfaceHeight+6,bounds:rectangle(0,-20,cursor,depth+40),unknown:hierarchy.unknown};
 const result=chromatic?chromaticManifest(manifest,composition):manifest;if(skyline){result.visual='c4';for(const m of Object.values(result.modules))m.presentation='skyline';for(const c of result.skywalkCorridors)c.maxY=Math.max(c.maxY,result.surfaceHeight+6);}return visual==='c3'?metropolisManifest(result,concept):result;
}

export function validateBoroughManifest(m){
 const errors=[],values=Object.values(m.modules),p=m.config;
 for(let i=0;i<values.length;i++){const a=values[i],b=a.decorativeBounds;
  if(![a.position.x,a.position.z,a.semanticHeight].every(Number.isFinite))errors.push(`Invalid ${a.id}`);
  const borough=m.boroughs.find(q=>q.id===a.boroughId).bounds;
  if(b.minX<borough.minX+p.riverbankSetback||b.maxX>borough.maxX-p.riverbankSetback||b.minZ<borough.minZ||b.maxZ>borough.maxZ)errors.push(`Bank ${a.id}`);
  for(const c of [...m.corridors,...m.crossings,...m.approaches,...m.obstructions])if(c.boroughId===a.boroughId||!c.boroughId)if(overlaps(b,c.bounds))errors.push(`Corridor ${a.id} ${c.id}`);
  for(let j=i+1;j<values.length;j++){const other=values[j],c=other.decorativeBounds;if(a.boroughId!==other.boroughId)continue;
   const dx=Math.max(0,b.minX-c.maxX,c.minX-b.maxX),dz=Math.max(0,b.minZ-c.maxZ,c.minZ-b.maxZ),gap=Math.hypot(dx,dz),required=Math.max(p.minBuildingGap,p.relativeGap*Math.max(a.footprint.width,other.footprint.width));if(gap+1e-6<required)errors.push(`Gap ${a.id} ${other.id}: ${gap}`);
  }
 }
 return errors;
}

/** Civic access topology only. It never consumes or creates module imports. */
export function streetConnectivity(manifest){
 const roads=[...manifest.corridors.filter(c=>c.kind==='street'),...manifest.crossings,...manifest.approaches],parents=roads.map((_,i)=>i);
 const find=i=>parents[i]===i?i:(parents[i]=find(parents[i]));
 for(let i=0;i<roads.length;i++)for(let j=0;j<i;j++){const a=roads[i].bounds,b=roads[j].bounds;if(a.minX<=b.maxX+1e-6&&a.maxX>=b.minX-1e-6&&a.minZ<=b.maxZ+1e-6&&a.maxZ>=b.minZ-1e-6)parents[find(i)]=find(j);}
 return {segments:roads.length,components:new Set(roads.map((_,i)=>find(i))).size};
}


// Six real files per visual court, stable source order; this creates no source directory.
function atomicCourts(specs,gap){
 const cw=Math.max(...specs.map(s=>s.w)),cd=Math.max(...specs.map(s=>s.d)),columns=Math.min(3,specs.length),placements=[];
 specs.forEach((s,i)=>{const row=Math.floor(i/columns),col=i%columns;placements.push({...s,localIndex:i,x:col*cw+(cw-s.w)/2,z:row*(cd+gap+8)+(cd-s.d)/2,w:s.w,d:cd});});
 // All row ends align so the street/service/skywalk bands never cross another court.
 for(const c of placements)c.z=Math.floor(c.localIndex/columns)*(cd+gap+8);
 return {w:columns*cw,d:Math.ceil(specs.length/columns)*cd+(Math.ceil(specs.length/columns)-1)*(gap+8),placements};
}

function chromaticCourts(specs,gap,count){
 const motif=count<=6?'institute-square':count<=20?'research-crescent':count>80?'science-promenade':'terraced-campus',columns=Math.min(specs.length,motif==='institute-square'?2:motif==='science-promenade'?4:3),cw=Math.max(...specs.map(s=>s.w)),cd=Math.max(...specs.map(s=>s.d)),placements=[];
 specs.forEach((s,i)=>{const row=Math.floor(i/columns),col=i%columns,side=col-(columns-1)/2,offsetX=motif==='terraced-campus'?(row%2?-2:2):0,offsetZ=motif==='research-crescent'?Math.abs(side)*2.5:motif==='terraced-campus'?(col%2?2:-2):0,rotation=(row%2?Math.PI:0)+(motif==='research-crescent'?side*.18:motif==='terraced-campus'?(col%2?.12:-.12):0);placements.push({...s,localIndex:i,motif,rotation,offsetX,offsetZ,x:col*cw+(cw-s.w)/2,z:row*(cd+gap+8)+Math.floor(row/2)*(motif==='science-promenade'?12:0),w:s.w,d:cd});});
 return {w:columns*cw,d:Math.max(...placements.map(c=>c.z+c.d)),placements};
}
