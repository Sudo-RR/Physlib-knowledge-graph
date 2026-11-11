import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryNode } from '../scripts/graph-query.mjs';
import { compareSnapshots } from '../scripts/diff-snapshots.mjs';
const snapshot=(revision,imports)=>({schemaVersion:1,source:{revision},modules:[{id:'Physlib.A',path:'Physlib/A.lean',imports}],maps:[{path:'Physlib/API-map.md',references:['Physlib/A.lean']}]});
test('query includes typed incoming map and outgoing import edges',()=>{const r=queryNode(snapshot('a',[{module:'Mathlib.B',line:3}]),'Physlib.A');assert.deepEqual(r.edges.map(e=>e.kind),['import','api-map-file']);assert.equal(r.edges[0].line,3);assert.equal(queryNode(snapshot('a',[]),'missing'),null);});
test('snapshot diff uses relation identity, ignoring line shifts',()=>{const a=snapshot('a',[{module:'Mathlib.B',line:3}]),b=snapshot('b',[{module:'Mathlib.B',line:4},{module:'Mathlib.C',line:5}]);const d=compareSnapshots(a,b);assert.equal(d.changes.edges.added.length,1);assert.equal(d.changes.edges.removed.length,0);assert.match(d.changes.edges.added[0],/Mathlib.C/);assert.throws(()=>compareSnapshots(a,{...b,schemaVersion:2}));});
