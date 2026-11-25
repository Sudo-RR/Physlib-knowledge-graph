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
for(const file of ['city.html','mathlib.html','legacy-redirect.js','data/graph.json','data/mathlib.json','data/mathlib-bridge.json','data/geneva-production.json']) {
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
await writeFile(path.join(root,'city-c4.html'),html.replaceAll('href="index.html"','href="city-c4.html"'));
// The old v2 route is a compatibility redirect, not a second UI.
await writeFile(path.join(root,'city-v2.html'),'<!doctype html><meta charset="utf-8"><title>PhysLib City</title><script>location.replace("index.html"+location.search+location.hash)</script><a href="index.html">Open PhysLib City</a>');

// User-approved G1 landing page; retain its explicit URL as an alias.
const g1Bundle=await readFile(path.join(workspace,'site','assets','geneva-g1-bundle.js'));
const g1Name='geneva-g1-bundle.'+createHash('sha256').update(g1Bundle).digest('hex').slice(0,12)+'.js';
await writeFile(path.join(root,'assets',g1Name),g1Bundle);
const g1Html=await readFile(path.join(workspace,'site','geneva-g1.html'),'utf8');
if(!g1Html.includes('assets/geneva-g1-bundle.js'))throw Error('G1 bundle reference missing');
const landingHtml=g1Html.replace('assets/geneva-g1-bundle.js','assets/'+g1Name);
await writeFile(path.join(root,'geneva-g1.html'),landingHtml);
await writeFile(path.join(root,'index.html'),landingHtml);
if(landingHtml.includes('href="city-v2.html"')||landingHtml.includes('href="city-c4.html"'))throw Error('Obsolete explorer exposed in primary navigation');

// Optional declaration snapshots are included only when deliberately generated.
for(const file of ['declarations.json','city-declarations.json','geneva-history.json','geneva-elaborated.json','geneva-elaborated-manifest.json']) {
  try {await stat(path.join(workspace,'site','data',file));await cp(path.join(workspace,'site','data',file),path.join(root,'data',file));} catch(error) {if(error.code!=='ENOENT')throw error;}
}
console.log(`Staged city-only site at ${root}`);
