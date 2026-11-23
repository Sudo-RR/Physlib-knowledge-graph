import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createAssetRegistry,createBuildingAsset,attachBuildingAsset} from '../site/city-asset-registry.js';
import {validateCityAsset} from '../scripts/validate-assets.mjs';

test('reviewed GLB is self-contained, decoder-free and has its CC0 receipt',async()=>{
  const asset=await validateCityAsset();assert.equal(asset.triangles,398);assert.ok(asset.bytes<50000);
});
test('registry caches shared resources and resolves relative Pages URLs',async()=>{
  let calls=0;const scene=new THREE.Group();
  const registry=createAssetRegistry(async url=>{calls++;assert.equal(url,'https://example.org/Physlib-knowledge-graph/assets/models/kenney-tower.glb');return {scene};});
  const results=await Promise.all([1,2].map(()=>registry.load('kenney-tower','https://example.org/Physlib-knowledge-graph/index.html')));
  assert.equal(calls,1);assert.equal(results[0],results[1]);
});
test('district kit is loaded once across repeated consumers at repository subpaths',async()=>{
 let calls=0;const scene=new THREE.Group();const registry=createAssetRegistry(async url=>{
  calls++;assert.equal(url,'https://example.org/Physlib-knowledge-graph/assets/models/kenney-district-kit.glb');return {scene};
 });
 const results=await Promise.all(Array.from({length:25},()=>registry.load('district-kit','https://example.org/Physlib-knowledge-graph/index.html')));
 assert.equal(calls,1);assert.ok(results.every(result=>result===scene));
});
test('uniform fit and pedestal preserve exact semantic height and descendant identity',()=>{
  const template=new THREE.Group(),geometry=new THREE.BoxGeometry(2,4,2),material=new THREE.MeshStandardMaterial();
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(3,2,-2);template.add(mesh);
  const original=template.toJSON();
  const result=createBuildingAsset(template,{moduleId:'Physlib.Units.ISQDimensionBase',width:2,depth:1.5,height:12});
  const box=new THREE.Box3().setFromObject(result.group);
  assert.equal(box.max.y,12);assert.equal(box.min.y,result.pedestalHeight);
  assert.ok(box.max.x<=1&&box.min.x>=-1&&box.max.z<=.75&&box.min.z>=-.75);
  const instance=result.group.children[0].children[0];
  assert.equal(instance.geometry,geometry);assert.equal(instance.material,material);
  assert.equal(instance.userData.id,'Physlib.Units.ISQDimensionBase');
  assert.deepEqual(template.toJSON(),original);
  const ray=new THREE.Raycaster(new THREE.Vector3(0,11,10),new THREE.Vector3(0,0,-1));
  assert.equal(ray.intersectObject(result.group,true)[0].object.userData.id,'Physlib.Units.ISQDimensionBase');
});
test('failed load preserves semantic group and can retry without poisoning cache',async()=>{
  let attempts=0;const registry=createAssetRegistry(async()=>{attempts++;throw Error('404');});
  const building={node:{id:'Physlib.A'},footprint:{width:2,depth:2},group:new THREE.Group()};
  const body=new THREE.Mesh(new THREE.BoxGeometry(2,8,2));building.group.add(body);
  const states=[];
  for(let i=0;i<2;i++)assert.equal(await attachBuildingAsset({registry,key:'kenney-tower',baseUrl:'https://example.org/repo/',building,height:8,onStatus:s=>states.push(s)}),null);
  assert.equal(attempts,2);assert.deepEqual(building.group.children,[body]);assert.deepEqual(states,['loading','fallback','loading','fallback']);
});
