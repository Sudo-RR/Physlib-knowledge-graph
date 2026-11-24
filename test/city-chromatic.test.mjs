import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildFullCity} from '../site/city-model.js';
import {buildHierarchy} from '../site/city-hierarchy.js';
import {buildFloorIndex} from '../site/city-floors.js';
import {createBoroughManifest,validateBoroughManifest,streetConnectivity,overlaps} from '../site/city-borough-layout.js';
import {layoutFullCity,layoutLegacyCity} from '../site/city-layout.js';
import {civicClearanceErrors} from '../site/city-chromatic-layout.js';
import {districtColors,districtIdentity,districtAddress,resolveDistrictColors,contrast,colorDistance} from '../site/city-colors.js';
import {createAtomicArt} from '../site/city-atomic-art.js';
import {createChromaticGeography} from '../site/city-chromatic-art.js';
import {atomicCameraPose} from '../site/city-atomic-plan.js';
import {skywalkCurve,createSkywalks} from '../site/city-skywalks.js';
const city=buildFullCity(...['graph','mathlib','mathlib-bridge'].map(n=>JSON.parse(fs.readFileSync(`test/fixtures/city/${n}.json`)))),manifest=createBoroughManifest(city,{visual:'c2'});
test('all 39 real first-level directories plus explicit Root Modules retain persistent colour addresses',()=>{
 const keys=buildHierarchy(city.nodes).roots.flatMap(r=>[...r.children.map(d=>d.id),r.id+'/@root']);assert.equal(keys.length,42);for(const key of keys){assert.ok(districtColors[key],key);const i=districtIdentity(key);assert.ok(contrast(i.primary,i.text)>=4.5);}
 assert.equal(districtAddress('Physlib.lean'),'Physlib/@root');assert.equal(districtAddress('PhyslibAlpha/Basic.lean'),'PhyslibAlpha/@root');assert.equal(districtAddress('Physlib/Units/WithDim/Area.lean'),'Physlib/Units');
 const before={...districtColors},resolved=resolveDistrictColors([...keys,'Physlib/NewDistrict'],{neighbors:{'Physlib/NewDistrict':['Physlib/Units','Physlib/ClassicalMechanics']}});for(const key of keys)assert.equal(resolved[key],before[key]);assert.deepEqual(resolved,resolveDistrictColors([...keys].reverse().concat('Physlib/NewDistrict'),{neighbors:{'Physlib/NewDistrict':['Physlib/Units','Physlib/ClassicalMechanics']}}));
 for(const m of Object.values(manifest.modules))assert.equal(m.identity.primary,districtColors[m.districtId]);for(const p of manifest.parcels)assert.equal(p.identity.key,p.districtId);
 for(const pair of manifest.colorAdjacency)assert.ok(pair.oklabDistance>=.075||pair.patterns[0]!==pair.patterns[1]);assert.ok(colorDistance('#efbc29','#e85d4b')>.075);
});
test('chromatic layout preserves all IDs, imports, sources and Mathlib anchors with deterministic safe civic reservations',()=>{
 const before=JSON.stringify(city),floors=buildFloorIndex(city.nodes);assert.deepEqual(manifest.boroughs.map(b=>b.count),[669,828,82]);assert.equal(city.nodes.length,2256);assert.equal(city.edges.length,6598);assert.equal(manifest.rivers.length,2);assert.ok(manifest.rivers.every(r=>r.width===100));assert.equal(manifest.landmarks.length,42);
 assert.deepEqual(validateBoroughManifest(manifest),[]);assert.deepEqual(civicClearanceErrors(manifest),[]);assert.equal(streetConnectivity(manifest).components,1);assert.equal(JSON.stringify(manifest),JSON.stringify(createBoroughManifest(city,{visual:'c2'})));assert.equal(JSON.stringify(city),before);
 for(const m of Object.values(manifest.modules)){assert.equal(m.semanticHeight,floors.get(m.id).height);assert.ok(m.displayHeight<=20);assert.equal(m.identity.key,m.districtId);}
 const next=layoutFullCity(city,{visual:'c2'}),legacy=layoutLegacyCity(city);for(const n of city.nodes.filter(n=>n.library==='Mathlib'))assert.deepEqual(next.positions.get(n.id),legacy.positions.get(n.id));
});
test('both composition alternatives fit all original shared architectural and civic geometry into exported AABBs',()=>{
 for(const composition of ['vivid','porcelain']){const m=createBoroughManifest(city,{visual:'c2',composition}),art=createAtomicArt(m),terrain=createChromaticGeography(m);for(const b of art.batches.values()){b.geometry.computeBoundingBox();for(const item of b.items){const a=m.modules[item.id],q=b.geometry.boundingBox.clone().applyMatrix4(item.matrix),e=a.decorativeBounds;assert.ok(q.min.x>=e.minX-1e-4&&q.max.x<=e.maxX+1e-4&&q.min.z>=e.minZ-1e-4&&q.max.z<=e.maxZ+1e-4&&q.max.y<=a.decorativeHeight+1e-4,item.id);}}
  for(const b of terrain.userData.civicBatches.values()){b.shape.computeBoundingBox();for(const item of b.items){const l=[...m.landmarks,...m.vegetation].find(l=>l.id===item.id);if(!l)continue;const q=b.shape.boundingBox.clone().applyMatrix4(item.matrix);assert.ok(q.min.x>=l.bounds.minX-1e-4&&q.max.x<=l.bounds.maxX+1e-4&&q.min.z>=l.bounds.minZ-1e-4&&q.max.z<=l.bounds.maxZ+1e-4&&q.max.y<=l.maxY+1e-4,l.id);}}
  assert.ok(terrain.children.length<25);terrain.traverse(o=>assert.ok(!['CircleGeometry','RingGeometry'].includes(o.geometry?.type)));
 }
});
const node=(path,lines=200)=>({id:path.replace('.lean','').replaceAll('/','.'),library:path.split('/')[0],module:{path,lineCount:lines,imports:[]}});
test('dense, irregular, tall, nested and missing-root fixtures retain camera and infrastructure clearance',()=>{
 for(const nodes of [Array.from({length:90},(_,i)=>node('Physlib/Units/Dense'+i+'.lean')),Array.from({length:17},(_,i)=>node(`Physlib/ClassicalMechanics/A${i%4}/Deep${i}/File.lean`,i===16?1e9:i*50)),[node('QuantumInfo/States/Qubit.lean',0),node('QuantumInfo/States/Deep/Deep/Module.lean',1e9)]]){const m=createBoroughManifest({nodes,edges:[]},{visual:'c2'});assert.deepEqual(validateBoroughManifest(m),[]);assert.deepEqual(civicClearanceErrors(m),[]);assert.equal(streetConnectivity(m).components,1);assert.equal(Object.keys(m.modules).length,nodes.length);}
});

test('C2 Low removes submitted close detail, address materials remain untinted, and focus outlines release owned buffers',()=>{
 const art=createAtomicArt(manifest),selected=manifest.modules['Physlib.Units.ISQDimensionBase'],pose=atomicCameraPose(selected,Object.values(manifest.modules)),camera=new THREE.PerspectiveCamera(40,2,.1,20000);camera.position.set(...pose.position);camera.lookAt(new THREE.Vector3(...pose.target));camera.updateMatrixWorld();
 for(const [key,b] of art.batches)if(['/accent/','/glass/','/amber/'].some(v=>key.includes(v)))assert.equal(b.material.color.getHex(),0xffffff,key);
 const triangles=()=>[...art.batches.values()].reduce((n,b)=>n+b.mesh.count*(b.geometry.index?.count||b.geometry.attributes.position.count)/3,0);
 art.update({camera,viewportHeight:600,selected:selected.id,quality:'medium',now:0});const medium=triangles();art.update({camera,viewportHeight:600,selected:selected.id,quality:'low',now:200});assert.ok(triangles()<medium*.8);
 const geography=createChromaticGeography(manifest),line=geography.children.find(o=>o.isLineLoop);let releases=0;line.geometry.addEventListener('dispose',()=>releases++);geography.userData.setScope('Physlib/Units');assert.equal(releases,1);assert.equal(line.visible,true);
});

test('sampled actual recorded local skywalks clear civic objects and use registry colours at their docks',()=>{
 const positions=new Map(Object.values(manifest.modules).map(m=>[m.id,m.position])),floors=buildFloorIndex(city.nodes),edges=city.edges.filter(e=>positions.has(e.from)&&positions.has(e.to)&&e.from!==e.to&&Math.hypot(positions.get(e.from).x-positions.get(e.to).x,positions.get(e.from).z-positions.get(e.to).z)<240).slice(0,8);
 assert.ok(edges.length>=3);for(const edge of edges){const curve=skywalkCurve(edge,city.nodes,positions,floors,manifest);for(const p of curve.getPoints(180))for(const o of manifest.obstructions){const q=o.bounds;assert.ok(!(p.x>q.minX-.25&&p.x<q.maxX+.25&&p.z>q.minZ-.25&&p.z<q.maxZ+.25&&p.y<o.maxY+.1),`${edge.from} ${o.id}`);}}
 const bridge=createSkywalks({edges:edges.slice(0,1),nodes:city.nodes,positions,floors,manifest}),docks=bridge.group.children.filter(o=>o.geometry?.type==='TorusGeometry');assert.deepEqual(docks.map(d=>d.userData.districtColor),[manifest.modules[edges[0].from].identity.primary,manifest.modules[edges[0].to].identity.primary]);
});
