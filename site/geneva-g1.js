import * as THREE from 'three';
import {masterplan,validatePlan,capacity,VERSION} from './geneva-g1-geometry.js';
import {buildCityV2} from './city-v2-model.js';
import {demoMassing} from './geneva-g1-massing.js';
import {civicFabric} from './geneva-civic-fabric.js';
import {renderCivicFabric} from './geneva-civic-render.js';
import {urbanSurfaceTextures,worldPlanarUV} from './geneva-urban-materials.js';
import {makeFacadeMaterials} from './city-v2-facades.js';
import {buildSynthKit,synthModel,addWindowEmission} from './geneva-synthcity-kit.js';
const $=id=>document.getElementById(id),p=masterplan(),metrics=validatePlan(p);
const ns='http://www.w3.org/2000/svg',el=(tag,attrs={},parent)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(parent)parent.append(e);return e;};
const pts=p=>p.map(v=>v.join(',')).join(' ');
const svg=el('svg',{viewBox:'-30 -30 1060 860',role:'img','aria-label':'Geneva masterplan with lake, Rhône, Arve and three library banks'},$('map'));
el('rect',{x:-30,y:-30,width:1060,height:860,fill:'#788582'},svg);
for(const s of p.sectors)el('polygon',{points:pts(s.polygon),fill:'#a9afb1'},svg);
el('polygon',{points:pts(p.water),fill:'#426f81'},svg);
for(const q of p.parks)el('polygon',{points:pts(q.polygon),fill:'#54705a',stroke:'#43594c','stroke-width':1},svg);
for(const q of p.shorelines)el('polyline',{points:pts(q),fill:'none',stroke:'#969ea1','stroke-width':7,'stroke-linejoin':'round'},svg);
for(const b of p.bridges){for(const [width,color] of [[b.width+3,'#4c535a'],[b.width,'#d0d0d0']])el('line',{x1:b.a[0],y1:b.a[1],x2:b.b[0],y2:b.b[1],stroke:color,'stroke-width':width,'stroke-linecap':'round'},svg);}
const towers=demoMassing(p),civic=civicFabric(p,towers);
const roadPath=civic.roads.map(r=>'M'+r.a.join(' ')+'L'+r.b.join(' ')).join(' ');
el('path',{d:roadPath,fill:'none',stroke:'#92999d','stroke-width':6,'stroke-linecap':'round','stroke-linejoin':'round'},svg);
el('path',{d:roadPath,fill:'none',stroke:'#4c535a','stroke-width':5,'stroke-linecap':'round','stroke-linejoin':'round'},svg);
const civicPlan=el('g',{'aria-label':'Illustrative civic buildings and public spaces'},svg);
for(const q of civic.plazas)el('circle',{cx:q.x,cy:q.z,r:q.r,fill:q.kind==='garden'?'#54705a':'#c4c9cb',stroke:'#92999d','stroke-width':.5},civicPlan);
for(const t of civic.infill){const g=el('g',{transform:'translate('+t.x+' '+t.z+') rotate('+(-t.angle*180/Math.PI)+')'},civicPlan);el('rect',{x:-t.w/2,y:-t.d/2,width:t.w,height:t.d,fill:['#b0b7bb','#c5cbd0','#969fa4','#aab0b4','#c5c9ca'][t.style],stroke:'#626b71','stroke-width':.35},g);}
for(const t of civic.trees)el('circle',{cx:t.x,cy:t.z,r:t.r,fill:'#4d6856'},civicPlan);

const roofPalette=['#b8b8b8','#b9c1c8','#87959c','#a0a0a0','#e8e8e8'];
const massing2d=el('g',{'aria-label':'Illustrative tower massing'},svg);
for(const t of towers){const g=el('g',{transform:'translate('+t.x+' '+t.z+') rotate('+(-t.angle*180/Math.PI)+')'},massing2d);el('rect',{x:-t.w*.5+3,y:-t.d*.5+4,width:t.w,height:t.d,fill:'#323b43',opacity:.25},g);el('rect',{x:-t.w/2,y:-t.d/2,width:t.w,height:t.d,fill:roofPalette[t.style],stroke:'#43594c','stroke-width':.6},g);el('rect',{x:-t.w*.23,y:-t.d*.24,width:t.w*.46,height:t.d*.48,fill:'#e8e8e8'},g);}
const labelGroup=el('g',{'font-family':'system-ui, sans-serif'},svg);
function label(x,y,txt,sub='',water=false){const g=el('g',{transform:'translate('+x+' '+y+')'},labelGroup);const t=el('text',{'text-anchor':'middle','font-size':water?23:29,'font-weight':water?500:700,fill:water?'#f0f4f4':'#202c34','paint-order':'stroke',stroke:water?'#426f81':'#a9afb1','stroke-width':3},g);t.textContent=txt;if(sub){const s=el('text',{y:24,'text-anchor':'middle','font-size':17,fill:'#34424b','paint-order':'stroke',stroke:'#a9afb1','stroke-width':2},g);s.textContent=sub;}}
for(const s of p.sectors)label(...s.label,s.name.toUpperCase(),s.id);
label(...p.anchors.lake,'Lac Léman','',true);label(424,374,'RHÔNE','',true);label(747,632,'ARVE','',true);
el('path',{d:'M130 552 L220 446',stroke:'#34424b','stroke-width':1.6,fill:'none'},labelGroup);label(105,572,'La Jonction');
el('path',{d:'M953 746V704L944 720M953 704L962 720',fill:'none',stroke:'#202c34','stroke-width':3},labelGroup);const north=el('text',{x:953,y:692,'text-anchor':'middle','font-size':18,fill:'#202c34'},labelGroup);north.textContent='N';
$('status').textContent=VERSION+' · '+(metrics.waterShare*100).toFixed(1)+'% water · '+metrics.bridges+' bridges · '+civic.infill.length+' civic buildings · '+civic.trees.length+' trees';
let scene,camera,renderer,rotating=false,yaw=0,labels=true,observer,frame,viewMode='north',massGroup,started=0;
function init3D(){
 if(renderer)return;
 const host=$('three');scene=new THREE.Scene();scene.background=new THREE.Color('#b9c8ce');
 scene.add(new THREE.HemisphereLight('#edf3ff','#6e7c84',1.65));const sun=new THREE.DirectionalLight('#fff1df',2.35);sun.position.set(-400,850,-200);scene.add(sun);
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
 const facade=makeFacadeMaterials(THREE),ivory=material('#e8e8e8'),metal=material('#909090',.35),glass=material('#687f76',.28),glow=new THREE.MeshStandardMaterial({color:'#ffb879',emissive:'#ff6a00',emissiveIntensity:.7});
 const boxGeo=new THREE.BoxGeometry(1,1,1),cylinderGeo=new THREE.CylinderGeometry(.5,.5,1,12),coneGeo=new THREE.ConeGeometry(.5,1,12),ringGeo=new THREE.TorusGeometry(.5,.035,5,20);
 const synthKit=buildSynthKit(THREE);addWindowEmission(THREE,facade);
 renderCivicFabric(THREE,scene,civic,facade,surfaces);
 const batches=new Map(),dummy=new THREE.Object3D();
 function part(t,geo,m,x,y,z,w,h,d,rx=0){const a=t.angle,c=Math.cos(a),s=Math.sin(a);dummy.position.copy(world(t.x+c*x+s*z,t.z-s*x+c*z,y));dummy.rotation.set(rx,a,0);dummy.scale.set(w,h,d);dummy.updateMatrix();const key=geo.uuid+'|'+m.uuid;if(!batches.has(key))batches.set(key,{geo,m,matrices:[]});batches.get(key).matrices.push(dummy.matrix.clone());}
 for(const t of towers){const {w,d,h,style}=t,fac=facade[style];
  part(t,boxGeo,ivory,0,1,0,w*1.08,2,d*1.08);
  const imported=synthKit[synthModel(t)];
  if(imported){part(t,imported,fac,0,h*.5+1,0,w,h,d);continue;}
  if(style===2){part(t,cylinderGeo,fac,0,h*.48,0,w,h*.92,d);part(t,cylinderGeo,ivory,0,h*.79,0,w*1.12,1.1,d*1.12);part(t,cylinderGeo,glass,0,h*.98,0,w*.83,h*.12,d*.83);part(t,coneGeo,metal,0,h*1.13,0,w*.38,h*.18,d*.38);}
  else if(style===3){part(t,boxGeo,fac,0,h*.36,0,w,h*.7,d);part(t,boxGeo,fac,0,h*.79,0,w*.64,h*.48,d*.64);part(t,boxGeo,ivory,0,h*.55,0,w*1.07,1.15,d*1.07);part(t,boxGeo,glow,0,h*1.03,0,w*.52,1,d*.52);}
  else if(style===4){part(t,cylinderGeo,ivory,0,h*.41,0,w*.58,h*.82,d*.58);part(t,cylinderGeo,glass,0,h*.85,0,w*1.02,h*.23,d*1.02);part(t,cylinderGeo,ivory,0,h*.99,0,w*1.04,1.3,d*1.04);part(t,ringGeo,metal,0,h*.98,0,w*1.12,d*1.12,1,Math.PI/2);part(t,coneGeo,metal,0,h*1.1,0,w*.21,h*.2,d*.21);}
  else{part(t,boxGeo,fac,0,h*.49,0,w*.84,h*.96,d*.86);for(const sign of [-1,1]){part(t,boxGeo,ivory,sign*w*.43,h*.48,0,w*.12,h*.95,d*.94);part(t,boxGeo,ivory,0,h*.48,sign*d*.44,w*.94,h*.95,d*.1);}part(t,boxGeo,ivory,0,h*.99,0,w*.98,1.4,d*.98);part(t,boxGeo,metal,0,h*1.06,0,w*.38,h*.1,d*.38);}
 }
 for(const {geo,m,matrices} of batches.values()){const mesh=new THREE.InstancedMesh(geo,m,matrices.length);matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;massGroup.add(mesh);}
 started=performance.now();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)massGroup.scale.y=.02;
 function sprite(text,sub,x,z){const c=document.createElement('canvas');c.width=1024;c.height=200;const g=c.getContext('2d');g.textAlign='center';g.font='bold 64px sans-serif';g.fillStyle='#263640';g.fillText(text,512,80);g.font='40px sans-serif';g.fillText(sub,512,138);const o=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));o.position.copy(world(x,z,112));o.scale.set(220,43,1);o.userData.isLabel=true;scene.add(o);}
 for(const s of p.sectors)sprite(s.name,s.id,...s.label);sprite('Lac Léman','',...p.anchors.lake);sprite('La Jonction','',175,505);
 camera=new THREE.OrthographicCamera(-650,650,550,-550,1,6000);renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;host.append(renderer.domElement);
 function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);const aspect=w/h,half=Math.max(520,570/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
 observer=new ResizeObserver(resize);observer.observe(host);resize();
 let prev=performance.now();function draw(now){const dt=Math.min(.05,(now-prev)/1000);prev=now;if(rotating&&viewMode==='oblique')yaw+=dt*.12;const pitch=viewMode==='north'?Math.PI*.35:Math.PI*.19,d=1550,a=viewMode==='north'?0:yaw;camera.position.set(Math.sin(a)*d*Math.cos(pitch),d*Math.sin(pitch),Math.cos(a)*d*Math.cos(pitch));camera.lookAt(0,0,0);if(massGroup&&massGroup.scale.y<1){const t=Math.min(1,(now-started)/850);massGroup.scale.y=1-Math.pow(1-t,3)*.98;}for(const o of scene.children)if(o.userData.isLabel)o.visible=labels;if(!$('three').hidden)renderer.render(scene,camera);frame=requestAnimationFrame(draw);}frame=requestAnimationFrame(draw);
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);observer.disconnect();surfaces.concrete.dispose();surfaces.asphalt.dispose();renderer.dispose();},{once:true});
}
function mode(next){viewMode=next;const three=next!=='plan';$('map').hidden=three;$('three').hidden=!three;for(const k of ['north','plan','oblique'])$(k).setAttribute('aria-pressed',String(k===next));$('rotate').hidden=next!=='oblique';rotating=false;$('rotate').setAttribute('aria-pressed','false');if(next==='oblique')yaw=.65;if(three){try{init3D();}catch(e){viewMode='plan';$('three').hidden=true;$('map').hidden=false;$('north').setAttribute('aria-pressed','false');$('plan').setAttribute('aria-pressed','true');$('oblique').setAttribute('aria-pressed','false');$('rotate').hidden=true;$('status').textContent='3D unavailable: '+e.message+' — north-up plan remains available.';}}}
$('north').onclick=()=>mode('north');$('plan').onclick=()=>mode('plan');$('oblique').onclick=()=>mode('oblique');$('labels').onclick=()=>{labels=!labels;labelGroup.style.display=labels?'':'none';$('labels').setAttribute('aria-pressed',String(labels));};$('rotate').onclick=()=>{rotating=!rotating;$('rotate').setAttribute('aria-pressed',String(rotating));};
mode('north');
async function loadCapacity(){try{const res=await fetch('data/graph.json',{cache:'no-cache'});if(!res.ok)throw Error('Snapshot HTTP '+res.status);const graph=await res.json(),model=buildCityV2(graph,null,{area:'all'}),rows=capacity(model.complexes);$('capacity').replaceChildren();for(const s of rows){const d=document.createElement('div');d.className='sector';const b=document.createElement('b');b.textContent=s.library;const c=document.createElement('span');c.className='metric';c.textContent=s.count+' complexes · '+Math.round(s.usable/s.land*100)+'% usable land estimate · '+(s.headroom===null?'empty':Math.round(s.headroom*100)+'% reserve vs current demand');d.append(b,c);$('capacity').append(d);}const revision=document.createElement('p');revision.className='metric';revision.textContent='Source '+graph.source.revision.slice(0,12);$('capacity').append(revision);}catch(e){$('capacity').textContent='Source capacity unavailable: '+e.message;}}
loadCapacity();
