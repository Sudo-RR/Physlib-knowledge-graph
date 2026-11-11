// Build a directory tree from repository paths, rather than guessing namespaces.
export function buildTree(modules, maps) {
  const root = { directories: new Map(), entries: [] };
  for (const item of [...modules.map(m=>({path:m.path,id:m.id,type:'module'})), ...maps.map(m=>({path:m.path,id:`map:${m.path}`,type:'map'}))]) {
    const parts=item.path.split('/'); const name=parts.pop(); let cursor=root;
    for (const part of parts) { if(!cursor.directories.has(part)) cursor.directories.set(part,{directories:new Map(),entries:[]}); cursor=cursor.directories.get(part); }
    cursor.entries.push({...item,name});
  }
  return root;
}
