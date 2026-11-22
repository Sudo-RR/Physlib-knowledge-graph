import test from 'node:test';
import assert from 'node:assert/strict';
import { cityBounds, fitDistance } from '../site/city-camera.js';

test('overview bounds include separated and underground areas without gaps',()=>{
  const bounds=cityBounds([{x:-30,z:0,radius:10},{x:80,z:100,radius:20,underground:true}],10);
  assert.deepEqual(bounds,{minX:-50,maxX:110,minZ:-20,maxZ:130});
});

test('framing accounts for narrow screens and tall buildings',()=>{
  const wide=fitDistance(100,20,2,40,2);
  const narrow=fitDistance(100,20,2,40,.5);
  assert.ok(narrow>wide);
  assert.ok(fitDistance(2,100,2,40,1)>fitDistance(2,10,2,40,1));
});
