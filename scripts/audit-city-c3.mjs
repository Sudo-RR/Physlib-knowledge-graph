import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildFullCity} from '../site/city-model.js';
import {buildFloorIndex} from '../site/city-floors.js';
import {createBoroughManifest,validateBoroughManifest,streetConnectivity} from '../site/city-borough-layout.js';
import {civicClearanceErrors} from '../site/city-chromatic-layout.js';
import {atomicCameraPose} from '../site/city-atomic-plan.js';
const out='docs/screenshots/milestone-c3';await mkdir(out,{recursive:true});
const raw=await Promise.all(['graph','mathlib','mathlib-bridge'].map(n=>readFile(`site/data/${n}.json`,'utf8'))),city=buildFullCity(...raw.map(JSON.parse)),floors=buildFloorIndex(city.nodes),m=createBoroughManifest(city,{visual:'c3',concept:'spaceage'}),c1=createBoroughManifest(city,{visual:'c1'}),c=createBoroughManifest(city),all=Object.values(m.modules);
const added={id:'Physlib.Units.ZLayoutAuditOnly',library:'Physlib',module:{path:'Physlib/Units/ZLayoutAuditOnly.lean',lineCount:100,imports:[]}},changed=createBoroughManifest({...city,nodes:[...city.nodes,added]},{visual:'c3',concept:'spaceage'});let minGap=Infinity;for(let i=0;i<all.length;i++)for(let j=0;j<i;j++){const a=all[i].decorativeBounds,b=all[j].decorativeBounds;minGap=Math.min(minGap,Math.hypot(Math.max(0,a.minX-b.maxX,b.minX-a.maxX),Math.max(0,a.minZ-b.maxZ,b.minZ-a.maxZ)));}
const audit={version:m.layoutVersion,registryVersion:m.colorRegistryVersion,manifestHash:createHash('sha256').update(JSON.stringify(m)).digest('hex'),deterministic:JSON.stringify(m)===JSON.stringify(createBoroughManifest(city,{visual:'c3',concept:'spaceage'})),sourceHashes:raw.map(s=>createHash('sha256').update(s).digest('hex')),nodes:city.nodes.length,edges:city.edges.length,boroughs:m.boroughs.map(b=>({id:b.id,count:b.count,bounds:b.bounds})),directories:m.parcels.filter(p=>p.depth===1).map(p=>({id:p.id,label:p.label,count:p.count,identity:p.identity,motif:p.motif,bounds:p.bounds})),adjacency:m.colorAdjacency,minimumGap:minGap,errors:[...validateBoroughManifest(m),...civicClearanceErrors(m)],streets:streetConnectivity(m),landmarks:m.landmarks.length,trees:m.vegetation.length,groves:m.groves.length,parks:m.parks.length,blocks:m.blocks.length,courts:m.courtyards.length,bounds:m.bounds,perturbation:{description:'One appended Units file, memory only',unchanged:all.filter(a=>a.position.x===changed.modules[a.id].position.x&&a.position.z===changed.modules[a.id].position.z).length,total:all.length}};
await writeFile(`${out}/layout-audit.json`,JSON.stringify(audit,null,2));await writeFile(`${out}/infrastructure.json`,JSON.stringify({version:5,serviceCorridors:m.serviceCorridors,skywalkCorridors:m.skywalkCorridors,roofDockingZones:m.roofDockingZones,landmarks:m.landmarks,vegetation:m.vegetation,groves:m.groves},null,2));
const bounds={maxX:Math.max(c.bounds.maxX,c1.bounds.maxX,m.bounds.maxX),maxZ:Math.max(c.bounds.maxZ,c1.bounds.maxZ,m.bounds.maxZ)},worldPath={target:[bounds.maxX/2,18,bounds.maxZ/2],radius:Math.max(bounds.maxX,bounds.maxZ)*.72};
const scenarios=[];
for(const visual of ['c2','c3']){
 const url=`http://127.0.0.1:4173/?visual=${visual}&metrics=1&collect=1`;
 scenarios.push({key:visual+'/surface/medium',quality:'medium',url:url+'&benchSize=956,476&cameraPath='+encodeURIComponent(JSON.stringify(worldPath))});
 scenarios.push({key:visual+'/cinematic/medium',quality:'medium',url:url+'&explore=1&cameraPath='+encodeURIComponent(JSON.stringify(worldPath))});
 const selected=m.modules['Physlib.Units.ISQDimensionBase'],path={target:[selected.position.x,selected.displayHeight*.46,selected.position.z],radius:45};
 scenarios.push({key:visual+'/orbit/medium',quality:'medium',url:url+'&benchSize=956,476&node='+selected.id+'&cameraPath='+encodeURIComponent(JSON.stringify(path))});
}
scenarios.push({...scenarios.find(s=>s.key==='c3/surface/medium'),key:'c3/surface/low',quality:'low',instruction:'Choose Low using the Quality control before running.'});
await writeFile(`${out}/benchmark-plan.json`,JSON.stringify(scenarios,null,2));console.log(JSON.stringify({nodes:audit.nodes,edges:audit.edges,directories:audit.directories.length-3,minimumGap:minGap,errors:audit.errors,streets:audit.streets,landmarks:audit.landmarks,trees:audit.trees,groves:audit.groves,perturbation:audit.perturbation,worldPath},null,2));
