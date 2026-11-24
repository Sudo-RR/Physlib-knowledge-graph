import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildSynthKit,synthModel} from '../site/geneva-synthcity-kit.js';
import {modelSources} from '../site/geneva-synthcity-models.js';
import {demoMassing} from '../site/geneva-g1-massing.js';
test('licensed SynthCity models parse and fit existing tower envelopes',()=>{
 const kit=buildSynthKit(THREE);assert.deepEqual(Object.keys(kit),Object.keys(modelSources));
 for(const g of Object.values(kit)){assert(g.getAttribute('position').count>0);assert.equal(g.getAttribute('uv').count,g.getAttribute('position').count);const b=g.boundingBox;for(const axis of ['x','y','z']){assert(Math.abs(b.min[axis]+.5)<1e-5);assert(Math.abs(b.max[axis]-.5)<1e-5);}g.dispose();}
 const assignments=demoMassing().map(synthModel);assert(assignments.some(Boolean));assert(assignments.some(x=>x===null));assert(assignments.filter(Boolean).every(x=>x in kit));
});
