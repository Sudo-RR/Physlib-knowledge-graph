import * as THREE from 'three';
import {masterplan,validatePlan,capacity,VERSION} from './geneva-g1-geometry.js';
import {buildCityV2} from './city-v2-model.js';
const $=id=>document.getElementById(id),p=masterplan(),metrics=validatePlan(p);
const ns='http://www.w3.org/2000/svg',el=(tag,attrs={},parent)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(parent)parent.append(e);return e;};
const pts=p=>p.map(v=>v.join(',')).join(' ');
const svg=el('svg',{viewBox:'-30 -30 1060 860',role:'img','aria-label':'Geneva masterplan with lake, Rhône, Arve and three library banks'},$('map'));
el('rect',{x:-30,y:-30,width:1060,height:860,fill:'#b7bda1'},svg);
for(const s of p.sectors)el('polygon',{points:pts(s.polygon),fill:'#d8d3bf'},svg);
el('polygon',{points:pts(p.water),fill:'#4d94a5'},svg);
for(const q of p.parks)el('polygon',{points:pts(q.polygon),fill:'#8fa47e',stroke:'#829771','stroke-width':1},svg);
for(const q of p.shorelines)el('polyline',{points:pts(q),fill:'none',stroke:'#b4bda4','stroke-width':7,'stroke-linejoin':'round'},svg);
for(const b of p.bridges){for(const [width,color] of [[b.width+3,'#827e74'],[b.width,'#f4e9d5']])el('line',{x1:b.a[0],y1:b.a[1],x2:b.b[0],y2:b.b[1],stroke:color,'stroke-width':width,'stroke-linecap':'round'},svg);}
const labelGroup=el('g',{'font-family':'system-ui, sans-serif'},svg);
function label(x,y,txt,sub='',water=false){const g=el('g',{transform:'translate('+x+' '+y+')'},labelGroup);const t=el('text',{'text-anchor':'middle','font-size':water?23:29,'font-weight':water?500:700,fill:water?'#e9f7f7':'#33444c','paint-order':'stroke',stroke:water?'#4d94a5':'#d8d3bf','stroke-width':3},g);t.textContent=txt;if(sub){const s=el('text',{y:24,'text-anchor':'middle','font-size':17,fill:'#50636a','paint-order':'stroke',stroke:'#d8d3bf','stroke-width':2},g);s.textContent=sub;}}
for(const s of p.sectors)label(...s.label,s.name.toUpperCase(),s.id);
label(...p.anchors.lake,'Lac Léman','',true);label(424,374,'RHÔNE','',true);label(747,632,'ARVE','',true);
el('path',{d:'M130 552 L220 446',stroke:'#40574e','stroke-width':1.6,fill:'none'},labelGroup);label(105,572,'La Jonction');
el('path',{d:'M953 746V704L944 720M953 704L962 720',fill:'none',stroke:'#33444c','stroke-width':3},labelGroup);const north=el('text',{x:953,y:692,'text-anchor':'middle','font-size':18,fill:'#33444c'},labelGroup);north.textContent='N';
$('status').textContent=VERSION+' · '+(metrics.waterShare*100).toFixed(1)+'% water · '+metrics.bridges+' bridges · geometry validated';
let scene,camera,renderer,rotating=false,yaw=.65,labels=true,observer,frame;
function init3D(){
 if(renderer)return;
 const host=$('three');scene=new THREE.Scene();scene.background=new THREE.Color('#edcab6');scene.fog=new THREE.Fog('#edcab6',1400,3100);
 scene.add(new THREE.HemisphereLight('#fff4dc','#7a9294',2.1));const sun=new THREE.DirectionalLight('#ffd1a1',2.5);sun.position.set(-400,850,-200);scene.add(sun);
 const material=(color,roughness=.85)=>new THREE.MeshStandardMaterial({color,roughness,side:THREE.DoubleSide});
 const ground=material('#b7bda1'),land=material('#d8d3bf'),water=material('#4d94a5',.44),green=material('#8fa47e'),quay=material('#b4bda4'),bridge=material('#e6dbc8'),asphalt=material('#9b998e');
 const world=(x,z,y=0)=>new THREE.Vector3(x-500,y,z-400);
 function face(poly,m,y){const s=new THREE.Shape();poly.forEach(([x,z],i)=>i?s.lineTo(x-500,400-z):s.moveTo(x-500,400-z));s.closePath();const o=new THREE.Mesh(new THREE.ShapeGeometry(s),m);o.rotation.x=-Math.PI/2;o.position.y=y;scene.add(o);return o;}
 function strip(a,b,w,h,y,m){const A=world(...a),B=world(...b),d=A.distanceTo(B);if(d<.0001)return;const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d+.7),m);o.position.copy(A.add(B).multiplyScalar(.5));o.position.y=y;o.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);scene.add(o);}
 const groundMesh=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),ground);groundMesh.rotation.x=-Math.PI/2;groundMesh.position.y=-2;scene.add(groundMesh);
 for(const s of p.sectors)face(s.polygon,land,0);
 face(p.water,water,-.6);for(const q of p.parks)face(q.polygon,green,.2);
 for(const q of p.shorelines)for(let i=1;i<q.length;i++)strip(q[i-1],q[i],5,.5,.3,quay);
 for(const b of p.bridges){strip(b.a,b.b,b.width+2,2,1,bridge);strip(b.a,b.b,b.width-1,.3,2.15,asphalt);for(const side of [-1,1])strip([b.a[0]+side*b.width/2,b.a[1]],[b.b[0]+side*b.width/2,b.b[1]],.65,2,2.9,bridge);}
 function sprite(text,sub,x,z){const c=document.createElement('canvas');c.width=1024;c.height=200;const g=c.getContext('2d');g.textAlign='center';g.font='bold 64px sans-serif';g.fillStyle='#233d49';g.fillText(text,512,80);g.font='40px sans-serif';g.fillText(sub,512,138);const o=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));o.position.copy(world(x,z,22));o.scale.set(220,43,1);o.userData.isLabel=true;scene.add(o);}
 for(const s of p.sectors)sprite(s.name,s.id,...s.label);sprite('Lac Léman','',...p.anchors.lake);sprite('La Jonction','',175,505);
 camera=new THREE.PerspectiveCamera(42,1,1,6000);renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;host.append(renderer.domElement);
 function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
 observer=new ResizeObserver(resize);observer.observe(host);resize();
 let prev=performance.now();function draw(now){const dt=Math.min(.05,(now-prev)/1000);prev=now;if(rotating)yaw+=dt*.12;const d=Math.max(1400,1200/camera.aspect);camera.position.set(Math.sin(yaw)*d*.75,d*.76,Math.cos(yaw)*d*.75);camera.lookAt(0,0,0);for(const o of scene.children)if(o.userData.isLabel)o.visible=labels;renderer.render(scene,camera);frame=requestAnimationFrame(draw);}frame=requestAnimationFrame(draw);
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);observer.disconnect();renderer.dispose();},{once:true});
}
function mode(three){$('map').hidden=three;$('three').hidden=!three;$('plan').setAttribute('aria-pressed',String(!three));$('oblique').setAttribute('aria-pressed',String(three));$('rotate').hidden=!three;if(three){try{init3D();}catch(e){$('three').hidden=true;$('map').hidden=false;$('plan').setAttribute('aria-pressed','true');$('oblique').setAttribute('aria-pressed','false');$('rotate').hidden=true;$('status').textContent='3D unavailable: '+e.message+' — north-up plan remains available.';}}else{rotating=false;$('rotate').setAttribute('aria-pressed','false');}}
$('plan').onclick=()=>mode(false);$('oblique').onclick=()=>mode(true);$('labels').onclick=()=>{labels=!labels;labelGroup.style.display=labels?'':'none';$('labels').setAttribute('aria-pressed',String(labels));};$('rotate').onclick=()=>{rotating=!rotating;$('rotate').setAttribute('aria-pressed',String(rotating));};
async function loadCapacity(){try{const res=await fetch('data/graph.json',{cache:'no-cache'});if(!res.ok)throw Error('Snapshot HTTP '+res.status);const graph=await res.json(),model=buildCityV2(graph,null,{area:'all'}),rows=capacity(model.complexes);$('capacity').replaceChildren();for(const s of rows){const d=document.createElement('div');d.className='sector';const b=document.createElement('b');b.textContent=s.library;const c=document.createElement('span');c.className='metric';c.textContent=s.count+' complexes · '+Math.round(s.usable/s.land*100)+'% usable land estimate · '+(s.headroom===null?'empty':Math.round(s.headroom*100)+'% reserve vs current demand');d.append(b,c);$('capacity').append(d);}const revision=document.createElement('p');revision.className='metric';revision.textContent='Source '+graph.source.revision.slice(0,12);$('capacity').append(revision);}catch(e){$('capacity').textContent='Source capacity unavailable: '+e.message;}}
loadCapacity();
