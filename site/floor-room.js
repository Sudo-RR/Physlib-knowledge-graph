import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// A decorative 3D interior: its architecture encodes no Lean data.
export function createFloorRoom(host) {
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xdce7ed);
  const camera=new THREE.PerspectiveCamera(48,1,.1,100);
  camera.position.set(0,2.1,5.3);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,2.2,-4);controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=true;controls.minPolarAngle=.65;controls.maxPolarAngle=2.2;controls.minAzimuthAngle=-.65;controls.maxAzimuthAngle=.65;controls.update();
  scene.add(new THREE.HemisphereLight(0xffffff,0x8b9ba7,2.2));
  const sun=new THREE.DirectionalLight(0xfff5e2,2.4);sun.position.set(-3,8,-8);scene.add(sun);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshStandardMaterial({color:0xcbd2d5,roughness:.45,metalness:.08}));floor.rotation.x=-Math.PI/2;scene.add(floor);
  const ceiling=new THREE.Mesh(new THREE.BoxGeometry(12,.25,12),new THREE.MeshStandardMaterial({color:0xe8e9e6,roughness:.9}));ceiling.position.set(0,4.6,0);scene.add(ceiling);
  const frame=new THREE.MeshStandardMaterial({color:0x465c6b,roughness:.42,metalness:.35});
  const glass=new THREE.MeshPhysicalMaterial({color:0x9fc5da,transparent:true,opacity:.28,roughness:.12,metalness:.05,side:THREE.DoubleSide});
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(12,4.4),glass);pane.position.set(0,2.3,-5.9);scene.add(pane);
  for(let x=-6;x<=6;x+=2){const pillar=new THREE.Mesh(new THREE.BoxGeometry(.12,4.5,.18),frame);pillar.position.set(x,2.3,-5.85);scene.add(pillar);}
  for(const y of [.15,2.25,4.5]){const beam=new THREE.Mesh(new THREE.BoxGeometry(12,.12,.18),frame);beam.position.set(0,y,-5.85);scene.add(beam);}
  for(let x=-6;x<=6;x+=2){const column=new THREE.Mesh(new THREE.BoxGeometry(.2,4.6,.2),new THREE.MeshStandardMaterial({color:0xd0d7d9,roughness:.8}));column.position.set(x,2.3,4);scene.add(column);}
  const grid=new THREE.GridHelper(20,20,0xabbac3,0xb8c6ce);grid.position.y=.01;scene.add(grid);
  let active=false;const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);};
  new ResizeObserver(resize).observe(host);
  return {show(){active=true;resize();renderer.setAnimationLoop(()=>{if(active){controls.update();renderer.render(scene,camera);}});},hide(){active=false;renderer.setAnimationLoop(null);}};
}
