import test from 'node:test';
import assert from 'node:assert/strict';
import { queryDeclaration } from '../scripts/declaration-query.mjs';
import { compareDeclarations } from '../scripts/diff-declarations.mjs';

const source = revision => ({revision,toolchain:'lean:v1',extractor:{name:'fixture',version:'1'}});
const snapshot = revision => ({schemaVersion:1,source:source(revision),coverage:[{module:'M',status:'partial'}],declarations:[{id:'M.a',module:'M',kind:'theorem',statement:null,line:2},{id:'M.b',module:'M',kind:'definition',statement:'Nat',line:4}],dependencies:[{from:'M.a',to:'M.b',kind:'proof'}]});
test('declaration query preserves direction, coverage and provenance',()=>{const s=snapshot('a'),r=queryDeclaration({source:source('a')},s,'M.b');assert.equal(r.coverage,'partial');assert.equal(r.incoming[0].from,'M.a');assert.equal(r.source.declarationSnapshot.revision,'a');assert.equal(queryDeclaration({source:source('a')},s,'M.missing'),null);});
test('diff distinguishes statement availability, edge kinds and coverage',()=>{const a=snapshot('a'),b=snapshot('b');b.declarations[0].statement='True';b.declarations[1].line=9;b.dependencies[0].kind='statement';b.coverage[0].status='complete';b.declarations.push({id:'M.c',module:'M',kind:'lemma',statement:null,line:null});const d=compareDeclarations(a,b);assert.deepEqual(d.declarations.added,['M.c']);assert.deepEqual(d.declarations.modified,[{id:'M.a',fields:{statement:{before:null,after:'True'}}}]);assert.deepEqual(d.dependencies.removed,[['M.a','M.b','proof']]);assert.deepEqual(d.dependencies.added,[['M.a','M.b','statement']]);assert.deepEqual(d.coverage,[{module:'M',before:'partial',after:'complete'}]);assert.throws(()=>compareDeclarations(a,{...b,schemaVersion:2}),/incompatible/);});
