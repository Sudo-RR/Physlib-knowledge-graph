// Presentation-only helpers. No new mathematical entities or relationships.
export const roleKeys=Object.freeze({
 'data-structure':{code:'D',label:'Data structures'},
 'relations-instances':{code:'R',label:'Relations & instances'},
 'interface-definition':{code:'I',label:'Interface definitions'},
 'lemmas-properties':{code:'L',label:'Lemmas & properties'},
 provisional:{code:'?',label:'Unclassified source'}
});
export const channels=Object.freeze({out:'#ef5d9f',in:'#ffc16f',mathlib:'#3ce4d5',declarationOut:'#80deff',declarationIn:'#b4f28b'});
export function visibleModuleLinks(edges,selected,channel,filter,sites,limit=14){
 const result={out:[],in:[],totalOut:0,totalIn:0};
 for(const direction of ['out','in']){
  if(channel!=='both'&&channel!==direction)continue;
  const matches=edges.filter(e=>direction==='out'?e.from===selected:e.to===selected).filter(e=>sites.has(e.from)&&sites.has(e.to)&&(filter==='all'||(sites.get(e.from).area===filter&&sites.get(e.to).area===filter)));
  result[direction==='out'?'totalOut':'totalIn']=matches.length;
  result[direction]=matches.slice(0,limit);
 }
 return result;
}
export function stationEvidence(complex){
 const targets=complex?.mathlib||[];
 return {active:targets.length>0,count:targets.length,sourceModules:new Set(targets.flatMap(t=>t.sourceModules||[]))};
}
export function stationRoleLinks(complex,buildings){
 const evidence=stationEvidence(complex),roles=new Map((complex?.buildings||[]).map(b=>[b.id,b]));
 return buildings.filter(b=>b.complexId===complex?.id&&roles.get(b.id)?.moduleIds.some(m=>evidence.sourceModules.has(m)));
}
