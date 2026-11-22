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
