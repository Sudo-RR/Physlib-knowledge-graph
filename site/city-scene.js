import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildDistricts, districtFor } from './city-model.js';

const palette={Physlib:0x002fa7,Mathlib:0x838997};

// The renderer knows positions, not Lean semantics. The caller owns selection.
export function createCityScene(host, city, onSelect) {
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0xf7f7f8);
  const camera=new THREE.PerspectiveCamera(37,1,.1,500);
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  host.append(renderer.domElement);
  const overlay=document.createElement('div');overlay.className='city-labels';overlay.setAttribute('aria-hidden','true');host.append(overlay);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=5;controls.maxDistance=180;
  scene.add(new THREE.HemisphereLight(0xffffff,0xc6ccdb,2));
  const sunlight=new THREE.DirectionalLight(0xffffff,2);sunlight.position.set(15,40,25);scene.add(sunlight);
  const buildings=new Map(),positions=new Map(),districts=new Map(),labels=[],edges=new THREE.Group();
  const grouped=buildDistricts(city.nodes);
  for(const library of ['Physlib','Mathlib']) {
    const items=grouped.filter(d=>d.library===library);
    items.forEach((district,index)=>{
      const x=(library==='Physlib'?-14:14)+(index%2)*11-5.5;
      const z=(Math.floor(index/2)-(Math.ceil(items.length/2)-1)/2)*11;
      const y=library==='Physlib'?7:0;
      const plate=new THREE.Mesh(new THREE.BoxGeometry(10,.2,10),new THREE.MeshLambertMaterial({color:library==='Physlib'?0xdce4fb:0xe4e5e8}));
      plate.position.set(x,y,z);scene.add(plate);
      const outline=new THREE.LineSegments(new THREE.EdgesGeometry(plate.geometry),new THREE.LineBasicMaterial({color:library==='Physlib'?0x9aafe5:0xb6b9c0}));outline.position.copy(plate.position);scene.add(outline);
      const label=document.createElement('span');label.className='city-district-label';label.textContent=district.id.split('/').slice(-2).join(' / ');overlay.append(label);
      labels.push({id:district.id,element:label,position:new THREE.Vector3(x,y+.2,z-5.4)});
      districts.set(district.id,{...district,x,y,z,outline});
      const side=Math.ceil(Math.sqrt(district.nodes.length));
      district.nodes.forEach((node,i)=>{
        const px=x+(i%side-(side-1)/2)*2.25,pz=z+(Math.floor(i/side)-(side-1)/2)*2.25;
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.35,2,1.35),new THREE.MeshLambertMaterial({color:palette[library]}));
        mesh.position.set(px,y+1.1,pz);mesh.userData.id=node.id;scene.add(mesh);buildings.set(node.id,mesh);positions.set(node.id,mesh.position.clone());
      });
    });
  }
  scene.add(edges);
  let mode='city', selected=null;
  const fitTarget=new THREE.Vector3(0,3.5,0);
  function setView(next,focus=controls.target.clone()) {
    mode=next;controls.target.copy(focus);
    camera.position.copy(focus).add(next==='map'?new THREE.Vector3(0,80,.01):new THREE.Vector3(34,32,48));
    controls.update();
  }
  function focusFolder(folder) {
    const members=city.nodes.filter(n=>n.module.path.replaceAll('\\','/').startsWith(`${folder}/`));
    if(!members.length)return;
    const centre=new THREE.Vector3();for(const node of members)centre.add(positions.get(node.id));centre.divideScalar(members.length);
    controls.target.copy(centre);camera.position.copy(centre).add(mode==='map'?new THREE.Vector3(0,24,.01):new THREE.Vector3(17,15,22));controls.update();
    for(const district of districts.values())district.outline.material.color.setHex(district.id===folder?0x002fa7:district.library==='Physlib'?0x9aafe5:0xb6b9c0);
  }
  function select(id) {
    selected=id;
    for(const [key,mesh] of buildings)mesh.material.color.setHex(key===id?0x151515:palette[city.nodes.find(n=>n.id===key).library]);
    for(const edge of edges.children)edge.dispose();edges.clear();
    for(const e of city.edges.filter(e=>e.from===id||e.to===id)) {
      const from=positions.get(e.from),to=positions.get(e.to),direction=to.clone().sub(from);
      if(direction.length()<.01)continue;
      const arrow=new THREE.ArrowHelper(direction.clone().normalize(),from,direction.length(),0x002fa7,.8,.4);
      arrow.line.material.depthTest=false;arrow.cone.material.depthTest=false;arrow.line.renderOrder=100;arrow.cone.renderOrder=100;edges.add(arrow);
    }
    const node=city.nodes.find(n=>n.id===id);
    for(const district of districts.values())district.outline.material.color.setHex(district.id===districtFor(node)?0x002fa7:district.library==='Physlib'?0x9aafe5:0xb6b9c0);
  }
  function showDeclarationLinks(links) {
    for(const edge of edges.children)edge.dispose();edges.clear();
    const pairs=new Set();
    for(const link of links){
      if(!positions.has(link.from)||!positions.has(link.to))continue;
      const key=JSON.stringify([link.from,link.to]);if(pairs.has(key))continue;pairs.add(key);
      const from=positions.get(link.from),to=positions.get(link.to),direction=to.clone().sub(from);
      if(direction.length()<.01)continue;
      const arrow=new THREE.ArrowHelper(direction.clone().normalize(),from,direction.length(),0x555d70,.8,.4);
      arrow.line.material.dispose();arrow.line.material=new THREE.LineDashedMaterial({color:0x555d70,dashSize:.8,gapSize:.5,depthTest:false});arrow.line.computeLineDistances();arrow.cone.material.depthTest=false;arrow.line.renderOrder=100;arrow.cone.renderOrder=100;edges.add(arrow);
    }
    return pairs.size;
  }
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
  renderer.domElement.addEventListener('pointerup',e=>{
    if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4)return;
    const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);
    const hit=ray.intersectObjects([...buildings.values()])[0];if(hit)onSelect(hit.object.userData.id);
  });
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
  new ResizeObserver(resize).observe(host);resize();setView('city',fitTarget);
  renderer.setAnimationLoop(()=>{
    controls.update();renderer.render(scene,camera);
    const active=city.nodes.find(node=>node.id===selected);const activeDistrict=active&&districtFor(active);const occupied=[];
    for(const label of [...labels].sort((a,b)=>Number(b.id===activeDistrict)-Number(a.id===activeDistrict))){
      const p=label.position.clone().project(camera),x=(p.x+1)*host.clientWidth/2,y=(1-p.y)*host.clientHeight/2;
      const width=Math.min(160,label.element.textContent.length*5.5+14),bounds={left:x-width/2,right:x+width/2,top:y-10,bottom:y+10};
      const hidden=p.z>1||bounds.left<0||bounds.right>host.clientWidth||bounds.top<0||bounds.bottom>host.clientHeight||(x>host.clientWidth-170&&y<155)||occupied.some(o=>bounds.left<o.right&&bounds.right>o.left&&bounds.top<o.bottom&&bounds.bottom>o.top);
      label.element.hidden=hidden;label.element.classList.toggle('active',label.id===activeDistrict);
      if(!hidden)occupied.push(bounds);
      label.element.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px)`;
    }
  });
  return {select,showDeclarationLinks,focusFolder,setView,reset:()=>setView(mode,fitTarget),get selected(){return selected;}};
}
