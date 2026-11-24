import * as THREE from 'three';
import {makeFacadeMaterials} from './city-v2-facades.js';
import {genevaLayout} from './city-v2-geneva.js';
import {buildCityV2,roleNames,roles,neighborhood,stationData} from './city-v2-model.js';

const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Stable subject identity, independent of source library, role, or selection.
const subjectColors={ClassicalMechanics:'#c65c42',ClassicalFieldTheory:'#a85d79',CondensedMatter:'#668d76',Cosmology:'#7464a8',Electromagnetism:'#c49832',FluidDynamics:'#4096b0',LatticeQFT:'#a077a3',Optics:'#d18c51',Particles:'#9c6551',ProbabilisticTheory:'#789b58',QFT:'#845baf',QuantumMechanics:'#527da8',Relativity:'#9e5072',SpaceAndTime:'#506b94',StatisticalMechanics:'#8d9146',StringTheory:'#b86f9c',Thermodynamics:'#d28240',QuantumInformation:'#458c94',SharedFoundations:'#8a929c'};
const subjectColor=area=>subjectColors[area]||'#8a929c';
const colors=[...new Set(Object.values(subjectColors))];
const cyan='#3ce4d5',pink='#ef5d9f',amber='#ffc16f',geom=new THREE.BoxGeometry(1,1,1);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const hash=s=>{let v=2166136261;for(let i=0;i<s.length;i++)v=Math.imul(v^s.charCodeAt(i),16777619);return (v>>>0)/4294967295;};
const material=(c,emissive=false)=>new THREE.MeshStandardMaterial({color:c,roughness:.63,metalness:.12,emissive:emissive?c:'#000000',emissiveIntensity:emissive?.22:0});
const frame=material('#e7dccb'),glass=material('#2d667b'),steel=material('#5f8092'),cream=material('#fff1d0'),scaffold=material('#f0b56c');
const materials=colors.map(c=>material(c));
function block(parent,x,y,z,w,h,d,m,geometry=geom){const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);return o;}
function path(parent,points,color,width=.4){if(points.length<2)return;const curve=new THREE.CatmullRomCurve3(points);const t=new THREE.Mesh(new THREE.TubeGeometry(curve,25,width,6,false),new THREE.MeshBasicMaterial({color}));parent.add(t);return t;}
function tower(parent,b,x,z,c,facades){
 const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
 const w=clamp(12+3*Math.log2(1+(b.lines||1)/110),12,20),h=clamp(25+18*Math.log2(1+(b.lines||1)/150),25,100);
 const accent=materials[c]; const cladding=facades[c][Math.max(0,roles.indexOf(b.role))%facades[c].length];
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
   block(g,0,h*.47,0,w*.89,h*.62,w*.89,cladding);
   block(g,0,h*.9,0,w,3,w,accent);
   for(const sx of [-.37,.37])block(g,sx*w,h*.44,w*.37,1.7,h*.73,1.4,cream);
  }else if(b.role===roles[1]){
   block(g,-w*.19,h*.44,0,w*.63,h*.83,w*.83,cladding);
   block(g,w*.26,h*.35,0,w*.42,h*.66,w*.73,frame);
   for(const level of [.3,.53,.76])block(g,0,h*level,0,w*1.02,1.5,w*.9,accent);
  }else if(b.role===roles[2]){
   const drum=new THREE.CylinderGeometry(.5,.5,1,12);
   block(g,0,h*.46,0,w*.86,h*.83,w*.86,cladding,drum);
   block(g,0,h*.91,0,w,2,w,accent,drum);
   block(g,0,h*.93+4,0,w*.34,8,w*.34,cream,drum);
  }else{
   block(g,0,h*.25,0,w*.91,h*.48,w*.91,cladding);
   block(g,0,h*.61,0,w*.72,h*.28,w*.72,frame);
   block(g,0,h*.84,0,w*.52,h*.19,w*.52,cladding);
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
 const scene=new THREE.Scene(),baseFacades=makeFacadeMaterials(THREE),facades=colors.map(tint=>baseFacades.map(base=>{const m=base.clone();m.color.lerp(new THREE.Color(tint),.52);return m;}));const sky=document.createElement('canvas');sky.width=2;sky.height=512;const ctx=sky.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,512);gradient.addColorStop(0,'#88abd5');gradient.addColorStop(.5,'#efbfa7');gradient.addColorStop(1,'#ffe6cc');ctx.fillStyle=gradient;ctx.fillRect(0,0,2,512);scene.background=new THREE.CanvasTexture(sky);scene.background.colorSpace=THREE.SRGBColorSpace;const worldFog=new THREE.FogExp2('#eadccc',.00023);scene.fog=worldFog;
 scene.add(new THREE.HemisphereLight('#ffeacb','#587487',2.15));
 const sun=new THREE.DirectionalLight('#ffc18d',3.2);sun.position.set(-180,240,100);scene.add(sun);
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;host.append(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(46,1,.5,50000);const mapCamera=new THREE.OrthographicCamera(-1,1,1,-1,.1,50000);
 const root=new THREE.Group(),connections=new THREE.Group();scene.add(root,connections);
 const geography=genevaLayout(model.complexes),origin=geography.center;
 const local=p=>({...p,x:p.x-origin.x,z:p.z-origin.z});
 const places=new Map([...geography.places].map(([id,p])=>[id,local(p)]));
 const boroughs=geography.boroughs.map(local),sectors=geography.sectors.map(local);
 const maxX=geography.maxX,maxZ=geography.maxZ;
 const bounds=Math.max(maxX,maxZ),field=new THREE.Mesh(new THREE.PlaneGeometry(bounds*7,bounds*7),material('#b2b699'));field.rotation.x=-Math.PI/2;field.position.y=-.3;scene.add(field);
 const sites=new Map(),structures=new Map(),powers=new Map(),labels=[];
 const roadway=material('#858581'),boroughLabels=[],boroughOutlines=[],sectorLabels=[];
 const civic=new THREE.Group();root.add(civic);
 const roadStripe=material('#e5ded0'),treeGeometry=new THREE.IcosahedronGeometry(1,0),treeMaterial=material('#667f61'),trunks=material('#9c8468');
 const paving=material('#d3c9b7'),park=material('#899b76'),stone=material('#c8c1b1'),water=material('#438c9d'),shore=material('#9eab99');
 const civicBatches=new Map(),dummy=new THREE.Object3D();
 function civicBox(x,y,z,w,h,d,m,angle=0){const key=m.uuid;if(!civicBatches.has(key))civicBatches.set(key,{m,items:[]});dummy.position.set(x,y,z);dummy.rotation.set(0,angle,0);dummy.scale.set(w,h,d);dummy.updateMatrix();civicBatches.get(key).items.push(dummy.matrix.clone());}
 function road(a,b,width=9,y=.48,m=roadway){const length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.01)return;civicBox((a.x+b.x)/2,y,(a.z+b.z)/2,width,.22,length+width*.25,m,Math.atan2(b.x-a.x,b.z-a.z));}
 // River bands follow a continuous centreline; surface geometry deliberately
 // separates civic roads and water from the canonical dependency graph.
 function ribbon(from,to,low,high,y,m){const vertices=[],indices=[];const n=Math.max(16,Math.ceil((to-from)/22));for(let i=0;i<=n;i++){const x=from+(to-from)*i/n;vertices.push(x-origin.x,y,low(x)-origin.z,x-origin.x,y,high(x)-origin.z);if(i){const k=(i-1)*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const mesh=new THREE.Mesh(g,m);root.add(mesh);return mesh;}
 const west=geography.minX-450,east=geography.extentX+550;
 function river(name,from,center,half){
  ribbon(from,east,x=>center(x)-half(x)-5,x=>center(x)+half(x)+5,.01,shore);
  ribbon(from,east,x=>center(x)-half(x),x=>center(x)+half(x),.07,water);
  for(const sign of [-1,1]){
   const edge=x=>center(x)+sign*half(x);
   ribbon(from,east,x=>Math.min(edge(x),edge(x)+sign*10),x=>Math.max(edge(x),edge(x)+sign*10),.16,stone);
   const quay=x=>edge(x)+sign*22;
   ribbon(from,east,x=>quay(x)-5.5,x=>quay(x)+5.5,.29,roadway);
   ribbon(from,east,x=>quay(x)-.22,x=>quay(x)+.22,.43,roadStripe);
  }
 }
 river('Rhône',west,geography.rhone,geography.rhoneWidth);
 // Begin Arve paving/quays after the confluence, so it never crosses the Rhône.
 river('Arve',geography.confluence+130,geography.arve,geography.arveWidth);
 ribbon(geography.confluence,east,x=>geography.arve(x)-geography.arveWidth(x),x=>geography.arve(x)+geography.arveWidth(x),.09,water);
 for(const edge of geography.streets)road(local(edge.a),local(edge.b),edge.width);
 for(const bridge of geography.bridges){
  const a=local({x:bridge.x,z:bridge.z1}),b=local({x:bridge.x,z:bridge.z2});
  const length=b.z-a.z,mid=(a.z+b.z)/2;
  civicBox(a.x,.75,mid,bridge.width,1.2,length+4,stone);
  civicBox(a.x,1.4,mid,bridge.width-3,.2,length,roadway);
  for(const side of [-1,1])civicBox(a.x+side*(bridge.width/2-.6),2.35,mid,.7,1.6,length+3,stone);
  civicBox(a.x,1.53,mid,.28,.05,length,roadStripe);
  for(const t of [.26,.74])civicBox(a.x,-.1,a.z+length*t,bridge.width*.62,2.4,3.8,stone);
 }
 function mapLabel(text,sub,x,z,size,y){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;
  const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.fillStyle='#183b4f';ctx.font='bold 72px Arial';ctx.fillText(text,512,86);ctx.font='36px Arial';ctx.fillText(sub,512,140);
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));label.position.set(x,y,z);label.scale.set(size,size*.1875,1);root.add(label);sectorLabels.push(label);
 }
 for(const sector of sectors)if(sector.count)mapLabel(sector.name,sector.subtitle,sector.x,sector.z,Math.min(460,maxX*.15),130);
 mapLabel('RHÔNE','',geography.width*.12-origin.x,geography.rhone(geography.width*.12)-origin.z,Math.min(220,maxX*.09),14);
 mapLabel('ARVE','',geography.width*.12-origin.x,geography.arve(geography.width*.12)-origin.z,Math.min(200,maxX*.08),14);
 // Shared land, continuous beyond the developed banks; no filled subject parcels.
 for(const b of boroughs){
  const tint=subjectColor(b.area),w=b.w/2,d=b.d/2;
  const corners=[[-w+3,-d+3],[w-3,-d+3],[w-3,d-3],[-w+3,d-3],[-w+3,-d+3]];
  const outline=new THREE.Line(new THREE.BufferGeometry().setFromPoints(corners.map(([x,z])=>new THREE.Vector3(b.x+x,1.1,b.z+z))),new THREE.LineBasicMaterial({color:tint,transparent:true,opacity:.85,depthTest:false}));outline.visible=false;root.add(outline);boroughOutlines.push(outline);
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.font='bold 54px Arial';ctx.fillStyle='#233f56';ctx.fillText(b.area.replace(/([a-z])([A-Z])/g,'$1 $2'),512,77);ctx.fillStyle=tint;ctx.fillRect(260,92,504,9);
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));label.position.set(b.x,105,b.z);label.scale.set(Math.min(340,b.w*.8),Math.min(42,b.w*.1),1);root.add(label);boroughLabels.push(label);
 }
 model.complexes.forEach((complex,i)=>{
  const {x:xx,z:zz}=places.get(complex.id);
  sites.set(complex.id,new THREE.Vector3(xx,0,zz));
  const tone=colors.indexOf(subjectColor(complex.area));
  // Courtyards and planted strips are civic scenery, not subject-coded parcels.
  const variation=hash(complex.id);civicBox(xx,.06,zz,112+variation*5,.24,112+(1-variation)*5,paving);
  civicBox(xx+4,.24,zz+50,42+variation*47,.18,10+variation*4,park);
  civicBox(xx+55,.24,zz+14,8,.18,32+variation*28,park);
  civicBox(xx,.65,zz-41,120,.35,10,roadway);civicBox(xx-43,.65,zz,10,.35,128,roadway);
  for(let lane=-44;lane<=44;lane+=12){civicBox(xx+lane,.85,zz-41,6,.05,.22,roadStripe);civicBox(xx-43,.85,zz+lane,.22,.05,6,roadStripe);}
  for(const dx of [-53,53])for(const dz of [-50,46]){if(hash(complex.id+dx+','+dz)<.15)continue;const scale=.7+hash(complex.id+dz+','+dx)*.55;civicBox(xx+dx,1.5*scale,zz+dz,1,3*scale,1,trunks);const crown=new THREE.Mesh(treeGeometry,treeMaterial);crown.position.set(xx+dx,4.7*scale,zz+dz);crown.scale.set(4.5*scale,5*scale,4.5*scale);root.add(crown);}

  const placements=[[-24,-24],[24,-24],[-24,24],[24,24],[0,0],[0,-48]];
  for(let k=0;k<complex.buildings.length&&k<6;k++){const [dx,dz]=placements[k],b=complex.buildings[k],t=tower(root,b,xx+dx,zz+dz,tone,facades);t.group.rotation.y=(hash(b.id)-.5)*.16;structures.set(b.id,t);}
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
 for(const {m,items} of civicBatches.values()){const batch=new THREE.InstancedMesh(geom,m,items.length);items.forEach((matrix,i)=>batch.setMatrixAt(i,matrix));batch.instanceMatrix.needsUpdate=true;civic.add(batch);}
 const keys=new Set();let yaw=.68,distance=clamp(bounds*1.2,170,1300),overhead=false,focus=new THREE.Vector3(),running=true,last=performance.now();
 const minDistance=60,maxDistance=Math.max(260,bounds*3);let mapZoom=1;
 function fitMap(){const aspect=camera.aspect||1,halfH=Math.max((maxZ+160)/2,(maxX+160)/(2*aspect))*mapZoom;mapCamera.left=-halfH*aspect;mapCamera.right=halfH*aspect;mapCamera.top=halfH;mapCamera.bottom=-halfH;mapCamera.updateProjectionMatrix();mapCamera.up.set(0,0,-1);mapCamera.position.set(focus.x,Math.max(500,bounds+200),focus.z);mapCamera.lookAt(focus.x,0,focus.z);mapCamera.updateMatrixWorld();}
 function pose(){if(overhead){fitMap();return;}const pitch=.62;distance=clamp(distance,minDistance,maxDistance);camera.position.set(focus.x+distance*Math.sin(yaw)*Math.cos(pitch),focus.y+distance*Math.sin(pitch),focus.z+distance*Math.cos(yaw)*Math.cos(pitch));camera.lookAt(focus);}
 const resize=()=>{const width=Math.max(host.clientWidth,120),height=Math.max(host.clientHeight,180);camera.aspect=width/height;camera.updateProjectionMatrix();if(overhead)fitMap();renderer.setSize(width,height,false);};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const clickTargets=[...structures.values(),...powers.values()].map(x=>x.pick),ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let start=null;
 renderer.domElement.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};});
 renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start.x,e.clientY-start.y)>7)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,overhead?mapCamera:camera);const hits=ray.intersectObjects(clickTargets,false);if(hits.length){const v=hits[0].object.userData;highlight(v.kind==='station'?v.complex:structures.get(v.id)?.data.complexId,v.kind==='building');selectCallback(v);}});
 renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();if(overhead)mapZoom=clamp(mapZoom*Math.exp(e.deltaY*.001),.15,2);else distance=clamp(distance*Math.exp(e.deltaY*.001),minDistance,maxDistance);},{passive:false});
 function keydown(e){if(e.target.closest?.('input,button,textarea,select')||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown'].includes(k)){keys.add(k);e.preventDefault();}}
 function keyup(e){keys.delete(e.key.toLowerCase());}
 window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);
 function highlight(id,showSky=true,channel=0){
  while(connections.children.length){const child=connections.children[0];connections.remove(child);child.geometry?.dispose();child.material?.dispose();}
  if(!showSky||!sites.has(id)||channel===3)return;
  const data=neighborhood(model,id),start=sites.get(id);
  for(const [edges,color,reverse] of [[channel===2?[]:data.uses,pink,false],[channel===1?[]:data.usedBy,amber,true]])for(const edge of edges.slice(0,14)){
   const end=sites.get(reverse?edge.from:edge.to);if(!end)continue;
   const a=new THREE.Vector3(start.x,58,start.z),b=new THREE.Vector3(end.x,58,end.z),mid=a.clone().add(b).multiplyScalar(.5);mid.y+=Math.min(85,a.distanceTo(b)*.16)+34;
   path(connections,[a,mid,b],color,.52);
   const direction=reverse?a.clone().sub(mid).normalize():b.clone().sub(mid).normalize(),arrow=new THREE.Mesh(new THREE.ConeGeometry(1.5,4,6),new THREE.MeshBasicMaterial({color}));arrow.position.copy((reverse?a:b).clone().addScaledVector(direction,-10));arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);connections.add(arrow);
  }
 }
 function update(now){if(!running)return;const dt=Math.min(.05,(now-last)/1000);last=now;
  if(keys.has('arrowleft'))yaw-=dt;if(keys.has('arrowright'))yaw+=dt;
  if(overhead){if(keys.has('arrowup'))mapZoom=clamp(mapZoom-dt*.7,.15,2);if(keys.has('arrowdown'))mapZoom=clamp(mapZoom+dt*.7,.15,2);}else{if(keys.has('arrowup'))distance-=95*dt;if(keys.has('arrowdown'))distance+=95*dt;}
  const forward=overhead?new THREE.Vector3(0,0,-1):new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=overhead?new THREE.Vector3(1,0,0):new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  for(const [k,v,t] of [['w',forward,1],['s',forward,-1],['a',right,-1],['d',right,1]])if(keys.has(k))focus.addScaledVector(v,110*dt*t);
  focus.x=clamp(focus.x,-bounds,bounds);focus.z=clamp(focus.z,-bounds,bounds);
  for(const label of labels)label.visible=overhead?mapZoom<.35:distance<550;for(const label of boroughLabels)label.visible=overhead?mapZoom>=.2&&mapZoom<.55:distance>=550&&distance<1200;for(const line of boroughOutlines)line.visible=false;for(const label of sectorLabels)label.visible=overhead?mapZoom>=.55:distance>=1200;pose();scene.fog=overhead?null:worldFog;renderer.render(scene,overhead?mapCamera:camera);requestAnimationFrame(update);
 }requestAnimationFrame(update);
 return {focus(id){const p=sites.get(id);if(p){focus.copy(p);distance=185;overhead=false;highlight(id,false);}},overview(){focus.set(0,0,0);mapZoom=1;overhead=true;fitMap();},district(){overhead=false;distance=180;},highlight,dispose(){running=false;observer.disconnect();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);const gs=new Set(),ms=new Set();scene.traverse(o=>{if(o.geometry&&o.geometry!==geom)gs.add(o.geometry);if(o.material&&!materials.includes(o.material)&&![frame,glass,steel,cream,scaffold].includes(o.material))ms.add(o.material);});for(const g of gs)g.dispose();const textures=new Set();for(const m of new Set([...ms,...facades.flat(),...baseFacades])){if(m.map)textures.add(m.map);m.dispose();}for(const t of textures)t.dispose();scene.background?.dispose();renderer.dispose();renderer.domElement.remove();}};
}
let graph,mathRevision=null,declarations=null,model=null,view=null,selectedComplex=null;
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
 $('#overview').addEventListener('click',()=>view?.overview());$('#district').addEventListener('click',()=>{if(selectedComplex)view?.focus(selectedComplex);else view?.district();});
 $('#searchComplex').addEventListener('input',()=>{const q=$('#searchComplex').value.toLowerCase();for(const b of $('#complexes').children)b.hidden=!b.title.toLowerCase().includes(q);});
 $('#toggleInspector').onclick=()=>document.body.classList.toggle('hide-inspector');
 window.addEventListener('keydown',e=>{if(e.target.matches?.('input,select,textarea')&&e.key!=='Escape')return;if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if(k==='/'){e.preventDefault();document.body.classList.remove('hide-inspector');$('#searchComplex').focus();}if(k==='m')view?.overview();if(k==='f'&&selectedComplex)view?.focus(selectedComplex);if(k==='i')document.body.classList.toggle('hide-inspector');if(k==='escape'){view?.highlight(null,false);document.activeElement?.blur();}if(['1','2','3'].includes(k)&&selectedComplex){view?.highlight(selectedComplex,true,Number(k));if(k==='3')inspectStation(selectedComplex);}});
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
 $('#complexes').replaceChildren(...model.complexes.map(c=>{const button=document.createElement('button');button.textContent=c.id.split('/').slice(-2).join(' / ');button.style.borderLeft='4px solid '+subjectColor(c.area);button.title=c.id;button.onclick=()=>{view.focus(c.id);inspectComplex(c.id);};return button;}));
 if(model.complexes.length){const pilot=area==='all'?(model.complexes.find(c=>c.id.includes('HamiltonianMechanics'))||model.complexes[0]):model.complexes[0];view.focus(pilot.id);inspectComplex(pilot.id);}else $('#details').textContent='No modules in this subject area.';
}
function inspectComplex(id){
 const c=model.complexes.find(x=>x.id===id);if(!c)return;selectedComplex=id;const n=neighborhood(model,id);
 $('#details').innerHTML='<h2>'+esc(c.id.split('/').at(-1))+'</h2><p class="muted">'+esc(c.id)+'</p><p>'+c.moduleIds.length+' modules · '+c.buildings.length+' visible building groups</p><p>'+n.uses.length+' outward complex imports · '+n.usedBy.length+' inbound complex imports</p><h3>Buildings</h3><div id="members"></div><button id="inspectStation">Math Power Station · '+c.mathlib.length+' Mathlib targets</button>';
 for(const b of c.buildings){const button=document.createElement('button');button.textContent=roleNames[b.role]+' — '+b.status+(b.status==='demo'?' [DEMO]':'');button.onclick=()=>{view.highlight(c.id,true);inspectBuilding(b.id);};$('#members').append(button);}
 $('#inspectStation').onclick=()=>inspectStation(id);
 const routes=document.createElement('section');routes.innerHTML='<h3>Recorded module imports</h3>';for(const [name,edges] of [['Uses',n.uses],['Used by',n.usedBy]]){const heading=document.createElement('h4');heading.textContent=name+' · '+edges.length+' complexes';routes.append(heading);for(const edge of edges){const d=document.createElement('details'),summary=document.createElement('summary');summary.textContent=(name==='Uses'?edge.to:edge.from)+' · '+edge.count+' imports';d.append(summary);const list=document.createElement('ul');for(const imp of edge.imports){const li=document.createElement('li'),link=document.createElement('a'),m=graph.modules.find(x=>x.id===imp.from);link.textContent=imp.from+' → '+imp.to;link.href=uri(graph.source.repository,graph.source.revision,m.path)+(imp.line?'#L'+imp.line:'');link.target='_blank';link.rel='noopener';li.append(link);list.append(li);}d.append(list);routes.append(d);}}$('#details').append(routes);
}
function inspectBuilding(id){
 const c=model.complexes.find(x=>x.buildings.some(b=>b.id===id)),b=c?.buildings.find(b=>b.id===id);if(!b)return;
 const list=b.moduleIds.map(id=>{const m=graph.modules.find(x=>x.id===id);return '<li><a target="_blank" rel="noopener" href="'+uri(graph.source.repository,graph.source.revision,m.path)+'">'+esc(id)+'</a></li>';}).join('');
 $('#details').innerHTML='<button id="back">← Complex</button><h2>'+esc(roleNames[b.role])+'</h2><p>'+esc(b.status)+' · '+esc(b.evidence)+'</p><p class="muted">'+b.declarationIds.length+' recorded declarations; '+b.moduleIds.length+' source modules. Missing coverage does not prove mathematical incompleteness.</p><h3>Source modules</h3><ul>'+list+'</ul><h3>Recorded declarations</h3><ul>'+b.declarationIds.map(id=>{const d=declarations?.declarations.find(x=>x.id===id),m=graph.modules.find(x=>x.id===d?.module);return m?'<li><a target="_blank" rel="noopener" href="'+uri(graph.source.repository,graph.source.revision,m.path)+(d.line?'#L'+d.line:'')+'">'+esc(id)+'</a></li>':'<li>'+esc(id)+'</li>';}).join('')+'</ul>';
 $('#back').onclick=()=>inspectComplex(c.id);
}
function inspectStation(id){
 const data=stationData(model,id);if(!data)return;
 selectedComplex=id;const refs=data.targets.map(t=>{const path=t.target.replaceAll('.','/')+'.lean';const link=uri('https://github.com/leanprover-community/mathlib4',mathRevision||'master',path);
 return '<details><summary>'+esc(t.target)+' · '+t.sourceModules.length+' importers</summary><a target="_blank" rel="noopener" href="'+link+'">View Mathlib source'+(mathRevision?' at pinned revision':' (latest)')+'</a><ul>'+t.sourceModules.map(m=>'<li>'+esc(m)+'</li>').join('')+'</ul></details>';}).join('');
 $('#details').innerHTML='<button id="back">← Complex</button><h2>Math Power Station</h2><p>'+data.totalUnique+' distinct Mathlib module targets</p><p class="muted">Ground-level pipes aggregate true recorded module imports. The same Mathlib file may be used by other complexes; this view does not show convergence to a shared node.</p><div class="stationList">'+(refs||'No Mathlib imports recorded.')+'</div>';
 $('#back').onclick=()=>inspectComplex(id);
}
function inspectPick(event){document.body.classList.remove('hide-inspector');selectedComplex=event.complex;if(event.kind==='station')inspectStation(event.complex);else inspectBuilding(event.id);}
load().catch(e=>{$('#coverage').textContent=e.message;console.error(e);});
