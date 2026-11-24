import { cp, mkdir, rm, stat, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Stage only the city, its compatibility redirects, and the required snapshots.
// The output directory is fixed inside this repository's ignored build directory.
const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(workspace,'dist','site');
if(path.dirname(root)!==path.resolve(workspace,'dist'))throw Error('Invalid staging directory.');
await rm(root,{recursive:true,force:true});
await mkdir(path.join(root,'assets'),{recursive:true});
await mkdir(path.join(root,'data'),{recursive:true});
for(const directory of ['models','licenses'])await cp(path.join(workspace,'site','assets',directory),path.join(root,'assets',directory),{recursive:true});
for(const file of ['city.html','mathlib.html','legacy-redirect.js','data/graph.json','data/mathlib.json','data/mathlib-bridge.json']) {
  await cp(path.join(workspace,'site',file),path.join(root,file));
}
// Content-address the bundle so a newly deployed interface is not masked by a
// browser or CDN cache holding the previous version of the stable filename.
const bundle=await readFile(path.join(workspace,'site','assets','city-bundle.js'));
const bundleName=`city-bundle.${createHash('sha256').update(bundle).digest('hex').slice(0,12)}.js`;
await writeFile(path.join(root,'assets',bundleName),bundle);
let html=await readFile(path.join(workspace,'site','index.html'),'utf8');
if(!html.includes('assets/city-bundle.js'))throw Error('City bundle reference missing from index.html');
html=html.replace('assets/city-bundle.js',`assets/${bundleName}`);
for(const file of ['style.css','city.css']){
  const data=await readFile(path.join(workspace,'site',file));
  const name=file.replace('.css',`.${createHash('sha256').update(data).digest('hex').slice(0,12)}.css`);
  if(!html.includes(`href="${file}"`))throw Error(`Stylesheet reference missing: ${file}`);
  html=html.replace(`href="${file}"`,`href="${name}"`);
  await writeFile(path.join(root,name),data);
}
await writeFile(path.join(root,'index.html'),html);
 // Independent opt-in City v2. No changes to the C.4 default page.
 const v2Bundle=await readFile(path.join(workspace,'site','assets','city-v2-bundle.js'));
 const v2Hash=createHash('sha256').update(v2Bundle).digest('hex').slice(0,12);
 const v2Name=`city-v2-bundle.${v2Hash}.js`;
 await writeFile(path.join(root,'assets',v2Name),v2Bundle);
 let v2Html=await readFile(path.join(workspace,'site','city-v2.html'),'utf8');
 if(!v2Html.includes('assets/city-v2-bundle.js'))throw Error('City v2 bundle reference missing');
 v2Html=v2Html.replace('assets/city-v2-bundle.js',`assets/${v2Name}`);
 await writeFile(path.join(root,'city-v2.html'),v2Html);

// Optional declaration snapshots are included only when deliberately generated.
for(const file of ['declarations.json','city-declarations.json']) {
  try {await stat(path.join(workspace,'site','data',file));await cp(path.join(workspace,'site','data',file),path.join(root,'data',file));} catch(error) {if(error.code!=='ENOENT')throw error;}
}
console.log(`Staged city-only site at ${root}`);
