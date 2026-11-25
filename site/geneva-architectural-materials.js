// PhysLib City architectural materials. Original procedural textures and
// sky, no remote assets. Tiles repeat in approximate world units rather than
// stretching a fixed number of windows over every tower.
export const QUALITY_PROFILES={low:{min:1,max:1,budget:1200000},medium:{min:1.4,max:1.75,budget:2400000},high:{min:1.8,max:2.5,budget:4200000}};
export function renderScale(quality,dpr,width,height){
 const p=QUALITY_PROFILES[quality]||QUALITY_PROFILES.medium;
 const target=Math.min(p.max,Math.max(p.min,Number.isFinite(dpr)?dpr:1));
 return Math.max(.5,Math.min(target,Math.sqrt(p.budget/Math.max(1,width*height))));
}
const PALETTES=[
 {frame:'#c1c7c8',glass:'#526e80',bottom:'#263b49',reflect:'#b6cdd8',trim:'#8b9b9e'},
 {frame:'#c8b6a1',glass:'#526b72',bottom:'#263b44',reflect:'#c6d3d3',trim:'#998b7c'},
 {frame:'#81929a',glass:'#4f788b',bottom:'#213944',reflect:'#b8dbe6',trim:'#526971'},
 {frame:'#d3cec2',glass:'#61788a',bottom:'#2c404d',reflect:'#cfdee6',trim:'#a7a49d'},
 {frame:'#aab8b5',glass:'#4e716f',bottom:'#263d42',reflect:'#bddbd6',trim:'#758c8a'}
];
const SIZE=1024;
function makeCanvas(w=SIZE,h=SIZE){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function texture(THREE,c,anisotropy=8){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=anisotropy;return t;}
function facadeTile(THREE,p,style){
 const c=makeCanvas(),e=makeCanvas(),g=c.getContext('2d'),light=e.getContext('2d');
 g.fillStyle=p.frame;g.fillRect(0,0,SIZE,SIZE);light.fillStyle='#000';light.fillRect(0,0,SIZE,SIZE);
 const cols=style===2?5:4,rows=4,cw=SIZE/cols,ch=SIZE/rows;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const px=x*cw,py=y*ch,padX=cw*(style===2?.035:.105),padY=ch*.115,w=cw-2*padX,h=ch-2*padY,xx=px+padX,yy=py+padY;
  g.fillStyle=p.trim;g.fillRect(xx-5,yy-5,w+10,h+10);g.fillStyle='#253642';g.fillRect(xx,yy,w,h);
  const grad=g.createLinearGradient(xx,yy,xx+w*.6,yy+h);grad.addColorStop(0,p.reflect);grad.addColorStop(.16,p.glass);grad.addColorStop(.70,p.bottom);grad.addColorStop(1,p.glass);
  g.fillStyle=grad;g.fillRect(xx+4,yy+4,w-8,h-8);
  // Structural mullions, interior floor divisions and restrained highlights.
  g.fillStyle='rgba(240,249,250,.14)';g.fillRect(xx+5,yy+5,w-10,Math.max(3,h*.07));
  g.fillStyle='rgba(15,30,40,.34)';g.fillRect(xx+4,yy+h*.78,w-8,h*.19);
  g.fillStyle=p.trim;g.fillRect(xx+w*.5-2,yy,4,h);
  g.fillStyle='rgba(255,255,255,.22)';g.fillRect(px,py+ch-4,cw,3);
  const seed=(x*19+y*11+style*13)%17;
  if(seed<3){light.fillStyle=seed===0?'#bfbfbf':'#707070';light.fillRect(xx+7,yy+7,w*.47-10,h-14);}
 }
 const base=texture(THREE,c),emissive=texture(THREE,e);emissive.colorSpace=THREE.NoColorSpace;
 return {base,emissive};
}
// Installed on each clone too: Three.Material.clone does not preserve callbacks.
export function applyFacadeProjection(material){
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float vArchitectRoof;')
   .replace('#include <uv_vertex>',`#include <uv_vertex>
   vArchitectRoof=smoothstep(0.58,0.90,abs(normal.y));
   #ifdef USE_INSTANCING
     vec3 dims=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
     float span=mix(dims.x,dims.z,step(abs(normal.z),abs(normal.x)));
     vec2 repetitions=max(vec2(1.0),floor(vec2(span/4.0,dims.y/5.0)+0.5));
     #ifdef USE_MAP
       vMapUv*=repetitions;
     #endif
     #ifdef USE_EMISSIVEMAP
       vEmissiveMapUv*=repetitions;
     #endif
   #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vArchitectRoof;')
   .replace('#include <map_fragment>',`#include <map_fragment>
   diffuseColor.rgb=mix(diffuseColor.rgb, diffuse*vec3(0.48,0.53,0.56),vArchitectRoof);`)
   .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   totalEmissiveRadiance*=1.0-vArchitectRoof;`);
 };
 material.customProgramCacheKey=()=> 'physlib-architectural-facade-v1';
 return material;
}
export function makeArchitecturalFacades(THREE){
 return PALETTES.map((p,i)=>{const {base,emissive}=facadeTile(THREE,p,i);return applyFacadeProjection(new THREE.MeshStandardMaterial({color:'#ececec',map:base,emissiveMap:emissive,emissive:'#ffbe82',emissiveIntensity:.055,roughness:i===2?.26:.40,metalness:i===2?.50:.28,envMapIntensity:.8}));});
}
export function installSkyEnvironment(THREE,renderer,scene){
 const c=makeCanvas(1024,512),g=c.getContext('2d'),sky=g.createLinearGradient(0,0,0,512);
 for(const [f,col] of [[0,'#587d9d'],[.22,'#8cabc5'],[.43,'#c9dce6'],[.5,'#e2d9ca'],[.55,'#969da2'],[1,'#59656c']])sky.addColorStop(f,col);
 g.fillStyle=sky;g.fillRect(0,0,1024,512);
 const sun=g.createRadialGradient(290,168,6,290,168,95);sun.addColorStop(0,'rgba(255,249,230,1)');sun.addColorStop(.1,'rgba(255,241,214,.9)');sun.addColorStop(1,'rgba(255,231,200,0)');g.fillStyle=sun;g.fillRect(195,73,190,190);
 const t=texture(THREE,c,1);t.mapping=THREE.EquirectangularReflectionMapping;
 const gen=new THREE.PMREMGenerator(renderer),target=gen.fromEquirectangular(t);
 scene.environment=target.texture;scene.environmentIntensity=.65;
 gen.dispose();t.dispose();return ()=>{scene.environment=null;target.dispose();};
}
export function contactShadows(THREE,scene,towers){
 const c=makeCanvas(128,128),g=c.getContext('2d'),grad=g.createRadialGradient(64,64,15,64,64,64);
 grad.addColorStop(0,'rgba(25,37,43,.5)');grad.addColorStop(.48,'rgba(25,37,43,.32)');grad.addColorStop(1,'rgba(25,37,43,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);
 const tex=texture(THREE,c,2),geo=new THREE.PlaneGeometry(1,1),mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,opacity:.8,polygonOffset:true,polygonOffsetFactor:-1}),mesh=new THREE.InstancedMesh(geo,mat,towers.length),o=new THREE.Object3D();
 towers.forEach((t,i)=>{o.position.set(t.x-500,.34,t.z-400);o.rotation.set(-Math.PI/2,0,t.angle);o.scale.set(t.w*1.65,t.d*1.65,1);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.name='Architectural contact shadows';scene.add(mesh);return ()=>{geo.dispose();mat.dispose();tex.dispose();};
}
