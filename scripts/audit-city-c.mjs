import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildFullCity} from '../site/city-model.js';
import {createBoroughManifest,validateBoroughManifest,streetConnectivity} from '../site/city-borough-layout.js';
const raw=await Promise.all(['graph','mathlib','mathlib-bridge'].map(n=>readFile(`site/data/${n}.json`,'utf8'))),[p,m,b]=raw.map(JSON.parse),city=buildFullCity(p,m,b),manifest=createBoroughManifest(city);
const moduleList=Object.values(manifest.modules),gaps=[];
for(let i=0;i<moduleList.length;i++)for(let j=i+1;j<moduleList.length;j++){const a=moduleList[i].decorativeBounds,c=moduleList[j].decorativeBounds;gaps.push(Math.hypot(Math.max(0,a.minX-c.maxX,c.minX-a.maxX),Math.max(0,a.minZ-c.maxZ,c.minZ-a.maxZ)));}
const added={id:'Physlib.Units.ZLayoutAuditOnly',library:'Physlib',module:{path:'Physlib/Units/ZLayoutAuditOnly.lean',lineCount:100,imports:[]}};
// Synthetic perturbation is in memory ONLY; never written into the graph or application.
const changed=createBoroughManifest({...city,nodes:[...city.nodes,added]}),movement=moduleList.map(a=>Math.hypot(a.position.x-changed.modules[a.id].position.x,a.position.z-changed.modules[a.id].position.z)).sort((a,b)=>a-b);
const audit={layoutVersion:manifest.layoutVersion,source:{physlib:p.source.revision,mathlib:m.source.revision},nodes:city.nodes.length,edges:city.edges.length,hashes:raw.map(v=>createHash('sha256').update(v).digest('hex')),roots:manifest.boroughs.map(b=>({id:b.id,count:b.count,bounds:b.bounds})),unknown:manifest.unknown,config:manifest.config,bounds:manifest.bounds,parcels:manifest.parcels.length,chunks:manifest.chunks.length,corridors:manifest.corridors.length,rivers:manifest.rivers,crossings:manifest.crossings,minimumDecorativeGap:Math.min(...gaps.slice().sort((a,b)=>a-b).slice(0,100)),errors:validateBoroughManifest(manifest),perturbation:{description:'One synthetic appended Units file, memory only',unchanged:movement.filter(d=>d<1e-8).length,total:movement.length,p50:movement[Math.floor(movement.length*.5)],p95:movement[Math.floor(movement.length*.95)],max:movement.at(-1)}};
audit.streets=streetConnectivity(manifest);
await mkdir('docs/screenshots/milestone-c',{recursive:true});await writeFile('docs/screenshots/milestone-c/layout-audit.json',JSON.stringify(audit,null,2));
await writeFile('docs/screenshots/milestone-c/units-reservations.json',JSON.stringify({parcels:manifest.parcels.filter(p=>p.districtId==='Physlib/Units'),modules:moduleList.filter(m=>m.districtId==='Physlib/Units'),corridors:manifest.corridors.filter(c=>c.districtId==='Physlib/Units')},null,2));console.log(JSON.stringify(audit,null,2));
