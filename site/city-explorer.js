// Actual paths drive both the folder explorer and the city districts.
export function makeFolderTree(nodes) {
  const root={dirs:new Map(),files:[]};
  for(const node of nodes){const parts=node.module.path.replaceAll('\\','/').split('/'),file=parts.pop();let branch=root;
    for(const part of parts){if(!branch.dirs.has(part))branch.dirs.set(part,{dirs:new Map(),files:[]});branch=branch.dirs.get(part);}
    branch.files.push({name:file,node});
  }
  return root;
}

export function renderFolderTree(tree,{selected='',query='',expanded=new Set(),escape=String}={}) {
  const q=query.trim().toLowerCase();
  if(q){const files=[];function collect(branch){for(const f of branch.files)if(f.node.id.toLowerCase().includes(q))files.push(f);for(const child of branch.dirs.values())collect(child);}collect(tree);
    return files.length?files.map(f=>`<button class="city-tree-file ${f.node.id===selected?'active':''}" data-node="${escape(f.node.id)}">${escape(f.node.id)}</button>`).join(''):'<p class="city-status">No displayed files match.</p>';
  }
  function render(branch,prefix=''){return [...branch.dirs.entries()].sort(([a],[b])=>{const order=['Physlib','PhyslibAlpha','QuantumInfo','Mathlib'];return !prefix?(order.indexOf(a)===-1?99:order.indexOf(a))-(order.indexOf(b)===-1?99:order.indexOf(b))||a.localeCompare(b):a.localeCompare(b);}).map(([name,child])=>{const id=prefix?`${prefix}/${name}`:name;return `<details class="city-tree-folder" data-folder="${escape(id)}" ${expanded.has(id)?'open':''}><summary><span>${escape(name)}</span></summary>${render(child,id)}</details>`;}).join('')+branch.files.sort((a,b)=>a.name.localeCompare(b.name)).map(f=>`<button class="city-tree-file ${f.node.id===selected?'active':''}" data-node="${escape(f.node.id)}">${escape(f.name)}</button>`).join('');}
  return render(tree);
}
