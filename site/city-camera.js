// Camera framing is based on both dimensions of the viewport.
export function fitDistance(width, height, depth, verticalFovDegrees, aspect, padding = 1.35) {
  const vertical = verticalFovDegrees * Math.PI / 180;
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * Math.max(.1, aspect));
  return Math.max(height / (2 * Math.tan(vertical / 2)), width / (2 * Math.tan(horizontal / 2))) * padding + depth / 2;
}

// A single generous rectangle avoids the gaps and snapping of separate circular zones.
export function cityBounds(zones, margin = 100) {
  if (!zones.length) return { minX: -margin, maxX: margin, minZ: -margin, maxZ: margin };
  return {
    minX: Math.min(...zones.map(z => z.x - z.radius)) - margin,
    maxX: Math.max(...zones.map(z => z.x + z.radius)) + margin,
    minZ: Math.min(...zones.map(z => z.z - z.radius)) - margin,
    maxZ: Math.max(...zones.map(z => z.z + z.radius)) + margin
  };
}

// Fit all eight box corners to a perspective viewport from a given direction.
// The direction points from the box centre toward the camera.
export function fitBox(box, direction, verticalFovDegrees, aspect, padding = 1.15) {
  const length = Math.hypot(direction.x, direction.y, direction.z);
  if (!length) throw Error('Camera direction must be nonzero');
  const d = {x:direction.x/length,y:direction.y/length,z:direction.z/length};
  const horizontalLength = Math.hypot(d.x,d.z);
  const right = horizontalLength > 1e-8 ? {x:d.z/horizontalLength,y:0,z:-d.x/horizontalLength} : {x:1,y:0,z:0};
  const up = {x:d.y*right.z-d.z*right.y,y:d.z*right.x-d.x*right.z,z:d.x*right.y-d.y*right.x};
  const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
  const centre={x:(box.min.x+box.max.x)/2,y:(box.min.y+box.max.y)/2,z:(box.min.z+box.max.z)/2};
  const tanV=Math.tan(verticalFovDegrees*Math.PI/360),tanH=tanV*Math.max(.1,aspect);
  let distance=0;
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
    const p={x:x-centre.x,y:y-centre.y,z:z-centre.z};
    distance=Math.max(distance,dot(p,d)+Math.abs(dot(p,right))/tanH,dot(p,d)+Math.abs(dot(p,up))/tanV);
  }
  return {centre,distance:Math.max(5,distance*padding)};
}

// A spatial grid keeps camera clearance checks local even in the full city.
// Boxes are real rendered file footprints; the index never changes graph data.
export function createCollisionGrid(boxes, cellSize = 6) {
  const cells = new Map();
  for (const box of boxes) {
    for(let x=Math.floor(box.min.x/cellSize);x<=Math.floor(box.max.x/cellSize);x++)
      for(let z=Math.floor(box.min.z/cellSize);z<=Math.floor(box.max.z/cellSize);z++) {
        const key=`${x},${z}`;
        if(!cells.has(key))cells.set(key,[]);
        cells.get(key).push(box);
      }
  }
  return {cells,cellSize};
}

export function cameraClearance(point, grid, layer, margin = .18) {
  const result={x:point.x,y:point.y,z:point.z},cx=Math.floor(point.x/grid.cellSize),cz=Math.floor(point.z/grid.cellSize),nearby=new Set();
  for(let x=cx-1;x<=cx+1;x++)for(let z=cz-1;z<=cz+1;z++)
    for(const box of grid.cells.get(`${x},${z}`)||[])if(box.layer===layer&&point.y>=box.min.y&&point.y<=box.max.y)nearby.add(box);
  const boxes=[...nearby].map(box=>({minX:box.min.x-margin,maxX:box.max.x+margin,minZ:box.min.z-margin,maxZ:box.max.z+margin}));
  const blocked=(x,z)=>boxes.some(box=>x>box.minX&&x<box.maxX&&z>box.minZ&&z<box.maxZ);
  if(!blocked(point.x,point.z))return result;
  // A candidate can lie at the intersection of two boundaries: this handles
  // overlapping clearances without bouncing between neighbouring buildings.
  const xs=[point.x,...boxes.flatMap(box=>[box.minX,box.maxX])],zs=[point.z,...boxes.flatMap(box=>[box.minZ,box.maxZ])];
  let best=null;
  for(const x of xs)for(const z of zs){
    const distance=(x-point.x)**2+(z-point.z)**2;
    if((!best||distance<best.distance)&&!blocked(x,z))best={x,z,distance};
  }
  return best?{x:best.x,y:point.y,z:best.z}:result;
}

// Prefer the selected file's recorded cross-library import; otherwise use the
// geographically closest file in the destination layer.
export function layerDestination(buildings, pipelines, selected, underground, target) {
  const direct=underground
    ? pipelines.find(edge=>edge.from===selected)?.to
    : pipelines.find(edge=>edge.to===selected)?.from;
  if(direct&&buildings.has(direct)&&(buildings.get(direct).direction<0)===underground)return direct;
  let destination=null,distance=Infinity;
  for(const [id,building] of buildings) {
    if((building.direction<0)!==underground)continue;
    const dx=building.group.position.x-target.x,dz=building.group.position.z-target.z,d=dx*dx+dz*dz;
    if(d<distance){distance=d;destination=id;}
  }
  return destination;
}
