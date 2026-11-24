import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCityV2,roleOf,neighborhood,stationData} from '../site/city-v2-model.js';
const source={revision:'a'.repeat(40),toolchain:'leanprover/lean4:v4.35.0'};
const graph={source,modules:[
 {id:'Physlib.ClassicalMechanics.HamiltonianMechanics.Basic',path:'Physlib/ClassicalMechanics/HamiltonianMechanics/Basic.lean',lineCount:150,imports:[{module:'Mathlib.Analysis.Basic',line:1},{module:'Physlib.ClassicalMechanics.Lagrangian.Basic',line:2}]},
 {id:'Physlib.ClassicalMechanics.HamiltonianMechanics.PoissonBracket',path:'Physlib/ClassicalMechanics/HamiltonianMechanics/PoissonBracket.lean',lineCount:300,imports:[{module:'Mathlib.Analysis.Basic',line:3}]},
 {id:'Physlib.ClassicalMechanics.Lagrangian.Basic',path:'Physlib/ClassicalMechanics/Lagrangian/Basic.lean',lineCount:90,imports:[{module:'Mathlib.Analysis.Basic',line:4},{module:'Physlib.ClassicalMechanics.HamiltonianMechanics.Basic',line:5}]},
]};
test('unclassified source stays visible as construction sites',()=>{
 const m=buildCityV2(graph);assert.equal(m.complexes.length,2);assert(m.complexes.every(c=>c.buildings.length===1&&c.buildings[0].role==='provisional'));
 assert.equal(m.edges.length,2);assert(m.edges.every(e=>e.count===1));
});
test('Mathlib stations aggregate per complex without merging shared Mathlib targets',()=>{
 const m=buildCityV2(graph);const c=m.complexes.find(c=>c.id.endsWith('HamiltonianMechanics')),other=m.complexes.find(c=>c.id.endsWith('Lagrangian'));
 assert.equal(stationData(m,c.id).totalUnique,1);assert.deepEqual(c.mathlib[0].sourceModules,[...c.moduleIds].sort());
 assert.equal(other.mathlib[0].target,c.mathlib[0].target);
 assert.equal(neighborhood(m,c.id).uses.length,1);assert.equal(neighborhood(m,c.id).usedBy.length,1);
});
test('partial declaration coverage retains provisional content alongside verified roles',()=>{
 const declarations={source,coverage:[{module:graph.modules[0].id,status:'partial'}],declarations:[
 {id:'Some.structure',module:graph.modules[0].id,kind:'structure'},
 {id:'Some.instance',module:graph.modules[0].id,kind:'instance'}
 ]};
 const m=buildCityV2(graph,declarations);const b=m.complexes.find(c=>c.id.endsWith('HamiltonianMechanics')).buildings;
 assert(b.some(x=>x.role==='data-structure'&&x.declarationIds.includes('Some.structure')));
 assert(b.some(x=>x.role==='relations-instances'));assert(b.some(x=>x.role==='provisional'));
});
test('role categories are explicit and synthetic demonstration is labelled',()=>{
 assert.equal(roleOf('other'),null);const m=buildCityV2(graph,null,{demo:true});
 assert(m.complexes.flatMap(c=>c.buildings).some(x=>x.status==='demo'&&x.evidence==='synthetic-visual-fixture'));
});
test('mismatched declaration revision cannot be assigned',()=>{
 assert.throws(()=>buildCityV2(graph,{source:{revision:'unrelated',toolchain:source.toolchain}}),/mismatch/);
});

test('import-only source modules remain represented even with zero declarations',()=>{
 const declarations={source,coverage:graph.modules.map(m=>({module:m.id,status:'complete'})),declarations:[]};
 const m=buildCityV2(graph,declarations);
 assert(m.complexes.every(c=>c.buildings.some(b=>b.role==='provisional')));
});

test('world contains all areas and preserves cross-borough imports',()=>{
 const other={id:'Physlib.QuantumMechanics.Basic',path:'Physlib/QuantumMechanics/Basic.lean',lineCount:10,imports:[{module:graph.modules[0].id,line:1}]};
 const g={...graph,modules:[...graph.modules,other]};const m=buildCityV2(g,null,{area:'all'});
 assert.equal(m.complexes.flatMap(c=>c.moduleIds).length,g.modules.length);assert(m.complexes.some(c=>c.area==='QuantumMechanics'));assert(m.edges.some(e=>e.imports.some(i=>i.from===other.id)));
});
