import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTree } from '../site/tree.js';
test('organizes modules and maps by actual directory paths',()=>{
  const tree=buildTree([{id:'Physlib.X',path:'Physlib/X.lean'},{id:'Physlib',path:'Physlib.lean'}],[{path:'Physlib/API-map.md'}]);
  assert.equal(tree.entries[0].id,'Physlib');
  assert.deepEqual(tree.directories.get('Physlib').entries.map(x=>x.id),['Physlib.X','map:Physlib/API-map.md']);
});
