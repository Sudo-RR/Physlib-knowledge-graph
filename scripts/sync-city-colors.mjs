import {createBoroughManifest} from '../site/city-borough-layout.js';
import {readFile,writeFile} from 'node:fs/promises';
import {buildFullCity} from '../site/city-model.js';
import {buildHierarchy} from '../site/city-hierarchy.js';
import {districtColors,resolveDistrictColors} from '../site/city-colors.js';
const city=buildFullCity(...await Promise.all(['graph','mathlib','mathlib-bridge'].map(async n=>JSON.parse(await readFile(`site/data/${n}.json`,'utf8'))))),keys=buildHierarchy(city.nodes).roots.flatMap(r=>[...r.children.map(d=>d.id),r.id+'/@root']);
const resolved=createBoroughManifest(city,{visual:'c2'}).colorRegistry,added=keys.filter(k=>!districtColors[k]);
// Explicit write step. Never recolours an existing address or writes from the static browser.
if(added.length&&process.argv.includes('--write')){const path='site/city-colors.js',source=await readFile(path,'utf8');await writeFile(path,source.replace(/export const districtColors=\{[\s\S]*?\n\};/,`export const districtColors=${JSON.stringify(resolved,null,2)};`));}
console.log(JSON.stringify({directories:keys.length-3,rootTerritories:3,missing:added,write:process.argv.includes('--write')},null,2));
