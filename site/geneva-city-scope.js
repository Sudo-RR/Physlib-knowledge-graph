// Presentation projection only: the complete canonical source snapshot is retained.
export const excludedArea='SharedFoundations';
export function visibleCity(layout){
 if(!layout)return layout;
 const sites=layout.sites.filter(t=>t.area!==excludedArea),ids=new Set(sites.map(t=>t.id));
 return {...layout,sites,buildings:layout.buildings.filter(t=>ids.has(t.complexId)),stations:layout.stations.filter(t=>ids.has(t.complexId)),boroughs:layout.boroughs.filter(t=>t.area!==excludedArea)};
}
export function visibleComplex(c){return c?.area!==excludedArea;}
