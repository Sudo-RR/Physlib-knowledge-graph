import * as THREE from 'three';
import {districtRows,DISTRICT_SWEEP_HZ} from './geneva-district-palette.js';
// Two batches: static roof caps in the depth-tested city, thin animated
// façade accents in its existing lightweight transparent annotation overlay.
export function roofHeight(t,imported){
 if(t.role==='provisional')return t.h+.22;
 if(imported)return t.h+1.42;
 if(t.style===2)return t.h*1.22+.25;
 if(t.style===4)return t.h*1.20+.25;
 if(t.style===3)return t.h*1.03+.65;
 return t.h*1.11+.25;
}
export function createDistrictLights(buildings,{imported=()=>false}={}){
 const rows=districtRows(buildings),roof={positions:[],colors:[],areas:[],indices:[]},sweep={positions:[],colors:[],areas:[],levels:[],phases:[],normals:[],across:[],indices:[]};
 const transform=(t,x,y,z)=>[t.x-500+Math.cos(t.angle||0)*x+Math.sin(t.angle||0)*z,y,t.z-400-Math.sin(t.angle||0)*x+Math.cos(t.angle||0)*z];
 const pushQuad=(out,pts,color,area,extra)=>{const base=out.positions.length/3;for(let i=0;i<4;i++){out.positions.push(...pts[i]);out.colors.push(color.r,color.g,color.b);out.areas.push(area);if(extra){out.levels.push(i<2?0:1);out.phases.push(extra.phase);out.normals.push(...extra.normal);out.across.push(i%2?-1:1);}}out.indices.push(base,base+1,base+2,base+2,base+1,base+3);};
 for(const {building:t,color,phase,area} of rows){
  const c=new THREE.Color(color),y=roofHeight(t,imported(t)),w=Math.max(.38,t.w*.24),d=Math.max(.38,t.d*.24);
  pushQuad(roof,[[-w,y,-d],[w,y,-d],[-w,y,d],[w,y,d]].map(p=>transform(t,...p)),c,area);
  // Thin architectural edge accents, not a coloured shell around the tower.
  // Keep them within the projected footprint and below the roofline; two
  // faces towards the camera are visible, with phase varying per building.
  const hw=t.w*.42,hd=t.d*.42,low=Math.max(2,t.h*.10),high=Math.max(low+.5,t.h*.82),a=t.angle||0;
  for(const sign of [-1,1]){
   const z=sign*hd,x=hw*.78,wx=Math.max(.11,Math.min(.48,t.w*.10));
   pushQuad(sweep,[[x-wx,low,z],[x+wx,low,z],[x-wx,high,z],[x+wx,high,z]].map(p=>transform(t,...p)),c,area,{phase,normal:[Math.sin(a)*sign,0,Math.cos(a)*sign]});
   const x2=sign*hw,z2=-hd*.78,wz=Math.max(.11,Math.min(.48,t.d*.10));
   pushQuad(sweep,[[x2,low,z2-wz],[x2,low,z2+wz],[x2,high,z2-wz],[x2,high,z2+wz]].map(p=>transform(t,...p)),c,area,{phase,normal:[Math.cos(a)*sign,0,-Math.sin(a)*sign]});
  }
 }
 function geom(data,animated){const g=new THREE.BufferGeometry();for(const [key,values,size] of [['position',data.positions,3],['districtTint',data.colors,3],['districtArea',data.areas,1],...(animated?[['districtLevel',data.levels,1],['districtPhase',data.phases,1],['districtNormal',data.normals,3],['districtAcross',data.across,1]]:[])])g.setAttribute(key,new THREE.Float32BufferAttribute(values,size));g.setIndex(data.indices);g.computeBoundingSphere();return g;}
 const roofMat=new THREE.ShaderMaterial({uniforms:{uArea:{value:-1}},side:THREE.DoubleSide,toneMapped:false,vertexShader:`
 attribute vec3 districtTint;attribute float districtArea;uniform float uArea;varying vec3 vTint;varying float vVisible;
 void main(){vTint=districtTint;vVisible=float(uArea<0.0||abs(districtArea-uArea)<0.5);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`varying vec3 vTint;varying float vVisible;void main(){if(vVisible<0.5)discard;gl_FragColor=vec4(mix(vTint,vec3(1.0),0.12),1.0);
 #include <colorspace_fragment>
 }`});
 const sweepMat=new THREE.ShaderMaterial({uniforms:{uArea:{value:-1},uTime:{value:0},uMoving:{value:0}},transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,toneMapped:false,vertexShader:`
 attribute vec3 districtTint,districtNormal;attribute float districtArea,districtLevel,districtPhase,districtAcross;
 uniform float uArea;varying vec3 vTint;varying float vVisible,vLevel,vPhase,vAcross;
 void main(){vTint=districtTint;vLevel=districtLevel;vPhase=districtPhase;vAcross=districtAcross;vec3 n=normalize(mat3(viewMatrix)*districtNormal);vVisible=float((uArea<0.0||abs(districtArea-uArea)<0.5)&&n.z>0.06);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`
 uniform float uTime,uMoving;varying vec3 vTint;varying float vVisible,vLevel,vPhase,vAcross;
 void main(){if(vVisible<0.5)discard;float p=fract(uTime*${DISTRICT_SWEEP_HZ.toFixed(2)}+vPhase);float band=exp(-pow((vLevel-p)*9.0,2.0));float edge=1.0-smoothstep(0.55,1.0,abs(vAcross));float intensity=.22+.65*band*uMoving;
 vec3 color=mix(vTint,vec3(1.0),.25*band*uMoving);gl_FragColor=vec4(color,intensity*edge);
 #include <colorspace_fragment>
 }`});
 const cap=new THREE.Mesh(geom(roof,false),roofMat),strips=new THREE.Mesh(geom(sweep,true),sweepMat);cap.renderOrder=2;strips.renderOrder=3;cap.frustumCulled=false;strips.frustumCulled=false;return {cap,strips,rows};
}
