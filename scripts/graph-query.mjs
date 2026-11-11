import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Materialize only source-observed relationships. External targets are names,
// not claims that a declaration or external module exists.
export function graphEdges(graph) {
  return [
    ...graph.modules.flatMap(m=>m.imports.map(i=>({kind:'import',from:m.id,to:i.module,line:i.line,sourcePath:m.path}))),
    ...graph.maps.flatMap(m=>m.references.map(p=>({kind:'api-map-file',from:`map:${m.path}`,to:p,sourcePath:m.path})))
  ];
}
export function queryNode(graph,id) {
  const node=graph.modules.find(m=>m.id===id)||graph.maps.find(m=>`map:${m.path}`===id);
  if(!node)return null;
  const aliases=new Set([id,node.path]);
  const edges=graphEdges(graph).filter(e=>aliases.has(e.from)||aliases.has(e.to));
  return {schemaVersion:graph.schemaVersion,source:graph.source,node,edges};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const [file,id]=process.argv.slice(2);if(!file||!id)throw Error('Usage: node scripts/graph-query.mjs <snapshot.json> <module ID or map:path>');
  const result=queryNode(JSON.parse(await readFile(file,'utf8')),id);if(!result){console.error('Node not found.');process.exitCode=1;}else console.log(JSON.stringify(result,null,2));
}
