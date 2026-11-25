import * as THREE from 'three';
import {masterplan,validatePlan,capacity,VERSION} from './geneva-g1-geometry.js';
import {roleNames} from './city-v2-model.js';
import {subjectColors} from './geneva-production-layout.js';
import {createSourceInspector} from './geneva-source-inspector.js';
import {setupResearchSearch} from './geneva-research-search.js';
import {setupHistory} from './geneva-history-ui.js';
import {complexEvidence,palettes} from './geneva-evidence.js';
import {districtKey,districtBounds,detailPlan} from './geneva-lod.js';
import {demoMassing} from './geneva-g1-massing.js';
import {civicFabric} from './geneva-civic-fabric.js';
import {renderCivicFabric} from './geneva-civic-render.js';
import {urbanSurfaceTextures,worldPlanarUV} from './geneva-urban-materials.js';
import {makeArchitecturalFacades,applyFacadeProjection,installSkyEnvironment,contactShadows,renderScale} from './geneva-architectural-materials.js';
import {buildSynthKit,synthModel} from './geneva-synthcity-kit.js';
const $=id=>document.getElementById(id),p=masterplan(),metrics=validatePlan(p),params=new URLSearchParams(location.search),study=params.get('study')==='1';
let production=null;
if(!study){
 try{const r=await fetch('data/geneva-production.json',{cache:'no-cache'});if(!r.ok)throw Error('Snapshot HTTP '+r.status);production=await r.json();if(production.layout?.version!=='geneva-source-1'||production.model?.source?.revision!==production.layout?.source?.revision||!production.layout.sites.length)throw Error('Invalid source layout snapshot');}
 catch(e){$('status').textContent='Source city unavailable: '+e.message+'. Reload the indexed city or open the architectural study.';throw e;}
}
const layout=production?.layout,model=production?.model;
let selectedId=null,selectedBuilding=null,channel='both',filter='all',zoom=1,focusX=0,focusZ=0,dependencyGroup=null,sourceUI=null;
const siteById=new Map((layout?.sites||[]).map(t=>[t.id,t])),buildingById=new Map([...(layout?.buildings||[]),...(layout?.stations||[])].map(t=>[t.id,t]));
const semanticMeshes=[],subjectSprites=[],mapParts=[],lodMeshes=[];
const geometryMode='full';
let evidenceMode='off',evidenceMeshes=[];
const tallest=new Map();for(const t of layout?.buildings||[])if(!tallest.has(t.complexId)||t.h>tallest.get(t.complexId).h)tallest.set(t.complexId,t);
const evidenceById=new Map((model?.complexes||[]).map(c=>[c.id,complexEvidence(production,c)]));
let redrawVersion=0,renderedFrames=0;const quality='high';const invalidate=()=>{redrawVersion++;};

const ns='http://www.w3.org/2000/svg',el=(tag,attrs={},parent)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(parent)parent.append(e);return e;};
const pts=p=>p.map(v=>v.join(',')).join(' ');
const svg=el('svg',{viewBox:'-30 -30 1060 860',role:'img','aria-label':'PhysLib city plan with three library districts'},$('map'));
el('rect',{x:-30,y:-30,width:1060,height:860,fill:'#788582'},svg);
for(const s of p.sectors)el('polygon',{points:pts(s.polygon),fill:'#a9afb1'},svg);
el('polygon',{points:pts(p.water),fill:'#426f81'},svg);
for(const q of p.parks)el('polygon',{points:pts(q.polygon),fill:'#54705a',stroke:'#43594c','stroke-width':1},svg);
for(const q of p.shorelines)el('polyline',{points:pts(q),fill:'none',stroke:'#969ea1','stroke-width':7,'stroke-linejoin':'round'},svg);
for(const b of p.bridges){for(const [width,color] of [[b.width+3,'#4c535a'],[b.width,'#d0d0d0']])el('line',{x1:b.a[0],y1:b.a[1],x2:b.b[0],y2:b.b[1],stroke:color,'stroke-width':width,'stroke-linecap':'round'},svg);}
const towers=layout?[...layout.decorativeTowers,...layout.buildings]:demoMassing(p),civic=layout?layout.civic:civicFabric(p,towers);
const bounds=districtBounds(towers);
const roadPath=civic.roads.map(r=>'M'+r.a.join(' ')+'L'+r.b.join(' ')).join(' ');
el('path',{d:roadPath,fill:'none',stroke:'#92999d','stroke-width':6,'stroke-linecap':'round','stroke-linejoin':'round'},svg);
el('path',{d:roadPath,fill:'none',stroke:'#4c535a','stroke-width':5,'stroke-linecap':'round','stroke-linejoin':'round'},svg);
const civicPlan=el('g',{'aria-label':'Illustrative civic buildings and public spaces'},svg);
for(const q of civic.plazas)el('circle',{cx:q.x,cy:q.z,r:q.r,fill:q.kind==='garden'?'#54705a':'#c4c9cb',stroke:'#92999d','stroke-width':.5},civicPlan);
for(const t of civic.infill){const g=el('g',{transform:'translate('+t.x+' '+t.z+') rotate('+(-t.angle*180/Math.PI)+')'},civicPlan);el('rect',{x:-t.w/2,y:-t.d/2,width:t.w,height:t.d,fill:['#b0b7bb','#c5cbd0','#969fa4','#aab0b4','#c5c9ca'][t.style],stroke:'#626b71','stroke-width':.35},g);}
for(const t of civic.trees)el('circle',{cx:t.x,cy:t.z,r:t.r,fill:'#4d6856'},civicPlan);

const roofPalette=['#b8b8b8','#b9c1c8','#87959c','#a0a0a0','#e8e8e8'];
const massing2d=el('g',{'aria-label':'Illustrative tower massing'},svg);
for(const t of towers){const g=el('g',{transform:'translate('+t.x+' '+t.z+') rotate('+(-t.angle*180/Math.PI)+')'},massing2d);el('rect',{x:-t.w*.5+3,y:-t.d*.5+4,width:t.w,height:t.d,fill:'#323b43',opacity:.25},g);el('rect',{x:-t.w/2,y:-t.d/2,width:t.w,height:t.d,fill:t.color||roofPalette[t.style],stroke:'#43594c','stroke-width':.6},g);el('rect',{x:-t.w*.23,y:-t.d*.24,width:t.w*.46,height:t.d*.48,fill:'#e8e8e8'},g);if(t.id){g.style.cursor='pointer';g.dataset.mapBuilding=t.id;g.addEventListener('click',()=>enterFromMap(t.complexId,t.id));mapParts.push({element:g,area:t.area});const title=el('title',{},g);title.textContent=t.id;}}
for(const t of layout?.stations||[]){const g=el('rect',{x:t.x-t.w/2,y:t.z-t.d/2,width:t.w,height:t.d,fill:'#3ce4d5',stroke:'#22363a','stroke-width':.4},massing2d);g.style.cursor='pointer';g.dataset.mapBuilding=t.id;g.addEventListener('click',()=>enterFromMap(t.complexId,t.id));mapParts.push({element:g,area:t.area});}
const selection2d=el('ellipse',{'pointer-events':'none',fill:'none',stroke:'#ff9b41','stroke-width':2.5,'data-selection':'active',visibility:'hidden'},svg);
const evidenceDots=[];const evidenceLayer=el('g',{'pointer-events':'none','aria-hidden':'true'},svg);
for(const [id,t] of tallest){const dot=el('circle',{cx:t.x,cy:t.z,r:Math.max(2,Math.min(4,t.w*.32)),stroke:'#26313a','stroke-width':.8,'data-evidence':id},evidenceLayer);evidenceDots.push({id,area:t.area,dot});}
evidenceLayer.style.display='none';
const labelGroup=el('g',{'font-family':'system-ui, sans-serif'},svg);
function label(x,y,txt,sub='',water=false){const g=el('g',{transform:'translate('+x+' '+y+')'},labelGroup);const t=el('text',{'text-anchor':'middle','font-size':water?23:29,'font-weight':water?500:700,fill:water?'#f0f4f4':'#202c34','paint-order':'stroke',stroke:water?'#426f81':'#a9afb1','stroke-width':3},g);t.textContent=txt;if(sub){const s=el('text',{y:24,'text-anchor':'middle','font-size':17,fill:'#34424b','paint-order':'stroke',stroke:'#a9afb1','stroke-width':2},g);s.textContent=sub;}}
for(const s of p.sectors)label(...s.label,s.id);
for(const b of layout?.boroughs||[]){const t=el('text',{x:b.x,y:b.z,'text-anchor':'middle','font-size':10,'font-weight':700,fill:b.color,stroke:'#19232b','stroke-width':2.5,'paint-order':'stroke'},labelGroup);t.textContent=b.area.replace(/([a-z])([A-Z])/g,'$1 $2');mapParts.push({element:t,area:b.area});}
el('path',{d:'M953 746V704L944 720M953 704L962 720',fill:'none',stroke:'#202c34','stroke-width':3},labelGroup);const north=el('text',{x:953,y:692,'text-anchor':'middle','font-size':18,fill:'#202c34'},labelGroup);north.textContent='N';
$('status').textContent=VERSION+' · '+(metrics.waterShare*100).toFixed(1)+'% water · '+metrics.bridges+' bridges · '+civic.infill.length+' civic buildings · '+civic.trees.length+' trees';
let scene,camera,renderer,hemi,sun,rotating=false,yaw=0,labels=true,observer,frame,viewMode='oblique',massGroup,selection3d,started=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function pan(dx,dz){focusX=clamp(focusX+dx,-600,600);focusZ=clamp(focusZ+dz,-500,500);updatePlanCamera();invalidate();}
function changeZoom(factor){zoom=clamp(zoom*factor,.75,9);updatePlanCamera();invalidate();}
function updatePlanCamera(){const w=1060/zoom,h=860/zoom;svg.setAttribute('viewBox',`${500+focusX-w/2} ${400+focusZ-h/2} ${w} ${h}`);}
let sidebarWidth=360;
function toggleSidebar(show){const aside=$('citySidebar'),next=show??aside.hidden;aside.hidden=!next;$('toggleSidebar').setAttribute('aria-expanded',String(next));$('toggleSidebar').textContent=next?'Explore ‹':'Explore ›';}
function setSidebarWidth(w){const limit=Math.max(280,Math.min(760,innerWidth-24));sidebarWidth=clamp(w,280,limit);document.documentElement.style.setProperty('--sidebar-width',sidebarWidth+'px');const grip=$('sidebarGrip');grip.setAttribute('aria-valuemax',String(limit));grip.setAttribute('aria-valuenow',String(Math.round(sidebarWidth)));const expanded=sidebarWidth>=Math.min(620,limit);$('expandSidebar').setAttribute('aria-pressed',String(expanded));$('expandSidebar').textContent=expanded?'Reduce':'Enlarge';}
function setupSidebar(){const grip=$('sidebarGrip');let drag=null;grip.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,width:sidebarWidth};grip.setPointerCapture(e.pointerId);e.preventDefault();});grip.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId)setSidebarWidth(drag.width+drag.x-e.clientX);});for(const k of ['pointerup','pointercancel','lostpointercapture'])grip.addEventListener(k,()=>{drag=null;});grip.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){setSidebarWidth(sidebarWidth+(e.key==='ArrowLeft'?32:-32));e.preventDefault();e.stopPropagation();}});$('expandSidebar').onclick=()=>setSidebarWidth($('expandSidebar').getAttribute('aria-pressed')==='true'?360:Math.min(680,innerWidth-24));$('closeSidebar').onclick=()=>{toggleSidebar(false);$('toggleSidebar').focus();};window.addEventListener('resize',()=>setSidebarWidth(sidebarWidth));setSidebarWidth(sidebarWidth);}
function updateSelection(){const t=buildingById.get(selectedBuilding)||siteById.get(selectedId);selection2d.setAttribute('visibility',t?'visible':'hidden');if(t){selection2d.setAttribute('cx',t.x);selection2d.setAttribute('cy',t.z);selection2d.setAttribute('rx',t.w*.65+1);selection2d.setAttribute('ry',t.d*.65+1);}if(selection3d){selection3d.visible=!!t;if(t){selection3d.position.set(t.x-500,.65,t.z-400);selection3d.scale.set(t.w*.65+1,t.d*.65+1,1);}}$('selectionStatus').textContent=t?(selectedBuilding===selectedId+'::mathlib-station'?'Mathlib station · ':selectedBuilding?'Building · ':'Complex · ')+selectedId:'No selection';invalidate();}
function clearSelection(){selectedId=selectedBuilding=null;sourceUI?.clear();const url=new URL(location.href);url.searchParams.delete('complex');url.searchParams.delete('building');history.replaceState(null,'',url);updateSelection();drawDependencies();}
function focusSelection(){if(selectedId)selectComplex(selectedId,selectedBuilding,true);else{zoom=4;updatePlanCamera();invalidate();}}
function resetCamera(){focusX=focusZ=0;zoom=1;updatePlanCamera();invalidate();}
function enterFromMap(id,building){selectComplex(id,building,true);mode('oblique');}
function enterMapPoint(e){if(e.target.closest?.('[data-map-building]'))return;const matrix=svg.getScreenCTM();if(!matrix)return;const pt=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());focusX=clamp(pt.x-500,-600,600);focusZ=clamp(pt.y-400,-500,500);zoom=Math.max(zoom,3);mode('oblique');}
function installDrag(target,move){let start=null,dragged=false;target.style.touchAction='none';target.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;start={id:e.pointerId,x:e.clientX,y:e.clientY,originX:e.clientX,originY:e.clientY};dragged=false;});target.addEventListener('pointermove',e=>{if(!start||start.id!==e.pointerId)return;if(!dragged&&Math.hypot(e.clientX-start.originX,e.clientY-start.originY)<6)return;if(!dragged){dragged=true;target.setPointerCapture(e.pointerId);target.style.cursor='grabbing';}move(e.clientX-start.x,e.clientY-start.y);start.x=e.clientX;start.y=e.clientY;});const finish=()=>{start=null;target.style.cursor='grab';};target.addEventListener('pointerup',finish);target.addEventListener('pointercancel',finish);target.addEventListener('click',e=>{if(dragged){dragged=false;e.preventDefault();e.stopImmediatePropagation();}},true);target.style.cursor='grab';}
installDrag(svg,(dx,dy)=>{const rect=svg.getBoundingClientRect(),scale=Math.min(rect.width/1060,rect.height/860)*zoom;pan(-dx/scale,-dy/scale);});
svg.addEventListener('wheel',e=>{e.preventDefault();changeZoom(Math.exp(-e.deltaY*.001));},{passive:false});
svg.addEventListener('dblclick',enterMapPoint);
function init3D(){
 if(renderer)return;
 const host=$('three');scene=new THREE.Scene();scene.background=new THREE.Color('#b9c8ce');
 hemi=new THREE.HemisphereLight('#dceaff','#68757a',.85);scene.add(hemi);sun=new THREE.DirectionalLight('#fff0d9',2.65);sun.position.set(-650,720,-320);scene.add(sun);
 const material=(color,roughness=.85)=>new THREE.MeshStandardMaterial({color,roughness,side:THREE.DoubleSide});
 const ground=material('#788582'),land=material('#a9afb1'),water=material('#426f81',.37),green=material('#54705a'),quay=material('#969ea1'),bridge=material('#d0d0d0'),asphalt=material('#4c535a');
 const surfaces=urbanSurfaceTextures(THREE);land.map=surfaces.concrete;land.roughness=.92;asphalt.map=surfaces.asphalt;
 const world=(x,z,y=0)=>new THREE.Vector3(x-500,y,z-400);
 function face(poly,m,y){const s=new THREE.Shape();poly.forEach(([x,z],i)=>i?s.lineTo(x-500,400-z):s.moveTo(x-500,400-z));s.closePath();const geo=new THREE.ShapeGeometry(s);if(m===land)worldPlanarUV(THREE,geo,28);const o=new THREE.Mesh(geo,m);o.rotation.x=-Math.PI/2;o.position.y=y;scene.add(o);return o;}
 function strip(a,b,w,h,y,m){const A=world(...a),B=world(...b),d=A.distanceTo(B);if(d<.0001)return;const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d+.7),m);o.position.copy(A.add(B).multiplyScalar(.5));o.position.y=y;o.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);scene.add(o);}
 const groundMesh=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),ground);groundMesh.rotation.x=-Math.PI/2;groundMesh.position.y=-2;scene.add(groundMesh);
 for(const s of p.sectors)face(s.polygon,land,0);
 face(p.water,water,-.6);for(const q of p.parks)face(q.polygon,green,.2);
 for(const q of p.shorelines)for(let i=1;i<q.length;i++)strip(q[i-1],q[i],5,.5,.3,quay);
 for(const b of p.bridges){strip(b.a,b.b,b.width+2,2,1,bridge);strip(b.a,b.b,b.width-1,.3,2.15,asphalt);for(const side of [-1,1])strip([b.a[0]+side*b.width/2,b.a[1]],[b.b[0]+side*b.width/2,b.b[1]],.65,2,2.9,bridge);}
 // Reusable facade materials and instanced structural pieces. Inspired by
 // Night Street's material-batched rendering, without copying its street assets.
 massGroup=new THREE.Group();scene.add(massGroup);
 const facade=makeArchitecturalFacades(THREE),ivory=material('#e8e8e8'),metal=material('#909090',.35),glass=material('#687f76',.28),glow=new THREE.MeshStandardMaterial({color:'#ffb879',emissive:'#ff6a00',emissiveIntensity:.7});
 const boxGeo=new THREE.BoxGeometry(1,1,1),cylinderGeo=new THREE.CylinderGeometry(.5,.5,1,24),coneGeo=new THREE.ConeGeometry(.5,1,24),ringGeo=new THREE.TorusGeometry(.5,.035,8,32);
 const synthKit=buildSynthKit(THREE);const disposeContacts=contactShadows(THREE,scene,[...towers,...civic.infill]);
 const civicDetail=renderCivicFabric(THREE,scene,civic,facade,surfaces);
 const batches=new Map(),dummy=new THREE.Object3D(),tinted=new Map(),beaconMaterials=new Map();
 function tintedFacade(t){if(!t.id)return facade[t.style];const key=t.area+'|'+t.style;if(!tinted.has(key)){const m=facade[t.style].clone();m.color.lerp(new THREE.Color(t.color),.38);applyFacadeProjection(m);tinted.set(key,m);}return tinted.get(key);}
 function beacon(color){if(!beaconMaterials.has(color))beaconMaterials.set(color,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.4,roughness:.5}));return beaconMaterials.get(color);}

 let tier='detail';
 function part(t,geo,m,x,y,z,w,h,d,rx=0){const a=t.angle,c=Math.cos(a),s=Math.sin(a);dummy.position.copy(world(t.x+c*x+s*z,t.z-s*x+c*z,y));dummy.rotation.set(rx,a,0);dummy.scale.set(w,h,d);dummy.updateMatrix();const district=districtKey(t),key=geo.uuid+'|'+m.uuid+'|'+district+'|'+tier;if(!batches.has(key))batches.set(key,{geo,m,matrices:[],ids:[],area:t.area||null,district,tier});const batch=batches.get(key);batch.matrices.push(dummy.matrix.clone());batch.ids.push(t.id?{id:t.id,complexId:t.complexId}:null);}
 for(const t of towers){const {w,d,h,style}=t,fac=tintedFacade(t);
  part(t,boxGeo,ivory,0,1,0,w*1.08,2,d*1.08);
  if(t.role==='provisional'){
   part(t,boxGeo,fac,0,h*.5,0,w*.78,h*.96,d*.78);
   for(const x of [-.46,.46])for(const z of [-.46,.46])part(t,boxGeo,metal,x*w,h*.5,z*d,w*.055,h,d*.055);
   for(let y=3;y<h;y+=Math.max(4,h/5)){part(t,boxGeo,glow,0,y,0,w, .19,d);part(t,boxGeo,fac,0,y+.13,0,w*.79,.16,d*.79);}
   continue;
  }
  const imported=synthKit[synthModel(t)];
  if(imported){part(t,imported,fac,0,h*.5+1,0,w,h,d);if(t.id)part(t,boxGeo,beacon(t.color),0,h+1.1,0,w*.22,.35,d*.22);continue;}
  if(style===2){part(t,cylinderGeo,fac,0,h*.48,0,w,h*.92,d);part(t,cylinderGeo,ivory,0,h*.79,0,w*1.12,1.1,d*1.12);part(t,cylinderGeo,glass,0,h*.98,0,w*.83,h*.12,d*.83);part(t,coneGeo,metal,0,h*1.13,0,w*.38,h*.18,d*.38);}
  else if(style===3){part(t,boxGeo,fac,0,h*.36,0,w,h*.7,d);part(t,boxGeo,fac,0,h*.79,0,w*.64,h*.48,d*.64);part(t,boxGeo,ivory,0,h*.55,0,w*1.07,1.15,d*1.07);part(t,boxGeo,glow,0,h*1.03,0,w*.52,1,d*.52);}
  else if(style===4){part(t,cylinderGeo,ivory,0,h*.41,0,w*.58,h*.82,d*.58);part(t,cylinderGeo,glass,0,h*.85,0,w*1.02,h*.23,d*1.02);part(t,cylinderGeo,ivory,0,h*.99,0,w*1.04,1.3,d*1.04);part(t,ringGeo,metal,0,h*.98,0,w*1.12,d*1.12,1,Math.PI/2);part(t,coneGeo,metal,0,h*1.1,0,w*.21,h*.2,d*.21);}
  else{part(t,boxGeo,fac,0,h*.49,0,w*.84,h*.96,d*.86);for(const sign of [-1,1]){part(t,boxGeo,ivory,sign*w*.43,h*.48,0,w*.12,h*.95,d*.94);part(t,boxGeo,ivory,0,h*.48,sign*d*.44,w*.94,h*.95,d*.1);}part(t,boxGeo,ivory,0,h*.99,0,w*.98,1.4,d*.98);part(t,boxGeo,metal,0,h*1.06,0,w*.38,h*.1,d*.38);}
 }
 // Overview silhouettes retain textured facades, subject colours, heights and distinct role forms.
 tier='coarse';
 const coarseRound=new THREE.CylinderGeometry(.5,.5,1,6),coarseCone=new THREE.ConeGeometry(.5,1,6);
 for(const t of towers){const {w,d,h,style}=t,fac=tintedFacade(t);
  if(t.role==='provisional'){part(t,boxGeo,fac,0,h*.5,0,w*.78,h*.96,d*.78);part(t,boxGeo,glow,0,h,0,w,.22,d);}
  else if(style===2){part(t,coarseRound,fac,0,h*.48,0,w,h*.92,d);part(t,coarseRound,glass,0,h*.98,0,w*.83,h*.12,d*.83);part(t,coarseCone,metal,0,h*1.13,0,w*.38,h*.18,d*.38);}
  else if(style===4){part(t,coarseRound,fac,0,h*.41,0,w*.58,h*.82,d*.58);part(t,coarseRound,glass,0,h*.87,0,w*1.02,h*.28,d*1.02);part(t,coarseCone,metal,0,h*1.1,0,w*.21,h*.2,d*.21);}
  else if(style===3){part(t,boxGeo,fac,0,h*.35+1,0,w,h*.7,d);part(t,boxGeo,fac,0,h*.85+1,0,w*.64,h*.3,d*.64);}
  else{part(t,boxGeo,fac,0,h*.5+1,0,w,h,d);part(t,boxGeo,ivory,0,h+1,0,w*.9,.35,d*.9);}
 }
 tier='shared';
 for(const t of layout?.stations||[]){part(t,boxGeo,metal,0,.65,0,t.w,1.3,t.d);part(t,boxGeo,beacon('#3ce4d5'),0,1.45,0,t.w*.65,.3,t.d*.65);}
 for(const {geo,m,matrices,ids,area,district,tier} of batches.values()){const mesh=new THREE.InstancedMesh(geo,m,matrices.length);matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.userData.ids=ids;mesh.userData.area=area;if(area)semanticMeshes.push(mesh);lodMeshes.push({mesh,area,district,tier});massGroup.add(mesh);}
 let lodKey='',lodStats=null;
 function updateLod(){
  const pixelsPerUnit=host.clientHeight*zoom/Math.max(1,camera.top-camera.bottom),viewRadius=Math.hypot(camera.right-camera.left,camera.top-camera.bottom)/(2*zoom)*1.1;
  const selected=selectedId&&tallest.get(selectedId),selectedKey=selected?districtKey(selected):null;
  const key=[geometryMode,quality,pixelsPerUnit,focusX,focusZ,viewRadius,selectedKey,filter].join('|');if(key===lodKey)return lodStats;lodKey=key;
  const plan=detailPlan(bounds,{mode:geometryMode,quality,pixelsPerUnit,focusX:focusX+500,focusZ:focusZ+400,viewRadius,selectedKey});
  let detailed=0,coarse=0;for(const {mesh,area,district,tier} of lodMeshes){mesh.visible=(!area||filter==='all'||area===filter)&&(tier==='shared'||(tier==='detail')===plan.detail.has(district));if(mesh.visible){if(tier==='detail')detailed+=mesh.count;if(tier==='coarse')coarse+=mesh.count;}}
  civicDetail.setDetail(plan.civicDetail);
  lodStats={mode:geometryMode,detailedDistricts:plan.detail.size,detailedInstances:detailed,coarseInstances:coarse,civicDetail:plan.civicDetail,pixelsPerUnit};return lodStats;
 }
 dependencyGroup=new THREE.Group();scene.add(dependencyGroup);
 selection3d=new THREE.Mesh(new THREE.RingGeometry(.90,1,48),new THREE.MeshBasicMaterial({color:'#ff9b41',side:THREE.DoubleSide,depthTest:false}));selection3d.rotation.x=-Math.PI/2;selection3d.renderOrder=6;scene.add(selection3d);updateSelection();
 if(production){
  const byArea=new Map();for(const [id,t] of tallest){if(!byArea.has(t.area))byArea.set(t.area,[]);byArea.get(t.area).push({id,t});}
  const geometry=new THREE.SphereGeometry(1,8,6),material=new THREE.MeshBasicMaterial({color:'#ffffff'}),marker=new THREE.Object3D();
  for(const [area,rows] of byArea){const mesh=new THREE.InstancedMesh(geometry,material,rows.length);rows.forEach(({t},i)=>{marker.position.copy(world(t.x,t.z,t.h*1.23+4));marker.scale.setScalar(Math.max(1.5,Math.min(3,t.w*.24)));marker.updateMatrix();mesh.setMatrixAt(i,marker.matrix);});mesh.instanceMatrix.needsUpdate=true;massGroup.add(mesh);evidenceMeshes.push({area,rows,mesh});}
  updateEvidence();
 }
 started=performance.now();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)massGroup.scale.y=.02;
 function sprite(text,sub,x,z){const c=document.createElement('canvas');c.width=1024;c.height=200;const g=c.getContext('2d');g.textAlign='center';g.font='bold 64px sans-serif';g.fillStyle='#263640';g.fillText(text,512,80);g.font='40px sans-serif';g.fillText(sub,512,138);const o=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));o.position.copy(world(x,z,112));o.scale.set(220,43,1);o.userData.isLabel=true;scene.add(o);return o;}
 for(const s of p.sectors)sprite(s.id,'',...s.label);
 for(const b of layout?.boroughs||[]){const o=sprite(b.area.replace(/([a-z])([A-Z])/g,'$1 $2'),'',b.x,b.z);o.scale.set(105,21,1);o.position.y=92;o.userData.area=b.area;subjectSprites.push(o);}
 camera=new THREE.OrthographicCamera(-650,650,550,-550,1,6000);renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;const disposeSky=installSkyEnvironment(THREE,renderer,scene);setDusk();for(const m of facade)m.emissiveIntensity=.65;for(const t of [surfaces.concrete,surfaces.asphalt])t.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());for(const m of facade){m.map.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());m.emissiveMap.anisotropy=m.map.anisotropy;}host.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','3D city. Arrow keys pan, plus and minus zoom, Home resets. Use the mathematics sidebar for keyboard selection.');
 function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);const aspect=w/h,half=Math.max(520,570/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.zoom=zoom;camera.updateProjectionMatrix();const gl=renderer.getContext(),limit=Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),gl.getParameter(gl.MAX_TEXTURE_SIZE));renderer.setPixelRatio(renderScale(quality,devicePixelRatio,w,h,limit));renderer.setSize(w,h,false);invalidate();}
 observer=new ResizeObserver(resize);observer.observe(host);resize();
 let prev=performance.now(),lastKey='',lastVersion=-1;
 function draw(now){
  const dt=Math.min(.05,(now-prev)/1000);prev=now;
  if(!document.hidden&&!host.hidden){
   if(rotating&&viewMode==='oblique')yaw+=dt*.12;
   const anim=massGroup&&massGroup.scale.y<1;
   if(anim){const t=Math.min(1,(now-started)/850);massGroup.scale.y=1-Math.pow(1-t,3)*.98;}
   const key=[viewMode,yaw,focusX,focusZ,zoom,labels,filter,massGroup.scale.y,quality,geometryMode].join('|');
   if(key!==lastKey||redrawVersion!==lastVersion){
    const pitch=Math.PI*.19,d=1550,a=yaw;
    camera.position.set(focusX+Math.sin(a)*d*Math.cos(pitch),d*Math.sin(pitch),focusZ+Math.cos(a)*d*Math.cos(pitch));camera.lookAt(focusX,0,focusZ);camera.zoom=zoom;camera.updateProjectionMatrix();
    for(const o of scene.children)if(o.userData.isLabel)o.visible=labels&&(!o.userData.area||filter==='all'||filter===o.userData.area);
    const lod=updateLod(),renderStart=performance.now();renderer.render(scene,camera);const cpuRenderMs=performance.now()-renderStart;renderedFrames++;
    host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);
    host.dataset.renderMetrics=JSON.stringify({...lod,lighting:'dusk',quality,cpuRenderMs,pixelRatio:renderer.getPixelRatio(),geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,canvasWidth:renderer.domElement.width,canvasHeight:renderer.domElement.height,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles});
    host.dataset.cameraPose=JSON.stringify({focusX,focusZ,zoom,viewMode});host.dataset.renderedFrames=String(renderedFrames);
    lastKey=key;lastVersion=redrawVersion;
   }
  }
  frame=requestAnimationFrame(draw);
 }
 frame=requestAnimationFrame(draw);
 document.addEventListener('visibilitychange',invalidate);
 installDrag(renderer.domElement,(dx,dy)=>{const scale=(camera.top-camera.bottom)/Math.max(1,host.clientHeight)/zoom,a=yaw,pitch=Math.PI*.19;pan(-dx*scale*Math.cos(a)-dy*scale*Math.sin(a)/Math.sin(pitch),dx*scale*Math.sin(a)-dy*scale*Math.cos(a)/Math.sin(pitch));});

 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 renderer.domElement.addEventListener('click',e=>{if(!production)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);for(const hit of ray.intersectObjects(semanticMeshes.filter(m=>m.visible),false)){const id=hit.object.userData.ids[hit.instanceId];if(id){selectComplex(id.complexId,id.id);break;}}});
 renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();changeZoom(Math.exp(-e.deltaY*.001));},{passive:false});
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);observer.disconnect();disposeSky();disposeContacts();surfaces.concrete.dispose();surfaces.asphalt.dispose();for(const m of facade){m.map.dispose();m.emissiveMap.dispose();m.dispose();}for(const m of tinted.values())m.dispose();renderer.dispose();},{once:true});
}
function mode(next){if(next!=='plan'&&next!=='oblique')return;invalidate();viewMode=next;updatePlanCamera();const three=next==='oblique';$('map').hidden=three;$('mapHint').hidden=three;$('three').hidden=!three;for(const k of ['plan','oblique'])$(k).setAttribute('aria-pressed',String(k===next));rotating=false;yaw=.65;if(three){try{init3D();}catch(e){viewMode='plan';$('three').hidden=true;$('map').hidden=false;$('mapHint').hidden=false;$('plan').setAttribute('aria-pressed','true');$('oblique').setAttribute('aria-pressed','false');$('three').dataset.error=e.message;$('status').textContent='3D unavailable: '+e.message+' — navigation map remains available.';}}}
$('plan').onclick=()=>mode('plan');$('oblique').onclick=()=>mode('oblique');$('labels').onclick=()=>{labels=!labels;labelGroup.style.display=labels?'':'none';$('labels').setAttribute('aria-pressed',String(labels));invalidate();};
function selectComplex(id,building=null,focus=false){
 if(!production||!siteById.has(id))return;
 const site=siteById.get(id);
 if(filter!=='all'&&filter!==site.area)sourceUI?.filter('all');
 selectedId=id;selectedBuilding=buildingById.get(building)?.complexId===id?building:null;building=selectedBuilding;sourceUI?.inspect(id,building);updateSelection();
 const url=new URL(location.href);url.searchParams.set('complex',id);if(building)url.searchParams.set('building',building);else url.searchParams.delete('building');
 if(url.href!==location.href)history.replaceState(null,'',url);
 if(focus){const t=buildingById.get(building)||siteById.get(id);focusX=t.x-500;focusZ=t.z-400;zoom=building?6:4;updatePlanCamera();invalidate();}
 drawDependencies();
}
function drawDependencies(){
 invalidate();
 if(!dependencyGroup||!production)return;
 for(const o of [...dependencyGroup.children]){dependencyGroup.remove(o);o.geometry?.dispose();o.material?.dispose();}
 if(!selectedId||channel==='off')return;
 const c=siteById.get(selectedId),vec=(t,y)=>new THREE.Vector3(t.x-500,y,t.z-400);
 function line(points,color){const geom=new THREE.BufferGeometry().setFromPoints(points),mat=new THREE.LineBasicMaterial({color,transparent:true,opacity:.9,depthTest:false});const l=new THREE.Line(geom,mat);l.renderOrder=5;dependencyGroup.add(l);}
 const selected=layout.buildings.filter(b=>b.complexId===selectedId),top=Math.max(8,...selected.map(b=>b.h))+6;
 const edges=model.edges.filter(e=>e.from===selectedId||e.to===selectedId);
 for(const direction of ['out','in']){if(channel!=='both'&&channel!==direction)continue;for(const e of edges.filter(e=>direction==='out'?e.from===selectedId:e.to===selectedId).slice(0,14)){
  const a=siteById.get(e.from),b=siteById.get(e.to);if(!a||!b)continue;
  if(filter!=='all'&&(a.area!==filter||b.area!==filter))continue;
  const start=vec(a,top),end=vec(b,top),mid=start.clone().lerp(end,.5);mid.y+=Math.min(125,25+start.distanceTo(end)*.15);
  line(new THREE.QuadraticBezierCurve3(start,mid,end).getPoints(24),direction==='out'?'#ef5d9f':'#ffc16f');
 }}
 const station=layout.stations.find(t=>t.complexId===selectedId),complex=model.complexes.find(t=>t.id===selectedId);
 if(station&&complex.mathlib.length)for(const b of selected)line([vec(b,1.5),vec(station,1.5)],'#3ce4d5');
}
function updateEvidence(){
 const active=evidenceMode!=='off',palette=palettes[evidenceMode];
 evidenceLayer.style.display=active?'':'none';
 for(const {id,area,dot} of evidenceDots){dot.style.display=filter==='all'||filter===area?'':'none';if(active)dot.setAttribute('fill',palette[evidenceById.get(id)[evidenceMode]][0]);}
 let count=0;for(const {area,rows,mesh} of evidenceMeshes){mesh.visible=active&&(filter==='all'||filter===area);if(mesh.visible){count+=rows.length;rows.forEach(({id},i)=>mesh.setColorAt(i,new THREE.Color(palette[evidenceById.get(id)[evidenceMode]][0])));mesh.instanceColor.needsUpdate=true;}}
 $('three').dataset.evidenceMarkers=String(count);
 const legend=$('evidenceLegend');legend.replaceChildren();if(active){for(const [key,[color,label]] of Object.entries(palette)){const row=document.createElement('div'),swatch=document.createElement('span');swatch.style.cssText='display:inline-block;width:10px;height:10px;margin-right:5px;background:'+color;row.append(swatch,document.createTextNode(label+' · '+[...evidenceById.entries()].filter(([id,e])=>(filter==='all'||siteById.get(id)?.area===filter)&&e[evidenceMode]===key).length));legend.append(row);}const note=document.createElement('p');note.textContent=evidenceMode==='freshness'?'Newest current-path change at indexed commit; not quality.':'Recorded module marks only; fingerprint validity not checked.';legend.append(note);}
 invalidate();
}
function setFilter(value){filter=value;for(const m of mapParts)m.element.style.display=value==='all'||m.area===value?'':'none';updateEvidence();drawDependencies();}
function setDusk(){invalidate();if(!scene)return;scene.background.set('#273849');hemi.intensity=.42;sun.intensity=.65;scene.environmentIntensity=.24;for(const m of massGroup.children.map(o=>o.material).filter(m=>m?.emissiveMap))m.emissiveIntensity=.65;renderer.toneMappingExposure=1.15;}
setupSidebar();mode('oblique');
$('resetView').onclick=resetCamera;$('focusSelection').onclick=focusSelection;$('zoomIn').onclick=()=>changeZoom(1.25);$('zoomOut').onclick=()=>changeZoom(.8);$('toggleSidebar').onclick=()=>toggleSidebar();$('clearSelection').onclick=clearSelection;
window.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase(),editing=e.target.matches?.('input,textarea,select,button,a,summary,[contenteditable=true]');if(editing&&k!=='escape')return;const step=35/zoom,a=viewMode==='oblique'?yaw:0;let used=true;switch(k){case 'a':case 'arrowleft':pan(-step*Math.cos(a),step*Math.sin(a));break;case 'd':case 'arrowright':pan(step*Math.cos(a),-step*Math.sin(a));break;case 'w':case 'arrowup':pan(-step*Math.sin(a),-step*Math.cos(a));break;case 's':case 'arrowdown':pan(step*Math.sin(a),step*Math.cos(a));break;case '+':case '=':changeZoom(1.2);break;case '-':changeZoom(1/1.2);break;case 'm':mode(viewMode==='plan'?'oblique':'plan');break;case 'home':resetCamera();break;case 'f':focusSelection();break;case 'i':toggleSidebar();break;case '/':if(production){toggleSidebar(true);$('searchSource').focus();}break;case 'escape':clearSelection();document.activeElement?.blur();break;case '1':case '2':case '3':if(production){const v=k==='1'?'out':k==='2'?'in':'mathlib';$('channels').value=v;channel=v;if(k==='3'&&selectedId)selectComplex(selectedId,selectedId+'::mathlib-station',true);drawDependencies();}break;default:used=false;}if(used)e.preventDefault();});
if(production){
 sourceUI=createSourceInspector({production,roleNames,subjectColors,onSelect:(id,b,focus)=>selectComplex(id,b,focus),onFilter:setFilter,onChannel:v=>{channel=v;drawDependencies();}});
 $('evidenceMode').onchange=()=>{evidenceMode=$('evidenceMode').value;updateEvidence();};
 setupResearchSearch(production,(id,b,focus)=>selectComplex(id,b,focus));
 $('historyTools').addEventListener('toggle',()=>{if($('historyTools').open&&!$('historyTools').dataset.loaded){$('historyTools').dataset.loaded='true';setupHistory(production);}});
 $('status').textContent=($('three').dataset.error?'3D unavailable; flat plan active · ':'')+layout.version+' · '+layout.sites.length+' source complexes · '+layout.buildings.length+' role buildings · '+layout.boroughs.length+' boroughs · '+model.source.revision.slice(0,12);
 $('caption').textContent='Click a coloured source building or cyan Mathlib station. Neutral buildings are civic scenery. Drag to pan · wheel or +/− to zoom · WASD/arrows to move · F focus · M map/city · I sidebar · / search · 1/2/3 dependency channels · Esc clear.';
 const area=params.get('area');if(area&&model.areas.includes(area)){ $('subject').value=area;sourceUI.filter(area);}
 const initial=params.get('complex'),building=params.get('building');if(initial&&siteById.has(initial)){const valid=buildingById.get(building)?.complexId===initial||building===initial+'::mathlib-station';selectComplex(initial,valid?building:null,true);}
}else{
 $('status').textContent='Architectural study · no mathematical identities';
 $('sourceControls').hidden=true;$('capacity').textContent='Illustrative skyline; return to the homepage for the live source city.';
}
