import test from 'node:test';import assert from 'node:assert/strict';
import {allocateGeneva,validateAllocation} from '../site/geneva-production-layout.js';
import {masterplan} from '../site/geneva-g1-geometry.js';
import {demoMassing} from '../site/geneva-g1-massing.js';
import {civicFabric} from '../site/geneva-civic-fabric.js';
test('source allocation covers full representative population, all role IDs and stations',()=>{
 const model={source:{revision:'fixture'},complexes:[['PhyslibAlpha',197],['Physlib',218],['QuantumInfo',18]].flatMap(([library,n])=>Array.from({length:n},(_,i)=>({id:library+'/'+i,library,area:['ClassicalMechanics','QFT','Relativity','QuantumInformation'][i%4],sourceLines:100+i*10,buildings:['data-structure','relations-instances','interface-definition','lemmas-properties','provisional'].slice(0,1+i%5).map(role=>({id:library+'/'+i+'::'+role,role,lines:100,status:'inferred'}))})))};
 const plan=masterplan(),base=demoMassing(plan),fabric=civicFabric(plan,base),layout=allocateGeneva(model,plan,base,fabric);const checks=validateAllocation(model,layout,plan);assert.equal(checks.complexes,433);assert.equal(checks.stations,433);assert.deepEqual(layout,allocateGeneva(model,plan,base,fabric));assert.equal(new Set(layout.sites.map(s=>s.key)).size,433);
});
