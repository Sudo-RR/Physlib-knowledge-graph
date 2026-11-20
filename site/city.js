import { buildReviewCity, cityNeighborhood } from './city-model.js';
import { makeFolderTree, renderFolderTree } from './city-explorer.js';
import { createCityScene } from './city-scene.js';
import { buildFloorIndex } from './city-floors.js';
import { validateDeclarations } from './declarations.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceUrl = (source, path, line) => `${source.repository}/blob/${source.revision}/${path.split('/').map(encodeURIComponent).join('/')}${line ? `#L${line}` : ''}`;
let city, physlib, mathlib, scene, tree, selected, declarationPilot, declarationSnapshot, floorIndex;
const expanded = new Set(['Physlib','Physlib/Mathematics','Physlib/Mathematics/Calculus','Mathlib']);

function renderExplorer() {
  $('#city-list').innerHTML = renderFolderTree(tree, {selected, query:$('#search').value, expanded, escape:esc});
}

function relationList(edges, endpoint) {
  if(!edges.length) return '<p class="note">None among the displayed files.</p>';
  const byId=new Map(city.nodes.map(node=>[node.id,node]));
  return `<ul class="inspect-list">${edges.map(edge=>{
    const importer=byId.get(edge.from), source=importer.library==='Mathlib'?mathlib.source:physlib.source;
    return `<li><button data-node="${esc(edge[endpoint])}">${esc(edge[endpoint])}</button> <a class="evidence" href="${sourceUrl(source,importer.module.path,edge.line)}" target="_blank" rel="noreferrer">line ${edge.line} ↗</a></li>`;
  }).join('')}</ul>`;
}

function declarationSection(node) {
  const data=floorIndex.get(node.id),count=data.items.length;
  if(!count)return `<h3>Floors</h3><p class="note">${data.coverage==='complete'?'No declarations recorded for this file.':data.coverage==='partial'?'No declarations recorded in the partial snapshot. Its building has a placeholder height.':'Declaration coverage is unavailable for this file. Its building has a placeholder height.'}</p>`;
  return `<h3>Floors · ${count} recorded declarations</h3><p class="note">${data.coverage==='complete'?'Recorded coverage is complete.':'Partial coverage: the file may contain more.'} ${count>data.floors.length?'Each floor groups several recorded declarations.':'Each floor represents one recorded declaration.'} Select a floor here or on the selected building.</p><div class="floor-list">${data.floors.map(f=>`<button data-floor="${f.index}"><span>Floor ${f.index+1}</span><small>${f.items.length===1?esc(f.items[0].id):`${f.items.length} declarations`}</small></button>`).join('')}</div><div id="floor-result" aria-live="polite"></div><div id="declaration-result" aria-live="polite"></div><div id="target-result" aria-live="polite"></div>`;
}

function inspectFloor(id,index) {
  if(id!==selected)return;
  const data=floorIndex.get(id),floor=data?.floors[index];if(!floor)return;
  const result=$('#floor-result');if(!result)return;
  $('#declaration-result').innerHTML='';$('#target-result').innerHTML='';
  scene.select(id);$('#relation-mode').textContent='Solid arrows · explicit file imports';
  const pilotPhys=new Set(declarationPilot?.declarations.map(d=>d.id)??[]),pilotMath=new Set(declarationPilot?.targets.map(d=>d.id)??[]);
  const node=city.nodes.find(item=>item.id===id),source=node.library==='Mathlib'?mathlib.source:physlib.source;
  result.innerHTML=`<h3>Floor ${index+1} · ${floor.items.length} recorded declaration${floor.items.length===1?'':'s'}</h3><ul class="inspect-list">${floor.items.map(d=>{
    const action=pilotPhys.has(d.id)?`<button data-declaration="${esc(d.id)}">${esc(d.id)}</button>`:pilotMath.has(d.id)?`<button data-target="${esc(d.id)}">${esc(d.id)}</button>`:esc(d.id);
    const link=d.line?` <a class="evidence" href="${sourceUrl(source,node.module.path,d.line)}" target="_blank" rel="noreferrer">line ${d.line} ↗</a>`:'';
    return `<li>${action} <span class="note">· ${esc(d.kind)}</span>${link}${d.statement?`<pre class="floor-statement">${esc(d.statement)}</pre>`:''}</li>`;
  }).join('')}</ul><p class="note">Declarations with recorded cross-library relationships can be selected.</p>`;
  for(const button of document.querySelectorAll('[data-floor]'))button.classList.toggle('active',Number(button.dataset.floor)===index);
  scene.selectFloor(id,index);
}

function inspectDeclaration(id) {
  const targets=new Map(declarationPilot.targets.map(d=>[d.id,d]));
  const edges=declarationPilot.edges.filter(edge=>edge.from===id);
  $('#declaration-result').innerHTML=`<h3>${esc(id)}</h3><p class="note">${edges.length} recorded Mathlib relationships in the pilot scope. “Value” includes definition bodies or theorem proofs. Some edges may be routed through omitted declarations.</p>${edges.length?`<ul class="inspect-list">${edges.map(edge=>{const target=targets.get(edge.to);return `<li>${esc(edge.to)} · ${esc(edge.kind)}<br><a href="mathlib.html?node=${encodeURIComponent(target.module)}">${esc(target.module)} ↗</a></li>`;}).join('')}</ul>`:'<p class="note">No Mathlib relationships recorded within the included scope.</p>'}<p class="note">Absence does not establish non-use.</p>`;
  const shown=scene.showDeclarationLinks(edges.map(edge=>({from:selected,to:targets.get(edge.to).module})));
  $('#relation-mode').textContent=`Declaration links · ${shown} displayed module pairs · partial, may be routed`;
}

function inspectTarget(id) {
  const declarations=new Map(declarationPilot.declarations.map(d=>[d.id,d]));
  const edges=declarationPilot.edges.filter(edge=>edge.to===id);
  $('#target-result').innerHTML=`<h3>${esc(id)}</h3><p class="note">${edges.length} recorded Physlib relationships in the partial pilot. Some may be routed through omitted declarations.</p><ul class="inspect-list">${edges.map(edge=>{const declaration=declarations.get(edge.from);return `<li>${esc(edge.from)} · ${esc(edge.kind)}<br><button data-node="${esc(declaration.module)}">${esc(declaration.module)}</button></li>`;}).join('')}</ul>`;
  const shown=scene.showDeclarationLinks(edges.map(edge=>({from:declarations.get(edge.from).module,to:selected})));
  $('#relation-mode').textContent=`Declaration links · ${shown} displayed module pairs · partial, may be routed`;
}

function select(id,{focus=true}={}) {
  const hood=cityNeighborhood(city,id);if(!hood)return;
  selected=id;const {node,imports,importers}=hood,source=node.library==='Mathlib'?mathlib.source:physlib.source;
  const folder=node.module.path.replaceAll('\\','/').split('/').slice(0,-1).join('/');
  const parts=folder.split('/');parts.forEach((_,i)=>expanded.add(parts.slice(0,i+1).join('/')));
  const maps=node.library==='Physlib'?physlib.maps.filter(map=>map.references.includes(node.module.path)):[];
  $('#city-inspector').innerHTML=`<span class="label">${node.library.toUpperCase()} · FILE</span><h2>${esc(id)}</h2><p class="city-path">${esc(node.module.path)}</p><div class="city-inspector-links"><a href="${sourceUrl(source,node.module.path)}" target="_blank" rel="noreferrer">Lean source ↗</a><a href="${node.library==='Mathlib'?'mathlib.html':'index.html'}?node=${encodeURIComponent(id)}">Full file view ↗</a></div>${declarationSection(node)}<h3>Imports · ${imports.length} in pilot</h3>${relationList(imports,'to')}<h3>Imported by · ${importers.length} in pilot</h3>${relationList(importers,'from')}<h3>API maps</h3>${maps.length?`<ul class="inspect-list">${maps.map(map=>`<li><a href="index.html?node=${encodeURIComponent('map:'+map.path)}">${esc(map.title)}</a></li>`).join('')}</ul>`:'<p class="note">No linked API maps in this snapshot.</p>'}<p class="city-note">A file import does not establish declaration usage. Declaration links are partial and may be routed. Other relationships may lie outside this pilot.</p>`;
  $('#current-selection').innerHTML=`<span>Selected file</span><strong>${esc(id)}</strong><small id="relation-mode">Solid arrows · explicit file imports</small>`;
  scene.select(id);if(focus)scene.focusBuilding(id);renderExplorer();
  const url=new URL(location.href);url.searchParams.set('node',id);history.replaceState(null,'',url);
}

function switchView(mode) {
  scene.setView(mode);
  for(const name of ['city','map']){$(`#view-${name}`).classList.toggle('active',name===mode);$(`#view-${name}`).setAttribute('aria-pressed',String(name===mode));}
}

document.addEventListener('click',event=>{
  const folder=event.target.closest('summary')?.parentElement;if(folder?.dataset.folder)scene?.focusFolder(folder.dataset.folder);
  const node=event.target.closest('[data-node]');if(node)select(node.dataset.node);
  const floor=event.target.closest('[data-floor]');if(floor)inspectFloor(selected,Number(floor.dataset.floor));
  const declaration=event.target.closest('[data-declaration]');if(declaration&&declarationPilot)inspectDeclaration(declaration.dataset.declaration);
  const target=event.target.closest('[data-target]');if(target&&declarationPilot)inspectTarget(target.dataset.target);
});
document.addEventListener('toggle',event=>{const folder=event.target;if(!folder.matches?.('details[data-folder]'))return;if(folder.open)expanded.add(folder.dataset.folder);else expanded.delete(folder.dataset.folder);},true);
$('#search').addEventListener('input',renderExplorer);
$('#view-city').addEventListener('click',()=>switchView('city'));
$('#view-map').addEventListener('click',()=>switchView('map'));
$('#reset').addEventListener('click',()=>scene.reset());

try {
  const responses=await Promise.all(['graph','mathlib','mathlib-bridge'].map(name=>fetch(`data/${name}.json`)));
  if(responses.some(response=>!response.ok))throw Error('Missing graph data. Run npm run build:data and npm run build:mathlib.');
  const [p,m,bridge]=await Promise.all(responses.map(response=>response.json()));physlib=p;mathlib=m;city=buildReviewCity(p,m,bridge);
  try {const response=await fetch('data/city-declarations.json');if(response.ok){const d=await response.json();if(d?.source?.physlibRevision===p.source.revision&&d.source.mathlibRevision===m.source.revision&&d.source.toolchain===p.source.toolchain&&Array.isArray(d.declarations)&&Array.isArray(d.targets)&&Array.isArray(d.edges)&&d.edges.every(e=>d.targets.some(t=>t.id===e.to)&&d.declarations.some(v=>v.id===e.from)))declarationPilot=d;}} catch {}
  try {const response=await fetch('data/declarations.json');if(response.ok){const candidate=await response.json();if(!validateDeclarations(candidate,p).length)declarationSnapshot=candidate;}} catch {}
  floorIndex=buildFloorIndex(city.nodes,declarationSnapshot,declarationPilot);
  tree=makeFolderTree(city.nodes);$('#count').textContent=city.nodes.length;
  $('#city-counts').textContent=`${city.nodes.filter(n=>n.library==='Physlib').length} Physlib files · ${city.mathlibModules} Mathlib files · ${city.edges.length} imports in this pilot`;
  $('#snapshot').innerHTML=`Physlib <a href="${p.source.repository}/commit/${p.source.revision}">${esc(p.source.revision.slice(0,10))} ↗</a><br>Mathlib <a href="${m.source.repository}/commit/${m.source.revision}">${esc(m.source.revision.slice(0,10))} ↗</a><br>${esc(p.source.toolchain)}`;
  renderExplorer();scene=createCityScene($('#city-canvas'),city,floorIndex,id=>select(id),inspectFloor);$('#loading').hidden=true;
  const requested=new URL(location.href).searchParams.get('node');const initial=requested||'Physlib.Mathematics.Calculus.Gradient';
  if(city.nodes.some(node=>node.id===initial))select(initial,{focus:false});
} catch(error) {$('#loading').innerHTML=`<div class="error">Could not load city: ${esc(error.message)}</div>`;}
