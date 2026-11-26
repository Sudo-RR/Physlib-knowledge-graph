// Project the existing city skyline into the approved oblique camera basis.
// Only camera composition changes; canonical positions and heights are untouched.
export function fitSkyline(rows,aspect,yaw=.65,pitch=Math.PI*.19){
 if(!rows.length||!(aspect>0))return {half:520,x:0,z:0,spanX:0,spanY:0};
 const c=Math.cos(yaw),s=Math.sin(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
 let loX=Infinity,hiX=-Infinity,loY=Infinity,hiY=-Infinity;
 for(const t of rows){
  const radius=Math.hypot(t.w||1,t.d||1)/2,x=t.x-500,z=t.z-400;
  const horizontal=c*x-s*z,vertical=-sp*(s*x+c*z);
  loX=Math.min(loX,horizontal-radius);hiX=Math.max(hiX,horizontal+radius);
  loY=Math.min(loY,vertical-sp*radius);hiY=Math.max(hiY,vertical+sp*radius+cp*Math.max(0,t.h||0)*1.26);
 }
 const spanX=hiX-loX,spanY=hiY-loY,cx=(loX+hiX)/2,cy=(loY+hiY)/2;
 // Keep 5–6% border for the city silhouettes; let peripheral terrain crop.
 return {half:Math.max(120,spanX/(2*aspect*.92),spanY/(2*.90)),x:c*cx-s*cy/sp,z:-s*cx-c*cy/sp,spanX,spanY};
}

// Initial exploration deliberately crops peripheral scenery; Overview restores full fit.
export function landingZoom(aspect){return aspect<.85?1.38:aspect<1.25?1.28:1.20;}
