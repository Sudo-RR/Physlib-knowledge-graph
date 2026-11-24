import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildFullCity} from '../site/city-model.js';
import {createBoroughManifest,validateBoroughManifest} from '../site/city-borough-layout.js';
import {createAtomicArt} from '../site/city-atomic-art.js';
import {skylineMassing,atomicCameraPose} from '../site/city-atomic-plan.js';
const city=buildFullCity(...['graph','mathlib','mathlib-bridge'].map(n=>JSON.parse(fs.readFileSync(`test/fixtures/city/${n}.json`)))),old=createBoroughManifest(city,{visual:'c2'}),sky=createBoroughManifest(city,{visual:'c4'});
test('skyline preserves horizontal geography, graph and colours while raising bounded source-derived towers',()=>{
 assert.equal(city.nodes.length,2256);assert.equal(city.edges.length,6598);assert.deepEqual(sky.boroughs,old.boroughs);assert.deepEqual(sky.rivers,old.rivers);assert.deepEqual(sky.colorRegistry,old.colorRegistry);assert.deepEqual(validateBoroughManifest(sky),[]);
 for(const [id,m] of Object.entries(sky.modules)){const b=old.modules[id];for(const k of ['position','footprint','plotBounds','decorativeBounds','semanticHeight','sourcePath','identity'])assert.deepEqual(m[k],b[k],id+' '+k);assert.ok(m.displayHeight>b.displayHeight*2);assert.ok(m.displayHeight/Math.min(m.architecture.width,m.architecture.depth)<=5.8+1e-6);assert.ok(m.dock.y>m.displayHeight);}
 for(const type of [0,1,2,3]){const ms=Object.values(sky.modules).filter(m=>m.architecture.type===type).sort((a,b)=>a.architecture.sourceLines-b.architecture.sourceLines);for(let i=1;i<ms.length;i++)assert.ok(ms[i].displayHeight>=ms[i-1].displayHeight);}
});
test('every skyscraper part fits the updated vertical collision and existing horizontal envelope',()=>{
 const art=createAtomicArt(sky);for(const b of art.batches.values()){b.geometry.computeBoundingBox();for(const i of b.items){const q=b.geometry.boundingBox.clone().applyMatrix4(i.matrix),m=sky.modules[i.id],e=m.decorativeBounds;assert.ok(q.min.x>=e.minX-1e-4&&q.max.x<=e.maxX+1e-4&&q.min.z>=e.minZ-1e-4&&q.max.z<=e.maxZ+1e-4&&q.max.y<=m.decorativeHeight+1e-4,i.id);}}
});
test('four illustrative massing styles increase occupied area and retain real Low geometry reduction',()=>{
 const styles=new Set();for(const m of Object.values(sky.modules)){const mass=skylineMassing(m);styles.add(mass.name);assert.equal(mass.classification,'illustrative');assert.equal(mass.height,m.displayHeight);assert.ok(mass.width*mass.depth>m.architecture.width*m.architecture.depth*1.35,m.id);}
 assert.equal(styles.size,4);
 const art=createAtomicArt(sky),m=sky.modules['Physlib.Units.ISQDimensionBase'],pose=atomicCameraPose(m,Object.values(sky.modules)),camera=new THREE.PerspectiveCamera(40,2,.1,20000);camera.position.set(...pose.position);camera.lookAt(new THREE.Vector3(...pose.target));camera.updateMatrixWorld();
 const triangles=()=>[...art.batches.values()].reduce((n,b)=>n+b.mesh.count*(b.geometry.index?.count||b.geometry.attributes.position.count)/3,0);
 art.update({camera,viewportHeight:555,selected:m.id,quality:'medium',now:0});const medium=triangles();art.update({camera,viewportHeight:555,selected:m.id,quality:'low',now:200});assert.ok(triangles()<medium*.8);
});
