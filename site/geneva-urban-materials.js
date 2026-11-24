// Local procedural monochrome urban surfaces: no external imagery.
// Fine aggregate is deliberately low contrast; it must not resemble terrain contours.
export function urbanSurfaceTextures(THREE){
 function texture(concrete){
  const c=document.createElement('canvas');c.width=c.height=256;
  const ctx=c.getContext('2d'),im=ctx.createImageData(256,256);let state=concrete?7123:4821;
  function rng(){state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;}
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   let v=(concrete?231:224)+(rng()-.5)*(concrete?14:25);
   if(concrete){const row=Math.floor(y/64),xx=(x+(row%2)*64)%128;if(y%64===0||xx===0)v-=10;}
   const i=4*(y*256+x);im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;
  }
  ctx.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
 }
 return {concrete:texture(true),asphalt:texture(false)};
}
export function worldPlanarUV(THREE,geo,scale){
 const p=geo.getAttribute('position'),uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){uv[2*i]=p.getX(i)/scale;uv[2*i+1]=p.getY(i)/scale;}
 geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));return geo;
}
