import {test} from 'node:test';
import assert from 'node:assert/strict';
import {districtKey,districtBounds,distanceToBounds,detailPlan} from '../site/geneva-lod.js';
const towers=[{id:'a',library:'Physlib',area:'Mechanics',x:10,z:20},{id:'b',library:'Physlib',area:'Mechanics',x:20,z:40},{id:'c',library:'PhyslibAlpha',area:'Mechanics',x:500,z:600},{x:90,z:80}];
const bounds=districtBounds(towers),near=districtKey(towers[0]),far=districtKey(towers[2]);
const params={quality:'medium',pixelsPerUnit:2,focusX:15,focusZ:30,viewRadius:100};
test('library banks remain separate even when subjects match',()=>{
 assert.equal(bounds.size,3);assert.notEqual(near,far);assert.equal(distanceToBounds(15,30,bounds.get(near)),0);assert.equal(distanceToBounds(25,40,bounds.get(near)),5);
});
test('overview simplifies all geometry; full override restores every district',()=>{
 const low=detailPlan(bounds,{...params,pixelsPerUnit:.7});assert.equal(low.detail.size,0);assert.equal(low.civicDetail,false);
 const full=detailPlan(bounds,{...params,mode:'full',pixelsPerUnit:.7});assert.equal(full.detail.size,bounds.size);assert.equal(full.civicDetail,true);
});
test('focus restores nearby detailed districts without restoring distant geometry',()=>{
 const focus=detailPlan(bounds,params);assert(focus.detail.has(near));assert(!focus.detail.has(far));assert(focus.civicDetail);
 const pan=detailPlan(bounds,{...params,focusX:500,focusZ:600});assert(pan.detail.has(far));assert(!pan.detail.has(near));
});
test('quality thresholds and selected district allowance are independent of identity',()=>{
 const low=detailPlan(bounds,{...params,quality:'low'});assert(!low.detail.has(near));
 const selected=detailPlan(bounds,{...params,quality:'low',selectedKey:near});assert(selected.detail.has(near));assert(!selected.civicDetail);
 const high=detailPlan(bounds,{...params,quality:'high',pixelsPerUnit:1.2});assert(high.detail.has(near));
 assert.equal(towers[0].id,'a');
});
