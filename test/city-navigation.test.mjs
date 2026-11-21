import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutFullCity } from '../site/city-layout.js';
import { visibleRelations } from '../site/city-relations.js';

test('top-level libraries occupy separated regions while Mathlib is placed below its importers',()=>{
  const node=(id,path,library='Physlib')=>({id,library,module:{path}});
  const city={nodes:[node('Physlib.A','Physlib/A.lean'),node('PhyslibAlpha.A','PhyslibAlpha/A.lean'),node('QuantumInfo.A','QuantumInfo/A.lean'),node('Mathlib.A','Mathlib/A.lean','Mathlib')],edges:[{from:'Physlib.A',to:'Mathlib.A'}]};
  const result=layoutFullCity(city);
  assert.deepEqual(result.zones.map(z=>z.id),['Physlib','PhyslibAlpha','QuantumInfo']);
  assert.ok(result.zones[0].maxZ<result.zones[1].minZ);
  assert.ok(result.zones[1].maxZ<result.zones[2].minZ);
  const math=result.positions.get('Mathlib.A'),source=result.positions.get('Physlib.A');
  assert.ok(Math.abs(math.x-source.x)<=1.5&&Math.abs(math.z-source.z)<=1.5);
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
