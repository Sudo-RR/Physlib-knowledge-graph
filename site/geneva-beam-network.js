import * as THREE from 'three';
import {channels,stationRoleLinks} from './geneva-legibility.js';
export function beamMotionAllowed({available,paused,reduced,visible,channel}){return !!available&&!paused&&!reduced&&!!visible&&channel!=='off';}
// A directionally animated, translucent, camera-facing ribbon. Each graph edge
// carries its own colour, arc length and deterministic phase. No extra lights,
// post-processing, per-edge material or animation object.
export function networkRows(model,layout,filter='all',channel='both',selected=null){
 if(channel==='off'||!model||!layout)return [];
 const sites=new Map(layout.sites.map(t=>[t.id,t])),roofs=new Map(),byComplex=new Map();
 for(const t of layout.buildings){const a=byComplex.get(t.complexId)||[];a.push(t);byComplex.set(t.complexId,a);if(!roofs.has(t.complexId)||roofs.get(t.complexId).h<t.h)roofs.set(t.complexId,t);}
 const stationByComplex=new Map(layout.stations.map(t=>[t.complexId,t]));
 const eligible=t=>t&&(filter==='all'||t.area===filter);
 const out=[];
 if(channel!=='mathlib')for(const e of model.edges){
  const a=sites.get(e.from),b=sites.get(e.to);if(!eligible(a)||!eligible(b))continue;
  const direction=selected&&e.to===selected?'in':'out';
  // Direction filters are meaningful relative to a selection; in unselected
  // overview every edge is shown exactly once, dependent -> prerequisite.
  if(selected&&channel!=='both'&&((channel==='out'&&e.from!==selected)||(channel==='in'&&e.to!==selected)))continue;
  const focused=!!selected&&(e.from===selected||e.to===selected);
  const start=roofs.get(e.from)||a,end=roofs.get(e.to)||b;
  out.push({id:e.from+'>'+e.to,from:start,to:end,key:direction,focused,utility:false});
 }
 for(const c of model.complexes){const station=stationByComplex.get(c.id);if(!eligible(station))continue;
  for(const t of stationRoleLinks(c,byComplex.get(c.id)||[]))out.push({id:t.id+'>'+station.id,from:t,to:station,key:'mathlib',focused:c.id===selected,utility:true});
 }
 return out;
}
const seed=id=>{let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);return (h>>>0)/4294967296;};
export function beamCurve(row){
 const pos=(t,y)=>new THREE.Vector3(t.x-500,y,t.z-400);
 const a=pos(row.from,row.utility?2.1:Math.max(8,(row.from.h||0)*1.23)+3),b=pos(row.to,row.utility?2.8:Math.max(8,(row.to.h||0)*1.23)+3),mid=a.clone().lerp(b,.5);
 mid.y+=row.utility?1.4:Math.min(105,16+a.distanceTo(b)*.12);
 if(!row.utility){mid.x-=(b.z-a.z)*.045;mid.z+=(b.x-a.x)*.045;}
 return new THREE.QuadraticBezierCurve3(a,mid,b);
}
export function createBeamNetwork(rows,{selected=false}={}){
 const position=[],tangent=[],side=[],distance=[],phase=[],tint=[],strength=[],width=[],indices=[];
 const segments=18;
 for(const row of rows){
  const curve=beamCurve(row),points=curve.getSpacedPoints(segments),length=curve.getLength(),p=seed(row.id),color=new THREE.Color(channels[row.key]),base=position.length/3;
  for(let i=0;i<=segments;i++){
   const direction=points[Math.min(segments,i+1)].clone().sub(points[Math.max(0,i-1)]).normalize();
   for(const sign of [-1,1]){position.push(...points[i].toArray());tangent.push(...direction.toArray());side.push(sign);distance.push(i/segments*length);phase.push(p);tint.push(color.r,color.g,color.b);strength.push(row.focused?.95:selected?.10:row.utility?.48:.24);width.push(row.focused?6.5:row.utility?3.8:3.4);}
   if(i<segments){const a=base+i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
 }
 const geo=new THREE.BufferGeometry();
 for(const [name,values,size] of [['position',position,3],['beamTangent',tangent,3],['beamSide',side,1],['beamDistance',distance,1],['beamPhase',phase,1],['beamTint',tint,3],['beamStrength',strength,1],['beamWidth',width,1]])geo.setAttribute(name,new THREE.Float32BufferAttribute(values,size));
 geo.setIndex(indices);geo.computeBoundingSphere();
 const mat=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uResolution:{value:new THREE.Vector2(1,1)}},transparent:true,blending:THREE.NormalBlending,depthWrite:false,depthTest:true,side:THREE.DoubleSide,toneMapped:false,
 vertexShader:`
 attribute vec3 beamTangent;attribute float beamSide,beamDistance,beamPhase,beamStrength,beamWidth;attribute vec3 beamTint;
 uniform vec2 uResolution;
 varying float vSide,vDistance,vPhase,vStrength;varying vec3 vTint;
 void main(){
  vec4 clip=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  vec4 next=projectionMatrix*modelViewMatrix*vec4(position+beamTangent,1.0);
  vec2 delta=(next.xy/next.w-clip.xy/clip.w)*uResolution;
  vec2 normal=vec2(-delta.y,delta.x)/max(length(delta),0.0001);
  clip.xy+=normal*beamSide*beamWidth*2.0/uResolution*clip.w;
  gl_Position=clip;vSide=beamSide;vDistance=beamDistance;vPhase=beamPhase;vTint=beamTint;vStrength=beamStrength;
 }`,
 fragmentShader:`
 uniform float uTime;varying float vSide,vDistance,vPhase,vStrength;varying vec3 vTint;
 void main(){
  float across=abs(vSide);
  float pulse=fract(vDistance/78.0-uTime*0.68+vPhase);
  float head=exp(-pow((pulse-.72)*12.0,2.0));
  float tail=exp(-pow((pulse-.57)*7.0,2.0))*smoothstep(.05,.3,pulse);
  float signal=clamp(head+tail*.50,0.0,1.0);
  float core=exp(-across*across*45.0);
  float halo=exp(-across*across*5.5)*(1.0-smoothstep(.72,1.0,across));
  vec3 rgb=mix(vTint,vec3(1.0,.98,.95),core*(.32+.68*signal));
  float alpha=(core*(.19+.81*signal)+halo*(.045+.28*signal))*vStrength;
  gl_FragColor=vec4(rgb,clamp(alpha,0.0,1.0));
  #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;mesh.renderOrder=4;return mesh;
}
