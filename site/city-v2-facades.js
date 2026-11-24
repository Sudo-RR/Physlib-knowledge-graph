// Vendored from https://github.com/trinhtanphat/aeroview-coast-3d/blob/85124ca1666ad890810db0d3f39c8aecbd5616f4/src/coastal-visuals.js
// MIT; Copyright (c) 2026 trinhtanphat. See assets/licenses/aeroview-mit.txt.
// Procedural facade textures for the simulated city.
// Entirely original pixels generated in the browser: no satellite imagery or Google assets.
export function makeFacadeMaterials(THREE){
 const palettes=[
  {frame:'#d4d8d6',glass:'#80aab4',shade:'#365b70',reflect:'#f0f5f1'},
  {frame:'#d7cbb9',glass:'#a4c5d0',shade:'#42617b',reflect:'#fbf1e3'},
  {frame:'#b3c9ce',glass:'#4380a2',shade:'#153d62',reflect:'#c8eef4'},
  {frame:'#e4ded0',glass:'#7fafbb',shade:'#406f89',reflect:'#f6f6df'},
  {frame:'#d5d5c8',glass:'#789c9c',shade:'#375d67',reflect:'#cce8df'}
 ];
 let seed=44213;
 const random=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
 return palettes.map((p,style)=>{
  const canvas=document.createElement('canvas');
  canvas.width=256;canvas.height=512;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=p.frame;ctx.fillRect(0,0,256,512);
  // Facade uses visible recessed glazed panels rather than flat colored boxes.
  const cols=style===2?9:7,rows=style===2?28:22;
  const cellW=256/cols,cellH=512/rows;
  for(let y=0;y<rows;y++){
   for(let x=0;x<cols;x++){
    const px=x*cellW+3,py=y*cellH+3;
    const w=cellW-6,h=cellH-6;
    const glint=random();
    ctx.fillStyle=glint<.32?p.glass:glint<.7?p.shade:p.reflect;
    ctx.fillRect(px,py,w,h);
    ctx.fillStyle='rgba(255,255,255,.33)';
    ctx.fillRect(px,py,Math.max(1,w*.11),h*.74);
    ctx.fillStyle='rgba(5,24,46,.30)';
    ctx.fillRect(px+w*.57,py,Math.max(1,w*.07),h);
    ctx.fillStyle='rgba(250,255,255,.23)';
    ctx.fillRect(px,py,w,1.5);
    if(style===1||style===3){
     ctx.fillStyle='rgba(240,243,240,.65)';
     ctx.fillRect(x*cellW,py+h*.83,cellW,Math.max(2,cellH*.12));
    }
   }
  }
  for(let x=0;x<cols+1;x++){
   ctx.fillStyle=style===2?'rgba(233,251,249,.74)':'rgba(230,235,229,.71)';
   ctx.fillRect(x*cellW-1.4,0,2.8,512);
  }
  ctx.fillStyle='rgba(255,255,255,.30)';
  ctx.fillRect(0,0,256,3);
  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=2;
  tex.wrapS=THREE.RepeatWrapping;
  tex.wrapT=THREE.RepeatWrapping;
  return new THREE.MeshStandardMaterial({
    color:'#eaf1f1',map:tex,roughness:style===2?.20:.45,
    metalness:style===2?.55:.24,
    envMapIntensity:.55
  });
 });
}
