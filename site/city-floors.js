// Counts represent indexed declarations, not the total contents of a file.
export function buildFloorIndex(nodes, declarations, pilot) {
  const index=new Map(nodes.map(node=>[node.id,{module:node.id,items:new Map(),coverage:'unavailable'}]));
  for(const entry of declarations?.coverage??[]){const building=index.get(entry.module);if(building)building.coverage=entry.status;}
  for(const d of declarations?.declarations??[]){const building=index.get(d.module);if(building)building.items.set(d.id,{...d,origin:'lean-vouch'});}
  for(const [items,origin] of [[pilot?.declarations??[],'result-graph'],[pilot?.targets??[],'result-graph-target']])for(const d of items){
    const building=index.get(d.module);if(!building)continue;
    const previous=building.items.get(d.id);building.items.set(d.id,{...d,...previous,origin:previous?.origin??origin});
    if(building.coverage==='unavailable')building.coverage='partial';
  }
  for(const building of index.values()){
    building.items=[...building.items.values()].sort((a,b)=>a.id.localeCompare(b.id));
    const count=building.items.length, floorCount=Math.min(count,12);
    building.height=count?1.4+2*Math.log2(count+1):1.4;
    building.floors=Array.from({length:floorCount},(_,i)=>({
      index:i,items:building.items.slice(Math.floor(i*count/floorCount),Math.floor((i+1)*count/floorCount))
    }));
  }
  return index;
}
