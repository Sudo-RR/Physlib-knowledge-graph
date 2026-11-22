import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Browsers normally capture non-interlaced 8-bit RGB/RGBA PNGs. Reject other
// formats explicitly instead of silently comparing incorrectly decoded data.
export function decodeScreenshot(buffer) {
  if (!buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw Error('Expected PNG');
  let offset=8,width,height,channels,compressed=[],interlace;
  while(offset+12<=buffer.length){
    const size=buffer.readUInt32BE(offset),kind=buffer.toString('ascii',offset+4,offset+8);
    if(offset+12+size>buffer.length)throw Error('Truncated PNG');
    const data=buffer.subarray(offset+8,offset+8+size);
    if(kind==='IHDR'){
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);channels=({2:3,6:4})[data[9]];interlace=data[12];
      if(data[8]!==8||!channels||interlace!==0||!width||!height)throw Error('PNG must be non-interlaced 8-bit RGB or RGBA');
    }
    if(kind==='IDAT')compressed.push(data);
    offset+=size+12;if(kind==='IEND')break;
  }
  if(!width||!compressed.length)throw Error('Incomplete PNG');
  const raw=inflateSync(Buffer.concat(compressed)),stride=width*channels;
  if(raw.length!==(stride+1)*height)throw Error('Unexpected PNG data length');
  const pixels=Buffer.alloc(stride*height);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)];
    if(filter>4)throw Error('Unsupported PNG filter');
    for(let x=0;x<stride;x++){
      const i=y*stride+x,a=x>=channels?pixels[i-channels]:0,b=y?pixels[i-stride]:0,c=y&&x>=channels?pixels[i-stride-channels]:0;
      const prediction=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c);
      pixels[i]=(raw[y*(stride+1)+1+x]+prediction)&255;
    }
  }
  return {width,height,channels,pixels};
}

export function compareScreenshots(before,after,{channelDelta=30}={}) {
  if(before.width!==after.width||before.height!==after.height)throw Error('Screenshot dimensions differ');
  let changed=0;const count=before.width*before.height;
  for(let i=0;i<count;i++){
    let different=false;
    for(let c=0;c<4;c++){
      const a=c<before.channels?before.pixels[i*before.channels+c]:255;
      const b=c<after.channels?after.pixels[i*after.channels+c]:255;
      if(Math.abs(a-b)>channelDelta){different=true;break;}
    }
    if(different)changed++;
  }
  return {width:before.width,height:before.height,changed,total:count,fraction:changed/count};
}

async function main() {
  const [beforePath,afterPath,limitArg]=process.argv.slice(2),limit=limitArg===undefined?.1:Number(limitArg);
  if(!beforePath||!afterPath||!Number.isFinite(limit)||limit<0||limit>1)throw Error('Usage: node scripts/compare-screenshots.mjs baseline.png current.png [maximum changed fraction]');
  const [before,after]=await Promise.all([beforePath,afterPath].map(async file=>decodeScreenshot(await readFile(file))));
  const result=compareScreenshots(before,after);
  console.log(JSON.stringify({...result,maximumChangedFraction:limit},null,2));
  if(result.fraction>limit)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
