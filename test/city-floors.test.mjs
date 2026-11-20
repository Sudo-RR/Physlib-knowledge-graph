import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFloorIndex} from '../site/city-floors.js';

test('floors use unique recorded declarations, preserve unknown coverage and group large files',()=>{
 const nodes=[{id:'P'},{id:'M'},{id:'Unknown'}];
 const declarations={coverage:[{module:'P',status:'partial'}],declarations:Array.from({length:30},(_,i)=>({id:`d${i}`,module:'P',kind:'theorem'}))};
 const pilot={declarations:[{id:'d1',module:'P',kind:'thm'}],targets:[{id:'m',module:'M',kind:'def'}]};
 const index=buildFloorIndex(nodes,declarations,pilot),p=index.get('P');
 assert.equal(p.items.length,30);assert.equal(p.floors.length,12);
 assert.equal(p.floors.flatMap(f=>f.items).length,30);
 assert.equal(p.coverage,'partial');assert.equal(index.get('M').coverage,'partial');
 assert.equal(index.get('Unknown').coverage,'unavailable');
 assert.ok(p.height>index.get('M').height);assert.ok(index.get('M').height>index.get('Unknown').height);
});

test('building height follows source size independently of partial declaration coverage',()=>{
 const nodes=[{id:'small',module:{lineCount:10}},{id:'large',module:{lineCount:1000}},{id:'legacy',module:{}}];
 const index=buildFloorIndex(nodes,null,null);
 assert.ok(index.get('large').height>index.get('small').height);
 assert.equal(index.get('small').coverage,'unavailable');assert.equal(index.get('legacy').lineCount,null);
 assert.equal(index.get('small').floors[0].kind,'source-range');
 assert.equal(index.get('small').floors[0].start,1);assert.equal(index.get('small').floors[0].end,10);
 const ranges=index.get('large').floors;assert.equal(ranges.length,12);assert.equal(ranges[0].start,1);assert.equal(ranges.at(-1).end,1000);
 for(let i=1;i<ranges.length;i++)assert.equal(ranges[i-1].end+1,ranges[i].start);
});
