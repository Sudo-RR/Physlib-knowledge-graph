import test from 'node:test';
import assert from 'node:assert/strict';
import { radialGroups, sectorPath } from '../site/city-map.js';
const node=(id,path,library='Physlib')=>({id,library,module:{path}});
test('radial map separates source roots and represents every file exactly once',()=>{
  const nodes=[node('Physlib','Physlib.lean'),node('Physlib.A','Physlib/ClassicalMechanics/A.lean'),node('Physlib.B','Physlib/ClassicalMechanics/B.lean'),node('PhyslibAlpha.C','PhyslibAlpha/QuantumMechanics/C.lean'),node('Mathlib.D','Mathlib/Analysis/D.lean','Mathlib')];
  const surface=radialGroups(nodes),lower=radialGroups(nodes,true);
  assert.deepEqual(surface.map(group=>group.root),['Physlib','PhyslibAlpha']);
  assert.equal(surface.flatMap(group=>group.topics).flatMap(topic=>topic.nodes).length,4);
  assert.equal(lower[0].topics[0].nodes[0].id,'Mathlib.D');
  assert.ok(Math.abs(surface.at(-1).end-surface[0].start-2*Math.PI)<1e-9);
  assert.match(sectorPath(2,3,0,Math.PI),/^M .* A /);
});
