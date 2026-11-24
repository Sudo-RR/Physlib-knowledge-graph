import {roofStyle,buildingStyle} from './city-art.js';

export const atomicPalette={ivory:0xf3e9d2,teal:0x14b8b0,amber:0xffc34b,coral:0xf47758,orchid:0xa47ae1,green:0x66be87,ink:0x27334d};
export const atomicTypes=['Research institute','Terraced laboratory','Space-age tower','Garden pavilion'];
export function reviewCameraOffset(value){
 try{const v=value?.trim().startsWith('[')?JSON.parse(value):value?.split(',').map(Number);return Array.isArray(v)&&v.length===3&&v.every(Number.isFinite)?v:null;}catch{return null;}
}
// Calibrated against the pinned surface distribution: 16 / 205 / 575 / 1335 / 2450 lines.
// Source height is retained separately. Storeys are decorative, source floors are not.
export function atomicPlan(node,semanticHeight,concept='campus'){
 const lines=Math.max(0,node.module.lineCount??0);let height=Math.min(20,5+3*Math.log2(1+lines/80));
 const type=roofStyle(node.id),scale=1+Math.min(.35,Math.log2(1+lines/205)*.08);
 const widths=[14,9,7.5,12],depths=[11,8,7.5,10];
 const width=Math.max(widths[type]*scale,height/1.85),depth=depths[type]*scale;
 if(concept==='skyscraper')height=Math.min(110,32+12*Math.log2(1+lines/80),5.8*Math.min(width,depth));
 return {id:node.id,type,name:atomicTypes[type],height,width,depth,semanticHeight,sourceLines:lines,sourceFootprint:buildingStyle(node.id),concept};
}
export function atomicBounds(plan){return {width:plan.width+1.4,depth:plan.depth+2,height:plan.height+1.8};}

/** Candidate screen-space occlusion: project neighbour AABBs into the subject view. */
export function atomicCameraPose(module,modules,aspect=1.5,view='selected'){
 const p=module.position,h=module.displayHeight,b=module.decorativeBounds,w=b.maxX-b.minX,d=b.maxZ-b.minZ;
 const radius=['metropolis','skyline'].includes(module.presentation)?Math.max(h*2.75,w*2.05/Math.max(.65,aspect),d*1.7):Math.max(h*3.8,w*2.45/Math.max(.65,aspect),d*1.6),target=[p.x,h*.46,p.z];let best;
 for(let i=0;i<24;i++){
  const angle=i*Math.PI/12,ux=Math.cos(angle),uz=Math.sin(angle),eye=[p.x+ux*radius,h*.46+radius*.68,p.z+uz*radius];let score=0;
  for(const m of modules){if(m.id===module.id)continue;const dx=m.position.x-p.x,dz=m.position.z-p.z,along=dx*ux+dz*uz;if(along<=0||along>=radius*1.12)continue;
   const q=m.decorativeBounds,lateral=Math.abs(-dx*uz+dz*ux),half=(q.maxX-q.minX+q.maxZ-q.minZ)*.36;
   const screenWidth=(half+w*.35)*(1-along/(radius*1.6));
   const rayHeight=h*.46+along*.68;if(lateral<screenWidth&&m.decorativeHeight>rayHeight)score+=(screenWidth-lateral)*(1+along/radius*3);
  }
  // Prefer entrance-facing southeast when equally unobstructed.
  score+=Math.abs(angle-Math.PI/3)*.015;if(!best||score<best.score)best={score,position:eye,target};
 }
 if(view==='street')best.position[1]=h*.65;
 return best;
}
