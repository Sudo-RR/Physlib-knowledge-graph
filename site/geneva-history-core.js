// Compare only source module IDs, explicit import pairs and map paths.
export function summarizeHistory(g){return {revision:g.source.revision,toolchain:g.source.toolchain,modules:g.modules.length,imports:g.modules.reduce((n,m)=>n+m.imports.length,0),maps:g.maps.length,byLibrary:Object.fromEntries(['Physlib','PhyslibAlpha','QuantumInfo'].map(l=>[l,g.modules.filter(m=>m.library===l).length]))};}
export function compareHistory(a,b){
 const diff=(x,y)=>({added:[...y].filter(v=>!x.has(v)).sort(),removed:[...x].filter(v=>!y.has(v)).sort()});
 const edges=g=>new Set(g.modules.flatMap(m=>m.imports.map(i=>JSON.stringify([m.id,i.module]))));
 const e=diff(edges(a),edges(b));
 return {from:a.source.revision,to:b.source.revision,modules:diff(new Set(a.modules.map(m=>m.id)),new Set(b.modules.map(m=>m.id))),maps:diff(new Set(a.maps.map(m=>m.path)),new Set(b.maps.map(m=>m.path))),imports:{added:e.added.map(x=>JSON.parse(x)),removed:e.removed.map(x=>JSON.parse(x))}};
}
