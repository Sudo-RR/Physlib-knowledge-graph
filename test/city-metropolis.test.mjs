import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildFullCity} from '../site/city-model.js';
import {createBoroughManifest,validateBoroughManifest,streetConnectivity} from '../site/city-borough-layout.js';
import {civicClearanceErrors} from '../site/city-chromatic-layout.js';
import {createAtomicArt} from '../site/city-atomic-art.js';
import {createMetropolisCentres} from '../site/city-metropolis.js';
import {atomicCameraPose} from '../site/city-atomic-plan.js';
import {layoutFullCity} from '../site/city-layout.js';
import {buildFloorIndex} from '../site/city-floors.js';
import {skywalkCurve} from '../site/city-skywalks.js';
const inputs=['graph','mathlib','mathlib-bridge'].map(n=>JSON.parse(fs.readFileSync(`test/fixtures/city/${n}.json`))),city=buildFullCity(...inputs),c2=createBoroughManifest(city,{visual:'c2'}),c3=createBoroughManifest(city,{visual:'c3',concept:'spaceage'});
test('C3 preserves every C2 module plot, dimension, address, corridor and underground anchor',()=>{
 assert.equal(city.nodes.length,2256);assert.equal(city.edges.length,6598);assert.deepEqual(c3.colorRegistry,c2.colorRegistry);assert.deepEqual(c3.boroughs,c2.boroughs);assert.deepEqual(c3.rivers,c2.rivers);assert.deepEqual(c3.corridors,c2.corridors);
 for(const [id,m] of Object.entries(c3.modules))for(const key of ['position','sourcePath','semanticHeight','displayHeight','footprint','decorativeBounds','decorativeHeight','plotBounds','identity','dock'])assert.deepEqual(m[key],c2.modules[id][key],id+' '+key);
 const a=layoutFullCity(city,{visual:'c2'}),b=layoutFullCity(city,{visual:'c3'});for(const n of city.nodes.filter(n=>n.library==='Mathlib'))assert.deepEqual(a.positions.get(n.id),b.positions.get(n.id));
 assert.deepEqual(validateBoroughManifest(c3),[]);assert.deepEqual(civicClearanceErrors(c3),[]);assert.equal(streetConnectivity(c3).components,1);
});
test('both C3 concepts keep every submitted architectural and civic part inside collision bounds',()=>{
 for(const concept of ['gardens','spaceage']){const m=createBoroughManifest(city,{visual:'c3',concept}),art=createAtomicArt(m),civic=createMetropolisCentres(m);
  for(const b of art.batches.values()){b.geometry.computeBoundingBox();for(const i of b.items){const a=m.modules[i.id],q=b.geometry.boundingBox.clone().applyMatrix4(i.matrix),e=a.decorativeBounds;assert.ok(q.min.x>=e.minX-1e-4&&q.max.x<=e.maxX+1e-4&&q.min.z>=e.minZ-1e-4&&q.max.z<=e.maxZ+1e-4&&q.max.y<=a.decorativeHeight+1e-4,i.id);}}
  for(const b of civic.userData.civicBatches.values()){b.shape.computeBoundingBox();for(const i of b.items){const l=[...m.landmarks,...m.groves].find(l=>l.id===i.id),q=b.shape.boundingBox.clone().applyMatrix4(i.matrix),e=l.bounds;assert.ok(q.min.x>=e.minX-1e-4&&q.max.x<=e.maxX+1e-4&&q.min.z>=e.minZ-1e-4&&q.max.z<=e.maxZ+1e-4&&q.max.y<=l.maxY+1e-4,l.id);}}
  assert.ok(civic.children.length<24);civic.traverse(o=>assert.ok(!o.userData.id&&!['CircleGeometry','RingGeometry'].includes(o.geometry?.type)));
 }
});
test('C3 genuine Low geometry reduction retains shared civic silhouettes and disposes scene resources',()=>{
 const art=createAtomicArt(c3),m=c3.modules['Physlib.Units.ISQDimensionBase'],p=atomicCameraPose(m,Object.values(c3.modules)),camera=new THREE.PerspectiveCamera(40,2,.1,20000);camera.position.set(...p.position);camera.lookAt(new THREE.Vector3(...p.target));camera.updateMatrixWorld();
 const count=()=>[...art.batches.values()].reduce((n,b)=>n+b.mesh.count*(b.geometry.index?.count||b.geometry.attributes.position.count)/3,0);
 art.update({camera,viewportHeight:476,selected:m.id,quality:'medium',now:0});const medium=count();art.update({camera,viewportHeight:476,selected:m.id,quality:'low',now:200});assert.ok(count()<medium*.8);assert.ok(art.group.userData.settled);
 const civic=createMetropolisCentres(c3);civic.userData.update({camera,quality:'low'});for(const b of civic.userData.civicBatches.values())assert.equal(b.mesh.count,b.detail?0:b.items.length);let released=0;const owned=new Set([...civic.userData.civicBatches.values()].map(b=>b.shape));for(const g of owned)g.addEventListener('dispose',()=>released++);civic.userData.dispose();civic.userData.dispose();assert.equal(released,owned.size);assert.equal(civic.children.length,0);
});
test('C3 dense/deep/extreme fixtures and real import routes clear expanded civic centres',()=>{
 const node=(path,lines)=>({id:path.replace('.lean','').replaceAll('/','.'),library:path.split('/')[0],module:{path,lineCount:lines,imports:[]}});
 for(const nodes of [Array.from({length:90},(_,i)=>node(`Physlib/Units/A${i}.lean`,i===89?1e9:200)),Array.from({length:17},(_,i)=>node(`QuantumInfo/States/A${i%4}/Deep${i}/File.lean`,i*100))]){const m=createBoroughManifest({nodes,edges:[]},{visual:'c3'});assert.deepEqual(validateBoroughManifest(m),[]);assert.deepEqual(civicClearanceErrors(m),[]);}
 const positions=new Map(Object.values(c3.modules).map(m=>[m.id,m.position])),floors=buildFloorIndex(city.nodes),edges=city.edges.filter(e=>positions.has(e.from)&&positions.has(e.to)&&e.from!==e.to&&Math.hypot(positions.get(e.from).x-positions.get(e.to).x,positions.get(e.from).z-positions.get(e.to).z)<240).slice(0,8);
 for(const e of edges)for(const p of skywalkCurve(e,city.nodes,positions,floors,c3).getPoints(180))for(const l of c3.landmarks){const b=l.bounds;assert.ok(!(p.x>b.minX&&p.x<b.maxX&&p.z>b.minZ&&p.z<b.maxZ&&p.y<l.maxY+.1));}
});
test('C3 append-file and new-directory updates preserve all unaffected source addresses',()=>{
 const original=JSON.stringify(city);for(const path of ['Physlib/Units/ZzzC3Fixture.lean','Physlib/ZzzC3District/Fixture.lean']){const n={id:path.replace('.lean','').replaceAll('/','.'),library:'Physlib',module:{path,lineCount:200,imports:[]}},m=createBoroughManifest({...city,nodes:[...city.nodes,n]},{visual:'c3'});for(const [id,a] of Object.entries(c3.modules)){assert.equal(m.modules[id].identity.primary,a.identity.primary);assert.equal(m.modules[id].districtId,a.districtId);if(path.includes('/Units/'))assert.deepEqual(m.modules[id].position,a.position);}assert.deepEqual(validateBoroughManifest(m),[]);assert.deepEqual(civicClearanceErrors(m),[]);}assert.equal(JSON.stringify(city),original);
});
