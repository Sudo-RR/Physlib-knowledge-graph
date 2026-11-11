import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { graphEdges } from './graph-query.mjs';

export function compareSnapshots(before,after){
  if(before.schemaVersion!==after.schemaVersion)throw Error('Snapshots have incompatible schema versions.');
  const keys=g=>({modules:new Set(g.modules.map(m=>m.id)),maps:new Set(g.maps.map(m=>m.path)),edges:new Set(graphEdges(g).map(e=>JSON.stringify([e.kind,e.from,e.to])))});
  const a=keys(before),b=keys(after);const changes={};
  for(const key of Object.keys(a)){changes[key]={added:[...b[key]].filter(x=>!a[key].has(x)).sort(),removed:[...a[key]].filter(x=>!b[key].has(x)).sort()};}
  return {before:before.source.revision,after:after.source.revision,changes,limitations:'Names and paths are snapshot identities; renames appear as removal and addition. Declaration statements are not indexed.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const [left,right]=process.argv.slice(2);if(!left||!right)throw Error('Usage: node scripts/diff-snapshots.mjs <before.json> <after.json>');
  const before=JSON.parse(await readFile(left,'utf8')),after=JSON.parse(await readFile(right,'utf8'));console.log(JSON.stringify(compareSnapshots(before,after),null,2));
}
