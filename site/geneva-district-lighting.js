import * as THREE from 'three';
import {districtRows,DISTRICT_BLANKET_HZ} from './geneva-district-palette.js';
// Static roofs in the city and broad unified façade skins in the existing overlay.
export function roofHeight(t,imported){
 if(t.role==='provisional')return t.h+.22;
 if(imported)return t.h+1.42;
 if(t.style===2)return t.h*1.22+.25;
 if(t.style===4)return t.h*1.20+.25;
 if(t.style===3)return t.h*1.03+.65;
 return t.h*1.11+.25;
}
// Polygon outlines follow existing architecture. Imported outlines are a
// simplified convex envelope; round and stepped towers keep their own profiles.
export function blanketSections(t,outline=null){
 const h=t.h,rect=(w,d)=>[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]],ellipse=(w,d)=>Array.from({length:16},(_,i)=>[Math.cos(i*Math.PI/8)*w/2,Math.sin(i*Math.PI/8)*d/2]);
 const sec=(points,lo,hi)=>({points,lo,hi});
 if(t.role==='provisional')return [sec(rect(t.w*.80,t.d*.80),2,h*.97)];
 if(outline?.length>=3)return [sec(outline.map(([x,z])=>[x*t.w,z*t.d]),1,h+1)];
 if(t.style===2)return [sec(ellipse(t.w,t.d),2,h*.92),sec(ellipse(t.w*.83,t.d*.83),h*.92,h*1.04)];
 if(t.style===4)return [sec(ellipse(t.w*.58,t.d*.58),2,h*.82),sec(ellipse(t.w*1.02,t.d*1.02),h*.82,h*.965)];
 if(t.style===3)return [sec(rect(t.w,t.d),2,h*.70),sec(rect(t.w*.64,t.d*.64),h*.70,h*1.03)];
 return [sec(rect(t.w*.90,t.d*.92),2,h*.98)];
}
export function createDistrictLights(buildings,{imported=()=>false,outline=()=>null}={}){
 const rows=districtRows(buildings),roof={positions:[],colors:[],areas:[],indices:[]},blanket={positions:[],colors:[],areas:[],phases:[],normals:[],indices:[]};
 const transform=(t,x,y,z)=>[t.x-500+Math.cos(t.angle||0)*x+Math.sin(t.angle||0)*z,y,t.z-400-Math.sin(t.angle||0)*x+Math.cos(t.angle||0)*z];
 const pushQuad=(out,pts,color,area,extra)=>{const base=out.positions.length/3;for(let i=0;i<4;i++){out.positions.push(...pts[i]);out.colors.push(color.r,color.g,color.b);out.areas.push(area);if(extra){out.phases.push(extra.phase);out.normals.push(...extra.normal);}}out.indices.push(base,base+1,base+2,base+2,base+1,base+3);};
 for(const {building:t,color,phase,area} of rows){
  const c=new THREE.Color(color),y=roofHeight(t,imported(t)),w=Math.max(.38,t.w*.24),d=Math.max(.38,t.d*.24);
  pushQuad(roof,[[-w,y,-d],[w,y,-d],[-w,y,d],[w,y,d]].map(p=>transform(t,...p)),c,area);
  const a=t.angle||0,cos=Math.cos(a),sin=Math.sin(a);
  for(const {points,lo,hi} of blanketSections(t,outline(t))){
   if(hi<=lo)continue;
   // Convex outlines run counterclockwise in local x,z. Each complete
   // face shares the complex's phase, without any spatial wave coordinate.
   for(let i=0;i<points.length;i++){
    const [x,z]=points[i],[xx,zz]=points[(i+1)%points.length],dx=xx-x,dz=zz-z,len=Math.hypot(dx,dz);
    if(len<1e-8)continue;
    const nx=dz/len,nz=-dx/len,off=.035;
    pushQuad(blanket,[[x+nx*off,lo,z+nz*off],[xx+nx*off,lo,zz+nz*off],[x+nx*off,hi,z+nz*off],[xx+nx*off,hi,zz+nz*off]].map(p=>transform(t,...p)),c,area,{phase,normal:[cos*nx+sin*nz,0,-sin*nx+cos*nz]});
   }
  }
 }
 function geom(data,animated){const g=new THREE.BufferGeometry();for(const [key,values,size] of [['position',data.positions,3],['districtTint',data.colors,3],['districtArea',data.areas,1],...(animated?[['districtPhase',data.phases,1],['districtNormal',data.normals,3]]:[])])g.setAttribute(key,new THREE.Float32BufferAttribute(values,size));g.setIndex(data.indices);g.computeBoundingSphere();return g;}
 const roofMat=new THREE.ShaderMaterial({uniforms:{uArea:{value:-1}},side:THREE.DoubleSide,toneMapped:false,vertexShader:`
 attribute vec3 districtTint;attribute float districtArea;uniform float uArea;varying vec3 vTint;varying float vVisible;
 void main(){vTint=districtTint;vVisible=float(uArea<0.0||abs(districtArea-uArea)<0.5);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`varying vec3 vTint;varying float vVisible;void main(){if(vVisible<0.5)discard;gl_FragColor=vec4(mix(vTint,vec3(1.0),0.12),1.0);
 #include <colorspace_fragment>
 }`});
 const blanketMat=new THREE.ShaderMaterial({uniforms:{uArea:{value:-1},uTime:{value:0},uMoving:{value:0}},transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,toneMapped:false,vertexShader:`
 attribute vec3 districtTint,districtNormal;attribute float districtArea,districtPhase;
 uniform float uArea;varying vec3 vTint;varying float vVisible,vPhase;
 void main(){vTint=districtTint;vPhase=districtPhase;vec3 n=normalize(mat3(viewMatrix)*districtNormal);vVisible=float((uArea<0.0||abs(districtArea-uArea)<0.5)&&n.z>0.035);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`
 uniform float uTime,uMoving;varying vec3 vTint;varying float vVisible,vPhase;
 void main(){if(vVisible<0.5)discard;
  float pulse=0.5+0.5*sin(6.2831853*(uTime*${DISTRICT_BLANKET_HZ.toFixed(2)}+vPhase));
  float intensity=.16+.27*pulse*uMoving;
  vec3 color=mix(vTint,vec3(1.0),.08+.06*pulse*uMoving);
  gl_FragColor=vec4(color,intensity);
  #include <colorspace_fragment>
 }`});
 const cap=new THREE.Mesh(geom(roof,false),roofMat),skin=new THREE.Mesh(geom(blanket,true),blanketMat);cap.renderOrder=2;skin.renderOrder=3;cap.frustumCulled=false;skin.frustumCulled=false;return {cap,blanket:skin,rows};
}
