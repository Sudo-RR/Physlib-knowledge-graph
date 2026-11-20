import { buildTree } from './tree.js';
import { moduleLabel, wrapLabel } from './labels.js';
import { createMathlibIndex, mathlibNeighborhood } from './mathlib-model.js';

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canvas=$('#graph'),ctx=canvas.getContext('2d');
let physlib,mathlib,bridge,index,tree,selected=null,nodes=[],edges=[],camera={x:0,y:0,scale:1},drag=null,hovered=null,activeTab='browse';
const dirs=new Map(),expanded=new Set(),expandedLists=new Set();
const source=(snapshot,file,line)=>`${snapshot.source.repository}/blob/${snapshot.source.revision}/${file.split('/').map(encodeURIComponent).join('/')}${line?`#L${line}`:''}`;
const mathButton=id=>`<button data-module="${esc(id)}">${esc(id)}</button>`;
const evidence=(snapshot,file,line)=>` <a class="evidence" href="${source(snapshot,file,line)}" target="_blank" rel="noreferrer">line ${line} ↗</a>`;
const physLink=id=>`<a href="index.html?node=${encodeURIComponent(id)}">${esc(id)}</a>`;
const breakable=id=>esc(id).replaceAll('.', '.<wbr>');

function registerDirectories(branch,prefix=''){
  dirs.set(prefix,branch);
  for(const [name,child] of branch.directories)registerDirectories(child,prefix?`${prefix}/${name}`:name);
}
function treeLevel(branch,prefix=''){
  const folders=[...branch.directories.entries()].sort(([a],[b])=>a.localeCompare(b));
  return folders.map(([name,child])=>{const key=prefix?`${prefix}/${name}`:name,open=expanded.has(key);return `<details class="tree-directory" data-dir="${esc(key)}" ${open?'open':''}><summary>${esc(name)}</summary><div>${open?treeLevel(child,key):''}</div></details>`;}).join('')+
    branch.entries.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(x=>`<button class="entry tree-entry ${selected===x.id?'active':''}" data-module="${esc(x.id)}"><span class="entry-name">${esc(x.name)}</span><span class="entry-count">Lean</span></button>`).join('');
}
function renderSidebar(){
  const q=$('#search').value.trim().toLowerCase();$('#browse-tab').classList.toggle('active',activeTab==='browse');$('#search-tab').classList.toggle('active',activeTab==='search');
  if(activeTab==='browse'&&!q){$('#sidebar-content').innerHTML='<div class="section-label">Mathlib directories and files</div>'+treeLevel(tree);$('#result-count').textContent='';return;}
  const found=mathlib.modules.filter(m=>m.id.toLowerCase().includes(q));$('#result-count').textContent=found.length;
  $('#sidebar-content').innerHTML=`<div class="section-label">${found.length} results${found.length>100?' · first 100':''}</div>`+found.slice(0,100).map(m=>`<button class="entry ${selected===m.id?'active':''}" data-module="${esc(m.id)}"><span class="entry-name">${esc(m.id)}</span></button>`).join('');
}
function fullList(key,items,renderItem){
  if(!items.length)return '<p class="note">None recorded.</p>';
  const limit=expandedLists.has(key)?items.length:100, shown=items.slice(0,limit);
  return `<ul class="inspect-list">${shown.map(x=>`<li>${renderItem(x)}</li>`).join('')}</ul>${items.length>limit?`<button class="list-more" data-list="${key}">Show all ${items.length} entries</button>`:''}`;
}
function renderInspector(hood){
  const {module,imports,importers,physlibImporters}=hood;
  const importLine=x=>`${index.modules.has(x.module)?mathButton(x.module):esc(x.module)+' <span class="note">· external or unresolved</span>'}${evidence(mathlib,module.path,x.line)}`;
  const importerLine=x=>`${mathButton(x.module)}${evidence(mathlib,index.modules.get(x.module).path,x.line)}`;
  const physLine=x=>`${physLink(x.module)}${evidence(physlib,index.physlibModules.get(x.module).path,x.line)}`;
  $('#inspector-content').innerHTML=`<span class="label">MATHLIB · MODULE</span><h2>${breakable(module.id)}</h2><p>Direct source imports at the indexed revisions. An import indicates availability, not use of a particular declaration.</p><div class="stat-grid"><div class="stat"><strong>${importers.length}</strong><small>Mathlib importers</small></div><div class="stat"><strong>${physlibImporters.length}</strong><small>Physlib importers</small></div></div><a class="source-link" href="${source(mathlib,module.path)}" target="_blank" rel="noreferrer">View Mathlib source ↗</a><h3>Imported by Physlib</h3>${fullList('physlib',physlibImporters,physLine)}<h3>Imported by Mathlib</h3>${fullList('importers',importers,importerLine)}<h3>Imports</h3>${fullList('imports',imports,importLine)}<p class="note">The graph is bounded; these lists show all recorded relationships on request. Declaration-level dependencies are not included.</p>`;
}
function layout(hood){
  const width=canvas.clientWidth, x=Math.max(110,Math.min(220,width*.27));
  nodes=[{id:hood.module.id,role:'selected',label:moduleLabel(hood.module.id),x:0,y:0,r:12}];edges=[];
  const add=(items,role,fromField,xPos)=>items.forEach((item,i)=>{const id=item.module,step=Math.min(26,Math.max(10,Math.max(100,canvas.clientHeight-90)/Math.max(items.length,1)));nodes.push({id,role,label:moduleLabel(id),x:xPos,y:(i-(items.length-1)/2)*step,r:6,indexed:index.modules.has(id)});edges.push(fromField==='target'?{from:id,to:hood.module.id}:{from:hood.module.id,to:id});});
  add(hood.shown.importers,'importer','target',-x);
  add(hood.shown.imports,'import','source',x);
  hood.shown.physlibImporters.forEach((item,i)=>{const step=Math.min(90,Math.max(36,Math.max(1,width-100)/Math.max(hood.shown.physlibImporters.length,1)));nodes.push({id:item.module,role:'physlib',label:moduleLabel(item.module),x:(i-(hood.shown.physlibImporters.length-1)/2)*step,y:Math.min(140,canvas.clientHeight*.32),r:6});edges.push({from:item.module,to:hood.module.id});});
}
function openModule(id,{historyEntry=true}={}){
  const hood=mathlibNeighborhood(index,id);if(!hood){$('#inspector-content').innerHTML='<h2>Module not found</h2><p>This Mathlib module is not in the pinned snapshot. It may have moved or been renamed.</p>';return;}
  selected=id;expandedLists.clear();layout(hood);renderInspector(hood);renderSidebar();
  $('#title').innerHTML=breakable(id);$('#crumb').textContent=id;$('#subtitle').textContent='Arrows point from an importing module to its dependency.';$('#scope-label').textContent='Direct neighborhood';
  $('#graph-counts').textContent=`Showing ${hood.shown.importers.length} of ${hood.importers.length} Mathlib importers · ${hood.shown.imports.length} of ${hood.imports.length} imports · ${hood.shown.physlibImporters.length} of ${hood.physlibImporters.length} Physlib importers`;
  if(historyEntry){const u=new URL(location.href);u.searchParams.set('node',id);history.pushState({},'',u);}
  fit();
}
function overview({historyEntry=true}={}){
  selected=null;nodes=[];edges=[];$('#title').textContent='Explore Mathlib.';$('#crumb').textContent='Overview';$('#subtitle').textContent='Select a file to see direct imports and Physlib files that import it.';$('#scope-label').textContent='Mathlib overview';$('#graph-counts').textContent=`${mathlib.modules.length} Mathlib modules · ${bridge.edges.length} direct Physlib-to-Mathlib imports`;
  $('#inspector-content').innerHTML='<div class="empty"><h2>Choose a Mathlib file.</h2><p>Browse the directory tree or search for a module name.</p></div>';renderSidebar();
  if(historyEntry){const u=new URL(location.href);u.searchParams.delete('node');history.pushState({},'',u);}fit();
}
function resize(){const d=window.devicePixelRatio||1,r=canvas.getBoundingClientRect();canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);ctx.setTransform(d,0,0,d,0,0);if(selected)layout(mathlibNeighborhood(index,selected));render();}
function fit(){camera={x:0,y:0,scale:1};render();}
function render(){
  if(!canvas.width)return;const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(w/2+camera.x,h/2+camera.y);ctx.scale(camera.scale,camera.scale);
  const pos=new Map(nodes.map(n=>[n.id,n]));
  for(const e of edges){const a=pos.get(e.from),b=pos.get(e.to);if(!a||!b)continue;const color=a.role==='physlib'?'#7354a5':a.role==='importer'?'#2166ac':'#cf593e',angle=Math.atan2(b.y-a.y,b.x-a.x),tx=b.x-Math.cos(angle)*(b.r+3),ty=b.y-Math.sin(angle)*(b.r+3);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color+'99';ctx.lineWidth=1;ctx.stroke();ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx-7*Math.cos(angle-.45),ty-7*Math.sin(angle-.45));ctx.lineTo(tx-7*Math.cos(angle+.45),ty-7*Math.sin(angle+.45));ctx.fillStyle=color;ctx.fill();}
  const fewPhyslibNodes=nodes.filter(n=>n.role==='physlib').length<=3;
  for(const n of nodes){const color={selected:'#161616',importer:'#2166ac',import:'#cf593e',physlib:'#7354a5'}[n.role];ctx.beginPath();if(n.role==='physlib')ctx.rect(n.x-n.r,n.y-n.r,2*n.r,2*n.r);else if(n.role==='importer'){ctx.moveTo(n.x,n.y-n.r);ctx.lineTo(n.x+n.r,n.y+n.r);ctx.lineTo(n.x-n.r,n.y+n.r);ctx.closePath();}else ctx.arc(n.x,n.y,n.r,0,2*Math.PI);ctx.fillStyle=color;ctx.fill();if(n.role==='import'&&!n.indexed){ctx.setLineDash([2,2]);ctx.strokeStyle='#151515';ctx.stroke();ctx.setLineDash([]);}if(n.id===selected||n.id===hovered||(nodes.length<=12&&(n.role!=='physlib'||fewPhyslibNodes))){ctx.font='10px Helvetica, Arial, sans-serif';ctx.fillStyle='#151515';ctx.textAlign='center';wrapLabel(n.label,180,t=>ctx.measureText(t).width).forEach((line,i)=>ctx.fillText(line,n.x,n.y+n.r+16+i*12));}}
  ctx.restore();
}
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left-r.width/2-camera.x)/camera.scale,y:(e.clientY-r.top-r.height/2-camera.y)/camera.scale};}
function hit(p){return [...nodes].reverse().find(n=>Math.hypot(n.x-p.x,n.y-p.y)<n.r+8);}
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,ox:camera.x,oy:camera.y,moved:false};});
canvas.addEventListener('pointermove',e=>{if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;camera.x=drag.ox+dx;camera.y=drag.oy+dy;render();return;}const n=hit(point(e));hovered=n?.id??null;canvas.title=n?.id??'';canvas.style.cursor=n?'pointer':'grab';render();});
canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const n=hit(point(e));if(n?.role==='physlib')location.href=`index.html?node=${encodeURIComponent(n.id)}`;else if(n&&index.modules.has(n.id))openModule(n.id);}drag=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();camera.scale=Math.max(.35,Math.min(3,camera.scale*(e.deltaY>0?.9:1.1)));render();},{passive:false});
$('#zoom-in').onclick=()=>{camera.scale=Math.min(3,camera.scale*1.2);render();};$('#zoom-out').onclick=()=>{camera.scale=Math.max(.35,camera.scale/1.2);render();};$('#zoom-reset').onclick=fit;$('#home').onclick=()=>overview();
$('#browse-tab').onclick=()=>{activeTab='browse';$('#search').value='';renderSidebar();};$('#search-tab').onclick=()=>{activeTab='search';renderSidebar();$('#search').focus();};$('#search').addEventListener('input',()=>{activeTab=$('#search').value?'search':'browse';renderSidebar();});
document.addEventListener('click',e=>{const module=e.target.closest('[data-module]');if(module)openModule(module.dataset.module);const more=e.target.closest('[data-list]');if(more&&selected){expandedLists.add(more.dataset.list);renderInspector(mathlibNeighborhood(index,selected));}});
document.addEventListener('toggle',e=>{const el=e.target;if(!el.matches?.('details[data-dir]'))return;const key=el.dataset.dir;if(el.open){expanded.add(key);const container=el.querySelector(':scope > div');if(container&&!container.childElementCount)container.innerHTML=treeLevel(dirs.get(key),key);}else expanded.delete(key);},true);
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('#search').focus();}});
window.addEventListener('resize',resize);window.addEventListener('popstate',()=>{const id=new URLSearchParams(location.search).get('node');if(id)openModule(id,{historyEntry:false});else overview({historyEntry:false});});

try{
  const responses=await Promise.all(['data/graph.json','data/mathlib.json','data/mathlib-bridge.json'].map(url=>fetch(url)));
  if(responses.some(r=>!r.ok))throw Error('Mathlib data is unavailable. Run npm run build:data and npm run build:mathlib.');
  [physlib,mathlib,bridge]=await Promise.all(responses.map(r=>r.json()));index=createMathlibIndex(physlib,mathlib,bridge);tree=buildTree(mathlib.modules,[]);registerDirectories(tree);
  $('#module-count').textContent=mathlib.modules.length;$('#snapshot').innerHTML=`Mathlib <a href="${mathlib.source.repository}/commit/${mathlib.source.revision}">${esc(mathlib.source.revision.slice(0,10))} ↗</a><br>Physlib <a href="${physlib.source.repository}/commit/${physlib.source.revision}">${esc(physlib.source.revision.slice(0,10))} ↗</a><br>${esc(mathlib.source.toolchain)}<br>${bridge.unresolved.length} unresolved Physlib imports`;
  $('#loading').hidden=true;resize();const id=new URLSearchParams(location.search).get('node');if(id)openModule(id,{historyEntry:false});else overview({historyEntry:false});
}catch(e){$('#loading').innerHTML=`<div class="error">Could not load the Mathlib graph: ${esc(e.message)}</div>`;}
