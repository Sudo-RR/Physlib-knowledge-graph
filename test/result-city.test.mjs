import test from 'node:test';import assert from 'node:assert/strict';import {adaptResultCity} from '../scripts/adapt-result-city.mjs';
test('normalizes result-graph direction and rejects mismatched provenance',()=>{
 const p={source:{revision:'p',toolchain:'t'},modules:[{id:'Physlib.A'}]},m={source:{revision:'m',physlibRevision:'p',toolchain:'t'},modules:[{id:'Mathlib.A'}]};
 const raw={roots:['Physlib.A'],nodes:[{name:'P',module:'Physlib.A',kind:'thm'},{name:'M',module:'Mathlib.A',kind:'thm'}],edges:[{src:'M',tgt:'P',kind:'proof'}]};
 const prov={physlibRevision:'p',mathlibRevision:'m',toolchain:'t',rawSha256:'h',extractorRevision:'2ee55ff6e521eabe71ecddac797e12f64448a5b6',includedPrefixes:['Mathlib'],roots:['Physlib.A']};
 const result=adaptResultCity(raw,p,m,prov,'h');assert.deepEqual(result.edges,[{from:'P',to:'M',kind:'value'}]);assert.equal(result.coverage,'partial');assert.throws(()=>adaptResultCity(raw,p,m,{...prov,mathlibRevision:'wrong'},'h'),/provenance/);
});
