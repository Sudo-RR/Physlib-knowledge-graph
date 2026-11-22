// Selected routes and markers are ephemeral; each owns its geometry and
// material. Releasing them on selection changes keeps GPU allocations bounded.
export function clearDisposableGroup(group) {
  for(const object of group.children){
    object.geometry?.dispose();
    for(const material of Array.isArray(object.material)?object.material:[object.material])material?.dispose();
  }
  group.clear();
}
