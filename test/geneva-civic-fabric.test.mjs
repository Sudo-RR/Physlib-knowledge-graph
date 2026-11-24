import test from 'node:test';
import assert from 'node:assert/strict';
import {masterplan,contains} from '../site/geneva-g1-geometry.js';
import {demoMassing} from '../site/geneva-g1-massing.js';
import {civicFabric,pointSegment} from '../site/geneva-civic-fabric.js';
const p=masterplan(),towers=demoMassing(p),f=civicFabric(p,towers);
const key=p=>p.join(',');
test('civic layer spans all three banks and joins all bridge landings',()=>{
 assert.deepEqual(f.diagnostics,[]);assert(f.roads.length>500);assert(f.infill.length>300);assert(f.trees.length>300);
 const graph=new Map(),edge=(a,b)=>{for(const [x,y] of [[key(a),key(b)],[key(b),key(a)]]){if(!graph.has(x))graph.set(x,new Set());graph.get(x).add(y);}};
 for(const r of f.roads)edge(r.a,r.b);
 for(const b of p.bridges){assert(graph.has(key(b.a)));assert(graph.has(key(b.b)));edge(b.a,b.b);}
 const seen=new Set(),queue=[graph.keys().next().value];seen.add(queue[0]);for(let i=0;i<queue.length;i++)for(const n of graph.get(queue[i]))if(!seen.has(n)){seen.add(n);queue.push(n);}
 assert.equal(seen.size,graph.size);
});
test('roads stay on their bank and avoid existing towers',()=>{
 for(const r of f.roads){const bank=p.sectors.find(s=>s.id===r.library);for(let i=0;i<=4;i++){const v=[r.a[0]+(r.b[0]-r.a[0])*i/4,r.a[1]+(r.b[1]-r.a[1])*i/4];assert(contains(bank.polygon,v));assert(!p.parks.some(q=>contains(q.polygon,v)));}for(const t of towers.filter(t=>t.library===r.library))assert(pointSegment([t.x,t.z],r.a,r.b)>=t.r+r.width/2);}
});
test('infill respects road buffers, original skyline and other infill',()=>{
 for(let i=0;i<f.infill.length;i++){const t=f.infill[i],pos=[t.x,t.z],bank=p.sectors.find(s=>s.id===t.library);assert(contains(bank.polygon,pos));assert(f.roads.filter(r=>r.library===t.library).every(r=>pointSegment(pos,r.a,r.b)>=t.r+r.width/2+1-1e-6));assert(towers.every(u=>Math.hypot(t.x-u.x,t.z-u.z)>=t.r+u.r));for(let j=0;j<i;j++){const u=f.infill[j];assert(Math.hypot(t.x-u.x,t.z-u.z)>=t.r+u.r);}}
});
