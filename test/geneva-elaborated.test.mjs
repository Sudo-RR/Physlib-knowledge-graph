import test from 'node:test';import assert from 'node:assert/strict';
import {indexElaborated} from '../site/geneva-elaborated.js';
const production={model:{source:{revision:'r',toolchain:'t'}},modulePaths:{A:'A.lean'}};
const snapshot={format:'physlib-elaborated-pilot',schemaVersion:1,source:{physlibRevision:'r',toolchain:'t',extractorRevision:'2ee55ff6e521eabe71ecddac797e12f64448a5b6'},declarations:[{id:'A.x',module:'A',kind:'thm'}],externalTargets:[{id:'M.y',module:'M',kind:'def'}],coverage:[{module:'A',status:'partial',count:1}],dependencies:[{from:'A.x',to:'M.y',kind:'statement',directness:'unknown-or-routed'}]};
test('indexes exact IDs and directional edges without joining lexical names',()=>{const i=indexElaborated(snapshot,production);assert.equal(i.uses.get('A.x')[0].to,'M.y');assert.equal(i.usedBy.get('M.y')[0].from,'A.x');assert.equal(i.local.size,1);});
test('rejects mismatched revision and dangling edge',()=>{assert.throws(()=>indexElaborated({...snapshot,source:{...snapshot.source,physlibRevision:'old'}},production));assert.throws(()=>indexElaborated({...snapshot,externalTargets:[]},production));});
