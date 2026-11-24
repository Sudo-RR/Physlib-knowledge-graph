import test from 'node:test';
import assert from 'node:assert/strict';
import {genevaLayout,sectorSpecs} from '../site/city-v2-geneva.js';

function fixture(counts){return counts.flatMap((n,i)=>Array.from({length:n},(_,j)=>({id:sectorSpecs[i].library+'/'+j,library:sectorSpecs[i].library,area:'Subject'+j%7})));}
test('every source complex is assigned to exactly one named library sector',()=>{
 const cs=fixture([300,220,30]),g=genevaLayout(cs);
 assert.equal(g.places.size,cs.length);assert.deepEqual(g.sectors.map(x=>x.count),[300,220,30]);
 assert.deepEqual(g.sectors.map(x=>x.name),['Rive Droite','Rive Gauche','Outre-Arve']);
 for(const c of cs)assert.equal(g.places.get(c.id).library,c.library);
 assert.deepEqual([...genevaLayout([...cs].reverse()).places],[...g.places]);
});
test('plot envelopes stay off both rivers for balanced, imbalanced and filtered worlds',()=>{
 for(const counts of [[1,1,1],[300,220,30],[500,1,1],[1,500,1],[1,1,500],[0,0,1],[0,1,0],[1,0,0],[0,0,0]]){
  const g=genevaLayout(fixture(counts));
  for(const p of g.places.values())for(const x of [p.x-64,p.x,p.x+64]){
   const lo=g.rhone(x)-g.rhoneWidth(x),hi=g.rhone(x)+g.rhoneWidth(x),arveLo=g.arve(x)-g.arveWidth(x),arveHi=g.arve(x)+g.arveWidth(x);
   const clearance=p.library==='PhyslibAlpha'?lo-p.z-64:p.library==='Physlib'?Math.min(p.z-64-hi,arveLo-p.z-64):p.z-64-arveHi;
   assert(clearance>0,p.id+' intersects a river');
  }
  assert(Number.isFinite(g.maxX)&&Number.isFinite(g.maxZ));
 }
});
test('civic bridges span their corresponding rivers and land on quays',()=>{
 const g=genevaLayout(fixture([300,220,30]));
 assert.equal(g.bridges.length,5);
 for(const b of g.bridges){const river=b.river==='Rhône'?g.rhone:g.arve,half=b.river==='Rhône'?g.rhoneWidth:g.arveWidth;assert(b.z1<river(b.x)-half(b.x));assert(b.z2>river(b.x)+half(b.x));}
});
test('unknown source libraries are rejected instead of silently misplaced',()=>{
 assert.throws(()=>genevaLayout([{id:'Unknown',library:'Unknown',area:'Other'}]),/Unknown source library/);
});
