import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateGraph } from '../scripts/validate.mjs';

function fixture() {
  return { schemaVersion:1, source:{repository:'https://github.com/example/repo',revision:'a'.repeat(40),generatedAt:'2026-11-11T00:00:00Z',toolchain:'leanprover/lean4:v4.35.0',extractor:{name:'scan',version:'1'}},
    modules:[{id:'Physlib.A',path:'Physlib/A.lean',library:'Physlib',imports:[{module:'Mathlib.B',line:1,kind:'import'},{module:'Physlib.Missing',line:2,kind:'import'}]}],
    maps:[{path:'Physlib/API-map.md',title:'A',abstract:'',references:['Physlib/Missing.lean']}],
    externalImports:[{source:'Physlib.A',target:'Mathlib.B',line:1}],unresolvedLocalImports:[{source:'Physlib.A',target:'Physlib.Missing',line:2}],unresolvedMapReferences:[{map:'Physlib/API-map.md',path:'Physlib/Missing.lean'}],
    counts:{modules:1,maps:1,imports:2,externalImports:1,unresolvedLocalImports:1,unresolvedMapReferences:1} };
}
test('accepts complete diagnostics including missing local references',()=>assert.deepEqual(validateGraph(fixture()),[]));
test('rejects duplicate IDs and stale diagnostics',()=>{const g=fixture();g.modules.push({...g.modules[0],path:'Physlib/Other.lean'});g.externalImports=[];const errors=validateGraph(g);assert.ok(errors.some(e=>e.includes('Duplicate module ID')));assert.ok(errors.some(e=>e.includes('externalImports')));});
test('rejects unsupported schemas and missing provenance',()=>{const g=fixture();g.schemaVersion=2;delete g.source.toolchain;const errors=validateGraph(g);assert.ok(errors.some(e=>e.includes('schema')));assert.ok(errors.some(e=>e.includes('metadata')));});
