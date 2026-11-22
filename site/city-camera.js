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
