import * as THREE from 'three';
import {buildCityV2,roleNames,roles,neighborhood,stationData} from './city-v2-model.js';

const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors=['#e97767','#73b9aa','#8c99da','#e8b966','#be86b5','#7daec8'];
const cyan='#3ce4d5',pink='#ef5d9f',amber='#ffc16f',geom=new THREE.BoxGeometry(1,1,1);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const hash=s=>{let v=2166136261;for(let i=0;i<s.length;i++)v=Math.imul(v^s.charCodeAt(i),16777619);return (v>>>0)/4294967295;};
const material=(c,emissive=false)=>new THREE.MeshStandardMaterial({color:c,roughness:.63,metalness:.12,emissive:emissive?c:'#000000',emissiveIntensity:emissive?.22:0});
const frame=material('#e7dccb'),glass=material('#2d667b'),steel=material('#5f8092'),cream=material('#fff1d0'),scaffold=material('#f0b56c');
const materials=colors.map(c=>material(c));
function block(parent,x,y,z,w,h,d,m,geometry=geom){const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);return o;}
function path(parent,points,color,width=.4){if(points.length<2)return;const curve=new THREE.CatmullRomCurve3(points);const t=new THREE.Mesh(new THREE.TubeGeometry(curve,25,width,6,false),new THREE.MeshBasicMaterial({color}));parent.add(t);return t;}
function tower(parent,b,x,z,c){
 const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
 const w=clamp(12+3*Math.log2(1+(b.lines||1)/110),12,20),h=clamp(25+18*Math.log2(1+(b.lines||1)/150),25,100);
 const accent=materials[c%materials.length];
 block(g,0,2,0,w*1.2,4,w*1.2,accent);
 if(b.role==='provisional'){
  const levels=Math.min(8,Math.floor(h/10)),top=levels*10;
  for(const sx of [-1,1])for(const sz of [-1,1])block(g,sx*w*.43,top/2,sz*w*.43,.8,top,.8,steel);
  for(let k=1;k<=levels;k++)block(g,0,k*10,0,w*.9,.65,w*.9,frame);
  for(const sx of [-1,1])block(g,sx*w*.53,(top+8)/2,w*.52,.4,top+8,.4,scaffold);
  block(g,-w*.52,(top+13)/2,-w*.52,.6,top+13,.6,scaffold);
  block(g,-w*.05,top+13,-w*.52,w*1.65,.65,.65,scaffold);
 }else{
  if(b.role===roles[0]){
   block(g,0,h*.42,0,w*.87,h*.78,w*.87,frame);
   block(g,0,h*.47,0,w*.76,h*.62,w*.78,glass);
   block(g,0,h*.9,0,w,3,w,accent);
   for(const sx of [-.37,.37])block(g,sx*w,h*.44,w*.37,1.7,h*.73,1.4,cream);
  }else if(b.role===roles[1]){
   block(g,-w*.19,h*.44,0,w*.63,h*.83,w*.83,glass);
   block(g,w*.26,h*.35,0,w*.42,h*.66,w*.73,frame);
   for(const level of [.3,.53,.76])block(g,0,h*level,0,w*1.02,1.5,w*.9,accent);
  }else if(b.role===roles[2]){
   const drum=new THREE.CylinderGeometry(.5,.5,1,12);
   block(g,0,h*.46,0,w*.86,h*.83,w*.86,glass,drum);
   block(g,0,h*.91,0,w,2,w,accent,drum);
   block(g,0,h*.93+4,0,w*.34,8,w*.34,cream,drum);
  }else{
   block(g,0,h*.25,0,w*.91,h*.48,w*.91,glass);
   block(g,0,h*.61,0,w*.72,h*.28,w*.72,frame);
   block(g,0,h*.84,0,w*.52,h*.19,w*.52,glass);
   for(const level of [.49,.76,.95])block(g,0,h*level,0,w*(1.12-level*.42),2,w*(1.12-level*.42),accent);
  }
  for(let i=1;i<=6;i++)block(g,0,h*i/8,0,w*.97,.32,w*.97,cream);
  for(const sx of [-.3,.3])block(g,sx*w,h*.43,w*.43,.4,h*.56,.45,accent);
 }
 // Canonical selection geometry stays invisible; decorative meshes never create semantic nodes.
 const pick=block(g,0,h/2,0,w*1.35,h,w*1.35,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
 pick.userData={kind:'building',id:b.id,complex:b.complexId};
 return {group:g,pick,position:new THREE.Vector3(x,h*.75,z),data:b};
}
function station(parent,x,z,id){
 const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
 block(g,0,2,0,17,4,13,steel);block(g,0,7,0,12,8,10,material('#3bd3c6',true));
 for(const xx of [-4,0,4])block(g,xx,13,0,2,10,2,cream,new THREE.CylinderGeometry(.5,.5,1,9));
 const ring=new THREE.Mesh(new THREE.TorusGeometry(7,.6,7,22),new THREE.MeshBasicMaterial({color:cyan}));ring.position.y=17;ring.rotation.x=Math.PI/2;g.add(ring);
 const pick=block(g,0,10,0,19,21,17,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));pick.userData={kind:'station',complex:id};
 return {group:g,pick,position:new THREE.Vector3(x,9,z)};
}
function createView(host,model,selectCallback){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#d6a6a5');scene.fog=new THREE.FogExp2('#e3bca8',.00035);
 scene.add(new THREE.HemisphereLight('#ffeacb','#587487',2.15));
 const sun=new THREE.DirectionalLight('#ffc18d',3.2);sun.position.set(-180,240,100);scene.add(sun);
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;host.append(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(46,1,.5,20000);
 const root=new THREE.Group(),connections=new THREE.Group();scene.add(root,connections);
 const total=model.complexes.length,pitch=160; const groups=new Map(); for(const c of model.complexes){if(!groups.has(c.area))groups.set(c.area,[]);groups.get(c.area).push(c);} const places=new Map(),boroughs=[]; let cursorX=0,cursorZ=0,rowDepth=0; const worldWidth=Math.max(480,Math.sqrt(total)*pitch*1.8); for(const [area,cs] of groups){const cols=Math.ceil(Math.sqrt(cs.length*1.3)),rows=Math.ceil(cs.length/cols),w=cols*pitch+100,d=rows*pitch+100;if(cursorX+w>worldWidth&&cursorX>0){cursorX=0;cursorZ+=rowDepth+70;rowDepth=0;} const bx=cursorX+w/2,bz=cursorZ+d/2; boroughs.push({area,x:bx,z:bz,w,d});cs.forEach((c,i)=>places.set(c.id,{x:cursorX+80+(i%cols)*pitch+(Math.floor(i/cols)%2?12:-12),z:cursorZ+80+Math.floor(i/cols)*pitch}));cursorX+=w+70;rowDepth=Math.max(rowDepth,d);} const maxX=Math.max(160,...boroughs.map(b=>b.x+b.w/2)),maxZ=Math.max(160,...boroughs.map(b=>b.z+b.d/2));for(const p of places.values()){p.x-=maxX/2;p.z-=maxZ/2;}for(const b of boroughs){b.x-=maxX/2;b.z-=maxZ/2;}
 const bounds=Math.max(maxX,maxZ),field=new THREE.Mesh(new THREE.PlaneGeometry(bounds*7,bounds*7),material('#adc3a1'));field.rotation.x=-Math.PI/2;field.position.y=-.3;scene.add(field);
 const sites=new Map(),structures=new Map(),powers=new Map(),labels=[];
 const roadway=material('#777e81');
 for(const b of boroughs){const tint=colors[Math.floor(hash(b.area)*colors.length)];const shape=new THREE.Shape();const w=b.w/2,d=b.d/2;[[-w*.9,-d],[w*.65,-d],[w,-d*.65],[w,d*.8],[w*.65,d],[-w*.8,d],[-w,d*.7],[-w,-d*.7]].forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),material(tint));mesh.rotation.x=-Math.PI/2;mesh.position.set(b.x,-.15,b.z);root.add(mesh);}
 model.complexes.forEach((complex,i)=>{
  const {x:xx,z:zz}=places.get(complex.id);
  sites.set(complex.id,new THREE.Vector3(xx,0,zz));
  const tone=Math.floor(hash(complex.id.split('/').slice(0,3).join('/'))*colors.length);
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(67,68,1,9),material('#e0d2bc'));pad.position.set(xx,.05,zz);pad.rotation.y=hash(complex.id)*.8;root.add(pad);
  block(root,xx,.65,zz-41,95,.35,8,roadway);block(root,xx-43,.65,zz,8,.35,80,roadway);
  const placements=[[-24,-24],[24,-24],[-24,24],[24,24],[0,0],[0,-48]];
  for(let k=0;k<complex.buildings.length&&k<6;k++){const [dx,dz]=placements[k],b=complex.buildings[k],t=tower(root,b,xx+dx,zz+dz,tone);structures.set(b.id,t);}
  const power=station(root,xx+51,zz-29,complex.id);powers.set(complex.id,power);
  if(complex.mathlib.length){
   const source=new Set(complex.mathlib.flatMap(x=>x.sourceModules));
   for(const b of complex.buildings.filter(x=>x.moduleIds.some(m=>source.has(m))).slice(0,5)){
    const t=structures.get(b.id);if(!t)continue;
    path(root,[new THREE.Vector3(t.position.x,1.25,t.position.z),new THREE.Vector3(t.position.x,1.25,zz-36),new THREE.Vector3(power.position.x,1.25,zz-36),new THREE.Vector3(power.position.x,1.25,power.position.z)],cyan,.48);
   }
  }
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=80;
  const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.font='bold 25px Arial';ctx.fillStyle='#233f56';ctx.fillText(complex.id.split('/').at(-1).replace('@root','Root'),256,48);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));sprite.position.set(xx,3,zz+53);sprite.scale.set(59,9,1);root.add(sprite);labels.push(sprite);
 });
 const keys=new Set();let yaw=.68,distance=clamp(bounds*1.2,170,1300),overhead=false,focus=new THREE.Vector3(),running=true,last=performance.now();
 const minDistance=60,maxDistance=Math.max(260,bounds*1.5);
 function pose(){const pitch=overhead?1.48:.62;distance=clamp(distance,minDistance,maxDistance);camera.position.set(focus.x+distance*Math.sin(yaw)*Math.cos(pitch),focus.y+distance*Math.sin(pitch),focus.z+distance*Math.cos(yaw)*Math.cos(pitch));camera.lookAt(focus);}
 const resize=()=>{const width=Math.max(host.clientWidth,120),height=Math.max(host.clientHeight,180);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const clickTargets=[...structures.values(),...powers.values()].map(x=>x.pick),ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let start=null;
 renderer.domElement.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};});
 renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start.x,e.clientY-start.y)>7)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(clickTargets,false);if(hits.length){const v=hits[0].object.userData;highlight(v.kind==='station'?v.complex:structures.get(v.id)?.data.complexId,v.kind==='building');selectCallback(v);}});
 renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();distance=clamp(distance*Math.exp(e.deltaY*.001),minDistance,maxDistance);},{passive:false});
 function keydown(e){if(e.target.closest?.('input,button,textarea,select')||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown'].includes(k)){keys.add(k);e.preventDefault();}}
 function keyup(e){keys.delete(e.key.toLowerCase());}
 window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);
 function highlight(id,showSky=true){
  while(connections.children.length){const child=connections.children[0];connections.remove(child);child.geometry?.dispose();child.material?.dispose();}
  if(!showSky||!sites.has(id))return;
  const data=neighborhood(model,id),start=sites.get(id);
  for(const [edges,color,reverse] of [[data.uses,pink,false],[data.usedBy,amber,true]])for(const edge of edges.slice(0,14)){
   const end=sites.get(reverse?edge.from:edge.to);if(!end)continue;
   const a=new THREE.Vector3(start.x,58,start.z),b=new THREE.Vector3(end.x,58,end.z),mid=a.clone().add(b).multiplyScalar(.5);mid.y+=Math.min(85,a.distanceTo(b)*.16)+34;
   path(connections,[a,mid,b],color,.52);
   const direction=reverse?a.clone().sub(mid).normalize():b.clone().sub(mid).normalize(),arrow=new THREE.Mesh(new THREE.ConeGeometry(1.5,4,6),new THREE.MeshBasicMaterial({color}));arrow.position.copy((reverse?a:b).clone().addScaledVector(direction,-10));arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);connections.add(arrow);
  }
 }
 function update(now){if(!running)return;const dt=Math.min(.05,(now-last)/1000);last=now;
  if(keys.has('arrowleft'))yaw-=dt;if(keys.has('arrowright'))yaw+=dt;
  if(keys.has('arrowup'))distance-=95*dt;if(keys.has('arrowdown'))distance+=95*dt;
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  for(const [k,v,t] of [['w',forward,1],['s',forward,-1],['a',right,-1],['d',right,1]])if(keys.has(k))focus.addScaledVector(v,110*dt*t);
  focus.x=clamp(focus.x,-bounds,bounds);focus.z=clamp(focus.z,-bounds,bounds);
  pose();renderer.render(scene,camera);requestAnimationFrame(update);
 }requestAnimationFrame(update);
 return {focus(id){const p=sites.get(id);if(p){focus.copy(p);distance=185;overhead=false;highlight(id,false);}},overview(){focus.set(0,0,0);distance=clamp(bounds*1.3,minDistance,maxDistance);overhead=true;},district(){overhead=false;distance=180;},highlight,dispose(){running=false;observer.disconnect();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);renderer.dispose();renderer.domElement.remove();}};
}
let graph,mathRevision=null,declarations=null,model=null,view=null;
const uri=(root,revision,path)=>root+'/blob/'+revision+'/'+path.split('/').map(encodeURIComponent).join('/');
async function load(){
 const response=await fetch('data/graph.json',{cache:'no-cache'});if(!response.ok)throw Error('Could not load PhysLib graph: '+response.status);graph=await response.json();
 try{const res=await fetch('data/mathlib.json',{cache:'no-cache'});if(res.ok)mathRevision=(await res.json()).source?.revision||null;}catch{}
 try{const res=await fetch('data/declarations.json',{cache:'no-cache'});if(res.ok){const candidate=await res.json();if(candidate.source?.revision===graph.source?.revision&&candidate.source?.toolchain===graph.source?.toolchain)declarations=candidate;}}catch{}
 const params=new URLSearchParams(location.search),initial=params.get('area')||'all';
 const areas=['all',...buildCityV2(graph,null,{area:initial}).areas];
 $('#area').replaceChildren(...areas.map(a=>{const e=document.createElement('option');e.value=a;e.textContent=a==='all'?'All physics boroughs':a.replace(/([a-z])([A-Z])/g,'$1 $2');return e;}));
 $('#area').value=areas.includes(initial)?initial:areas[0];$('#demo').checked=params.get('demo')==='1';
 $('#area').addEventListener('change',render);$('#demo').addEventListener('change',render);
 $('#overview').addEventListener('click',()=>view?.overview());$('#district').addEventListener('click',()=>view?.district());
 render();
}
function render(){
 const u=new URL(location.href),area=$('#area').value,demo=$('#demo').checked;
 u.searchParams.set('area',area);if(demo)u.searchParams.set('demo','1');else u.searchParams.delete('demo');history.replaceState(null,'',u);
 model=buildCityV2(graph,declarations,{area,demo});view?.dispose();$('#canvas').replaceChildren();
 view=createView($('#canvas'),model,inspectPick);
 $('#summary').textContent=model.complexes.length+' complexes · '+model.complexes.reduce((n,c)=>n+c.moduleIds.length,0)+' modules · '+graph.source.revision.slice(0,10);
 $('#coverage').textContent=declarations?'Source declaration inventory loaded; roles are inferred and coverage may be partial.':'No compatible declaration snapshot. Construction sites mean unknown classification, not unfinished Lean mathematics.';
 $('#demoWarning').hidden=!demo;
 $('#complexes').replaceChildren(...model.complexes.map(c=>{const button=document.createElement('button');button.textContent=c.id.split('/').slice(-2).join(' / ');button.title=c.id;button.onclick=()=>{view.focus(c.id);inspectComplex(c.id);};return button;}));
 if(model.complexes.length){if(area==='all')view.overview();else view.focus(model.complexes[0].id);inspectComplex(model.complexes[0].id);}else $('#details').textContent='No modules in this subject area.';
}
function inspectComplex(id){
 const c=model.complexes.find(x=>x.id===id);if(!c)return;const n=neighborhood(model,id);
 $('#details').innerHTML='<h2>'+esc(c.id.split('/').at(-1))+'</h2><p class="muted">'+esc(c.id)+'</p><p>'+c.moduleIds.length+' modules · '+c.buildings.length+' visible building groups</p><p>'+n.uses.length+' outward complex imports · '+n.usedBy.length+' inbound complex imports</p><h3>Buildings</h3><div id="members"></div><button id="inspectStation">Math Power Station · '+c.mathlib.length+' Mathlib targets</button>';
 for(const b of c.buildings){const button=document.createElement('button');button.textContent=roleNames[b.role]+' — '+b.status+(b.status==='demo'?' [DEMO]':'');button.onclick=()=>{view.highlight(c.id,true);inspectBuilding(b.id);};$('#members').append(button);}
 $('#inspectStation').onclick=()=>inspectStation(id);
}
function inspectBuilding(id){
 const c=model.complexes.find(x=>x.buildings.some(b=>b.id===id)),b=c?.buildings.find(b=>b.id===id);if(!b)return;
 const list=b.moduleIds.map(id=>{const m=graph.modules.find(x=>x.id===id);return '<li><a target="_blank" rel="noopener" href="'+uri(graph.source.repository,graph.source.revision,m.path)+'">'+esc(id)+'</a></li>';}).join('');
 $('#details').innerHTML='<button id="back">← Complex</button><h2>'+esc(roleNames[b.role])+'</h2><p>'+esc(b.status)+' · '+esc(b.evidence)+'</p><p class="muted">'+b.declarationIds.length+' recorded declarations; '+b.moduleIds.length+' source modules. Missing coverage does not prove mathematical incompleteness.</p><h3>Source modules</h3><ul>'+list+'</ul><h3>Recorded declarations</h3><ul>'+b.declarationIds.map(id=>'<li>'+esc(id)+'</li>').join('')+'</ul>';
 $('#back').onclick=()=>inspectComplex(c.id);
}
function inspectStation(id){
 const data=stationData(model,id);if(!data)return;
 const refs=data.targets.map(t=>{const path='Mathlib/'+t.target.slice(8).replaceAll('.','/')+'.lean';const link=uri('https://github.com/leanprover-community/mathlib4',mathRevision||'master',path);
 return '<details><summary>'+esc(t.target)+' · '+t.sourceModules.length+' importers</summary><a target="_blank" rel="noopener" href="'+link+'">View Mathlib source'+(mathRevision?' at pinned revision':' (latest)')+'</a><ul>'+t.sourceModules.map(m=>'<li>'+esc(m)+'</li>').join('')+'</ul></details>';}).join('');
 $('#details').innerHTML='<button id="back">← Complex</button><h2>Math Power Station</h2><p>'+data.totalUnique+' distinct Mathlib module targets</p><p class="muted">Ground-level pipes aggregate true recorded module imports. The same Mathlib file may be used by other complexes; this view does not show convergence to a shared node.</p><div class="stationList">'+(refs||'No Mathlib imports recorded.')+'</div>';
 $('#back').onclick=()=>inspectComplex(id);
}
function inspectPick(event){if(event.kind==='station')inspectStation(event.complex);else inspectBuilding(event.id);}
load().catch(e=>{$('#coverage').textContent=e.message;console.error(e);});
