import * as THREE from 'three';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineGeometry} from 'three/addons/lines/LineGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {roleKeys,channels as linkColors,visibleModuleLinks,stationEvidence,stationRoleLinks} from './geneva-legibility.js';
import {fitSkyline,landingZoom} from './geneva-landing-frame.js';
import {districtColor,districtAreas,districtMotionAllowed} from './geneva-district-palette.js';
import {createDistrictLights} from './geneva-district-lighting.js';
import {boroughEnvelopes,meshPlanOutline,roofOutline} from './geneva-topdown-plan.js';
import {visibleCity,excludedArea} from './geneva-city-scope.js';
import {breathingCity,rolePattern} from './geneva-breathing-city.js';
import {networkRows,createBeamNetwork,beamMotionAllowed,beamCurve} from './geneva-beam-network.js';
import {masterplan,validatePlan,capacity,VERSION} from './geneva-g1-geometry.js';
import {roleNames} from './city-v2-model.js';
import {subjectColors} from './geneva-production-layout.js';
import {createSourceInspector} from './geneva-source-inspector.js';
import {setupResearchSearch} from './geneva-research-search.js';
import {setupHistory} from './geneva-history-ui.js';
import {complexEvidence,palettes} from './geneva-evidence.js';
import {setupApiMaps} from './geneva-api-map-panel.js';
import {districtKey,districtBounds,detailPlan} from './geneva-lod.js';
import {navigationKeys,navigationDelta,normalizeYaw} from './geneva-navigation.js';
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
const model=production?.model,layout=breathingCity(visibleCity(production?.layout),model);
let selectedId=null,selectedBuilding=null,selectedDeclaration=null,channel='both',filter='all',zoom=1,focusX=0,focusZ=0,dependencyGroup=null,sourceUI=null;
const siteById=new Map((layout?.sites||[]).map(t=>[t.id,t])),buildingById=new Map([...(layout?.buildings||[]),...(layout?.stations||[])].map(t=>[t.id,t]));
const semanticMeshes=[],subjectSprites=[],mapParts=[],lodMeshes=[];
const complexById=new Map((model?.complexes||[]).map(c=>[c.id,c]));
let roleMarkerGroup=null;const roleTextures=new Map();
let beamMesh=null,beamScene=null,beamRenderer=null,districtLights=null,overviewFrame=null,previousChannel='both',networkKey='',motionPaused=false;const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let activeApiMap=null,apiMapGroup=null,apiMapUI=null;
const geometryMode='full';
let evidenceMode='off',evidenceMeshes=[];
const tallest=new Map();for(const t of layout?.buildings||[])if(!tallest.has(t.complexId)||t.h>tallest.get(t.complexId).h)tallest.set(t.complexId,t);
const evidenceById=new Map((model?.complexes||[]).map(c=>[c.id,complexEvidence(production,c)]));
let redrawVersion=0,renderedFrames=0;const quality='high';const invalidate=()=>{redrawVersion++;};

const ns='http://www.w3.org/2000/svg',el=(tag,attrs={},parent)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(parent)parent.append(e);return e;};
const pts=p=>p.map(v=>v.join(',')).join(' ');
const svg=el('svg',{viewBox:'-30 -30 1060 860',role:'img','aria-label':'North-up architectural plan of the source city with coloured physics boroughs','data-city-projection':'north-up'},$('map'));
const synthKit=buildSynthKit(THREE),roofMeshes=Object.fromEntries(Object.entries(synthKit).map(([id,geo])=>[id,meshPlanOutline(geo)]));
el('rect',{x:-30,y:-30,width:1060,height:860,fill:'#172730'},svg);
for(const s of p.sectors)el('polygon',{points:pts(s.polygon),fill:'#303e47'},svg);
const boroughDefs=el('defs',{},svg),boroughLayer=el('g',{'pointer-events':'none','aria-label':'Physics boroughs derived from occupied city parcels'},svg);
for(const sector of p.sectors){const clip=el('clipPath',{id:'borough-bank-'+sector.id},boroughDefs);el('polygon',{points:pts(sector.polygon)},clip);}
const envelopes=boroughEnvelopes(layout?.sites||[],p.frame,{buffer:10});
for(const region of envelopes){const color=districtColor(region.area);if(!color)continue;const group=el('g',{'data-borough-area':region.area,'data-borough-library':region.library,'data-borough-sites':region.siteIds.length,'data-borough-cells':region.cells,'clip-path':'url(#borough-bank-'+region.library+')'},boroughLayer);
 el('path',{d:region.path,fill:color,opacity:.24,'data-borough-fill':'true'},group);el('path',{d:region.boundary,fill:'none',stroke:color,'stroke-width':.65,'stroke-linejoin':'round','stroke-linecap':'round',opacity:.66,'data-borough-boundary':'true'},group);mapParts.push({element:group,area:region.area});}
el('polygon',{points:pts(p.water),fill:'#193f54'},svg);
for(const q of p.parks)el('polygon',{points:pts(q.polygon),fill:'#324f43',stroke:'#263d36','stroke-width':1},svg);
for(const q of p.shorelines)el('polyline',{points:pts(q),fill:'none',stroke:'#596a73','stroke-width':5,'stroke-linejoin':'round'},svg);
for(const b of p.bridges){for(const [width,color] of [[b.width+3,'#4c535a'],[b.width,'#d0d0d0']])el('line',{x1:b.a[0],y1:b.a[1],x2:b.b[0],y2:b.b[1],stroke:color,'stroke-width':width,'stroke-linecap':'round'},svg);}
const towers=layout?[...layout.decorativeTowers,...layout.buildings]:demoMassing(p),civic=layout?layout.civic:civicFabric(p,towers);
const bounds=districtBounds(towers);
const roadGroups=new Map();for(const road of civic.roads){const width=road.width||5,paths=roadGroups.get(width)||[];paths.push('M'+road.a.join(' ')+'L'+road.b.join(' '));roadGroups.set(width,paths);}
const roadLayer=el('g',{'data-plan-roads':civic.roads.length,'pointer-events':'none'},svg);
for(const [width,paths] of roadGroups)el('path',{d:paths.join(''),fill:'none',stroke:'#637078','stroke-width':width+.5,'stroke-linecap':'round','stroke-linejoin':'round'},roadLayer);
for(const [width,paths] of roadGroups)el('path',{d:paths.join(''),fill:'none',stroke:'#202d36','stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'},roadLayer);
const civicPlan=el('g',{'aria-label':'Illustrative civic buildings and public spaces'},svg);
for(const q of civic.plazas)el('circle',{cx:q.x,cy:q.z,r:q.r,fill:q.kind==='garden'?'#54705a':'#c4c9cb',stroke:'#92999d','stroke-width':.5},civicPlan);
for(const t of civic.infill){const g=el('g',{transform:'translate('+t.x+' '+t.z+') rotate('+(-t.angle*180/Math.PI)+')'},civicPlan);el('rect',{x:-t.w*.525,y:-t.d*.525,width:t.w*1.05,height:t.d*1.05,fill:['#78858d','#89939b','#687780','#76838c','#89949a'][t.style],stroke:'#45535e','stroke-width':.35},g);}
for(const t of civic.trees)el('circle',{cx:t.x,cy:t.z,r:t.r,fill:'#4d6856'},civicPlan);

const roofPalette=['#b8b8b8','#b9c1c8','#87959c','#a0a0a0','#e8e8e8'];
const massing2d=el('g',{'aria-label':'Source buildings, utility stations and illustrative tower massing'},svg);
for(const t of towers){
 const color=districtColor(t.area),imported=t.role==='provisional'?null:roofMeshes[synthModel(t)],outline=roofOutline(t,imported),group=el('g',{transform:'translate('+t.x+' '+t.z+') rotate('+(-t.angle*180/Math.PI)+')','data-roof-projection':imported?'mesh-outline':t.style===2||t.style===4?'round':'rectangular'},massing2d);
 // Renderer base slab and roof/body silhouette share its true plan transform.
 el('rect',{x:-t.w*.54,y:-t.d*.54,width:t.w*1.08,height:t.d*1.08,fill:'#4c5962',stroke:'#293740','stroke-width':.22},group);
 el('polygon',{points:pts(outline),fill:t.id&&color?color:roofPalette[t.style],opacity:t.id?.92:.66,stroke:t.id&&color?color:'#33424c','stroke-width':.46,'data-roof-outline':'true'},group);
 if(t.id){
  group.dataset.districtColor=color||'';group.dataset.mapBuilding=t.id;group.dataset.mapRole=t.role;group.dataset.rolePattern=String(rolePattern(t));group.dataset.basicBearing=String(!!t.basicBearing);group.style.cursor='pointer';
  const mark={stroke:'#e1edf2','stroke-width':.42,fill:'none',opacity:.85,'pointer-events':'none'},w=t.w*.22,d=t.d*.22,pattern=rolePattern(t);
  if(pattern===1)for(const x of [-w,0,w])el('line',{x1:x,y1:-d,x2:x,y2:d,...mark},group);
  else if(pattern===2)for(const x of [-w,w])for(const y of [-d,d])el('circle',{cx:x,cy:y,r:Math.min(w,d)*.27,fill:'#e1edf2',opacity:.85,'pointer-events':'none'},group);
  else if(pattern===3)for(const y of [-d,0,d])el('line',{x1:-w,y1:y,x2:w,y2:y,...mark},group);
  else if(pattern===4)el('rect',{x:-w,y:-d,width:2*w,height:2*d,...mark},group);
  if(t.basicBearing)el('circle',{cx:0,cy:0,r:Math.min(w,d)*.42,fill:'#fff3db',stroke:'#26353d','stroke-width':.25,'pointer-events':'none','data-basic-marker':'true'},group);
  group.addEventListener('click',()=>enterFromMap(t.complexId,t.id));mapParts.push({element:group,area:t.area});const title=el('title',{},group);title.textContent=(roleNames[t.role]||t.role)+' · '+t.complexId+' · '+t.area;
 }
}
for(const t of layout?.stations||[]){const evidence=stationEvidence(complexById.get(t.complexId)),g=el('g',{transform:'translate('+t.x+' '+t.z+') rotate('+(-t.angle*180/Math.PI)+')','data-mathlib-station':evidence.active?'active':'empty'},massing2d);const r=Math.max(t.w,t.d)*.55;el('circle',{r:r*1.35,fill:evidence.active?'#3ce4d5':'#aab3bf',opacity:.18,'pointer-events':'none'},g);el('rect',{x:-t.w/2,y:-t.d/2,width:t.w,height:t.d,rx:.4,fill:'#183b40',stroke:evidence.active?'#3ce4d5':'#87959c','stroke-width':.55},g);el('path',{d:'M0 '+(-r)+' L'+r+' 0 L0 '+r+' L'+(-r)+' 0 Z',fill:evidence.active?'#a4fff3':'#aab3bf',stroke:'#19363a','stroke-width':.55},g);const title=el('title',{},g);title.textContent='Mathlib power station · '+evidence.count+' unique direct module imports · '+t.complexId;g.style.cursor='pointer';g.dataset.mapBuilding=t.id;g.addEventListener('click',()=>enterFromMap(t.complexId,t.id));mapParts.push({element:g,area:t.area});}
const apiMapLayer=el('g',{'pointer-events':'none','data-api-overlay':'true'},svg);
const declarationMapLayer=el('g',{'pointer-events':'none','data-declaration-links':'true'},svg);
const globalMapLayer=el('g',{'pointer-events':'none','data-global-network':'true'},svg);
const moduleMapLayer=el('g',{'pointer-events':'none','data-module-links':'true'},svg);
const roleMapLayer=el('g',{'pointer-events':'none','data-role-markers':'true'},svg);
const defs=el('defs',{},svg);for(const [key,color] of Object.entries(linkColors)){const marker=el('marker',{id:'link-arrow-'+key,markerWidth:8,markerHeight:8,refX:7,refY:4,orient:'auto',markerUnits:'userSpaceOnUse',viewBox:'0 0 8 8'},defs);el('path',{d:'M0 0 L8 4 L0 8 L2 4 Z',fill:color,stroke:'#24353d','stroke-width':.6},marker);}
const selection2d=el('ellipse',{'pointer-events':'none',fill:'none',stroke:'#ff9b41','stroke-width':2.5,'data-selection':'active',visibility:'hidden'},svg);
const evidenceDots=[];const evidenceLayer=el('g',{'pointer-events':'none','aria-hidden':'true'},svg);
for(const [id,t] of tallest){const dot=el('circle',{cx:t.x,cy:t.z,r:Math.max(2,Math.min(4,t.w*.32)),stroke:'#26313a','stroke-width':.8,'data-evidence':id},evidenceLayer);evidenceDots.push({id,area:t.area,dot});}
evidenceLayer.style.display='none';
const labelGroup=el('g',{'font-family':'system-ui, sans-serif'},svg);
function label(x,y,txt,sub='',water=false){const g=el('g',{transform:'translate('+x+' '+y+')'},labelGroup);const t=el('text',{'text-anchor':'middle','font-size':water?23:29,'font-weight':water?500:700,fill:water?'#f0f4f4':'#202c34','paint-order':'stroke',stroke:water?'#426f81':'#a9afb1','stroke-width':3},g);t.textContent=txt;if(sub){const s=el('text',{y:24,'text-anchor':'middle','font-size':17,fill:'#34424b','paint-order':'stroke',stroke:'#a9afb1','stroke-width':2},g);s.textContent=sub;}}
for(const s of p.sectors)label(...s.label,s.id);
for(const b of layout?.boroughs||[]){const t=el('text',{x:b.x,y:b.z,'text-anchor':'middle','font-size':10,'font-weight':700,fill:districtColor(b.area)||b.color,stroke:'#172730','stroke-width':2.7,'paint-order':'stroke'},labelGroup);t.textContent=b.area.replace(/([a-z])([A-Z])/g,'$1 $2');mapParts.push({element:t,area:b.area});}
el('path',{d:'M953 746V704L944 720M953 704L962 720',fill:'none',stroke:'#202c34','stroke-width':3},labelGroup);const north=el('text',{x:953,y:692,'text-anchor':'middle','font-size':18,fill:'#202c34'},labelGroup);north.textContent='N';
$('status').textContent=VERSION+' · '+(metrics.waterShare*100).toFixed(1)+'% water · '+metrics.bridges+' bridges · '+civic.infill.length+' civic buildings · '+civic.trees.length+' trees';
let scene,camera,renderer,hemi,sun,yaw=.65,labels=true,observer,frame,viewMode='oblique',massGroup,selection3d,started=0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function pan(dx,dz){const x=clamp(focusX+dx,-600,600),z=clamp(focusZ+dz,-500,500);if(x===focusX&&z===focusZ)return;focusX=x;focusZ=z;updatePlanCamera();invalidate();}
function changeZoom(factor){const next=clamp(zoom*factor,.75,9);if(next===zoom)return;zoom=next;updatePlanCamera();invalidate();}
function turn(angle){if(viewMode!=='oblique'||!angle)return;yaw=normalizeYaw(yaw+angle);invalidate();}
const heldKeys=new Set();
function navigate(keys,dt){const d=navigationDelta(keys,viewMode,yaw,zoom,dt);if(d.dx||d.dz)pan(d.dx,d.dz);if(d.rotation)turn(d.rotation);if(d.factor!==1)changeZoom(d.factor);}
function updatePlanCamera(){const w=1060/zoom,h=860/zoom;svg.setAttribute('viewBox',`${500+focusX-w/2} ${400+focusZ-h/2} ${w} ${h}`);const marker=$('mapCameraMarker');if(marker)marker.setAttribute('transform',`translate(${500+focusX} ${400+focusZ}) rotate(${-yaw*180/Math.PI}) scale(${1/Math.sqrt(zoom)})`);}
let sidebarWidth=360;
function toggleSidebar(show){const aside=$('citySidebar'),next=show??aside.hidden;aside.hidden=!next;$('toggleSidebar').setAttribute('aria-expanded',String(next));$('toggleSidebar').textContent=next?'Explore ‹':'Explore ›';}
function setSidebarWidth(w){const limit=Math.max(280,Math.min(760,innerWidth-24));sidebarWidth=clamp(w,280,limit);document.documentElement.style.setProperty('--sidebar-width',sidebarWidth+'px');const grip=$('sidebarGrip');grip.setAttribute('aria-valuemax',String(limit));grip.setAttribute('aria-valuenow',String(Math.round(sidebarWidth)));const expanded=sidebarWidth>=Math.min(620,limit);$('expandSidebar').setAttribute('aria-pressed',String(expanded));$('expandSidebar').textContent=expanded?'Reduce':'Enlarge';}
function setupSidebar(){const grip=$('sidebarGrip');let drag=null;grip.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,width:sidebarWidth};grip.setPointerCapture(e.pointerId);e.preventDefault();});grip.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId)setSidebarWidth(drag.width+drag.x-e.clientX);});for(const k of ['pointerup','pointercancel','lostpointercapture'])grip.addEventListener(k,()=>{drag=null;});grip.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){setSidebarWidth(sidebarWidth+(e.key==='ArrowLeft'?32:-32));e.preventDefault();e.stopPropagation();}});$('expandSidebar').onclick=()=>setSidebarWidth($('expandSidebar').getAttribute('aria-pressed')==='true'?360:Math.min(680,innerWidth-24));$('closeSidebar').onclick=()=>{toggleSidebar(false);$('toggleSidebar').focus();};window.addEventListener('resize',()=>setSidebarWidth(sidebarWidth));setSidebarWidth(sidebarWidth);}
function updateSelection(){const t=buildingById.get(selectedBuilding)||siteById.get(selectedId);selection2d.setAttribute('visibility',t?'visible':'hidden');if(t){selection2d.setAttribute('cx',t.x);selection2d.setAttribute('cy',t.z);selection2d.setAttribute('rx',t.w*.65+1);selection2d.setAttribute('ry',t.d*.65+1);}if(selection3d){selection3d.visible=!!t;if(t){selection3d.position.set(t.x-500,.65,t.z-400);selection3d.scale.set(t.w*.65+1,t.d*.65+1,1);}}$('selectionStatus').textContent=selectedDeclaration?'Declaration · '+selectedDeclaration.origin.id+' · '+(selectedDeclaration.origin.placement==='inferred-role'?'inferred role':'owning complex'):t?(selectedBuilding===selectedId+'::mathlib-station'?'Mathlib power station · ':selectedBuilding?(roleNames[t.role]||'Building')+' · ':'Complex · ')+selectedId:'No selection';drawRoleMarkers();invalidate();}
function clearSelection(){selectedId=selectedBuilding=selectedDeclaration=null;sourceUI?.clearDeclaration();sourceUI?.clear();const url=new URL(location.href);url.searchParams.delete('complex');url.searchParams.delete('building');url.searchParams.delete('declaration');history.replaceState(null,'',url);updateSelection();drawDependencies();}
function focusSelection(){if(selectedId)selectComplex(selectedId,selectedBuilding,true,selectedDeclaration);else{zoom=4;updatePlanCamera();invalidate();}}
function resetCamera(){focusX=focusZ=0;zoom=1;if(viewMode==='oblique'){yaw=.65;if(overviewFrame){focusX=overviewFrame.x;focusZ=overviewFrame.z;}}updatePlanCamera();invalidate();}
function enterFromMap(id,building){selectComplex(id,building,true);mode('oblique');}
function enterMapPoint(e){if(e.target.closest?.('[data-map-building]'))return;const matrix=svg.getScreenCTM();if(!matrix)return;const pt=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());focusX=clamp(pt.x-500,-600,600);focusZ=clamp(pt.y-400,-500,500);zoom=Math.max(zoom,3);mode('oblique');}
function installDrag(target,move,orbit=null){
 const pointers=new Map();let dragged=false,origin=null,previousDistance=0;
 target.style.touchAction='none';
 const distance=()=>{const [a,b]=[...pointers.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;};
 target.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0&&!(orbit&&e.button===2))return;if(!pointers.size){dragged=false;origin={x:e.clientX,y:e.clientY};}pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,rotate:!!orbit&&(e.button===2||e.shiftKey)});if(pointers.size===2){dragged=true;previousDistance=distance();for(const id of pointers.keys())try{target.setPointerCapture(id);}catch{}}});
 target.addEventListener('pointermove',e=>{const old=pointers.get(e.pointerId);if(!old)return;const dx=e.clientX-old.x,dy=e.clientY-old.y;pointers.set(e.pointerId,{...old,x:e.clientX,y:e.clientY});
  if(pointers.size>=2){const next=distance();if(previousDistance>0&&next>0)changeZoom(next/previousDistance);previousDistance=next;return;}
  if(!dragged&&origin&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)<5)return;
  if(!dragged){dragged=true;try{target.setPointerCapture(e.pointerId);}catch{}target.style.cursor='grabbing';}
  if(old.rotate&&orbit)orbit(dx,dy);else move(dx,dy);
 });
 const finish=e=>{pointers.delete(e.pointerId);previousDistance=0;if(!pointers.size){origin=null;target.style.cursor='grab';}};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])target.addEventListener(event,finish);
 target.addEventListener('click',e=>{if(dragged){dragged=false;e.preventDefault();e.stopImmediatePropagation();}},true);
 if(orbit)target.addEventListener('contextmenu',e=>e.preventDefault());target.style.cursor='grab';
}
installDrag(svg,(dx,dy)=>{const rect=svg.getBoundingClientRect(),scale=Math.min(rect.width/1060,rect.height/860)*zoom;pan(-dx/scale,-dy/scale);});
svg.addEventListener('wheel',e=>{e.preventDefault();changeZoom(Math.exp(-e.deltaY*.001));},{passive:false});
svg.addEventListener('dblclick',enterMapPoint);
const mapMarker=el('g',{id:'mapCameraMarker','pointer-events':'none','aria-hidden':'true'},svg);el('circle',{r:9,fill:'#1c2531',stroke:'#ffb879','stroke-width':1.5,opacity:.92},mapMarker);el('path',{d:'M0 -7 L4 4 L0 2 L-4 4 Z',fill:'#ffb879'},mapMarker);updatePlanCamera();
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
 const disposeContacts=contactShadows(THREE,scene,[...towers,...civic.infill]);
 const civicDetail=renderCivicFabric(THREE,scene,civic,facade,surfaces);
 const batches=new Map(),dummy=new THREE.Object3D(),tinted=new Map(),beaconMaterials=new Map();
 function tintedFacade(t){if(!t.id)return facade[t.style];const key=t.area+'|'+t.style;if(!tinted.has(key)){const m=facade[t.style].clone();const color=new THREE.Color(districtColor(t.area)||t.color);m.color.lerp(color,.17);m.emissive.lerp(color,.55);applyFacadeProjection(m);tinted.set(key,m);}return tinted.get(key);}
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
  if(imported){part(t,imported,fac,0,h*.5+1,0,w,h,d);if(t.id)part(t,boxGeo,beacon(districtColor(t.area)||t.color),0,h+1.1,0,w*.22,.35,d*.22);continue;}
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
 const utilityBase=material('#183b40',.45),utilityInactive=material('#819397',.5),utilityLight=new THREE.MeshBasicMaterial({color:'#a4fff3',toneMapped:false}),utilityHalo=new THREE.MeshBasicMaterial({color:'#3ce4d5',transparent:true,opacity:.24,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
 const utilityRing=new THREE.RingGeometry(.44,.5,24),utilityGlowRing=new THREE.RingGeometry(.40,.5,24),utilityCylinder=new THREE.CylinderGeometry(.5,.5,1,16),utilityCone=new THREE.ConeGeometry(.5,1,12);
 for(const t of layout?.stations||[]){const active=stationEvidence(complexById.get(t.complexId)).active;part(t,boxGeo,utilityBase,0,.65,0,t.w,1.3,t.d);part(t,utilityCylinder,active?beacon('#3ce4d5'):utilityInactive,0,2.1,0,t.w*.72,1.6,t.d*.72);part(t,utilityCone,active?utilityLight:utilityInactive,0,3.3,0,t.w*.58,.9,t.d*.58);part(t,utilityRing,active?utilityLight:utilityInactive,0,2.8,0,t.w*.94,t.d*.94,1,-Math.PI/2);if(active)part(t,utilityGlowRing,utilityHalo,0,3.1,0,t.w*1.15,t.d*1.15,1,-Math.PI/2);}
 host.dataset.mathlibStations=String(layout?.stations.length||0);host.dataset.activeMathlibStations=String((layout?.stations||[]).filter(t=>stationEvidence(complexById.get(t.complexId)).active).length);
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
 dependencyGroup=new THREE.Group();scene.add(dependencyGroup);apiMapGroup=new THREE.Group();scene.add(apiMapGroup);roleMarkerGroup=new THREE.Group();scene.add(roleMarkerGroup);drawApiMap();
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
 camera=new THREE.OrthographicCamera(-650,650,550,-550,1,6000);renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;const disposeSky=installSkyEnvironment(THREE,renderer,scene);setDusk();for(const m of facade)m.emissiveIntensity=.65;for(const t of [surfaces.concrete,surfaces.asphalt])t.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());for(const m of facade){m.map.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());m.emissiveMap.anisotropy=m.map.anisotropy;}host.append(renderer.domElement);
 // Separate transparent GPU layer: beam-only frames never redraw the high-DPR city.
 beamScene=new THREE.Scene();try{beamRenderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});beamRenderer.setClearColor(0x000000,0);beamRenderer.outputColorSpace=THREE.SRGBColorSpace;beamRenderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));$('beamOverlay').append(beamRenderer.domElement);host.dataset.beamRenderer='overlay';}catch(e){beamRenderer=null;host.dataset.beamRenderer='static-fallback';console.warn('Animated overlay unavailable:',e.message);}
 if(layout?.buildings.length){districtLights=createDistrictLights(layout.buildings,{imported:t=>!!synthKit[synthModel(t)],outline:t=>roofMeshes[synthModel(t)]||null});scene.add(districtLights.cap);if(beamRenderer)beamScene.add(districtLights.blanket);else scene.add(districtLights.blanket);host.dataset.districtLightingMode='complex-blanket';host.dataset.roleLighting='static-role-patterns';host.dataset.basicBuildings=String(layout.buildings.filter(t=>t.basicBearing).length);host.dataset.breathing=JSON.stringify(layout.breathing);host.dataset.districtComplexes=String(new Set(districtLights.rows.map(r=>r.building.complexId)).size);host.dataset.districtLights=String(districtLights.rows.length);host.dataset.districtVisible=String(districtLights.rows.length);}
 renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','3D city. Arrow keys pan, plus and minus zoom, Home resets. Use the mathematics sidebar for keyboard selection.');
 function resize(){if(host.hidden||!host.clientWidth||!host.clientHeight)return;const w=host.clientWidth,h=host.clientHeight;const aspect=w/h,first=!overviewFrame;overviewFrame=fitSkyline(towers,aspect);const half=overviewFrame.half;if(first){focusX=overviewFrame.x;focusZ=overviewFrame.z;zoom=landingZoom(aspect);updatePlanCamera();}host.dataset.landingZoom=String(landingZoom(aspect));host.dataset.skylineFit=JSON.stringify(overviewFrame);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.zoom=zoom;camera.updateProjectionMatrix();const gl=renderer.getContext(),limit=Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),gl.getParameter(gl.MAX_TEXTURE_SIZE));const ratio=renderScale(quality,devicePixelRatio,w,h,limit);const current=renderer.getSize(new THREE.Vector2());if(current.x!==w||current.y!==h||renderer.getPixelRatio()!==ratio){renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);}if(beamRenderer){const size=beamRenderer.getSize(new THREE.Vector2());if(size.x!==w||size.y!==h)beamRenderer.setSize(w,h,false);}invalidate();}
 observer=new ResizeObserver(resize);observer.observe(host);resize();
 let prev=performance.now(),lastKey='',lastVersion=-1,lastBeamFrame=-Infinity,lastBeamVersion=-1,beamFrames=0;
 const gl=renderer.getContext(),beamGL=beamRenderer?.getContext();let renderFence=null,beamFence=null;
 function releaseFence(context,fence){if(fence)context.deleteSync(fence);}
 function fenceReady(context,fence){return !fence||context.clientWaitSync(fence,0,0)!==context.TIMEOUT_EXPIRED;}
 function submitFence(context){if(typeof context.fenceSync!=='function'||context.isContextLost())return null;const fence=context.fenceSync(context.SYNC_GPU_COMMANDS_COMPLETE,0);context.flush();return fence;}
 function syncMotion(){const visible=!host.hidden&&!document.hidden,moving=beamMotionAllowed({available:!!beamRenderer&&!!beamMesh,paused:motionPaused,reduced:reducedMotion.matches,visible,channel}),districtMoving=districtMotionAllowed({available:!!beamRenderer&&!!districtLights,paused:motionPaused,reduced:reducedMotion.matches,visible});host.dataset.beamAnimated=String(moving);host.dataset.districtAnimated=String(districtMoving);if(beamMesh&&!moving){beamMesh.material.uniforms.uTime.value=0;host.dataset.beamTime='0';}if(districtLights&&!districtMoving){districtLights.blanket.material.uniforms.uTime.value=0;districtLights.blanket.material.uniforms.uMoving.value=0;host.dataset.districtTime='0';}invalidate();}
 reducedMotion.addEventListener('change',syncMotion);document.addEventListener('visibilitychange',syncMotion);
 function draw(now){
  const dt=Math.min(.12,(now-prev)/1000);prev=now;if(!document.hidden&&heldKeys.size)navigate(heldKeys,dt);
  if(!document.hidden&&!host.hidden){
   const anim=massGroup&&massGroup.scale.y<1;
   if(anim){const t=Math.min(1,(now-started)/850);massGroup.scale.y=1-Math.pow(1-t,3)*.98;}
   const key=[viewMode,yaw,focusX,focusZ,zoom,labels,filter,massGroup.scale.y,quality,geometryMode].join('|');
   const moving=beamMotionAllowed({available:!!beamRenderer&&!!beamMesh,paused:motionPaused,reduced:reducedMotion.matches,visible:true,channel});
   const districtMoving=districtMotionAllowed({available:!!beamRenderer&&!!districtLights,paused:motionPaused,reduced:reducedMotion.matches,visible:true});
   host.dataset.beamAnimated=String(moving);host.dataset.districtAnimated=String(districtMoving);
   const cityDirty=key!==lastKey||redrawVersion!==lastVersion;
   if(cityDirty&&fenceReady(gl,renderFence)){
    releaseFence(gl,renderFence);renderFence=null;
    const pitch=Math.PI*.19,d=1550,a=yaw;
    camera.position.set(focusX+Math.sin(a)*d*Math.cos(pitch),d*Math.sin(pitch),focusZ+Math.cos(a)*d*Math.cos(pitch));camera.lookAt(focusX,0,focusZ);camera.zoom=zoom;camera.updateProjectionMatrix();
    for(const o of scene.children)if(o.userData.isLabel)o.visible=labels&&(!o.userData.area||filter==='all'||filter===o.userData.area);
    if(beamMesh&&!beamRenderer){beamMesh.material.uniforms.uTime.value=0;beamMesh.material.uniforms.uResolution.value.set(host.clientWidth,host.clientHeight);}
    const lod=updateLod(),renderStart=performance.now();renderer.render(scene,camera);renderFence=submitFence(gl);const cpuRenderMs=performance.now()-renderStart;renderedFrames++;
    host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);
    host.dataset.renderMetrics=JSON.stringify({...lod,lighting:'dusk',quality,cpuRenderMs,pixelRatio:renderer.getPixelRatio(),geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,canvasWidth:renderer.domElement.width,canvasHeight:renderer.domElement.height,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles});
    host.dataset.cameraPose=JSON.stringify({focusX,focusZ,zoom,yaw,viewMode});host.dataset.renderedFrames=String(renderedFrames);
    lastKey=key;lastVersion=redrawVersion;
   }
   // During motion only the overlay is submitted. Wait for the previous
   // overlay GPU workload without blocking DOM input or camera navigation.
   const beamDirty=lastBeamVersion!==lastVersion||(moving||districtMoving)&&now-lastBeamFrame>=1000/30;
   if(beamRenderer&&(beamMesh||districtLights)&&beamDirty&&fenceReady(beamGL,beamFence)){
    releaseFence(beamGL,beamFence);beamFence=null;
    if(beamMesh){beamMesh.material.uniforms.uTime.value=moving?now/1000:0;beamMesh.material.uniforms.uResolution.value.set(host.clientWidth,host.clientHeight);}
    if(districtLights){districtLights.blanket.material.uniforms.uTime.value=districtMoving?now/1000:0;districtLights.blanket.material.uniforms.uMoving.value=districtMoving?1:0;host.dataset.districtTime=String(districtLights.blanket.material.uniforms.uTime.value);}
    beamRenderer.render(beamScene,camera);beamFence=submitFence(beamGL);
    host.dataset.beamTime=String(beamMesh?.material.uniforms.uTime.value||0);host.dataset.beamFrames=String(++beamFrames);
    lastBeamVersion=lastVersion;lastBeamFrame=now;
   }
  }
  frame=requestAnimationFrame(draw);
 }
 frame=requestAnimationFrame(draw);
 document.addEventListener('visibilitychange',invalidate);
 installDrag(renderer.domElement,(dx,dy)=>{const scale=(camera.top-camera.bottom)/Math.max(1,host.clientHeight)/zoom,a=yaw,pitch=Math.PI*.19;pan(-dx*scale*Math.cos(a)-dy*scale*Math.sin(a)/Math.sin(pitch),dx*scale*Math.sin(a)-dy*scale*Math.cos(a)/Math.sin(pitch));},dx=>turn(-dx*.006));

 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 renderer.domElement.addEventListener('click',e=>{if(!production)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);for(const hit of ray.intersectObjects(semanticMeshes.filter(m=>m.visible),false)){const id=hit.object.userData.ids[hit.instanceId];if(id){selectComplex(id.complexId,id.id);break;}}});
 renderer.domElement.addEventListener('dblclick',()=>{if(selectedId)focusSelection();});
 renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();changeZoom(Math.exp(-e.deltaY*.001));},{passive:false});
 window.addEventListener('pagehide',e=>{if(e.persisted)return;cancelAnimationFrame(frame);observer.disconnect();releaseFence(gl,renderFence);if(beamRenderer){releaseFence(beamGL,beamFence);beamRenderer.dispose();beamRenderer.forceContextLoss();}reducedMotion.removeEventListener('change',syncMotion);document.removeEventListener('visibilitychange',syncMotion);renderer.dispose();renderer.forceContextLoss();});
 window.addEventListener('pageshow',e=>{if(e.persisted){resize();invalidate();}});
}
function mode(next){if(next!=='plan'&&next!=='oblique')return;invalidate();viewMode=next;updatePlanCamera();const three=next==='oblique';$('map').hidden=three;$('mapHint').hidden=three;$('mapDistrictKey').hidden=three;$('three').hidden=!three;$('beamOverlay').hidden=!three||!beamRenderer||(!beamMesh&&!districtLights);$('three').dataset.districtAnimated=String(districtMotionAllowed({available:!!beamRenderer&&!!districtLights,paused:motionPaused,reduced:reducedMotion.matches,visible:three&&!document.hidden}));$('three').dataset.beamAnimated=String(beamMotionAllowed({available:!!beamRenderer&&!!beamMesh,paused:motionPaused,reduced:reducedMotion.matches,visible:three&&!document.hidden,channel}));for(const k of ['plan','oblique'])$(k).setAttribute('aria-pressed',String(k===next));heldKeys.clear();$('turnLeft').hidden=!three;$('turnRight').hidden=!three;if(three){try{init3D();if(!beamMesh){networkKey='';refreshNetwork();}}catch(e){viewMode='plan';$('three').hidden=true;$('map').hidden=false;$('mapHint').hidden=false;$('mapDistrictKey').hidden=false;$('plan').setAttribute('aria-pressed','true');$('oblique').setAttribute('aria-pressed','false');$('three').dataset.error=e.message;$('status').textContent='3D unavailable: '+e.message+' — navigation map remains available.';}}}
$('plan').onclick=()=>mode('plan');$('oblique').onclick=()=>mode('oblique');$('labels').onclick=()=>{labels=!labels;labelGroup.style.display=labels?'':'none';$('labels').setAttribute('aria-pressed',String(labels));drawRoleMarkers();invalidate();};
function selectComplex(id,building=null,focus=false,declaration=null){
 if(!production)return;
 if(!siteById.has(id)){if(complexById.get(id)?.area===excludedArea){sourceUI?.inspect(id,null);toggleSidebar(true);}return;}
 const site=siteById.get(id);selectedDeclaration=declaration;if(!declaration)sourceUI?.clearDeclaration();
 if(filter!=='all'&&filter!==site.area)sourceUI?.filter('all');
 selectedId=id;selectedBuilding=buildingById.get(building)?.complexId===id?building:null;building=selectedBuilding;sourceUI?.inspect(id,building);updateSelection();
 const url=new URL(location.href);url.searchParams.set('complex',id);if(building)url.searchParams.set('building',building);else url.searchParams.delete('building');if(declaration)url.searchParams.set('declaration',declaration.origin.id);else url.searchParams.delete('declaration');
 if(url.href!==location.href)history.replaceState(null,'',url);
 if(focus){const t=buildingById.get(building)||siteById.get(id);focusX=t.x-500;focusZ=t.z-400;zoom=building?6:4;updatePlanCamera();invalidate();}
 drawDependencies();
}
function drawRoleMarkers(){
 roleMapLayer.replaceChildren();
 if(roleMarkerGroup)for(const o of [...roleMarkerGroup.children]){roleMarkerGroup.remove(o);o.material.dispose();}
 const c=complexById.get(selectedId),key=$('complexKey');key.replaceChildren();key.hidden=!c;
 if(!c){$('three').dataset.roleMarkers='0';return;}
 const title=document.createElement('strong');title.textContent=c.id.split('/').at(-1);key.append(title);
 const list=document.createElement('div');list.className='complex-role-list';key.append(list);
 function chip(text,id,code){const b=document.createElement('button');b.type='button';b.dataset.roleTarget=id;b.setAttribute('aria-pressed',String(selectedBuilding===id));const marker=document.createElement('b');marker.textContent=code;b.append(marker,document.createTextNode(text));b.onclick=()=>selectComplex(c.id,id,true);list.append(b);}
 const rows=layout.buildings.filter(t=>t.complexId===c.id);
 for(const t of rows){const role=roleKeys[t.role]||roleKeys.provisional;chip(role.label,t.id,role.code);
  const active=selectedBuilding===t.id,fill=active?'#ff9b41':'#172932',stroke=active?'#fff0ce':t.color;
  const mapMarker=el('g',{transform:'translate('+t.x+' '+t.z+')','data-role-marker':t.id},roleMapLayer);
  el('circle',{r:Math.max(2,Math.min(3.4,t.w*.48)),fill,stroke,'stroke-width':.85},mapMarker);const txt=el('text',{'text-anchor':'middle','dominant-baseline':'central','font-size':3.3,'font-weight':800,fill:active?'#172932':'#ffffff'},mapMarker);txt.textContent=role.code;
  if(roleMarkerGroup){
   if(!roleTextures.has(role.code)){const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#172932';ctx.beginPath();ctx.arc(64,64,58,0,2*Math.PI);ctx.fill();ctx.strokeStyle='#d9f2f5';ctx.lineWidth=6;ctx.stroke();ctx.font='bold 74px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ffffff';ctx.fillText(role.code,64,68);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;roleTextures.set(role.code,tex);}
   const s=new THREE.Sprite(new THREE.SpriteMaterial({map:roleTextures.get(role.code),color:active?'#ffb879':'#ffffff',depthTest:false,depthWrite:false,toneMapped:false}));s.position.set(t.x-500,t.h*1.23+5,t.z-400);s.scale.set(7,7,1);s.renderOrder=9;roleMarkerGroup.add(s);
  }
 }
 const evidence=stationEvidence(c);chip('Mathlib · '+evidence.count+' imports',c.id+'::mathlib-station','M');
 const note=document.createElement('small');note.textContent='Roles inferred from source commands · neutral scenery is not mathematical content.';key.append(note);
 roleMapLayer.style.display=labels&&(filter==='all'||filter===c.area)?'':'none';if(roleMarkerGroup)roleMarkerGroup.visible=labels&&(filter==='all'||filter===c.area);
 $('three').dataset.roleMarkers=String(rows.length);
}
function drawSolidPipe(curve,color,radius=1.05,arrow=true){
 if(!dependencyGroup)return;
 const material=new THREE.MeshBasicMaterial({color,toneMapped:false,depthTest:false,depthWrite:false});
 const outline=new THREE.Mesh(new THREE.TubeGeometry(curve,24,radius*1.48,6,false),new THREE.MeshBasicMaterial({color:'#20323e',depthTest:false,depthWrite:false,toneMapped:false}));outline.renderOrder=4;dependencyGroup.add(outline);
 const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,24,radius,8,false),material);tube.renderOrder=5;dependencyGroup.add(tube);
 if(arrow){const at=.78,point=curve.getPointAt(at),tangent=curve.getTangentAt(at).normalize(),tip=new THREE.Mesh(new THREE.ConeGeometry(radius*2.65,radius*5.5,10),material.clone());tip.position.copy(point);tip.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tangent);tip.renderOrder=6;dependencyGroup.add(tip);}
}
function drawDashedPipe(curve,color,reverse=false){
 if(!dependencyGroup)return;
 const geom=new LineGeometry();geom.setPositions(curve.getPoints(32).flatMap(v=>[v.x,v.y,v.z]));
 const mat=new LineMaterial({color,linewidth:2.6,dashed:true,dashSize:5,gapSize:3,depthTest:false,depthWrite:false,toneMapped:false});
 const line=new Line2(geom,mat);line.computeLineDistances();line.renderOrder=6;dependencyGroup.add(line);
 const at=reverse?.22:.78,tip=new THREE.Mesh(new THREE.ConeGeometry(1.8,4,10),new THREE.MeshBasicMaterial({color,toneMapped:false,depthTest:false,depthWrite:false}));tip.position.copy(curve.getPointAt(at));tip.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),curve.getTangentAt(at).normalize().multiplyScalar(reverse?-1:1));tip.renderOrder=7;dependencyGroup.add(tip);
}
function mapPipe(layer,a,b,key,{dashed=false,bend=.12}={}){
 const dx=b.x-a.x,dz=b.z-a.z,path=`M${a.x} ${a.z} Q${(a.x+b.x)/2-dz*bend} ${(a.z+b.z)/2+dx*bend} ${b.x} ${b.z}`;
 el('path',{d:path,fill:'none',stroke:'#20323e','stroke-width':3.5,'vector-effect':'non-scaling-stroke',opacity:.8},layer);
 el('path',{d:path,fill:'none',stroke:linkColors[key],'stroke-width':2.2,'vector-effect':'non-scaling-stroke','stroke-dasharray':dashed?'5 3':'none','marker-end':'url(#link-arrow-'+key+')','data-pipe-channel':key},layer);
}
function updateLinkReadout(text){$('linkReadout').textContent=text;}
function refreshNetwork(){
 const host=$('three');$('togglePipes').setAttribute('aria-pressed',String(channel!=='off'));$('togglePipes').textContent=channel==='off'?'Pipes off':'Pipes on';
 const key=[filter,channel,selectedId||'',!!selectedDeclaration].join('|');if(key===networkKey)return;networkKey=key;
 if(beamMesh){beamMesh.removeFromParent();beamMesh.geometry.dispose();beamMesh.material.dispose();beamMesh=null;}
 globalMapLayer.replaceChildren();const rows=networkRows(model,layout,filter,channel,selectedId);let modules=0,utility=0;const counts={out:0,in:0,both:0,mathlib:0};
 for(const row of [...rows.filter(r=>!r.utility),...rows.filter(r=>r.utility)]){
  if(row.utility)utility++;else modules++;counts[row.key]++;
  const group=el('g',{'data-network-channel':row.key},globalMapLayer),a=row.from,b=row.to,dx=b.x-a.x,dz=b.z-a.z;
  const width=row.utility?(row.focused?4.2:2.1):row.focused?2.7:1.05,opacity=row.utility?(row.focused?.98:.90):row.focused?.95:selectedId?.12:.42;
  const draw=(path,color,extra={})=>el('path',{d:path,fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round','vector-effect':'non-scaling-stroke',opacity,...extra},group);
  const points=beamCurve(row,{outline:t=>roofMeshes[synthModel(t)]||null}).getSpacedPoints(18),path=pts=>pts.map((p,i)=>(i?'L':'M')+(p.x+500)+' '+(p.z+400)).join(' ');
  if(row.utility)draw(path(points),linkColors.mathlib);
  else if(row.key==='both'){draw(path(points.slice(0,10)),linkColors.out,{'data-pipe-end':'dependent'});draw(path(points.slice(9)),linkColors.in,{'data-pipe-end':'prerequisite'});}
  else draw(path(points),linkColors[row.key]);
 }
 if(scene&&rows.length){beamMesh=createBeamNetwork(rows,{selected:!!selectedId,outline:t=>roofMeshes[synthModel(t)]||null});(beamRenderer?beamScene:scene).add(beamMesh);}
 $('beamOverlay').hidden=!beamRenderer||(!beamMesh&&!districtLights)||viewMode!=='oblique';
 host.dataset.networkGeometry='architectural-skywalk';host.dataset.networkModulePipes=String(modules);host.dataset.networkMathlibPipes=String(utility);host.dataset.networkChannels=JSON.stringify(counts);host.dataset.beamAnimated='false';host.dataset.beamTime='0';
}
function drawDependencies(){
 refreshNetwork();invalidate();declarationMapLayer.replaceChildren();moduleMapLayer.replaceChildren();$('three').dataset.declarationArcs='0';$('three').dataset.modulePipes='0';$('three').dataset.mathlibPipes='0';updateLinkReadout(channel==='off'?'Pipes hidden':'City network · '+$('three').dataset.networkModulePipes+' directed complex imports · '+$('three').dataset.networkMathlibPipes+' utility connections');
 if(dependencyGroup)for(const o of [...dependencyGroup.children]){dependencyGroup.remove(o);o.geometry?.dispose();o.material?.dispose();}
 if(!production||!selectedId||channel==='off')return;
 if(selectedDeclaration){drawDeclarationDependencies();return;}
 const c=siteById.get(selectedId),vec=(t,y)=>new THREE.Vector3(t.x-500,y,t.z-400),top=t=>Math.max(8,(tallest.get(t.id)?.h||0)*1.23)+3;
 const links=visibleModuleLinks(model.edges,selectedId,channel,filter,siteById);
 let count=0;
 for(const direction of ['out','in'])for(const e of links[direction]){
  const a=siteById.get(e.from),b=siteById.get(e.to),start=vec(a,top(a)),end=vec(b,top(b)),mid=start.clone().lerp(end,.5),dx=b.x-a.x,dz=b.z-a.z;
  mid.y+=Math.min(125,25+start.distanceTo(end)*.15);mid.x-=dz*.08;mid.z+=dx*.08;
  mapPipe(moduleMapLayer,a,b,direction,{bend:.045});count++;
 }
 const station=layout.stations.find(t=>t.complexId===selectedId),complex=complexById.get(selectedId),evidence=stationEvidence(complex);let utilityCount=0;
 if(station&&evidence.active&&(filter==='all'||c.area===filter)){
  const buildings=stationRoleLinks(complex,layout.buildings);
  for(const b of buildings){const points=beamCurve({from:b,to:station,utility:true},{outline:t=>roofMeshes[synthModel(t)]||null}).getSpacedPoints(18),path=points.map((p,i)=>(i?'L':'M')+(p.x+500)+' '+(p.z+400)).join(' ');el('path',{d:path,fill:'none',stroke:linkColors.mathlib,'stroke-width':3.2,'stroke-linecap':'round','stroke-linejoin':'round','vector-effect':'non-scaling-stroke','data-pipe-channel':'mathlib','marker-end':'url(#link-arrow-mathlib)'},moduleMapLayer);utilityCount++;}
 }
 $('three').dataset.modulePipes=String(count);$('three').dataset.mathlibPipes=String(utilityCount);
 updateLinkReadout('Module imports · '+links.out.length+'/'+links.totalOut+' uses · '+links.in.length+'/'+links.totalIn+' used by · '+evidence.count+' Mathlib module imports (role links by cited source modules).');
}
function drawDeclarationDependencies(){
 if(channel==='mathlib')return;
 const n=selectedDeclaration,origin=buildingById.get(n.origin.building)||siteById.get(n.origin.complex);if(!origin)return;
 let drawn=0;const visible={out:0,in:0};
 for(const direction of ['out','in']){if(channel!=='both'&&channel!==direction)continue;
  const key=direction==='out'?'declarationOut':'declarationIn',color=linkColors[key];
  for(const entry of n.groups.filter(x=>x.direction===direction&&(filter==='all'||siteById.get(x.complex)?.area===filter)).slice(0,14)){
   const target=siteById.get(entry.complex);if(!target)continue;
   const dx=target.x-origin.x,dz=target.z-origin.z,bend=direction==='out'?.12:-.12;
   mapPipe(declarationMapLayer,direction==='out'?origin:target,direction==='out'?target:origin,key,{dashed:true,bend:.12});
   if(dependencyGroup){const from=new THREE.Vector3(origin.x-500,Math.max(10,(origin.h||tallest.get(n.origin.complex)?.h||10)*1.23)+5,origin.z-400),to=new THREE.Vector3(target.x-500,Math.max(10,(tallest.get(entry.complex)?.h||10)*1.23)+5,target.z-400),mid=from.clone().lerp(to,.5);mid.y+=Math.min(100,18+from.distanceTo(to)*.13);mid.x-=dz*bend;mid.z+=dx*bend;drawDashedPipe(new THREE.QuadraticBezierCurve3(from,mid,to),color,direction==='in');}
   drawn++;visible[direction]++;
  }
 }
 $('three').dataset.declarationArcs=String(drawn);updateLinkReadout('Declaration relationships (may be routed) · '+visible.out+' prerequisite complexes · '+visible.in+' dependent complexes · up to 14 per direction; full records in sidebar.');
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
function setFilter(value){filter=value;if(districtLights){const idx=districtAreas.indexOf(value);districtLights.cap.material.uniforms.uArea.value=idx;districtLights.blanket.material.uniforms.uArea.value=idx;$('three').dataset.districtVisible=String(districtLights.rows.filter(r=>value==='all'||r.building.area===value).length);}for(const m of mapParts)m.element.style.display=value==='all'||m.area===value?'':'none';updateEvidence();drawDependencies();drawApiMap();drawRoleMarkers();}
function drawApiMap(){
 apiMapLayer.replaceChildren();if(apiMapGroup)for(const o of [...apiMapGroup.children]){apiMapGroup.remove(o);o.geometry.dispose();o.material.dispose();}
 let count=0;for(const entry of activeApiMap?.complexes||[]){const s=siteById.get(entry.id);if(!s||(filter!=='all'&&s.area!==filter))continue;count++;
  el('ellipse',{cx:s.x,cy:s.z,rx:s.w*.66+2,ry:s.d*.66+2,fill:'none',stroke:'#d6a8ff','stroke-width':2,'stroke-dasharray':'4 2','data-api-complex':entry.id},apiMapLayer);
  if(apiMapGroup){const mesh=new THREE.Mesh(new THREE.RingGeometry(.87,1,32),new THREE.MeshBasicMaterial({color:'#d6a8ff',side:THREE.DoubleSide,depthTest:false,transparent:true,opacity:.88}));mesh.rotation.x=-Math.PI/2;mesh.position.set(s.x-500,.85,s.z-400);mesh.scale.set(s.w*.66+2,s.d*.66+2,1);mesh.renderOrder=7;apiMapGroup.add(mesh);}
 }
 $('three').dataset.apiMapMarkers=String(count);invalidate();
}
function setApiMap(map){activeApiMap=map;const url=new URL(location.href);if(map){url.searchParams.set('apiMap',map.path);if(filter!=='all')sourceUI?.filter('all');}else url.searchParams.delete('apiMap');history.replaceState(null,'',url);drawApiMap();}
function setDusk(){invalidate();if(!scene)return;scene.background.set('#273849');hemi.intensity=.42;sun.intensity=.65;scene.environmentIntensity=.24;for(const m of massGroup.children.map(o=>o.material).filter(m=>m?.emissiveMap))m.emissiveIntensity=.65;renderer.toneMappingExposure=1.15;}
setupSidebar();
const stage=document.querySelector('.stage'),controls=document.querySelector('.controls'),selectionBar=document.querySelector('.selection-bar');
function fitHud(){stage.style.setProperty('--hud-top',Math.ceil(controls.getBoundingClientRect().bottom-stage.getBoundingClientRect().top+8)+'px');stage.style.setProperty('--hud-bottom',Math.ceil(stage.getBoundingClientRect().bottom-selectionBar.getBoundingClientRect().top+8)+'px');}
const hudObserver=new ResizeObserver(fitHud);hudObserver.observe(controls);hudObserver.observe(selectionBar);fitHud();
mode('oblique');drawDependencies();
for(const area of [...new Set((layout?.boroughs||[]).map(b=>b.area))].sort()){const color=districtColor(area);if(!color)continue;const row=document.createElement('span'),swatch=document.createElement('i');swatch.style.background=color;row.dataset.district=area;row.append(swatch,document.createTextNode(area.replace(/([a-z])([A-Z])/g,'$1 $2')));$('districtKey').append(row);$('mapDistrictLegend').append(row.cloneNode(true));}
$('togglePipes').onclick=()=>{if(channel==='off'){channel=previousChannel==='off'?'both':previousChannel;}else{previousChannel=channel;channel='off';}$('channels').value=channel;drawDependencies();};
$('pauseBeams').onclick=()=>{motionPaused=!motionPaused;$('pauseBeams').setAttribute('aria-pressed',String(motionPaused));$('pauseBeams').textContent=motionPaused?'Resume motion':'Pause motion';$('three').dataset.beamAnimated=String(beamMotionAllowed({available:!!beamRenderer&&!!beamMesh,paused:motionPaused,reduced:reducedMotion.matches,visible:!$('three').hidden&&!document.hidden,channel}));if(motionPaused&&beamMesh){beamMesh.material.uniforms.uTime.value=0;$('three').dataset.beamTime='0';}if(motionPaused&&districtLights){districtLights.blanket.material.uniforms.uTime.value=0;districtLights.blanket.material.uniforms.uMoving.value=0;$('three').dataset.districtTime='0';$('three').dataset.districtAnimated='false';}invalidate();};
$('resetView').onclick=resetCamera;$('focusSelection').onclick=focusSelection;$('zoomIn').onclick=()=>changeZoom(1.25);$('zoomOut').onclick=()=>changeZoom(.8);$('toggleSidebar').onclick=()=>toggleSidebar();$('clearSelection').onclick=clearSelection;$('showSelection').onclick=()=>toggleSidebar(true);$('turnLeft').onclick=()=>turn(-Math.PI/12);$('turnRight').onclick=()=>turn(Math.PI/12);
window.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase(),editing=e.target.closest?.('input,textarea,select,button,a,summary,[contenteditable=true],[role=separator]');
 if(editing&&k!=='escape')return;
 if(navigationKeys.has(k)){if(!heldKeys.has(k)){heldKeys.add(k);navigate(new Set([k]),.045);}e.preventDefault();return;}
 if(e.repeat)return;let used=true;switch(k){
 case 'm':mode(viewMode==='plan'?'oblique':'plan');break;case 'home':resetCamera();break;case 'f':focusSelection();break;case 'i':toggleSidebar();break;
 case '/':if(production){$('quickSearch').focus();}break;case 'escape':clearSelection();document.activeElement?.blur();break;
 case '1':case '2':case '3':if(production){const v=k==='1'?'out':k==='2'?'in':'mathlib';$('channels').value=v;channel=v;if(k==='3'&&selectedId)selectComplex(selectedId,selectedId+'::mathlib-station',true);drawDependencies();}break;
 default:used=false;}if(used)e.preventDefault();
});
window.addEventListener('keyup',e=>heldKeys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>heldKeys.clear());document.addEventListener('visibilitychange',()=>heldKeys.clear());
document.addEventListener('focusin',e=>{if(e.target.closest?.('input,textarea,select,[contenteditable=true],[role=separator]'))heldKeys.clear();});
if(production){
 apiMapUI=setupApiMaps(production,setApiMap,id=>{selectComplex(id,null,true);if(viewMode==='plan')mode('oblique');});
 sourceUI=createSourceInspector({production,roleNames,subjectColors,onApiMap:path=>apiMapUI.select(path),onSelect:(id,b,focus)=>selectComplex(id,b,focus),onFilter:setFilter,onChannel:v=>{channel=v;drawDependencies();},onTravel:n=>{if(channel==='mathlib'||channel==='off'){channel='both';$('channels').value=channel;}selectComplex(n.origin.complex,n.origin.building,true,n);toggleSidebar(true);if(viewMode==='plan')mode('oblique');},onResetDeclaration:()=>{selectedDeclaration=null;updateSelection();drawDependencies();}});
 const quick=$('quickSearch'),sourceSearch=$('searchSource');quick.disabled=false;
 quick.addEventListener('input',()=>{toggleSidebar(true);sourceSearch.value=quick.value;sourceSearch.dispatchEvent(new Event('input',{bubbles:true}));});
 sourceSearch.addEventListener('input',()=>{quick.value=sourceSearch.value;});
 quick.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();toggleSidebar(true);const first=$('sourceList').querySelector('button');(first||sourceSearch).focus();}else if(e.key==='Escape'){quick.blur();}});
 $('evidenceMode').onchange=()=>{evidenceMode=$('evidenceMode').value;updateEvidence();};
 setupResearchSearch(production,(id,b,focus)=>selectComplex(id,b,focus));
 $('historyTools').addEventListener('toggle',()=>{if($('historyTools').open&&!$('historyTools').dataset.loaded){$('historyTools').dataset.loaded='true';setupHistory(production);}});
 $('status').textContent=($('three').dataset.error?'3D unavailable; flat plan active · ':'')+layout.version+' · '+layout.sites.length+' source complexes visible ('+(production.layout.sites.length-layout.sites.length)+' excluded) · '+layout.buildings.length+' role buildings · '+layout.boroughs.length+' boroughs · '+model.source.revision.slice(0,12);
 $('caption').textContent='Animated dependency pipes are on by default. Select a complex to emphasise its real links and role markers; use Pipes to hide the network. Cyan diamond beacons identify Mathlib stations; neutral buildings are scenery. WASD move · ←/→ rotate · ↑/↓ zoom · drag to pan · right-drag or Shift-drag to rotate · wheel/pinch zoom · F focus · M map/city · I sidebar · / search · Esc clear.';
 const area=params.get('area');if(area&&area!==excludedArea&&model.areas.includes(area)){ $('subject').value=area;sourceUI.filter(area);}
 const initial=params.get('complex'),building=params.get('building'),declaration=params.get('declaration');if(initial&&complexById.get(initial)?.area===excludedArea){sourceUI.inspect(initial,null);toggleSidebar(true);}else if(initial&&siteById.has(initial)){const valid=buildingById.get(building)?.complexId===initial||building===initial+'::mathlib-station';selectComplex(initial,valid?building:null,true);}if(declaration){toggleSidebar(true);void sourceUI.restoreDeclaration(declaration);}const api=params.get('apiMap');if(api&&apiMapUI.select(api))toggleSidebar(true);
}else{
 $('status').textContent='Architectural study · no mathematical identities';
 $('sourceControls').hidden=true;$('capacity').textContent='Illustrative skyline; return to the homepage for the live source city.';
}
