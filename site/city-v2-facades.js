// Vendored from https://github.com/trinhtanphat/aeroview-coast-3d/blob/85124ca1666ad890810db0d3f39c8aecbd5616f4/src/coastal-visuals.js
// MIT; Copyright (c) 2026 trinhtanphat. See assets/licenses/aeroview-mit.txt.
// Palette adapted to the PhysLib cassette-futurist art direction (see docs/geneva/colour-system.spec.md).
// Procedural facade textures for the simulated city.
// Entirely original pixels generated in the browser: no satellite imagery or Google assets.
export function makeFacadeMaterials(THREE){
 const palettes=[
  {frame:'#d0d0d0',glass:'#8c9d8b',shade:'#405b55',reflect:'#e8dcc6'},
  {frame:'#b8b8b8',glass:'#a2ae9b',shade:'#52674e',reflect:'#ffcf9d'},
  {frame:'#a0a0a0',glass:'#64827a',shade:'#354525',reflect:'#d2ddd1'},
  {frame:'#e8e8e8',glass:'#91a092',shade:'#536f66',reflect:'#f3d7b1'},
  {frame:'#d0d0d0',glass:'#8c9b74',shade:'#4a5a3a',reflect:'#dce3c6'}
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
    color:'#e8e8e8',map:tex,roughness:style===2?.20:.45,
    metalness:style===2?.55:.24,
    envMapIntensity:.55
  });
 });
}
