import * as THREE from 'three';
import {channels,stationRoleLinks} from './geneva-legibility.js';
import {blanketSections} from './geneva-district-lighting.js';
export function beamMotionAllowed({available,paused,reduced,visible,channel}){return !!available&&!paused&&!reduced&&!!visible&&channel!=='off';}
// Batched architectural skywalk shells and continuous street utility strips.
// Graph edges and semantic endpoint colours remain unchanged.
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
// Avalanche the stable hash so consecutive edge names do not bias the bands.
export function seed(id){let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return (h>>>0)/4294967296;}
export function anchorRatio(id){return seed(id+':band')<.55?.50+.45*seed(id+':height'):.10+.40*seed(id+':height');}
export function facadeAnchor(t,target,y,outline=null){
 const a=t.angle||0,c=Math.cos(a),s=Math.sin(a),dx=target.x-t.x,dz=target.z-t.z;
 const u=c*dx-s*dz,v=s*dx+c*dz,len=Math.hypot(u,v)||1,ux=len===1&&dx===0&&dz===0?1:u/len,uz=v/len;
 const sections=blanketSections({...t,w:t.w||2,d:t.d||2,h:t.h||5},outline),section=sections.find(q=>y>=q.lo&&y<=q.hi)||sections[0];
 let ray=Infinity;
 for(let i=0;i<section.points.length;i++){const [x,z]=section.points[i],[xx,zz]=section.points[(i+1)%section.points.length],ex=xx-x,ez=zz-z,det=ux*ez-uz*ex;if(Math.abs(det)<1e-8)continue;const k=(x*ez-z*ex)/det,j=(x*uz-z*ux)/det;if(k>=0&&j>=-1e-8&&j<=1+1e-8)ray=Math.min(ray,k);}
 if(!Number.isFinite(ray))ray=Math.min((t.w||2)/2,(t.d||2)/2);
 const x=ux*ray,z=uz*ray;return new THREE.Vector3(t.x-500+c*x+s*z,y,t.z-400-s*x+c*z);
}
export function beamCurve(row,{outline=()=>null}={}){
 const id=row.id||String(row.from.id)+'>'+String(row.to.id);
 const a=facadeAnchor(row.from,row.to,row.utility?1.1:Math.max(2,(row.from.h||5)*anchorRatio(id+':from')),outline(row.from));
 const b=facadeAnchor(row.to,row.from,row.utility?1.45:Math.max(2,(row.to.h||5)*anchorRatio(id+':to')),row.utility?null:outline(row.to));
 const delta=b.clone().sub(a),flat=new THREE.Vector3(delta.x,0,delta.z),span=flat.length();
 if(span<.4)return new THREE.LineCurve3(a,b);
 const path=new THREE.CurvePath(),add=(p,q)=>{if(p.distanceTo(q)>1e-5)path.add(new THREE.LineCurve3(p,q));};
 if(row.utility){
  const angle=row.from.angle||0,c=Math.cos(angle),s=Math.sin(angle),u=delta.x*c-delta.z*s,elbow=new THREE.Vector3(a.x+c*u,(a.y+b.y)/2,a.z-s*u);
  add(a,elbow);add(elbow,b);return path;
 }
 // Straight horizontal exit and entry stubs, with an enclosed inclined span.
 const stub=Math.min(4,span*.18),dir=flat.normalize(),exit=a.clone().addScaledVector(dir,stub),entry=b.clone().addScaledVector(dir,-stub);
 add(a,exit);add(exit,entry);add(entry,b);return path;
}
export function createBeamNetwork(rows,{selected=false,outline=()=>null}={}){
 const position=[],tangent=[],side=[],distance=[],phase=[],tint=[],strength=[],width=[],utility=[],indices=[];
 const segments=18;
 function vertex(point,dir,s,d,p,color,k,w,isUtility){position.push(...point.toArray());tangent.push(...dir.toArray());side.push(s);distance.push(d);phase.push(p);tint.push(color.r,color.g,color.b);strength.push(k);width.push(w);utility.push(isUtility?1:0);}
 for(const row of [...rows.filter(r=>!r.utility),...rows.filter(r=>r.utility)]){
  const curve=beamCurve(row,{outline}),points=curve.getSpacedPoints(segments),length=curve.getLength(),p=seed(row.id||''),startColor=new THREE.Color(channels[row.key==='both'?'out':row.key]),endColor=new THREE.Color(channels[row.key==='both'?'in':row.key]),base=position.length/3;
  const k=row.utility?(row.focused?1:.95):row.focused?1:selected?.18:.78;
  const dirs=points.map((point,i)=>points[Math.min(segments,i+1)].clone().sub(points[Math.max(0,i-1)]).normalize());
  if(row.utility){
   for(let i=0;i<=segments;i++){const color=startColor.clone().lerp(endColor,i/segments);for(const sign of [-1,1])vertex(points[i],dirs[i],sign,i/segments*length,p,color,k,row.focused?7.5:5.7,true);if(i<segments){const j=base+i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}
  }else{
   // Four actual world-space faces, each with transverse coordinate for
   // dark structural rails and coloured glazing. No billboard extrusion.
   const halfW=row.focused?1.55:1.15,halfH=row.focused?1.15:.88;
   for(let i=0;i<=segments;i++){
    const d=dirs[i],right=new THREE.Vector3(-d.z,0,d.x).normalize();if(right.lengthSq()<1e-8)right.set(1,0,0);
    const up=new THREE.Vector3().crossVectors(right,d).normalize();if(up.y<0)up.negate();
    const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>points[i].clone().addScaledVector(right,x*halfW).addScaledVector(up,y*halfH));
    const color=startColor.clone().lerp(endColor,THREE.MathUtils.smoothstep(i/segments,.36,.64));
    for(let f=0;f<4;f++){vertex(corners[f],d,-1,i/segments*length,p,color,k,0,false);vertex(corners[(f+1)%4],d,1,i/segments*length,p,color,k,0,false);}
    if(i<segments)for(let f=0;f<4;f++){const j=base+i*8+f*2;indices.push(j,j+1,j+8,j+1,j+9,j+8);}
   }
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
  if(beamUtility>0.5){vec4 next=projectionMatrix*modelViewMatrix*vec4(position+beamTangent,1.0);vec2 delta=(next.xy/next.w-clip.xy/clip.w)*uResolution;vec2 normal=vec2(-delta.y,delta.x)/max(length(delta),0.0001);clip.xy+=normal*beamSide*beamWidth*2.0/uResolution*clip.w;}
  gl_Position=clip;vSide=beamSide;vDistance=beamDistance;vPhase=beamPhase;vTint=beamTint;vStrength=beamStrength;vUtility=beamUtility;
 }`,
 fragmentShader:`
 uniform float uTime;varying float vSide,vDistance,vPhase,vStrength,vUtility;varying vec3 vTint;
 void main(){
  float across=abs(vSide),pulse=.5+.5*cos(6.2831853*(vDistance/mix(78.0,14.0,vUtility)-uTime*.68+vPhase));
  vec3 rgb;float alpha;
  if(vUtility>0.5){float casing=1.0-smoothstep(.83,.98,across),core=1.0-smoothstep(.35,.62,across);rgb=mix(vTint*.22,mix(vTint,vec3(.73,1.0,.96),.35+.28*pulse),core);alpha=(.72*casing+.24*core)*vStrength;}
  else{float rail=smoothstep(.68,.87,across),mullion=1.0-smoothstep(.055,.12,abs(fract(vDistance/7.0)-.5));float frame=max(rail,mullion);rgb=mix(vTint*(.58+.22*pulse),vec3(.055,.085,.11),frame);rgb=mix(rgb,vTint,.36*rail);alpha=(.90+.08*frame)*vStrength;}
  gl_FragColor=vec4(rgb,clamp(alpha,0.0,1.0));
  #include <colorspace_fragment>
 }`});
 const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;mesh.renderOrder=4;return mesh;
}
