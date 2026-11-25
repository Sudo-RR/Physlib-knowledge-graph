import test from 'node:test';import assert from 'node:assert/strict';
import {mergeMetadata} from '../scripts/merge-elaborated-metadata.mjs';
const snapshot={format:'physlib-elaborated-pilot',source:{},declarations:[{id:'A.x',module:'A'}],dependencies:[{from:'A.x',to:'A.y',directness:'unknown-or-routed'}]};
const row={id:'A.x',module:'A',statement:'A.x : True',range:{line:3,column:0,endLine:4,endColumn:5},valueAvailable:true,typeReferences:[{id:'True',module:'Init.Prelude'}],valueReferences:[{id:'True.intro',module:'Init.Prelude'}]};
test('exact identity enriches without rewriting contracted edges',()=>{const s=mergeMetadata(snapshot,[row],'a'.repeat(64));assert.equal(s.declarations[0].line,3);assert.equal(s.declarations[0].statement,row.statement);assert.equal(s.declarations[0].directReferences.value[0].id,'True.intro');assert.deepEqual(s.dependencies,snapshot.dependencies);});
test('rejects wrong module, missing and duplicate identities, invalid ranges and unavailable values',()=>{for(const rows of [[],[row,row],[{...row,module:'B'}],[{...row,range:{...row.range,endLine:2}}],[{...row,valueAvailable:false}]])assert.throws(()=>mergeMetadata(snapshot,rows,'a'.repeat(64)));});
