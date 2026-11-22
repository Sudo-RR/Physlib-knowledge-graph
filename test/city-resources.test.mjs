import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { clearDisposableGroup } from '../site/city-resources.js';

test('repeated relationship refreshes dispose their owned GPU resources',()=>{
  const group=new THREE.Group();let geometries=0,materials=0;
  for(let iteration=0;iteration<100;iteration++){
    for(let i=0;i<6;i++){
      const geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial();
      geometry.addEventListener('dispose',()=>geometries++);
      material.addEventListener('dispose',()=>materials++);
      group.add(new THREE.Mesh(geometry,material));
    }
    clearDisposableGroup(group);
    assert.equal(group.children.length,0);
  }
  assert.equal(geometries,600);assert.equal(materials,600);
});
