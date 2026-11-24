import {readFile,writeFile} from 'node:fs/promises';
import {buildFullCity} from '../site/city-model.js';
import {createBoroughManifest} from '../site/city-borough-layout.js';
import {fitBox} from '../site/city-camera.js';
const city=buildFullCity(...await Promise.all(['graph','mathlib','mathlib-bridge'].map(async n=>JSON.parse(await readFile(`site/data/${n}.json`,'utf8'))))),old=createBoroughManifest(city,{visual:'c1'}),next=createBoroughManifest(city,{visual:'c2'}),captures=[];
const url=(visual,query)=>`http://127.0.0.1:4173/?visual=${visual}&${query}`;
for(const [name,path] of [['world',null],['physlib','Physlib'],['units','Physlib/Units'],['mechanics','Physlib/ClassicalMechanics'],['withdim','Physlib/Units/WithDim']]){
 const get=m=>!path?{bounds:m.bounds}:m.boroughs.find(b=>b.id===path)||m.parcels.find(p=>p.id===path),a=get(old).bounds,b=get(next).bounds,w=Math.max(a.maxX-a.minX,b.maxX-b.minX),d=Math.max(a.maxZ-a.minZ,b.maxZ-b.minZ),fit=fitBox({min:{x:-w/2,y:0,z:-d/2},max:{x:w/2,y:42,z:d/2}},{x:0,y:.9,z:1},40,956/476,1.08),length=Math.hypot(.9,1),offset=[0,fit.distance*.9/length,fit.distance/length];
 for(const [visual,m] of [['c1',old],['c2',next]]){const bounds=get(m).bounds,target=!path?[(next.bounds.maxX+next.bounds.minX)/2,21,(next.bounds.maxZ+next.bounds.minZ)/2]:[(bounds.minX+bounds.maxX)/2,21,(bounds.minZ+bounds.maxZ)/2],pose={target,position:target.map((v,i)=>v+offset[i])};captures.push({name:`${visual==='c1'?'before':'after'}-${name}-matched`,url:url(visual,`benchSize=956,476${path?'&folder='+path:''}&reviewPose=${encodeURIComponent(JSON.stringify(pose))}`),pose,fov:40,canvas:[956,476],viewport:[1536,791],match:path?'Identical target-relative direction, distance and height; changed-layout territory centres':'Identical absolute world pose'});}
}
for(const visual of ['c1','c2'])captures.push({name:`${visual==='c1'?'before':'after'}-selected-matched`,url:url(visual,'benchSize=956,476&node=Physlib.Units.ISQDimensionBase&reviewOffset=35,30,7'),match:'Identical module-relative offset, target height, FOV and canvas'});
await writeFile('docs/screenshots/milestone-c2/capture-plan.json',JSON.stringify(captures,null,2));console.log(captures.length+' comparison captures planned');
