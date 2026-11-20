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
