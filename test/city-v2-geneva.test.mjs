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

test('seeded irregular placement is reproducible, changes with seed, and keeps plot clearance',()=>{
 const cs=fixture([300,220,30]),g=genevaLayout(cs,{seed:'geneva-1'}),again=genevaLayout(cs,{seed:'geneva-1'}),other=genevaLayout(cs,{seed:'geneva-2'});
 assert.deepEqual([...g.places],[...again.places]);
 assert.notDeepEqual([...g.places],[...other.places]);
 for(const world of [g,other]){
  const ps=[...world.places.values()];
  for(let i=0;i<ps.length;i++)for(let j=0;j<i;j++)if(ps[i].library===ps[j].library)assert(Math.max(Math.abs(ps[i].x-ps[j].x),Math.abs(ps[i].z-ps[j].z))>=136-1e-8);
  for(const p of ps)for(const x of [p.x-64,p.x,p.x+64]){
   const lo=world.rhone(x)-world.rhoneWidth(x),hi=world.rhone(x)+world.rhoneWidth(x),al=world.arve(x)-world.arveWidth(x),ah=world.arve(x)+world.arveWidth(x);
   assert((p.library==='PhyslibAlpha'?lo-p.z-64:p.library==='Physlib'?Math.min(p.z-64-hi,al-p.z-64):p.z-64-ah)>0);
  }
 }
});

import {buildCityV2} from '../site/city-v2-model.js';
test('the complete source graph including library root files can start the Geneva renderer',()=>{
 const graph={source:{revision:'fixture',toolchain:'fixture'},modules:sectorSpecs.flatMap(s=>[
 {id:s.library,path:s.library+'.lean',library:s.library,lineCount:1,imports:[]},
 {id:s.library+'.ClassicalMechanics.Basic',path:s.library+'/ClassicalMechanics/Basic.lean',library:s.library,lineCount:10,imports:[]}
 ])};
 const model=buildCityV2(graph,null,{area:'all'}),city=genevaLayout(model.complexes);
 assert.equal(city.places.size,model.complexes.length);
 assert.equal(city.sectors.reduce((n,s)=>n+s.count,0),model.complexes.length);
 for(const c of model.complexes)assert(sectorSpecs.some(s=>s.library===c.library));
});
