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
