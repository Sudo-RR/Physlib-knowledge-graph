import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveRecord,resolveModule,loogleUrl} from '../site/geneva-research-search.js';
import {summarizeHistory,compareHistory} from '../site/geneva-history-core.js';
const p={contributor:{owner:{'Physlib.A':'Physlib/A'}}};
test('exact external module matching; no declaration or prototype guesses',()=>{assert.equal(resolveRecord({module_name:['Physlib','A'],name:['A','thm']},p).complex,'Physlib/A');assert.equal(resolveRecord({module_name:['Physlib','B'],name:['A','thm']},p).complex,null);assert.equal(resolveRecord({module_name:'Physlib.A',name:['x']},p),null);assert.equal(resolveModule('Physlib/A.lean',p).complex,'Physlib/A');assert.equal(resolveModule('toString',p),null);assert.equal(new URL(loogleUrl('ContDiff, ?x')).searchParams.get('q'),'ContDiff, ?x');});
test('history counts explicit records and diffs unique relationships',()=>{const a={source:{revision:'a'},modules:[{id:'A',library:'Physlib',imports:[{module:'B'},{module:'B'}]}],maps:[]},b={source:{revision:'b'},modules:[{id:'A',library:'Physlib',imports:[{module:'C'}]},{id:'C',library:'Physlib',imports:[]}],maps:[{path:'API-map.md'}]};const d=compareHistory(a,b);assert.deepEqual(d.modules.added,['C']);assert.deepEqual(d.imports.removed,[['A','B']]);assert.deepEqual(d.imports.added,[['A','C']]);assert.equal(summarizeHistory(a).imports,2);});
