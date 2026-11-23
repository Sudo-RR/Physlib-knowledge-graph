import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {clearCachedArt,canonicalPickTargets} from '../site/city-resources.js';
test('inspection cleanup releases owned buffers without disposing shared GLB or atlas resources',()=>{
 const source=new THREE.BoxGeometry(),atlas=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1),material=new THREE.MeshStandardMaterial({map:atlas}),template=new THREE.Group();template.add(new THREE.Mesh(source,material));
 const wrapper=new THREE.BufferGeometry();wrapper.setIndex(source.index);for(const [name,a] of Object.entries(source.attributes))wrapper.setAttribute(name,a);wrapper.setAttribute('instanceLodWeight',new THREE.InstancedBufferAttribute(new Float32Array([1]),1));
 const owned=material.clone(),mesh=new THREE.InstancedMesh(wrapper,owned,1),group=new THREE.Group();group.add(mesh);
 let disposed=0,cachedDisposed=0;source.addEventListener('dispose',()=>cachedDisposed++);material.addEventListener('dispose',()=>cachedDisposed++);atlas.addEventListener('dispose',()=>cachedDisposed++);wrapper.addEventListener('dispose',()=>{disposed++;assert.equal(wrapper.index,null);assert.equal(wrapper.getAttribute('position'),undefined);assert.ok(wrapper.getAttribute('instanceLodWeight'));});owned.addEventListener('dispose',()=>disposed++);mesh.addEventListener('dispose',()=>disposed++);
 clearCachedArt(group,template);assert.equal(disposed,3);assert.equal(cachedDisposed,0);assert.ok(source.index);assert.ok(source.getAttribute('position'));assert.equal(group.children.length,0);
});
test('canonical floor targets win over the invisible whole-building body',()=>{
 const group=new THREE.Group(),material=new THREE.MeshBasicMaterial(),body=new THREE.Mesh(new THREE.BoxGeometry(2,10,2),material);body.visible=false;body.userData={id:'exact.module',canonicalHit:true};group.add(body);
 const floors=[0,1].map(floor=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,5,2),material);mesh.position.y=floor===0?-2.5:2.5;mesh.visible=false;mesh.userData={id:'exact.module',floor,canonicalHit:true};group.add(mesh);return mesh;});group.updateMatrixWorld(true);
 const buildings=new Map([['exact.module',{group,body}]]),ray=new THREE.Raycaster(new THREE.Vector3(0,3,10),new THREE.Vector3(0,0,-1)),targets=canonicalPickTargets(buildings);
 assert.deepEqual(targets,floors);assert.equal(ray.intersectObjects(targets,false)[0].object.userData.floor,1);
 group.remove(...floors);assert.deepEqual(canonicalPickTargets(buildings),[body]);assert.equal(ray.intersectObjects(canonicalPickTargets(buildings),false)[0].object.userData.id,'exact.module');
});
