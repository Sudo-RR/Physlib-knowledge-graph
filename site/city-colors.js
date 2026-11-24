// Geographic addresses only. These colours say nothing about proofs or scientific rank.
export const colorRegistryVersion=1;
export const boroughColors={Physlib:'#13a8a5',PhyslibAlpha:'#d9527c',QuantumInfo:'#7956c7'};
export const districtColors={
 'Physlib/@root':'#197789',
 'Physlib/ClassicalFieldTheory':'#3883aa','Physlib/ClassicalMechanics':'#e85d4b',
 'Physlib/CondensedMatter':'#23a798','Physlib/Cosmology':'#ac71d1',
 'Physlib/Electromagnetism':'#298cce','Physlib/FluidDynamics':'#257c9c',
 'Physlib/LatticeQFT':'#b5962d','Physlib/Mathematics':'#35946d',
 'Physlib/Meta':'#667f93','Physlib/Optics':'#e17e99',
 'Physlib/Particles':'#c56832','Physlib/ProbabilisticTheory':'#72a13e',
 'Physlib/QFT':'#7852a4','Physlib/QuantumMechanics':'#6679d7',
 'Physlib/Relativity':'#c84d87','Physlib/SpaceAndTime':'#4869ae',
 'Physlib/StatisticalMechanics':'#a1ab31','Physlib/StringTheory':'#a74465',
 'Physlib/Thermodynamics':'#ec8b39','Physlib/Units':'#efbc29',
 'PhyslibAlpha/@root':'#b53764',
 'PhyslibAlpha/ClassicalFieldTheory':'#d87d52','PhyslibAlpha/ClassicalMechanics':'#bb685f',
 'PhyslibAlpha/CondensedMatter':'#55a8ad','PhyslibAlpha/Electromagnetism':'#78a4d5',
 'PhyslibAlpha/Mathematics':'#8c64aa','PhyslibAlpha/Particles':'#c09a36',
 'PhyslibAlpha/ProbabilisticTheory':'#acbd5d','PhyslibAlpha/QuantumMechanics':'#c35aaf',
 'PhyslibAlpha/Relativity':'#db5b71','PhyslibAlpha/SpaceAndTime':'#5396bc',
 'QuantumInfo/@root':'#5e4a99',
 'QuantumInfo/Capacity':'#40a5bf','QuantumInfo/Channels':'#8871ce',
 'QuantumInfo/ClassicalInfo':'#d99e58','QuantumInfo/Entropy':'#a571c0',
 'QuantumInfo/ForMathlib':'#599a95','QuantumInfo/Measurements':'#a8ad58',
 'QuantumInfo/Operators':'#d179a0','QuantumInfo/ResourceTheory':'#6578a1',
 'QuantumInfo/States':'#4ea1d0'
};
export const geographicPatterns=['portico','observatory','fin-array','orbital-gate'];
const srgb=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
const channels=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export function mixColor(a,b,t){return '#'+channels(a).map((v,i)=>Math.round((v*(1-t)+channels(b)[i]*t)*255).toString(16).padStart(2,'0')).join('');}
export function contrast(a,b){const lum=h=>channels(h).map(srgb).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0),x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function oklab(hex){const [r,g,b]=channels(hex).map(srgb),l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];}
export const colorDistance=(a,b)=>Math.hypot(...oklab(a).map((v,i)=>v-oklab(b)[i]));
export function districtAddress(path){const a=path.replaceAll('\\','/').split('/');return a.length>2?a.slice(0,2).join('/'):a.length===2&&!a[1].endsWith('.lean')?a.join('/'):a[0].replace(/\.lean$/,'')+'/@root';}
/** New keys only: select the palette swatch farthest from supplied adjacent assignments. */
export function resolveDistrictColors(keys,{existing=districtColors,neighbors={}}={}){
 const resolved={...existing};for(const key of keys.slice().sort()){if(resolved[key])continue;const nearby=(neighbors[key]||[]).map(id=>resolved[id]).filter(Boolean),candidates=Object.values(districtColors);resolved[key]=candidates.reduce((best,c)=>{const score=nearby.length?Math.min(...nearby.map(n=>colorDistance(c,n))):Math.min(...Object.values(resolved).map(n=>colorDistance(c,n)));return !best||score>best.score?{color:c,score}:best;},null).color;}return resolved;
}
export function districtIdentity(path,{registry=districtColors,composition='vivid',depth=1}={}){
 const key=path.includes('/@root')?path:districtAddress(path),primary=registry[key]||resolveDistrictColors([key],{existing:registry})[key],borough=key.split('/')[0],index=Object.keys(registry).indexOf(key),pattern=geographicPatterns[((index%4)+4)%4]+'-'+(1+Math.floor(index/4)%3)+'-'+(1+Math.floor(index/12));
 return {key,primary,ground:mixColor(primary,'#fff2d8',composition==='porcelain'?.70:.32),neighborhood:mixColor(primary,'#fff2d8',.38+Math.min(5,depth)*.025),dark:mixColor(primary,'#17243a',.55),text:contrast(primary,'#ffffff')>contrast(primary,'#000000')?'#ffffff':'#000000',borough:boroughColors[borough],pattern,finCount:1+Math.floor(index/4)%3,bands:1+Math.floor(index/12),version:colorRegistryVersion};
}
