import test from 'node:test';
import assert from 'node:assert/strict';
import {demoMassing} from '../site/geneva-g1-massing.js';
import {masterplan,contains} from '../site/geneva-g1-geometry.js';
test('illustrative skyline is deterministic and occupies all three banks without overlapping towers',()=>{const plan=masterplan(),ts=demoMassing(plan);assert(ts.length>=80);assert.deepEqual(ts,demoMassing(plan));for(const sector of plan.sectors)assert(ts.some(t=>t.library===sector.id));for(let i=0;i<ts.length;i++){const t=ts[i],bank=plan.sectors.find(s=>s.id===t.library);for(let k=0;k<16;k++)assert(contains(bank.polygon,[t.x+t.r*Math.cos(k*Math.PI/8),t.z+t.r*Math.sin(k*Math.PI/8)]));for(let j=0;j<i;j++)assert(Math.hypot(t.x-ts[j].x,t.z-ts[j].z)>=t.r+ts[j].r+2);}});
