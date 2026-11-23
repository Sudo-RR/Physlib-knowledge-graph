import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export async function validateCityAsset(root = new URL('../site/', import.meta.url)) {
  const bytes=await readFile(new URL('assets/models/kenney-tower.glb',root));
  if(bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)
    throw Error('Invalid GLB header/length');
  const length=bytes.readUInt32LE(12);
  if(bytes.readUInt32LE(16)!==0x4e4f534a||bytes.readUInt32LE(24+length)!==0x004e4942)
    throw Error('Invalid GLB chunks');
  const json=JSON.parse(bytes.subarray(20,20+length));
  if(json.asset.version!=='2.0'||json.extensionsRequired?.length)throw Error('Unexpected decoder requirement');
  if(json.buffers.some(b=>b.uri)||json.images.some(i=>i.uri))throw Error('Asset must be self-contained');
  for(const view of json.bufferViews)if((view.byteOffset||0)+view.byteLength>json.buffers[0].byteLength)throw Error('Out-of-range buffer view');
  const sha256=createHash('sha256').update(bytes).digest('hex');
  if(sha256!=='e5c40d7c77c2d82a6daf3b137cbaa2c42d01e5aa438ff1fcbb9806de1b56ebb3')throw Error('Asset differs from reviewed licence receipt');
  const license=await readFile(new URL('assets/licenses/kenney-modular-buildings.txt',root),'utf8');
  if(!license.includes('Creative Commons Zero, CC0'))throw Error('Missing CC0 receipt');
  return {bytes:bytes.length,sha256,triangles:json.accessors[4].count/3,embeddedImages:json.images.length};
}
export async function validateDistrictKit(root=new URL('../site/',import.meta.url)){
 const bytes=await readFile(new URL('assets/models/kenney-district-kit.glb',root));
 const sha256=createHash('sha256').update(bytes).digest('hex');
 if(sha256!=='0e9500ea8076cd606149e6ea7c665b120399a1abdae666a654ea49ad85332545')throw Error('District kit differs from reviewed receipt');
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
 if(bytes.readUInt32LE(8)!==bytes.length||json.buffers.some(b=>b.uri)||json.images.some(i=>i.uri)||json.extensionsRequired?.length)throw Error('Invalid or externally dependent district kit');
 for(const view of json.bufferViews)if((view.byteOffset||0)+view.byteLength>json.buffers[0].byteLength)throw Error('Out-of-range kit buffer view');
 return {bytes:bytes.length,sha256,parts:json.nodes.map(n=>n.name),triangles:json.meshes.reduce((sum,m)=>sum+m.primitives.reduce((n,p)=>n+json.accessors[p.indices].count/3,0),0)};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const root=process.argv[2]?new URL(`file:///${process.argv[2].replaceAll('\\','/')}/`):undefined;
 console.log(JSON.stringify({fixture:await validateCityAsset(root),district:await validateDistrictKit(root)},null,2));
}
