// Camera-relative movement shared by city and navigation map. Fixed oblique pitch.
export const navigationKeys=new Set(['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown','q','e','+','=','-']);
export function navigationDelta(keys,view,yaw,zoom,seconds){
 const dt=Math.max(0,Math.min(.12,seconds)),has=k=>keys.has(k)?1:0,city=view==='oblique',a=city?yaw:0;
 let x=has('d')-has('a'),z=has('s')-has('w');
 if(!city){x+=has('arrowright')-has('arrowleft');z+=has('arrowdown')-has('arrowup');}
 const length=Math.hypot(x,z),speed=210/Math.max(.75,zoom)*dt;
 if(length>1){x/=length;z/=length;}
 const rotation=city?((has('arrowright')-has('arrowleft'))+(has('e')-has('q')))*1.35*dt:0;
 const exponent=((city?has('arrowup')-has('arrowdown'):0)+Math.max(has('+'),has('='))-has('-'))*1.7*dt;
 return {dx:(x*Math.cos(a)+z*Math.sin(a))*speed,dz:(-x*Math.sin(a)+z*Math.cos(a))*speed,rotation,factor:Math.exp(exponent)};
}
export function normalizeYaw(yaw){return Math.atan2(Math.sin(yaw),Math.cos(yaw));}
