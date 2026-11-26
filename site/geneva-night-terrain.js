// Original world-space surface and river shader. No external assets or reflection targets.
import * as THREE from 'three';
export function riverMotionAllowed({available,paused,reduced,visible}){return !!available&&!paused&&!reduced&&!!visible;}
export function roadJunctions(roads){
 const byPoint=new Map();for(const r of roads)for(const p of [r.a,r.b]){const key=p.join(','),w=Math.max(0,r.width||0);const prev=byPoint.get(key);if(!prev||prev.width<w)byPoint.set(key,{point:p,width:w});}return [...byPoint.values()];
}
export function polygonMesh(poly,mat,y){const s=new THREE.Shape();poly.forEach(([x,z],i)=>i?s.lineTo(x-500,400-z):s.moveTo(x-500,400-z));s.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(s),mat);mesh.rotation.x=-Math.PI/2;mesh.position.y=y;return mesh;}
const vertex=`varying vec3 vWorld;
void main(){vec4 p=modelMatrix*vec4(position,1.0);
#ifdef USE_INSTANCING
p=modelMatrix*instanceMatrix*vec4(position,1.0);
#endif
vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`;
const noise=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float grain(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}`;
export function nightPaving(kind='land'){
 const asphalt=kind==='asphalt',outer=kind==='ground';
 return new THREE.ShaderMaterial({side:THREE.DoubleSide,toneMapped:false,uniforms:{uKind:{value:asphalt?1:outer?2:0}},vertexShader:vertex,fragmentShader:`
 varying vec3 vWorld;uniform float uKind;
 ${noise}
 void main(){vec2 p=vWorld.xz;float fine=grain(p*1.7),broad=grain(p*.065),tile=0.0;
 if(uKind<.5){vec2 a=abs(fract(p/vec2(7.0,4.0))-.5);tile=smoothstep(.46,.49,max(a.x,a.y));}
 vec3 base=uKind>1.5?vec3(.016,.025,.036):uKind>.5?vec3(.022,.032,.044):vec3(.042,.055,.070);
 vec3 color=base*(.90+.20*broad+.10*fine-.18*tile);
 // Broad wet-surface sheen, not specular reflections of individual objects.
 float sheen=pow(max(0.0,grain(p*vec2(.035,.12))-.27),2.0);
 color+=vec3(.016,.025,.036)*sheen;
 gl_FragColor=vec4(color,1.0);
 #include <colorspace_fragment>
 }`});
}
export function riverMaterial(overlay=false){
 return new THREE.ShaderMaterial({side:THREE.DoubleSide,toneMapped:false,transparent:overlay,depthWrite:!overlay,depthTest:true,uniforms:{uTime:{value:0},uOverlay:{value:overlay?1:0}},vertexShader:vertex,fragmentShader:`
 varying vec3 vWorld;uniform float uTime,uOverlay;
 ${noise}
 void main(){
 vec2 p=vWorld.xz+vec2(500.0,400.0);
 // Authored Geneva river branches flow towards the downstream western outlet.
 // Blend the southeast Arve and lake outlet directions smoothly.
 float arve=smoothstep(440.0,545.0,p.y);
 vec2 dir=normalize(mix(vec2(-.93,.36),vec2(-.94,-.34),arve));
 vec2 crossDir=vec2(-dir.y,dir.x);
 vec2 q=vec2(dot(p,dir),dot(p,crossDir));
 float t=uTime;
 float a=sin(q.x*.17+q.y*.42-t*1.7+grain(q*.08)*3.2);
 float b=sin(q.x*.49-q.y*.28-t*2.9+grain(q*.13)*2.0);
 float ripple=.5+.25*a+.25*b;
 float fleck=pow(clamp(ripple,0.0,1.0),6.0);
 float swells=grain(vec2(q.x*.045-t*.12,q.y*.20));
 float teal=grain(vec2(q.x*.032,q.y*.09));
 // Broken vertical streaks of reflected city light; explicitly stylised.
 float glint=pow(grain(vec2(p.x*.095,p.y*.018-t*.045)),5.0)*(.35+.65*fleck);
 vec3 base=mix(vec3(.008,.031,.056),vec3(.021,.095,.122),.35+.45*swells);
 base+=vec3(.035,.13,.18)*fleck+mix(vec3(.04,.16,.22),vec3(.30,.15,.045),teal)*glint;
 vec3 color=mix(base,vec3(.055,.19,.25)*(.55+.45*ripple)+vec3(.20,.095,.028)*glint, uOverlay);
 gl_FragColor=vec4(color,mix(1.0,.18+.26*fleck,uOverlay));
 #include <colorspace_fragment>
 }`});
}
export function createRiverOverlay(plan,towers,civic,stations=[]){
 const scene=new THREE.Scene(),depth=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:true,side:THREE.DoubleSide});
 for(const s of plan.sectors)scene.add(polygonMesh(s.polygon,depth,0));
 const rows=[...towers,...civic.infill,...stations,...plan.bridges.map(b=>({x:(b.a[0]+b.b[0])/2,z:(b.a[1]+b.b[1])/2,w:b.width+2,d:Math.hypot(b.a[0]-b.b[0],b.a[1]-b.b[1])+.7,h:4,angle:Math.atan2(b.b[0]-b.a[0],b.b[1]-b.a[1])}))];
 if(rows.length){const proxies=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),depth,rows.length),o=new THREE.Object3D();rows.forEach((r,i)=>{const h=Math.max(1,r.h*1.27+1);o.position.set(r.x-500,h/2,r.z-400);o.rotation.set(0,r.angle||0,0);o.scale.set(r.w*1.1,h,r.d*1.1);o.updateMatrix();proxies.setMatrixAt(i,o.matrix);});proxies.instanceMatrix.needsUpdate=true;proxies.renderOrder=-1;scene.add(proxies);}
 const water=polygonMesh(plan.water,riverMaterial(true),-.56);water.renderOrder=1;scene.add(water);return {scene,water,proxyCount:rows.length};
}
