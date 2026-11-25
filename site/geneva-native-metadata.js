// Lazy, hash-checked native module shards, bound to the currently indexed graph.
const keys=['physlibRevision','mathlibRevision','toolchain','extractorRevision','rawSha256'];
export function unpackNativeShard(shard,module,expected){
 if(shard?.schemaVersion!==1||shard.module!==module||!Array.isArray(shard.refs)||!Array.isArray(shard.rows)||shard.rows.length!==expected.length)throw Error('Invalid native shard');
 const wanted=new Set(expected),refs=shard.refs.map(x=>{if(!Array.isArray(x)||x.length!==2||typeof x[0]!=='string'||typeof x[1]!=='string')throw Error('Invalid native reference');return {id:x[0],module:x[1]};}),out=new Map();
 const resolve=xs=>{if(!Array.isArray(xs)||xs.some(i=>!Number.isInteger(i)||i<0||i>=refs.length))throw Error('Invalid native reference index');return xs.map(i=>refs[i]);};
 for(const r of shard.rows){if(!Array.isArray(r)||r.length!==6||!wanted.has(r[0])||out.has(r[0])||!(r[1]===null||typeof r[1]==='string')||typeof r[3]!=='boolean')throw Error('Invalid native identity');const range=r[2];if(range!==null&&(!range||!['line','column','endLine','endColumn'].every(k=>Number.isInteger(range[k])&&range[k]>=0)||range.line<1||range.endLine<range.line||(range.endLine===range.line&&range.endColumn<range.column)))throw Error('Invalid native range');const type=resolve(r[4]),value=resolve(r[5]);if(!r[3]&&value.length)throw Error('Unavailable value has references');out.set(r[0],{statement:r[1],range,directReferences:{type,value,valueAvailable:r[3]}});}
 return out;
}
export function nativeLoader(index){
 let manifest=null;const cache=new Map(),pending=new Map();
 async function loadManifest(){if(!manifest)manifest=(async()=>{const r=await fetch('data/geneva-native/manifest.json',{cache:'no-cache'});if(r.status===404)return null;if(!r.ok)throw Error('Native manifest HTTP '+r.status);const m=await r.json();if(m.schemaVersion!==1||keys.some(k=>typeof m.source?.[k]!=='string'||m.source[k]!==index.source[k])||!m.modules||m.counts?.matched!==index.local.size)throw Error('Native manifest incompatible with current graph');return m;})().catch(e=>{manifest=null;throw e;});return manifest;}
 async function moduleRows(module){
  if(cache.has(module)){const rows=cache.get(module);cache.delete(module);cache.set(module,rows);return rows;}
  if(pending.has(module))return pending.get(module);
  const task=(async()=>{const m=await loadManifest();if(!m)return null;const rec=Object.hasOwn(m.modules,module)?m.modules[module]:null;if(!rec)return null;if(!/^[a-f0-9]{64}$/.test(rec.sha256)||!Number.isInteger(rec.bytes)||rec.bytes<1||rec.bytes>24*1024*1024)throw Error('Invalid native shard manifest entry');
   const expected=(index.modules.get(module)||[]).map(d=>d.id);if(expected.length!==rec.count)throw Error('Native module coverage mismatch');
   const r=await fetch('data/geneva-native/'+rec.sha256+'.json');if(!r.ok)throw Error('Native shard HTTP '+r.status);const bytes=await r.arrayBuffer();if(bytes.byteLength!==rec.bytes)throw Error('Native shard length mismatch');
   if(!globalThis.crypto?.subtle)throw Error('Secure context required to verify native shard');const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');if(digest!==rec.sha256)throw Error('Native shard integrity mismatch');
   const rows=unpackNativeShard(JSON.parse(new TextDecoder().decode(bytes)),module,expected);cache.set(module,rows);while(cache.size>8)cache.delete(cache.keys().next().value);return rows;
  })().finally(()=>pending.delete(module));pending.set(module,task);return task;
 }
 return async row=>{if(row.directReferences)return {statement:row.statement,range:row.range,directReferences:row.directReferences};return (await moduleRows(row.module))?.get(row.id)||null;};
}
