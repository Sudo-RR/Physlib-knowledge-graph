// Selected routes and markers are ephemeral; each owns its geometry and
// material. Releasing them on selection changes keeps GPU allocations bounded.
export function clearDisposableGroup(group) {
  const geometries=new Set(),materials=new Set();
  for(const object of group.children){
    if(object.geometry)geometries.add(object.geometry);
    for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)materials.add(material);
    object.dispose?.(); // InstancedMesh owns instance GPU buffers separately.
  }
  for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();
  group.clear();
}

// Instance wrappers own their LOD attributes; the GLB cache owns shared vertex
// and index attributes. Strip only shared references before releasing wrappers.
export function clearCachedArt(group,template){
  const cachedGeometry=new Set(),cachedAttributes=new Set(),cachedMaterials=new Set();
  template.traverse(object=>{if(object.geometry){cachedGeometry.add(object.geometry);for(const attribute of Object.values(object.geometry.attributes))cachedAttributes.add(attribute);if(object.geometry.index)cachedAttributes.add(object.geometry.index);}for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)cachedMaterials.add(material);});
  const geometries=new Set(),materials=new Set();
  group.traverse(object=>{object.dispose?.();if(object.geometry)geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)materials.add(material);});
  for(const geometry of geometries){if(cachedGeometry.has(geometry))continue;for(const [name,attribute] of Object.entries(geometry.attributes))if(cachedAttributes.has(attribute))geometry.deleteAttribute(name);if(cachedAttributes.has(geometry.index))geometry.setIndex(null);geometry.dispose();}
  for(const material of materials)if(!cachedMaterials.has(material))material.dispose();
  // Textures belong to the scene's shared atlas / GLB registry, not an inspection.
  group.clear();
}

export function canonicalPickTargets(buildings){
  const targets=[];
  for(const building of buildings.values()){
    if(!building.group.visible)continue;
    const hasFloors=building.group.children.some(child=>Number.isInteger(child.userData.floor));
    for(const child of building.group.children){
      if(child.userData.decorative||child===building.body&&hasFloors)continue;
      if(child.visible||child.userData.canonicalHit)targets.push(child);
    }
  }
  return targets;
}
