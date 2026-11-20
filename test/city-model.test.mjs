import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCity, cityNeighborhood } from '../site/city-model.js';

test('city preserves explicit import directions and reports omitted files',()=>{
 const source={repository:'https://github.com/leanprover-community/physlib',revision:'p',toolchain:'v'};
 const phys={source,modules:[{id:'Physlib.ClassicalMechanics.A',imports:[{module:'Mathlib.A',line:2}]},{id:'Physlib.ClassicalMechanics.B',imports:[]}]};
 const math={source:{repository:'https://github.com/leanprover-community/mathlib4',physlibRevision:'p',revision:'m',toolchain:'v'},modules:[{id:'Mathlib.A',imports:[]}]};
 const bridge={source:{physlibRevision:'p',mathlibRevision:'m',toolchain:'v'},edges:[{from:'Physlib.ClassicalMechanics.A',to:'Mathlib.A',line:2}],unresolved:[]};
 const city=buildCity(phys,math,bridge,{limit:1});
 assert.equal(city.omittedPhyslib,1);assert.equal(city.mathlibModules,1);
 assert.deepEqual(cityNeighborhood(city,'Mathlib.A').importers,[{from:'Physlib.ClassicalMechanics.A',to:'Mathlib.A',line:2}]);
 assert.equal(cityNeighborhood(city,'Mathlib.A').imports.length,0);
 assert.throws(()=>buildCity(phys,math,{...bridge,source:{...bridge.source,mathlibRevision:'wrong'}}),/do not match/);
});
