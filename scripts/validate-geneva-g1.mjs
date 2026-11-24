import {readFile} from 'node:fs/promises';
import {masterplan,validatePlan,capacity} from '../site/geneva-g1-geometry.js';
import {buildCityV2} from '../site/city-v2-model.js';
const graph=JSON.parse(await readFile('site/data/graph.json','utf8'));const model=buildCityV2(graph,null,{area:'all'});const rows=capacity(model.complexes);if(rows.reduce((n,r)=>n+r.count,0)!==model.complexes.length)throw Error('G1 capacity missed a complex');console.log(JSON.stringify({geometry:masterplan().version,source:graph.source.revision,checks:validatePlan(),capacity:rows},null,2));for(const r of rows)if(r.headroom!==null&&r.headroom<.2)throw Error('G1 insufficient provisional land capacity for '+r.library);
