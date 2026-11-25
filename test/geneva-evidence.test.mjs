import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseSourceHistory,mapReviewMarks,complexEvidence} from '../site/geneva-evidence.js';
const modules=[{id:'A',path:'Physlib/A.lean'},{id:'B',path:'Physlib/B.lean'}],a='a'.repeat(40),b='b'.repeat(40);
test('first observed path activity wins and unrelated paths are ignored',()=>{
 const log='\0@@'+a+' 2026-11-25T00:00:00Z\0\0\nPhyslib/A.lean\0README.md\0\0@@'+b+' 2026-10-01T00:00:00Z\0\0\nPhyslib/A.lean\0Physlib/B.lean\0';
 const x=parseSourceHistory(log,modules);assert.equal(x.A.sha,a);assert.equal(x.B.sha,b);assert.equal(Object.keys(x).length,2);
});
test('only exact module marks map; notes are not published; conflicting marks retained',()=>{
 const x=mapReviewMarks([{path:'.lean-vouch/marks/r.json',data:{format:3,name:'R',marks:{'module A':{status:'agree',notes:['private']},'A.someDeclaration':{status:'reject'}}}},{path:'.lean-vouch/marks/s.json',data:{format:3,name:'S',marks:{'module A':{status:'question'}}}},{path:'bad',data:{format:2}}],modules);
 assert.equal(x.unmapped,1);assert.equal(x.invalid,1);assert.equal(x.marks.A.length,2);assert.equal(x.marks.A[0].notes,undefined);assert.equal(x.marks.A[0].reviewerId,'r');
});
test('activity and review are independent, missing and stale snapshots are unknown',()=>{
 const c={moduleIds:['A','B']},p={model:{source:{revision:a}},evidence:{version:1,revision:a,asOf:'2026-11-25T00:00:00Z',activity:{A:{sha:a,date:'2026-10-26T00:00:00Z'},B:{sha:b,date:'2026-08-01T00:00:00Z'}},review:{marks:{A:[{status:'agree'},{status:'reject'}]}}}};
 assert.equal(complexEvidence(p,c).freshness,'recent');assert.equal(complexEvidence(p,c).review,'reject');
 delete p.evidence.activity.B;assert.equal(complexEvidence(p,c).freshness,'unknown');p.evidence.revision=b;assert.equal(complexEvidence(p,c).review,'unknown');
});
test('freshness boundaries and missing review',()=>{
 const c={moduleIds:['A']},p={model:{source:{revision:a}},evidence:{version:1,revision:a,asOf:'2026-11-25T00:00:00Z',activity:{A:{sha:a,date:'2026-10-25T00:00:00Z'}},review:{marks:{}}}};
 assert.equal(complexEvidence(p,c).freshness,'warm');assert.equal(complexEvidence(p,c).review,'unknown');
 p.evidence.activity.A.date='2026-08-27T00:00:00Z';assert.equal(complexEvidence(p,c).freshness,'warm');
 p.evidence.activity.A.date='2026-08-26T00:00:00Z';assert.equal(complexEvidence(p,c).freshness,'older');
});
