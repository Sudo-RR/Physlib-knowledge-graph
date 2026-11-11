import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Exploratory connected components of modules that share at least two non-hub
// local imports. This is similarity of imports, not declaration or topic identity.
export function clusterModules(graph, { maxImporters = 25, maxImports = 50, minShared = 2 } = {}) {
  const modules = new Map(graph.modules.map(m => [m.id, m]));
  const reverse = new Map();
  for (const m of graph.modules) {
    if (m.imports.length >= maxImports) continue;
    for (const target of new Set(m.imports.map(i => i.module))) {
      if (!modules.has(target)) continue;
      if (!reverse.has(target)) reverse.set(target, []);
      reverse.get(target).push(m.id);
    }
  }
  const pairs = new Map();
  for (const [target, importers] of reverse) {
    if (importers.length > maxImporters) continue;
    importers.sort();
    for (let i=0;i<importers.length;i++) for (let j=i+1;j<importers.length;j++) {
      const key=JSON.stringify([importers[i],importers[j]]);
      if (!pairs.has(key)) pairs.set(key, []);
      pairs.get(key).push(target);
    }
  }
  const neighbors=new Map(), evidence=[];
  for (const [key, shared] of pairs) if (shared.length>=minShared) {
    const [a,b]=JSON.parse(key);
    for(const [x,y] of [[a,b],[b,a]]) { if(!neighbors.has(x))neighbors.set(x,[]);neighbors.get(x).push(y); }
    evidence.push({ modules:[a,b], sharedImports:shared.sort() });
  }
  const groups=[], seen=new Set();
  for(const start of [...neighbors.keys()].sort()) if(!seen.has(start)) {
    const queue=[start];seen.add(start);
    for(let i=0;i<queue.length;i++)for(const next of neighbors.get(queue[i]))if(!seen.has(next)){seen.add(next);queue.push(next);}
    groups.push(queue.sort());
  }
  groups.sort((a,b)=>b.length-a.length||a[0].localeCompare(b[0]));
  return { parameters:{maxImporters,maxImports,minShared}, groups, evidence };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const graph=JSON.parse(await readFile(process.argv[2]||'site/data/graph.json','utf8'));
  console.log(JSON.stringify({ source:graph.source, ...clusterModules(graph) },null,2));
}
