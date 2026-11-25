import test from 'node:test';import assert from 'node:assert/strict';
import {buildContributorIndex,createContributorQueries} from '../site/geneva-contributor.js';
const graph={source:{revision:'abc'},modules:[{id:'A',path:'A.lean',imports:[{module:'B',line:4},{module:'External',line:5}]},{id:'B',path:'B.lean',imports:[{module:'C',line:6}]},{id:'C',path:'C.lean',imports:[{module:'A',line:8}]},{id:'D',path:'D.lean',imports:[]}],maps:[{path:'API-map.md',title:'Map',references:['A.lean','C.lean','Missing.lean']}]};
const model={complexes:graph.modules.map(m=>({id:'complex/'+m.id,moduleIds:[m.id]}))};
const index=buildContributorIndex(graph,model),q=createContributorQueries(index);
test('path retains exact import evidence and does not invent external edges',()=>{assert.deepEqual(q.path('A','C').edges.map(e=>[e.from,e.to,e.line]),[['A','B',4],['B','C',6]]);assert(!q.path('A','D').found);assert.equal(q.path('A','A').edges.length,0);assert.throws(()=>q.path('A','External'));});
test('reverse reachability, cycles, bounds and unresolved map citations',()=>{assert.deepEqual(q.walk('A',{direction:'usedBy',depth:3}).records.map(r=>r.id),['C','B']);assert(q.walk('A',{depth:1}).depthLimited);assert(q.walk('A',{limit:1}).nodeLimited);assert(!q.path('A','C',{depth:1}).found);const maps=q.relatedMaps(['A','C']);assert.equal(maps.length,1);assert.deepEqual(maps[0].matchingModules,['A','C']);assert.equal(maps[0].references[2].module,null);});
test('reject incomplete ownership',()=>assert.throws(()=>buildContributorIndex(graph,{complexes:[]})));
