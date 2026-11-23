export const surfaceRoots=['Physlib','PhyslibAlpha','QuantumInfo'];
export const normalizedPath=node=>node.module.path.replaceAll('\\','/');
export function buildHierarchy(nodes){
 const roots=surfaceRoots.map(id=>({id,name:id,depth:0,files:[],children:[],count:0})),unknown=[];
 const dirs=new Map(roots.map(r=>[r.id,r]));
 for(const node of [...nodes].sort((a,b)=>normalizedPath(a).localeCompare(normalizedPath(b)))){
  if(node.library==='Mathlib')continue;
  const parts=normalizedPath(node).split('/'),root=parts[0].replace(/\.lean$/,'');
  if(!surfaceRoots.includes(root)){unknown.push(node.id);continue;}
  let parent=dirs.get(root);
  for(let i=1;i<parts.length-1;i++){
   const id=parts.slice(0,i+1).join('/');
   if(!dirs.has(id)){const d={id,name:parts[i],depth:i,files:[],children:[],count:0};dirs.set(id,d);parent.children.push(d);}
   parent=dirs.get(id);
  }
  parent.files.push(node.id);
 }
 function count(d){d.children.sort((a,b)=>a.id.localeCompare(b.id));d.count=d.files.length+d.children.reduce((n,c)=>n+count(c),0);return d.count;}
 roots.forEach(count);return {roots,unknown};
}
