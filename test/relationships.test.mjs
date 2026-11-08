import { test } from 'node:test';
import assert from 'node:assert/strict';
import { neighborhood } from '../site/relationships.js';

test('classifies direct relationships and preserves arrow direction', () => {
  const selected = { id:'Physlib.A', path:'Physlib/A.lean', library:'Physlib', imports:[{module:'Mathlib.B'}] };
  const importer = { id:'Physlib.C', path:'Physlib/C.lean', library:'Physlib', imports:[{module:'Physlib.A'}] };
  const result = neighborhood(selected,[selected,importer],[{path:'Physlib/API-map.md',title:'A',references:['Physlib/A.lean']}]);
  assert.deepEqual(result.nodes.map(x=>[x.id,x.role]), [['Physlib.A','selected'],['Physlib.C','importer'],['Mathlib.B','import'],['map:Physlib/API-map.md','map']]);
  assert.deepEqual(result.edges, [{from:'Physlib.C',to:'Physlib.A',kind:'import'},{from:'Physlib.A',to:'Mathlib.B',kind:'import'},{from:'map:Physlib/API-map.md',to:'Physlib.A',kind:'api-map'}]);
  assert.equal(result.nodes[2].library,'external');
});

test('reports omitted nodes without changing full counts', () => {
  const selected = { id:'A', path:'A.lean', library:'Physlib', imports:[{module:'B'},{module:'C'}] };
  const result = neighborhood(selected,[selected],[],1);
  assert.equal(result.outgoing.length,2);
  assert.equal(result.truncated.outgoing,true);
  assert.equal(result.edges.length,1);
});
