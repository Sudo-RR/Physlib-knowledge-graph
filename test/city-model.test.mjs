import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCity, buildReviewCity, buildDistricts, cityNeighborhood } from '../site/city-model.js';
import { makeFolderTree, renderFolderTree } from '../site/city-explorer.js';

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

test('review slice follows real files, paths and import edges',()=>{
 const source={repository:'https://github.com/leanprover-community/physlib',revision:'p',toolchain:'v'};
 const phys={source,modules:[
  {id:'Physlib.Mathematics.Calculus.Gradient',path:'Physlib/Mathematics/Calculus/Gradient.lean',imports:[{module:'Mathlib.Analysis.Calculus.Gradient.Basic',line:8}]},
  {id:'Physlib.ClassicalMechanics.Example',path:'Physlib/ClassicalMechanics/Example.lean',imports:[{module:'Physlib.Mathematics.Calculus.Gradient',line:3}]},
  {id:'Physlib.Other',path:'Physlib/Other.lean',imports:[]}
 ]};
 const math={source:{repository:'https://github.com/leanprover-community/mathlib4',physlibRevision:'p',revision:'m',toolchain:'v'},modules:[{id:'Mathlib.Analysis.Calculus.Gradient.Basic',path:'Mathlib/Analysis/Calculus/Gradient/Basic.lean',imports:[]}]};
 const bridge={source:{physlibRevision:'p',mathlibRevision:'m',toolchain:'v'},edges:[{from:'Physlib.Mathematics.Calculus.Gradient',to:'Mathlib.Analysis.Calculus.Gradient.Basic',line:8}],unresolved:[]};
 const city=buildReviewCity(phys,math,bridge);
 assert.equal(city.nodes.length,3);assert.equal(city.edges.length,2);
 assert.deepEqual(buildDistricts(city.nodes).map(d=>d.id).sort(),['Mathlib/Analysis/Calculus','Physlib/ClassicalMechanics','Physlib/Mathematics/Calculus']);
 const html=renderFolderTree(makeFolderTree(city.nodes),{expanded:new Set(['Physlib','Physlib/Mathematics','Physlib/Mathematics/Calculus'])});
 assert.match(html,/Gradient\.lean/);assert.doesNotMatch(html,/Other\.lean/);
 assert.match(renderFolderTree(makeFolderTree(city.nodes),{query:'example'}),/Physlib\.ClassicalMechanics\.Example/);
});
