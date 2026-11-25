// Experimental elaborated graph contract. Never merge with lexical IDs by guessing.
export const RESULT_REVISION='2ee55ff6e521eabe71ecddac797e12f64448a5b6';
export const PILOT_ROOTS=['Physlib.ClassicalMechanics.EulerLagrange','Physlib.ClassicalMechanics.HamiltonianMechanics.Basic','Physlib.ClassicalMechanics.HamiltonianMechanics.PoissonBracket'];
export const PREFIXES=['Mathlib.Analysis.Calculus'];
export const FULL_ROOTS=['Physlib','PhyslibAlpha','QuantumInfo'];
// JSON spellings from ResultGraph/Basic.lean Kind.toString, not constructor names.
const kinds=new Set(['thm','def','inductive','ctor','axiom','opaque','rec','quot']);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const within=(m,p)=>m===p||m.startsWith(p+'.');
export function normalizePilot(raw,graph,provenance){
 if(provenance.extractorRevision!==RESULT_REVISION||provenance.physlibRevision!==graph.source.revision||provenance.toolchain!==graph.source.toolchain||!provenance.mathlibRevision||!/^[a-f0-9]{64}$/.test(provenance.rawSha256))throw Error('Incompatible provenance');
 if(!Array.isArray(raw.nodes)||!Array.isArray(raw.edges)||!same(raw.roots,provenance.roots)||!([PILOT_ROOTS,FULL_ROOTS].some(roots=>same(provenance.roots,roots)))||!same(provenance.includedPrefixes,PREFIXES)||!same(provenance.flags,['--private','--auto']))throw Error('Unexpected result-graph scope or flags');
 const modules=new Map(graph.modules.map(m=>[m.id,m])),roots=provenance.roots,nodes=new Map();
 const scoped=m=>roots.some(p=>within(m,p));
 const full=same(roots,FULL_ROOTS);
 for(const n of raw.nodes){
  if(typeof n.name!=='string'||!n.name||typeof n.module!=='string'||!kinds.has(n.kind)||nodes.has(n.name))throw Error('Invalid or duplicate elaborated declaration: '+JSON.stringify({name:n.name,module:n.module,kind:n.kind}));
  if(!scoped(n.module)&&!PREFIXES.some(p=>within(n.module,p)))throw Error('Unexpected module '+n.module);
  if(scoped(n.module)&&!modules.has(n.module))throw Error('Unindexed source module '+n.module);
  for(const key of ['isPrivate','isUnsafe','hasSorry','sorryTainted','axiomTainted'])if(n[key]!==undefined&&typeof n[key]!=='boolean')throw Error('Invalid '+key+' for '+n.name);
  if(n.customAxioms!==undefined&&(!Array.isArray(n.customAxioms)||n.customAxioms.some(x=>typeof x!=='string')))throw Error('Invalid axiom list');
  nodes.set(n.name,{id:n.name,module:n.module,kind:n.kind,library:scoped(n.module)?(modules.get(n.module).library||n.module.split('.')[0]):'Mathlib',statement:null,line:null,isPrivate:n.isPrivate??null,isUnsafe:n.isUnsafe??null,hasSorry:n.hasSorry??null,sorryTainted:n.sorryTainted??null,customAxioms:n.customAxioms??null,axiomTainted:n.axiomTainted??null});
 }
 const dependencies=[],seen=new Set();
 for(const e of raw.edges){
  const from=nodes.get(e.tgt),to=nodes.get(e.src);
  if(!from||!to||!['statement','proof'].includes(e.kind)||from.id===to.id)throw Error('Invalid dependency endpoint or type');
  if(!scoped(from.module))continue;
  // Producer's "proof" means value-only, even for definitions and opaque constants.
  // --private --auto still excludes internal-detail names, hence paths may be routed.
  const kind=e.kind==='statement'?'statement':from.kind==='thm'?'theorem-proof-or-routed':'value-or-routed';
  const key=JSON.stringify([from.id,to.id,kind]);if(seen.has(key))continue;seen.add(key);
  dependencies.push({from:from.id,to:to.id,kind,producerKind:e.kind,directness:'unknown-or-routed'});
 }
 const declarations=[...nodes.values()].filter(n=>scoped(n.module));
 const referenced=new Set(dependencies.map(e=>e.to));
 const externalTargets=[...nodes.values()].filter(n=>!scoped(n.module)&&referenced.has(n.id));
 const counts=new Map();for(const n of declarations)counts.set(n.module,(counts.get(n.module)||0)+1);
 const coverage=[...modules.keys()].filter(scoped).sort().map(module=>({module,status:counts.has(module)?'partial':'not-recorded',count:counts.get(module)||0}));
 if(!declarations.length||(!full&&roots.some(m=>!counts.has(m)))||(full&&roots.some(root=>!declarations.some(n=>within(n.module,root)))))throw Error('Missing extraction root declarations');
 return {schemaVersion:1,format:'physlib-elaborated-pilot',source:{...provenance,method:'result-graph elaborated expression references; scoped and potentially contracted'},coverage,declarations,externalTargets,dependencies};
}
export function summarizePilot(snapshot,lexical){
 const counts={};for(const e of snapshot.dependencies)counts[e.kind]=(counts[e.kind]||0)+1;
 const external=new Set(snapshot.externalTargets.map(n=>n.id));
 const grouped=new Map(),lexGrouped=new Map();for(const d of snapshot.declarations){if(!grouped.has(d.module))grouped.set(d.module,[]);grouped.get(d.module).push(d);}for(const d of lexical.declarations){if(!lexGrouped.has(d.module))lexGrouped.set(d.module,[]);lexGrouped.get(d.module).push(d);}
 const roots=snapshot.coverage.map(c=>{
  const records=grouped.get(c.module)||[],lex=lexGrouped.get(c.module)||[];
  // Short-name comparison is diagnostic only: not identity resolution or recall.
  const short=id=>id.split('.').at(-1),matches=lex.map(d=>{const name=d.id.split(':').at(-1);return {lexicalId:d.id,candidates:records.filter(r=>short(r.id)===short(name)).map(r=>r.id)};});
  return {module:c.module,elaboratedRecords:records.length,lexicalRecords:lex.length,uniqueShortNameCandidates:matches.filter(x=>x.candidates.length===1).length,ambiguousShortNameCandidates:matches.filter(x=>x.candidates.length>1).length,noShortNameCandidate:matches.filter(x=>!x.candidates.length).length,matches};
 });
 return {source:snapshot.source,roots,totals:{declarations:snapshot.declarations.length,externalTargets:snapshot.externalTargets.length,dependencies:snapshot.dependencies.length,modulesWithRecords:snapshot.coverage.filter(c=>c.count>0).length,scopedModules:snapshot.coverage.length},dependenciesByKind:counts,crossLibraryDependencies:snapshot.dependencies.filter(e=>external.has(e.to)).length,withinPilotDependencies:snapshot.dependencies.filter(e=>!external.has(e.to)).length,limitations:['Scoped to the recorded roots and Mathlib.Analysis.Calculus; Mathlib and filtered declaration coverage are incomplete.','Internal-detail nodes may be contracted; directness is unknown.','Statement text and source locations are not exported by this producer.','Short-name comparisons do not resolve declaration identities or estimate recall.']};
}
