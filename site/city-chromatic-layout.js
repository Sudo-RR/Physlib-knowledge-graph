import {districtIdentity,districtColors,colorRegistryVersion,geographicPatterns,colorDistance,resolveDistrictColors} from './city-colors.js';

export const compositionMotifs=['institute-square','research-crescent','terraced-campus','science-promenade'];
/** Enrich the authoritative layout, never the graph. Civic objects are explicitly non-modules. */
export function chromaticManifest(manifest,composition='vivid'){
 const districts=manifest.parcels.filter(p=>p.depth===1),neighbors={};
 for(const a of districts){const others=districts.filter(b=>b.boroughId===a.boroughId&&b.id!==a.id).map(b=>({b,d:Math.hypot(Math.max(0,a.bounds.minX-b.bounds.maxX,b.bounds.minX-a.bounds.maxX),Math.max(0,a.bounds.minZ-b.bounds.maxZ,b.bounds.minZ-a.bounds.maxZ))})).sort((a,b)=>a.d-b.d);neighbors[a.id]=(others.filter(v=>v.d<=manifest.config.districtGap*1.5).length?others.filter(v=>v.d<=manifest.config.districtGap*1.5):others.slice(0,3)).map(v=>v.b.id);}
 const registry=resolveDistrictColors(districts.map(p=>p.id),{neighbors}),landmarks=[];
 for(const p of manifest.parcels)p.identity=districtIdentity(p.id,{registry,composition,depth:p.depth});
 for(const m of Object.values(manifest.modules))m.identity=districtIdentity(m.districtId,{registry,composition,depth:m.directoryPath.split('/').length});
 for(const [index,p] of districts.entries()){
  const b=p.bounds,width=32,depth=24,x=b.minX+(b.maxX-b.minX)*.64,z=b.maxZ-30,shape=Object.keys(registry).indexOf(p.id)%4;
  const landmark={id:p.id+'/civic-landmark',districtId:p.id,boroughId:p.boroughId,kind:'district-landmark',selectable:false,label:p.label+' · civic landmark (not a module)',shape,pattern:geographicPatterns[shape],position:{x,z},bounds:{minX:x-width/2,maxX:x+width/2,minZ:z-depth/2,maxZ:z+depth/2},minY:0,maxY:36,identity:p.identity};landmarks.push(landmark);
  manifest.corridors.push({id:p.id+'/civic-access',kind:'street',boroughId:p.boroughId,districtId:p.id,bounds:{minX:b.minX+7,maxX:x-width/2,minZ:z-1.5,maxZ:z+1.5},minY:0,maxY:.1});
  p.landmarkId=landmark.id;p.motif=compositionMotifs[p.count<=6?0:p.count<=20?1:p.count>80?3:2];
 }
 // Perceptual near-pairs have a second stable visual code: distinct civic silhouettes.
 const adjacent=[];for(const p of districts)for(const id of neighbors[p.id]){if(p.id>id)continue;const q=districts.find(v=>v.id===id),distance=colorDistance(p.identity.primary,q.identity.primary);adjacent.push({from:p.id,to:id,oklabDistance:distance,requiresPattern:distance<.075,patterns:[p.identity.pattern,q.identity.pattern]});}
 manifest.parks=manifest.parks.filter(p=>![...landmarks,...manifest.corridors.filter(c=>c.id.endsWith('/civic-access'))].some(c=>p.bounds.minX<c.bounds.maxX&&p.bounds.maxX>c.bounds.minX&&p.bounds.minZ<c.bounds.maxZ&&p.bounds.maxZ>c.bounds.minZ));
 const vegetation=[];for(const p of districts){const parks=manifest.parks.filter(q=>q.id.startsWith(p.id+'/park/')).sort((a,b)=>(b.bounds.maxX-b.bounds.minX)*(b.bounds.maxZ-b.bounds.minZ)-(a.bounds.maxX-a.bounds.minX)*(a.bounds.maxZ-a.bounds.minZ));for(const park of parks){if(vegetation.filter(v=>v.districtId===p.id).length>=3)break;const b=park.bounds;if(b.maxX-b.minX<6||b.maxZ-b.minZ<6)continue;const x=(b.minX+b.maxX)/2,z=(b.minZ+b.maxZ)/2,bounds={minX:x-1.6,maxX:x+1.6,minZ:z-1.6,maxZ:z+1.6},blocked=[...manifest.corridors,...landmarks,...manifest.rivers].some(c=>bounds.minX<c.bounds.maxX&&bounds.maxX>c.bounds.minX&&bounds.minZ<c.bounds.maxZ&&bounds.maxZ>c.bounds.minZ)||Object.values(manifest.modules).some(m=>bounds.minX<m.decorativeBounds.maxX+3&&bounds.maxX>m.decorativeBounds.minX-3&&bounds.minZ<m.decorativeBounds.maxZ+3&&bounds.maxZ>m.decorativeBounds.minZ-3);if(!blocked)vegetation.push({id:p.id+'/tree/'+vegetation.length,kind:'civic-tree',districtId:p.id,boroughId:p.boroughId,position:{x,z},bounds,minY:0,maxY:4.5,identity:p.identity});}}
 manifest.vegetation=vegetation;manifest.obstructions.push(...vegetation);
 manifest.layoutVersion=5;manifest.visual='c2';manifest.composition=composition;manifest.colorRegistryVersion=colorRegistryVersion;manifest.colorRegistry=registry;manifest.districtNeighbors=neighbors;manifest.colorAdjacency=adjacent;manifest.landmarks=landmarks;manifest.obstructions.push(...landmarks);manifest.surfaceHeight=Math.max(manifest.surfaceHeight,42);
 return manifest;
}

export function civicClearanceErrors(m){
 const errors=[],gap=m.config.orbitClearance;
 for(const a of [...(m.landmarks||[]),...(m.vegetation||[]),...(m.groves||[])]){for(const b of Object.values(m.modules)){const q=b.decorativeBounds;if(a.bounds.minX<q.maxX+gap&&a.bounds.maxX>q.minX-gap&&a.bounds.minZ<q.maxZ+gap&&a.bounds.maxZ>q.minZ-gap)errors.push(`Inspection ${a.id} ${b.id}`);}
  for(const c of [...m.corridors,...m.rivers,...m.crossings,...m.approaches]){const b=c.bounds;if(a.bounds.minX<b.maxX&&a.bounds.maxX>b.minX&&a.bounds.minZ<b.maxZ&&a.bounds.maxZ>b.minZ)errors.push(`Reserve ${a.id} ${c.id}`);}
 }
 return errors;
}
