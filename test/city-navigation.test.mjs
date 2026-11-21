import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutFullCity } from '../site/city-layout.js';
import { visibleRelations, allMathlibPipelines, mathlibPipelines, relationGroups, clampLayerY } from '../site/city-relations.js';

test('top-level libraries occupy separated regions and Mathlib has an underground region',()=>{
  const node=(id,path,library='Physlib')=>({id,library,module:{path}});
  const city={nodes:[node('Physlib.A','Physlib/A.lean'),node('PhyslibAlpha.A','PhyslibAlpha/A.lean'),node('QuantumInfo.A','QuantumInfo/A.lean'),node('Mathlib.A','Mathlib/A.lean','Mathlib')],edges:[{from:'Physlib.A',to:'Mathlib.A'}]};
  const result=layoutFullCity(city);
  assert.deepEqual(result.zones.map(z=>z.id),['Physlib','PhyslibAlpha','QuantumInfo','Mathlib']);
  assert.ok(result.zones[0].maxZ<result.zones[1].minZ);
  assert.ok(result.zones[1].maxZ<result.zones[2].minZ);
  assert.equal(result.zones.find(zone=>zone.id==='Mathlib').underground,true);
  assert.ok(result.districts.some(d=>d.id==='Mathlib'&&d.underground));
  assert.ok(result.positions.has('Mathlib.A'));
});

test('pipelines contain all direct Mathlib imports and selection isolates the matching endpoints',()=>{
  const nodes=[{id:'Physlib.A',library:'Physlib'},{id:'Physlib.B',library:'Physlib'},{id:'Mathlib.A',library:'Mathlib'},{id:'Mathlib.B',library:'Mathlib'}];
  const edges=[{from:'Physlib.A',to:'Mathlib.A'},{from:'Physlib.A',to:'Physlib.B'},{from:'Physlib.B',to:'Mathlib.B'},{from:'Mathlib.A',to:'Mathlib.B'},{from:'Physlib.A',to:'Mathlib.A'}];
  assert.deepEqual(mathlibPipelines({nodes,edges},'Physlib.A'),[edges[0]]);
  assert.deepEqual(mathlibPipelines({nodes,edges},'Mathlib.A'),[edges[0]]);
  assert.deepEqual(allMathlibPipelines({nodes,edges}),[edges[0],edges[2]]);
});

test('relationship groups separate Mathlib, dependencies and dependants',()=>{
  const nodes=[{id:'A',library:'Physlib'},{id:'B',library:'Physlib'},{id:'C',library:'Physlib'},{id:'M',library:'Mathlib'}];
  const edges=[{from:'A',to:'M'},{from:'A',to:'B'},{from:'C',to:'A'}];
  assert.deepEqual(relationGroups({nodes,edges},'A'),{mathlib:[edges[0]],uses:[edges[1]],usedBy:[edges[2]]});
});

test('navigation stays on its selected layer until explicitly changed',()=>{
  assert.equal(clampLayerY(-20,'surface'),1);
  assert.equal(clampLayerY(20,'surface'),20);
  assert.equal(clampLayerY(20,'underground'),-1);
  assert.equal(clampLayerY(-20,'underground'),-20);
});

test('connection filters retain import direction, remove duplicates and report the full count',()=>{
  const links=[{from:'A',to:'B'},{from:'C',to:'A'},{from:'A',to:'B'},{from:'A',to:'D'}];
  assert.deepEqual(visibleRelations(links,'A','imports',1),{links:[links[0]],total:2});
  assert.deepEqual(visibleRelations(links,'A','importers'),{links:[links[1]],total:1});
  assert.equal(visibleRelations(links,'A','both').total,3);
  assert.equal(visibleRelations(links,'A','none').total,0);
});

test('topic cities follow source folders and have non-overlapping neighbourhoods',()=>{
  const paths=['Physlib/ClassicalMechanics/Pendulum/A.lean','Physlib/ClassicalMechanics/Orbit/B.lean','Physlib/QuantumMechanics/State/C.lean','PhyslibAlpha/ClassicalMechanics/Pendulum/D.lean'];
  const city={nodes:paths.map(path=>({id:path.replace(/\.lean$/,'').replaceAll('/','.'),library:'Physlib',module:{path}})),edges:[]};
  const layout=layoutFullCity(city),again=layoutFullCity(city);
  assert.deepEqual(layout.topics.map(t=>t.id).sort(),['Physlib/ClassicalMechanics','Physlib/QuantumMechanics','PhyslibAlpha/ClassicalMechanics']);
  assert.deepEqual([...layout.positions],[...again.positions]);
  for(let i=0;i<layout.districts.length;i++)for(let j=0;j<i;j++){
    const a=layout.districts[i],b=layout.districts[j];
    assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=a.radius+b.radius);
  }
});
