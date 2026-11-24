import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {buildCityV2} from '../site/city-v2-model.js';
import {genevaLayout} from '../site/city-v2-geneva.js';
const graph=JSON.parse(await readFile('site/data/graph.json','utf8'));
const declarations=JSON.parse(await readFile('site/data/declarations.json','utf8'));
const all=buildCityV2(graph,declarations,{area:'all'});
for(const area of ['all',...all.areas]){
 const city=buildCityV2(graph,declarations,{area}),layout=genevaLayout(city.complexes);
 assert.equal(layout.places.size,city.complexes.length);
 for(const c of city.complexes)assert.equal(layout.places.get(c.id)?.library,c.library);
 console.log(area+': '+city.complexes.length+' complexes successfully placed');
}
