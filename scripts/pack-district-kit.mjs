// Offline repack of the five reviewed Kenney CC0 pieces. No geometry is modified.
// Usage: node scripts/pack-district-kit.mjs SOURCE_DIRECTORY PALETTE_PNG
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const [directory,palettePath]=process.argv.slice(2);
if(!directory||!palettePath)throw Error('Supply original part directory and colormap.png');
const parts=['building-window-wide','window-white-wide','building-door','roof-flat-border-straight','roof-flat-detail-a'];
const json={asset:{version:'2.0',generator:'Physlib offline CC0 kit repack'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],accessors:[],bufferViews:[],buffers:[{byteLength:0}],materials:[],textures:[],samplers:[],images:[]};
let length=0;const chunks=[],receipts=[];
for(const name of parts){
 const bytes=await readFile(path.join(directory,`${name}.glb`));
 const source=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
 const binary=bytes.subarray(28+bytes.readUInt32LE(12));
 const offsetViews=json.bufferViews.length,offsetAccessors=json.accessors.length;
 json.bufferViews.push(...source.bufferViews.map(view=>({...view,buffer:0,byteOffset:(view.byteOffset||0)+length})));
 json.accessors.push(...source.accessors.map(accessor=>({...accessor,bufferView:accessor.bufferView+offsetViews})));
 const primitives=source.meshes[0].primitives.map(p=>({...p,attributes:Object.fromEntries(Object.entries(p.attributes).map(([k,v])=>[k,v+offsetAccessors])),indices:p.indices+offsetAccessors,material:0}));
 json.scenes[0].nodes.push(json.nodes.length);json.nodes.push({mesh:json.meshes.length,name});json.meshes.push({name,primitives});
 if(!json.materials.length){json.materials=source.materials;json.textures=source.textures;json.samplers=source.samplers;json.extensionsUsed=source.extensionsUsed;}
 chunks.push(binary);length+=binary.length;
 receipts.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const palette=await readFile(palettePath);
json.images=[{name:'colormap',bufferView:json.bufferViews.length,mimeType:'image/png'}];
json.bufferViews.push({buffer:0,byteOffset:length,byteLength:palette.length});chunks.push(palette);length+=palette.length;
json.buffers[0].byteLength=length;
const pad=(b,fill=0)=>Buffer.concat([b,Buffer.alloc((4-b.length%4)%4,fill)]);
const metadata=pad(Buffer.from(JSON.stringify(json)),32),binary=pad(Buffer.concat(chunks)),header=Buffer.alloc(20),binHeader=Buffer.alloc(8);
header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+metadata.length+binary.length,8);header.writeUInt32LE(metadata.length,12);header.writeUInt32LE(0x4e4f534a,16);
binHeader.writeUInt32LE(binary.length);binHeader.writeUInt32LE(0x004e4942,4);
const output=Buffer.concat([header,metadata,binHeader,binary]);
await writeFile('site/assets/models/kenney-district-kit.glb',output);
console.log(JSON.stringify({parts:receipts,outputBytes:output.length,outputSha256:createHash('sha256').update(output).digest('hex')},null,2));
