import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {modelSources} from './geneva-synthcity-models.js';
// Normalize the actual imported geometry to a centred unit bounding box.
// The caller supplies the existing safe footprint, height and frontage angle.
export function buildSynthKit(THREE){
 const loader=new OBJLoader(),kit={};
 for(const [id,text] of Object.entries(modelSources)){
  try{
   const group=loader.parse(text),meshes=[];group.traverse(o=>{if(o.isMesh)meshes.push(o);});
   if(meshes.length!==1)throw Error('Expected one building mesh');
   const mesh=meshes[0],g=mesh.geometry;g.computeBoundingBox();const b=g.boundingBox,size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());
   if(Math.min(size.x,size.y,size.z)<=0||![size.x,size.y,size.z].every(Number.isFinite))throw Error('Invalid OBJ bounds');
   g.translate(-center.x,-center.y,-center.z);g.scale(1/size.x,1/size.y,1/size.z);
   // Upstream UVs target its own texture atlas. Generate planar facade UVs
   // instead, so the local licensed procedural texture works on every side.
   const pos=g.getAttribute('position'),normal=g.getAttribute('normal'),uv=new Float32Array(pos.count*2);
   for(let i=0;i<pos.count;i++){const nx=Math.abs(normal.getX(i)),ny=Math.abs(normal.getY(i)),nz=Math.abs(normal.getZ(i));uv[2*i]=(nx>nz?pos.getZ(i):pos.getX(i))+.5;uv[2*i+1]=(ny>Math.max(nx,nz)?pos.getZ(i):pos.getY(i))+.5;}
   g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.computeBoundingBox();g.computeBoundingSphere();kit[id]=g;
   for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.dispose();
  }catch(e){console.warn('SynthCity model fallback: '+id,e.message);}
 }
 return kit;
}
// Art-only model choice. Existing circular observation towers are retained.
export function synthModel(t){
 if(t.style===2||t.style===4)return null;
 if(t.h>76&&t.style===3)return 'mega_01';
 if(t.style===3)return 's_05_03';
 if(t.style===1)return t.h>55?'s_05_01':'s_03_01';
 return 's_02_01';
}
export function addWindowEmission(THREE,materials){
 for(let style=0;style<materials.length;style++){
  const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,256,512);const cols=style===2?9:7,rows=style===2?28:22,w=256/cols,h=512/rows;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const n=(Math.imul(x+11,73856093)^Math.imul(y+17,19349663)^Math.imul(style+1,83492791))>>>0;if(n%11<3){ctx.fillStyle=n%3===0?'#ffffff':'#8c8c8c';ctx.fillRect(x*w+4,y*h+4,w-8,h-8);}}
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.NoColorSpace;materials[style].emissiveMap=map;materials[style].emissive.set('#ffb879');materials[style].emissiveIntensity=.6;
 }
}
