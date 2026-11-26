// Crisp, compact label plates, sized in CSS pixels at every camera zoom.
// Canvas raster size is independent of the world-space sprite scale.
export const LABEL_FONT=84;
export const LABEL_LINE=100;
export function labelLines(text,maxChars=19){
 const words=String(text).trim().split(/\s+/),lines=[];
 let line='';for(const word of words){if(line&&(line+' '+word).length>maxChars){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines.length?lines:[''];
}
export function labelWorldSize(width,height,pixelsPerUnit,zoom){
 const cssFont=zoom>=2.4?16:14,scale=cssFont/LABEL_FONT/Math.max(.001,pixelsPerUnit);
 return {width:width*scale,height:height*scale,cssFont};
}
export function makeCityLabel(THREE,text,sub=''){
 const c=document.createElement('canvas'),g=c.getContext('2d'),font='700 '+LABEL_FONT+'px system-ui, sans-serif',lines=labelLines(text);
 g.font=font;const widths=lines.map(s=>g.measureText(s).width);if(sub){g.font='600 58px system-ui, sans-serif';widths.push(g.measureText(sub).width);}
 c.width=Math.ceil(Math.max(...widths,84)+56);c.height=lines.length*LABEL_LINE+32+(sub?76:0);
 g.clearRect(0,0,c.width,c.height);g.fillStyle='rgba(13,24,37,.91)';g.strokeStyle='rgba(161,189,207,.55)';g.lineWidth=4;g.beginPath();g.roundRect(3,3,c.width-6,c.height-6,20);g.fill();g.stroke();
 g.textAlign='center';g.textBaseline='middle';g.font=font;g.fillStyle='#f2f7fc';g.strokeStyle='#101a25';g.lineWidth=7;g.lineJoin='round';
 lines.forEach((line,i)=>{const y=16+(i+.5)*LABEL_LINE;g.strokeText(line,c.width/2,y);g.fillText(line,c.width/2,y);});
 if(sub){g.font='600 58px system-ui, sans-serif';g.fillStyle='#cedbe5';g.fillText(sub,c.width/2,16+lines.length*LABEL_LINE+38);}
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));
 sprite.renderOrder=9;sprite.userData.isLabel=true;sprite.userData.labelPixels=[c.width,c.height];return sprite;
}
