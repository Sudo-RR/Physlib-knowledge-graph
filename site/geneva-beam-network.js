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
  const direction=selected?(e.to===selected?'in':e.from===selected?'out':'both'):(channel==='in'?'in':channel==='out'?'out':'both');
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
 const a=pos(row.from,row.utility?1.1:Math.max(8,(row.from.h||0)*1.23)+3),b=pos(row.to,row.utility?1.45:Math.max(8,(row.to.h||0)*1.23)+3),mid=a.clone().lerp(b,.5);
 if(row.utility){
  // Rounded parcel-axis elbow, not invented road or mathematical edges.
  const angle=row.from.angle||0,c=Math.cos(angle),s=Math.sin(angle),delta=b.clone().sub(a),u=delta.x*c-delta.z*s;
  const elbow=new THREE.Vector3(a.x+c*u,(a.y+b.y)/2,a.z-s*u);
  const first=elbow.clone().sub(a),last=b.clone().sub(elbow),radius=Math.min(1.2,first.length()*.28,last.length()*.28);
  if(radius<.12)return new THREE.LineCurve3(a,b);
  const before=elbow.clone().addScaledVector(first.normalize(),-radius),after=elbow.clone().addScaledVector(last.normalize(),radius);
  const path=new THREE.CurvePath();path.add(new THREE.LineCurve3(a,before));path.add(new THREE.QuadraticBezierCurve3(before,elbow,after));path.add(new THREE.LineCurve3(after,b));return path;
 }
 mid.y+=Math.min(105,16+a.distanceTo(b)*.12);mid.x-=(b.z-a.z)*.045;mid.z+=(b.x-a.x)*.045;
 return new THREE.QuadraticBezierCurve3(a,mid,b);
}
export function createBeamNetwork(rows,{selected=false}={}){
 const position=[],tangent=[],side=[],distance=[],phase=[],tint=[],strength=[],width=[],utility=[],indices=[];
 const segments=18;
 for(const row of [...rows.filter(r=>!r.utility),...rows.filter(r=>r.utility)]){
  const curve=beamCurve(row),points=curve.getSpacedPoints(segments),length=curve.getLength(),p=seed(row.id),startColor=new THREE.Color(channels[row.key==='both'?'out':row.key]),endColor=new THREE.Color(channels[row.key==='both'?'in':row.key]),base=position.length/3;
  for(let i=0;i<=segments;i++){
   const direction=points[Math.min(segments,i+1)].clone().sub(points[Math.max(0,i-1)]).normalize(),progress=i/segments,color=startColor.clone().lerp(endColor,THREE.MathUtils.smoothstep(progress,.36,.64));
   for(const sign of [-1,1]){position.push(...points[i].toArray());tangent.push(...direction.toArray());side.push(sign);distance.push(i/segments*length);phase.push(p);tint.push(color.r,color.g,color.b);strength.push(row.utility?(row.focused?1:.82):row.focused?.95:selected?.16:.34);width.push(row.utility?(row.focused?7:5.2):row.focused?5.8:3.5);utility.push(row.utility?1:0);}
   if(i<segments){const a=base+i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
 }
 const geo=new THREE.BufferGeometry();
 for(const [name,values,size] of [['position',position,3],['beamTangent',tangent,3],['beamSide',side,1],['beamDistance',distance,1],['beamPhase',phase,1],['beamTint',tint,3],['beamStrength',strength,1],['beamWidth',width,1],['beamUtility',utility,1]])geo.setAttribute(name,new THREE.Float32BufferAttribute(values,size));
 geo.setIndex(indices);geo.computeBoundingSphere();
 const mat=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uResolution:{value:new THREE.Vector2(1,1)}},transparent:true,blending:THREE.NormalBlending,depthWrite:false,depthTest:true,side:THREE.DoubleSide,toneMapped:false,
 vertexShader:`
 attribute vec3 beamTangent;attribute float beamSide,beamDistance,beamPhase,beamStrength,beamWidth,beamUtility;attribute vec3 beamTint;
 uniform vec2 uResolution;
 varying float vSide,vDistance,vPhase,vStrength,vUtility;varying vec3 vTint;
 void main(){
  vec4 clip=projectionMatrix*modelViewMatrix*vec4(position,1.0);
  vec4 next=projectionMatrix*modelViewMatrix*vec4(position+beamTangent,1.0);
  vec2 delta=(next.xy/next.w-clip.xy/clip.w)*uResolution;
  vec2 normal=vec2(-delta.y,delta.x)/max(length(delta),0.0001);
  clip.xy+=normal*beamSide*beamWidth*2.0/uResolution*clip.w;
  gl_Position=clip;vSide=beamSide;vDistance=beamDistance;vPhase=beamPhase;vTint=beamTint;vStrength=beamStrength;vUtility=beamUtility;
 }`,
 fragmentShader:`
 uniform float uTime;varying float vSide,vDistance,vPhase,vStrength,vUtility;varying vec3 vTint;
 void main(){
  float across=abs(vSide);
  float pulse=0.5+0.5*cos(6.2831853*(vDistance/mix(78.0,14.0,vUtility)-uTime*0.68+vPhase));
  float signal=pow(pulse,2.0);
  float casing=1.0-smoothstep(.63,.78,across);
  float body=1.0-smoothstep(.38,.54,across);
  float core=1.0-smoothstep(.10,.31,across);
  float halo=(1.0-smoothstep(.64,1.0,across))*.12;
  vec3 rgb=mix(vTint*.32,vTint,body);
  rgb=mix(rgb,mix(vTint,vec3(.77,.95,1.0),.22+.28*signal+.15*vUtility),core);
  float alpha=(casing*(.47+.12*signal)+body*.20+core*.18+halo)*vStrength;
  gl_FragColor=vec4(rgb,clamp(alpha,0.0,1.0));
  #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;mesh.renderOrder=4;return mesh;
}
