import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildFullCity} from '../site/city-model.js';
import {buildFloorIndex} from '../site/city-floors.js';
import {atomicPlan,atomicCameraPose,reviewCameraOffset} from '../site/city-atomic-plan.js';
import {createAtomicArt} from '../site/city-atomic-art.js';
import {createBoroughManifest,validateBoroughManifest,streetConnectivity} from '../site/city-borough-layout.js';
import {layoutFullCity,layoutLegacyCity} from '../site/city-layout.js';
import {skywalkCurve} from '../site/city-skywalks.js';
const city=buildFullCity(...['graph','mathlib','mathlib-bridge'].map(n=>JSON.parse(fs.readFileSync(`test/fixtures/city/${n}.json`)))),floors=buildFloorIndex(city.nodes);
const node=(id,lines)=>({id,library:'Physlib',module:{path:id.replaceAll('.','/')+'.lean',lineCount:lines,imports:[]}});
test('atomic display mapping is monotone, broad and preserves canonical source measurements',()=>{
 const heights=[0,16,117,205,575,1335,2450,1e9].map(l=>atomicPlan(node('Physlib.Units.A',l),42));
 assert.ok(heights.every((p,i)=>p.semanticHeight===42&&p.height<=20&&p.height/p.width<=1.85&&(!i||p.height>=heights[i-1].height)));
 const before=JSON.stringify(city),m=createBoroughManifest(city,{visual:'c1'});assert.equal(m.layoutVersion,4);assert.deepEqual(m.boroughs.map(b=>b.count),[669,828,82]);assert.equal(Object.keys(m.modules).length,1579);assert.equal(city.edges.length,6598);assert.equal(JSON.stringify(city),before);
 assert.equal(new Set(Object.values(m.modules).map(m=>m.architecture.type)).size,4);
 for(const m0 of Object.values(m.modules))assert.equal(m0.semanticHeight,floors.get(m0.id).height);
 assert.deepEqual(validateBoroughManifest(m),[]);assert.equal(streetConnectivity(m).components,1);
 assert.equal(JSON.stringify(m),JSON.stringify(createBoroughManifest(city,{visual:'c1'})));
 const a=layoutFullCity(city,{visual:'c1'}),old=layoutLegacyCity(city);for(const n of city.nodes.filter(n=>n.library==='Mathlib'))assert.deepEqual(a.positions.get(n.id),old.positions.get(n.id));
});
test('all original atomic geometry fits the exported decorative bounds and Low reduces real geometry',()=>{
 const manifest=createBoroughManifest(city,{visual:'c1'}),art=createAtomicArt(manifest),camera=new THREE.PerspectiveCamera(40,1.5,.1,20000),m=manifest.modules['Physlib.Units.ISQDimensionBase'],pose=atomicCameraPose(m,Object.values(manifest.modules));camera.position.set(...pose.position);camera.lookAt(new THREE.Vector3(...pose.target));camera.updateMatrixWorld();
 for(const b of art.batches.values()){b.geometry.computeBoundingBox();for(const item of b.items){const q=b.geometry.boundingBox.clone().applyMatrix4(item.matrix),m=manifest.modules[item.id],e=m.decorativeBounds;assert.ok(q.min.x>=e.minX-1e-5&&q.max.x<=e.maxX+1e-5&&q.min.z>=e.minZ-1e-5&&q.max.z<=e.maxZ+1e-5&&q.max.y<=m.decorativeHeight+1e-5,item.id);}}
 const triangles=()=>[...art.batches.values()].reduce((n,b)=>n+b.mesh.count*(b.geometry.index?.count||b.geometry.attributes.position.count)/3,0);
 art.update({camera,viewportHeight:600,quality:'medium',selected:m.id,now:0});const medium=triangles();art.update({camera,viewportHeight:600,quality:'low',selected:m.id,now:200});assert.ok(triangles()<medium*.65);assert.ok(art.batches.size<30);
});
test('dense, extreme and deep hierarchies reserve collision-safe service paths and sampled roof routes',()=>{
 for(const nodes of [Array.from({length:36},(_,i)=>node('Physlib.Units.Dense'+i,100)),[node('Physlib.Units.Small',0),node('Physlib.Units.Extreme',1e9)],[node('Physlib.Units.WithDim.Deep.A',200),node('Physlib.Units.WithDim.Deep.B',230)]]){
  const fixture={nodes,edges:[]},manifest=createBoroughManifest(fixture,{visual:'c1'}),f=buildFloorIndex(nodes),positions=new Map(Object.values(manifest.modules).map(m=>[m.id,m.position]));assert.deepEqual(validateBoroughManifest(manifest),[]);assert.ok(manifest.serviceCorridors.length&&manifest.skywalkCorridors.length&&manifest.roofDockingZones.length===nodes.length);
  const from=nodes[0].id,to=nodes.at(-1).id,curve=skywalkCurve({from,to},nodes,positions,f,manifest);
  for(const p of curve.getPoints(300))for(const m of Object.values(manifest.modules)){if(m.id===from||m.id===to)continue;const b=m.decorativeBounds;assert.ok(!(p.x>b.minX-.3&&p.x<b.maxX+.3&&p.z>b.minZ-.3&&p.z<b.maxZ+.3&&p.y<m.decorativeHeight+.4));}
 }
});

test('review pose URLs accept both supported forms and ignore malformed offsets',()=>{assert.deepEqual(reviewCameraOffset('35,30,7'),[35,30,7]);assert.deepEqual(reviewCameraOffset('[35,30,7]'),[35,30,7]);for(const v of ['invalid','[1,2]','[1,null,3]','NaN,1,2'])assert.equal(reviewCameraOffset(v),null);});
