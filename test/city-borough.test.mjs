import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createBoroughManifest,validateBoroughManifest,streetConnectivity} from '../site/city-borough-layout.js';
import {layoutFullCity,layoutLegacyCity} from '../site/city-layout.js';
import {buildHierarchy} from '../site/city-hierarchy.js';
import {createChunkIndex} from '../site/city-spatial-index.js';
import {buildFullCity} from '../site/city-model.js';
import {createGeography} from '../site/city-rivers.js';
import {createCollisionGrid,cameraClearance} from '../site/city-camera.js';
import {skywalkCurve} from '../site/city-skywalks.js';
import {buildFloorIndex} from '../site/city-floors.js';
import * as THREE from 'three';
const read=n=>JSON.parse(fs.readFileSync(`test/fixtures/city/${n}.json`));
const city=buildFullCity(read('graph'),read('mathlib'),read('mathlib-bridge'));
test('full three-borough hierarchy is exact, deterministic, spacious and corridor safe',()=>{
 const before=JSON.stringify(city),m=createBoroughManifest(city);
 assert.equal(Object.keys(m.modules).length,1579);assert.deepEqual(m.boroughs.map(b=>b.count),[669,828,82]);
 assert.deepEqual(Object.keys(m.modules).sort(),city.nodes.filter(n=>n.library!=='Mathlib').map(n=>n.id).sort());
 assert.equal(m.rivers.length,2);assert.equal(m.crossings.length,2);assert.ok(m.rivers.every(r=>r.centerline.length>2));
 assert.deepEqual(validateBoroughManifest(m),[]);assert.equal(JSON.stringify(m),JSON.stringify(createBoroughManifest(city)));assert.equal(JSON.stringify(city),before);
 assert.ok(m.corridors.some(c=>c.kind==='pipe-service'));assert.ok(m.corridors.some(c=>c.kind==='skywalk'));
 assert.ok(m.parcels.some(p=>p.depth>=5));assert.ok(m.modules.Physlib.parcelId.endsWith('/@root'));assert.equal(m.modules.Physlib.directoryPath,'');
 const legacy=layoutLegacyCity(city),next=layoutFullCity(city);for(const n of city.nodes.filter(n=>n.library==='Mathlib'))assert.deepEqual(next.positions.get(n.id),legacy.positions.get(n.id));
});
const node=path=>({id:path.replace('.lean','').replaceAll('/','.'),library:'Physlib',module:{path,lineCount:100,imports:[]}});
test('mixed-depth, duplicate basenames, unknown roots, missing borough and forced expansion',()=>{
 const nodes=['Physlib.lean','Physlib/A/X.lean','Physlib/A/B/C/X.lean','PhyslibAlpha/A/X.lean','Unexpected/X.lean'].map(node),h=buildHierarchy(nodes);
 assert.equal(h.roots[2].count,0);assert.deepEqual(h.unknown,['Unexpected.X']);
 const a=createBoroughManifest({nodes}),b=createBoroughManifest({nodes},{config:{minBuildingGap:30}});assert.deepEqual(validateBoroughManifest(b),[]);assert.ok(b.bounds.maxX>a.bounds.maxX);
 const c=createBoroughManifest({nodes:[...nodes,node('Physlib/A/Y.lean')]});assert.deepEqual(a.modules['Physlib.A.X'].position,c.modules['Physlib.A.X'].position);
});
test('chunk candidates can activate an offscreen exact module',()=>{const m=createBoroughManifest(city),index=createChunkIndex(m.chunks),id='QuantumInfo.States.Pure.Qubit';assert.ok(index.byModule.has(id));assert.equal(index.visible(()=>false,id)[0].moduleIds.includes(id),true);assert.deepEqual(index.query({minX:-100,maxX:-90,minZ:-100,maxZ:-90}),[]);});
test('normal geography has no circular ground allocations; public corridors and inspection orbits are navigable',()=>{
 const m=createBoroughManifest(city),geo=createGeography(m);let circles=0;geo.traverse(o=>{if(['CircleGeometry','RingGeometry'].includes(o.geometry?.type))circles++;});assert.equal(circles,0);
 const grid=createCollisionGrid(Object.values(m.modules).map(b=>({min:{x:b.decorativeBounds.minX,y:0,z:b.decorativeBounds.minZ},max:{x:b.decorativeBounds.maxX,y:b.decorativeHeight,z:b.decorativeBounds.maxZ},layer:'surface'})));
 for(const id of ['Physlib.Units.ISQDimensionBase','QuantumInfo.States.Pure.Qubit']){const b=m.modules[id],radius=Math.max(b.footprint.width,b.footprint.depth)/2+2.8;for(let i=0;i<32;i++){const a=i*Math.PI/16,p={x:b.position.x+Math.cos(a)*radius,y:b.semanticHeight*.5,z:b.position.z+Math.sin(a)*radius};assert.deepEqual(cameraClearance(p,grid,'surface'),p);}}
 for(const c of m.corridors.filter(c=>c.kind==='street')){const p={x:(c.bounds.minX+c.bounds.maxX)/2,y:2,z:(c.bounds.minZ+c.bounds.maxZ)/2};assert.deepEqual(cameraClearance(p,grid,'surface'),p);}
});
test('reanchored selected import routes clear all non-endpoint decorative envelopes',()=>{
 const floors=buildFloorIndex(city.nodes),layout=layoutFullCity(city,{floors}),m=layout.manifest;
 const edge=city.edges.find(e=>e.from==='Physlib.Units.ISQDimensionBase'&&m.modules[e.to]);assert.ok(edge);
 const curve=skywalkCurve(edge,city.nodes,layout.positions,floors,m);
 for(const p of curve.getPoints(200))for(const b of Object.values(m.modules)){if([edge.from,edge.to].includes(b.id))continue;const q=b.decorativeBounds;assert.ok(!(p.x>q.minX-.3&&p.x<q.maxX+.3&&p.z>q.minZ-.3&&p.z<q.maxZ+.3&&p.y<b.decorativeHeight+.3),b.id);}
});
test('river surfaces sit above their bed, and invisible canonical bodies remain raycastable',()=>{
 const m=createBoroughManifest(city),group=createGeography(m),bed=group.children.find(o=>o.material?.color?.getHex()===0x7e9b91),matrix=new THREE.Matrix4();assert.ok(bed?.isInstancedMesh);bed.getMatrixAt(0,matrix);const bedTop=matrix.elements[13]+matrix.elements[5]/2;
 for(const r of m.rivers){const water=group.getObjectByName(r.id);assert.ok(water.geometry.attributes.position.getY(0)>bedTop);}
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,10,2),new THREE.MeshBasicMaterial());mesh.userData.id='exact.module';mesh.visible=false;mesh.updateMatrixWorld();const ray=new THREE.Raycaster(new THREE.Vector3(0,0,10),new THREE.Vector3(0,0,-1));assert.equal(ray.intersectObject(mesh)[0].object.userData.id,'exact.module');
});
test('dense single-directory and extreme source sizes expand safely independent of input ordering',()=>{
 const nodes=Array.from({length:100},(_,i)=>{const n=node(`Physlib/Dense/F${String(i).padStart(3,'0')}.lean`);n.module.lineCount=i===0?0:i===1?1e9:100;return n;});
 const a=createBoroughManifest({nodes}),b=createBoroughManifest({nodes:[...nodes].reverse()});assert.equal(JSON.stringify(a),JSON.stringify(b));assert.deepEqual(validateBoroughManifest(a),[]);assert.equal(a.modules['Physlib.Dense.F000'].semanticHeight,2);assert.ok(a.modules['Physlib.Dense.F001'].clearance>15);
 const enlarged=createBoroughManifest({nodes},{config:{minBuildingGap:40}});assert.deepEqual(validateBoroughManifest(enlarged),[]);assert.ok(enlarged.boroughs[0].bounds.maxZ>=a.boroughs[0].bounds.maxZ);assert.ok(enlarged.boroughs[0].bounds.maxX>a.boroughs[0].bounds.maxX);
});
test('civic streets connect every directory and both river bridges without becoming import edges',()=>{
 const before=JSON.stringify(city.edges),m=createBoroughManifest(city);assert.equal(streetConnectivity(m).components,1);assert.equal(JSON.stringify(city.edges),before);
 const missing=createBoroughManifest({nodes:[node('Physlib/Only/A.lean')]});assert.equal(streetConnectivity(missing).components,1);
 const fixture={corridors:[{kind:'street',bounds:{minX:0,maxX:2,minZ:0,maxZ:2}},{kind:'street',bounds:{minX:3,maxX:5,minZ:0,maxZ:2}}],crossings:[],approaches:[]};assert.equal(streetConnectivity(fixture).components,2);fixture.corridors[1].bounds.minX=2;assert.equal(streetConnectivity(fixture).components,1);
});
