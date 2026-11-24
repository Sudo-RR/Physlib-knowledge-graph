import test from 'node:test';
import assert from 'node:assert/strict';
import {masterplan,validatePlan,area,contains,capacity} from '../site/geneva-g1-geometry.js';
test('G1 shared shoreline partitions the entire frame with one water face',()=>{const p=masterplan(),m=validatePlan(p);assert.equal(m.area,800000);assert(m.waterShare>.15&&m.waterShare<.25);assert.equal(p.sectors.length,3);assert.equal(m.bridges,6);for(const a of Object.values(p.anchors).filter(([x])=>x>0&&x<1000))assert(contains(p.water,a));});
test('terrain does not depend on the source population',()=>{const p=JSON.stringify(masterplan());for(const n of [0,1,433,600]){const cs=Array.from({length:n},(_,i)=>({library:['PhyslibAlpha','Physlib','QuantumInfo'][i%3]}));const rows=capacity(cs);assert.equal(rows.reduce((n,s)=>n+s.count,0),cs.length);assert(rows.every(s=>s.usable>0));assert.equal(JSON.stringify(masterplan()),p);}});
test('all shoreline faces have finite positive area and bridge landing clearance',()=>{const p=masterplan();for(const s of p.sectors)assert(area(s.polygon)>0);for(const b of p.bridges){assert(b.b[1]-b.a[1]<90);assert(b.width>0);}});
