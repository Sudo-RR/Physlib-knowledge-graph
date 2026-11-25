// Art-only, PaperView-inspired subject families. No change to source taxonomy.
export const districtPalette=Object.freeze({
 ClassicalMechanics:'#ffad48',FluidDynamics:'#e7d36a',Optics:'#ffdc9f',
 QuantumMechanics:'#4b9bff',QuantumInformation:'#829eff',CondensedMatter:'#5084c5',
 Relativity:'#bc8aff',SpaceAndTime:'#a9a1f7',Cosmology:'#8855e9',StringTheory:'#d08ce6',
 ClassicalFieldTheory:'#ff9572',Electromagnetism:'#eab84d',QFT:'#e97892',LatticeQFT:'#c75a82',Particles:'#ff775d',
 StatisticalMechanics:'#7bca83',Thermodynamics:'#b5dc66',ProbabilisticTheory:'#46b69a'
});
export const districtAreas=Object.freeze(Object.keys(districtPalette));
export const DISTRICT_SWEEP_HZ=.9;
export function districtColor(area){return districtPalette[area]||null;}
export function districtPhase(id){let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);return (h>>>0)/4294967296;}
export function districtRows(buildings){return buildings.filter(t=>t.id&&t.complexId&&districtColor(t.area)&&!t.id.endsWith('::mathlib-station')).map(t=>({building:t,color:districtColor(t.area),phase:districtPhase(t.id),area:districtAreas.indexOf(t.area)}));}
export function districtMotionAllowed({available,paused,reduced,visible}){return !!available&&!paused&&!reduced&&!!visible;}
