import { cp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Stage only the city, its compatibility redirects, and the required snapshots.
// The output directory is fixed inside this repository's ignored build directory.
const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(workspace,'dist','site');
if(path.dirname(root)!==path.resolve(workspace,'dist'))throw Error('Invalid staging directory.');
await rm(root,{recursive:true,force:true});
await mkdir(path.join(root,'assets'),{recursive:true});
await mkdir(path.join(root,'data'),{recursive:true});
for(const file of ['index.html','city.html','mathlib.html','legacy-redirect.js','city.css','style.css','assets/city-bundle.js','data/graph.json','data/mathlib.json','data/mathlib-bridge.json']) {
  await cp(path.join(workspace,'site',file),path.join(root,file));
}
// Optional declaration snapshots are included only when deliberately generated.
for(const file of ['declarations.json','city-declarations.json']) {
  try {await stat(path.join(workspace,'site','data',file));await cp(path.join(workspace,'site','data',file),path.join(root,'data',file));} catch(error) {if(error.code!=='ENOENT')throw error;}
}
console.log(`Staged city-only site at ${root}`);
