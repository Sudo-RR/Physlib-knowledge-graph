import { buildFullCity, cityNeighborhood } from './city-model.js';
import { makeFolderTree, renderFolderTree } from './city-explorer.js';
import { createCityScene } from './city-scene.js';
import { buildFloorIndex } from './city-floors.js';
import { validateDeclarations } from './declarations.js';
import { createFloorRoom } from './floor-room.js';
import { mathlibPipelines } from './city-relations.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceUrl = (source, path, line) => `${source.repository}/blob/${source.revision}/${path.split('/').map(encodeURIComponent).join('/')}${line ? `#L${line}` : ''}`;
let city, physlib, mathlib, scene, tree, selected, declarationPilot, declarationSnapshot, floorIndex, floorRoom;
let navIndex=0, navMax=0, relationMode='imports',pipelinesVisible=true;
const expanded = new Set(['Physlib','Physlib/ClassicalMechanics']);
function describeRelations(result){if(relationMode==='none')return 'File arrows hidden';return `${result.drawn} of ${result.total} ${relationMode==='imports'?'imports':relationMode==='importers'?'importers':'relationships'} shown${result.total>result.drawn?' · all listed in inspector':''}`;}

function renderExplorer() {
  const list=$('#city-list'),scroll=list.scrollTop;
  list.innerHTML = renderFolderTree(tree, {selected, query:$('#search').value, expanded, escape:esc});
  list.scrollTop=scroll;
}

function updateHistoryButtons(){$('#nav-back').disabled=navIndex<=0;$('#nav-forward').disabled=navIndex>=navMax;}
function clearSelection({resetCamera=false}={}){selected=null;scene.select(null);if(resetCamera)scene.reset();$('#current-selection').textContent='Select a file';$('#city-inspector').innerHTML='<div class="empty"><h2>Select a file.</h2><p>Explore its imports and recorded declarations.</p></div>';$('#floor-interior').hidden=true;floorRoom?.hide();renderExplorer();}
function populateAreas(){
  const roots=new Map();
  for(const node of city.nodes){const parts=node.module.path.replaceAll('\\','/').split('/');if(parts.length<3)continue;const [root,name]=parts,path=`${root}/${name}`;if(!roots.has(root))roots.set(root,new Map());const areas=roots.get(root);areas.set(path,(areas.get(path)||0)+1);}
  const human=name=>name.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/([A-Z])([A-Z][a-z])/g,'$1 $2');
  $('#area-select').innerHTML='<option value="">Choose an area</option>'+[...roots].sort(([a],[b])=>a.localeCompare(b)).map(([root,areas])=>`<optgroup label="${esc(root)}">${[...areas].sort(([a],[b])=>a.localeCompare(b)).map(([path,count])=>`<option value="${esc(path)}">${esc(human(path.split('/')[1]))} · ${count} ${count===1?'file':'files'}</option>`).join('')}</optgroup>`).join('');
}
function mathlibTarget(target) {
  if(city.nodes.some(node=>node.id===target.module))return `<button data-node="${esc(target.module)}">${esc(target.module)}</button>`;
  const module=mathlib.modules.find(item=>item.id===target.module);
  return module?`<a href="${sourceUrl(mathlib.source,module.path)}" target="_blank" rel="noreferrer">${esc(target.module)} · source ↗</a>`:`${esc(target.module)} · not in city`;
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
  if(!count){const message=data.coverage==='complete'?'No declarations recorded for this file.':data.coverage==='partial'?'No declarations recorded in the partial snapshot.':'Declaration coverage is unavailable for this file.';
    if(!data.floors.length)return `<h3>Floors</h3><p class="note">${message} Source line data is also unavailable.</p>`;
    return `<h3>Source floors · ${data.floors.length}</h3><p class="note">${message} Floors represent ranges of source lines, not declarations.</p><div class="floor-list">${data.floors.map(f=>`<button data-floor="${f.index}"><span>Floor ${f.index+1}</span><small>Source lines ${f.start}–${f.end}</small></button>`).join('')}</div><div id="floor-result" aria-live="polite"></div><div id="declaration-result" aria-live="polite"></div><div id="target-result" aria-live="polite"></div>`;}
  return `<h3>Floors · ${count} recorded declarations</h3><p class="note">${data.coverage==='complete'?'Recorded coverage is complete.':'Partial coverage: the file may contain more.'} ${count>data.floors.length?'Each floor groups several recorded declarations.':'Each floor represents one recorded declaration.'} Select a floor here or on the selected building.</p><div class="floor-list">${data.floors.map(f=>`<button data-floor="${f.index}"><span>Floor ${f.index+1}</span><small>${f.items.length===1?esc(f.items[0].id):`${f.items.length} declarations`}</small></button>`).join('')}</div><div id="floor-result" aria-live="polite"></div><div id="declaration-result" aria-live="polite"></div><div id="target-result" aria-live="polite"></div>`;
}

function inspectFloor(id,index) {
  if(id!==selected)return;
  const data=floorIndex.get(id),floor=data?.floors[index];if(!floor)return;
  const result=$('#floor-result');if(!result)return;
  $('#declaration-result').innerHTML='';$('#target-result').innerHTML='';
  const selection=scene.select(id);$('#relation-mode').textContent=describeRelations(selection);
  const pilotPhys=new Set(declarationPilot?.declarations.map(d=>d.id)??[]),pilotMath=new Set(declarationPilot?.targets.map(d=>d.id)??[]);
  const node=city.nodes.find(item=>item.id===id),source=node.library==='Mathlib'?mathlib.source:physlib.source;
  if(floor.kind==='source-range'){
    const imports=node.module.imports.filter(imp=>imp.line>=floor.start&&imp.line<=floor.end);
    result.innerHTML=`<h3>Floor ${index+1} · source lines ${floor.start}–${floor.end}</h3><p class="note">This floor is a source range, not an extracted declaration. Dependencies below are file-level imports.</p><p><a href="${sourceUrl(source,node.module.path,floor.start)}-L${floor.end}" target="_blank" rel="noreferrer">Read these source lines ↗</a></p><h3>Imports in this range</h3>${imports.length?`<ul class="inspect-list">${imports.map(imp=>`<li>${city.nodes.some(n=>n.id===imp.module)?`<button data-node="${esc(imp.module)}">${esc(imp.module)}</button>`:esc(imp.module)} <a class="evidence" href="${sourceUrl(source,node.module.path,imp.line)}" target="_blank" rel="noreferrer">line ${imp.line} ↗</a></li>`).join('')}</ul>`:'<p class="note">No explicit imports occur in this source range.</p>'}<p class="note">For all recorded file imports and importers, use the inspector.</p>`;
  } else result.innerHTML=`<h3>Floor ${index+1} · ${floor.items.length} recorded declaration${floor.items.length===1?'':'s'}</h3><ul class="inspect-list">${floor.items.map(d=>{
    const action=pilotPhys.has(d.id)?`<button data-declaration="${esc(d.id)}">${esc(d.id)}</button>`:pilotMath.has(d.id)?`<button data-target="${esc(d.id)}">${esc(d.id)}</button>`:esc(d.id);
    const link=d.line?` <a class="evidence" href="${sourceUrl(source,node.module.path,d.line)}" target="_blank" rel="noreferrer">line ${d.line} ↗</a>`:'';
    return `<li>${action} <span class="note">· ${esc(d.kind)}</span>${link}${d.statement?`<pre class="floor-statement">${esc(d.statement)}</pre>`:''}</li>`;
  }).join('')}</ul><p class="note">Declarations with recorded cross-library relationships can be selected.</p>`;
  $('#floor-interior-title').textContent=`Floor ${index+1}`;
  $('#floor-interior-file').textContent=node.id;
  $('#floor-interior-content').innerHTML=result.innerHTML;
  $('#floor-dependencies').innerHTML=floor.kind==='source-range'?`<h3>File relationships</h3><p>These apply to the file as a whole, not necessarily this floor.</p><h3>Imports</h3>${relationList(cityNeighborhood(city,id).imports,'to')}<h3>Imported by</h3>${relationList(cityNeighborhood(city,id).importers,'from')}`:'<p>Select a linked declaration to inspect its recorded dependencies.</p>';
  $('#floor-interior').hidden=false;
  try {floorRoom??=createFloorRoom($('#floor-room'));floorRoom.show();} catch {$('#floor-room').classList.add('room-fallback');}
  for(const button of document.querySelectorAll('[data-floor]'))button.classList.toggle('active',Number(button.dataset.floor)===index);
  scene.selectFloor(id,index);
}

function inspectDeclaration(id) {
  const targets=new Map(declarationPilot.targets.map(d=>[d.id,d]));
  const edges=declarationPilot.edges.filter(edge=>edge.from===id);
  $('#declaration-result').innerHTML=`<h3>${esc(id)}</h3><p class="note">${edges.length} recorded Mathlib relationships in the pilot scope. “Value” includes definition bodies or theorem proofs. Some edges may be routed through omitted declarations.</p>${edges.length?`<ul class="inspect-list">${edges.map(edge=>{const target=targets.get(edge.to);return `<li>${esc(edge.to)} · ${esc(edge.kind)}<br>${mathlibTarget(target)}</li>`;}).join('')}</ul>`:'<p class="note">No Mathlib relationships recorded within the included scope.</p>'}<p class="note">Absence does not establish non-use.</p>`;
  const shown=scene.showDeclarationLinks(edges.map(edge=>({from:selected,to:targets.get(edge.to).module})));
  $('#relation-mode').textContent=`Declaration links · ${shown} displayed module pairs · partial, may be routed`;
  if(!$('#floor-interior').hidden)$('#floor-dependencies').innerHTML=$('#declaration-result').innerHTML;
}

function inspectTarget(id) {
  const declarations=new Map(declarationPilot.declarations.map(d=>[d.id,d]));
  const edges=declarationPilot.edges.filter(edge=>edge.to===id);
  $('#target-result').innerHTML=`<h3>${esc(id)}</h3><p class="note">${edges.length} recorded Physlib relationships in the partial pilot. Some may be routed through omitted declarations.</p><ul class="inspect-list">${edges.map(edge=>{const declaration=declarations.get(edge.from);return `<li>${esc(edge.from)} · ${esc(edge.kind)}<br><button data-node="${esc(declaration.module)}">${esc(declaration.module)}</button></li>`;}).join('')}</ul>`;
  const shown=scene.showDeclarationLinks(edges.map(edge=>({from:declarations.get(edge.from).module,to:selected})));
  $('#relation-mode').textContent=`Declaration links · ${shown} displayed module pairs · partial, may be routed`;
  if(!$('#floor-interior').hidden)$('#floor-dependencies').innerHTML=$('#target-result').innerHTML;
}

function select(id,{focus=true,record=true}={}) {
  const hood=cityNeighborhood(city,id);if(!hood)return;
  const changed=selected!==id;
  selected=id;$('#floor-interior').hidden=true;floorRoom?.hide();const {node,imports,importers}=hood,source=node.library==='Mathlib'?mathlib.source:physlib.source;
  const folder=node.module.path.replaceAll('\\','/').split('/').slice(0,-1).join('/');
  const parts=folder.split('/');parts.forEach((_,i)=>expanded.add(parts.slice(0,i+1).join('/')));
  const maps=node.library==='Physlib'?physlib.maps.filter(map=>map.references.includes(node.module.path)):[];
  const pipelineCount=mathlibPipelines(city,id).length;
  const measure=floorIndex.get(id).lineCount;
  $('#city-inspector').innerHTML=`<span class="label">${esc(node.id.split('.')[0].toUpperCase())} · FILE</span><h2>${esc(id)}</h2><p class="city-path">${esc(node.module.path)}</p><p class="note">${measure===null?'Source line count unavailable; height uses available declaration data.':`${measure.toLocaleString()} source lines · height is logarithmic`}</p><div class="city-inspector-links"><a href="${sourceUrl(source,node.module.path)}" target="_blank" rel="noreferrer">Lean source ↗</a></div><div class="relation-controls"><label for="relation-filter">Connections in the city</label><select id="relation-filter"><option value="imports">Imports (${imports.length})</option><option value="importers">Imported by (${importers.length})</option><option value="both">Both directions</option><option value="none">Hide file arrows</option></select><p>Blue: this file imports. Amber: imports this file. Up to 12 lines are shown; complete lists are below.</p><label class="pipeline-toggle"><input type="checkbox" id="pipeline-toggle" ${pipelinesVisible?'checked':''}> Show Mathlib pipelines (${pipelineCount} for this file)</label><p>Each cyan pipeline is a direct file import, not a declaration-use claim.</p><button type="button" id="view-foundations" ${pipelineCount?'':'disabled'}>View foundations</button></div>${declarationSection(node)}<h3>Imports · ${imports.length} in city</h3>${relationList(imports,'to')}<h3>Imported by · ${importers.length} in city</h3>${relationList(importers,'from')}<h3>API maps</h3>${maps.length?`<ul class="inspect-list">${maps.map(map=>`<li><a href="${sourceUrl(physlib.source,map.path)}" target="_blank" rel="noreferrer">${esc(map.title)} ↗</a></li>`).join('')}</ul>`:'<p class="note">No linked API maps in this snapshot.</p>'}<p class="city-note">A file import does not establish declaration usage. Declaration links are partial and may be routed. Other relationships may lie outside this city.</p>`;
  $('#relation-filter').value=relationMode;
  $('#current-selection').innerHTML=`<span>${esc(node.id.split('.')[0])} · Selected file</span><strong>${esc(id)}</strong><small id="relation-mode"></small>`;
  const graph=scene.select(id);$('#relation-mode').textContent=describeRelations(graph);if(focus)scene.focusBuilding(id);renderExplorer();
  const url=new URL(location.href);url.searchParams.set('node',id);
  if(record&&changed){navIndex++;navMax=navIndex;history.pushState({cityIndex:navIndex},'',url);}else history.replaceState({cityIndex:navIndex},'',url);
  updateHistoryButtons();
}

document.addEventListener('click',event=>{
  if(event.target.closest('#view-foundations'))scene?.focusFoundations();
  const folder=event.target.closest('summary')?.parentElement;if(folder?.dataset.folder)scene?.focusFolder(folder.dataset.folder);
  const node=event.target.closest('[data-node]');if(node)select(node.dataset.node);
  const floor=event.target.closest('[data-floor]');if(floor)inspectFloor(selected,Number(floor.dataset.floor));
  const declaration=event.target.closest('[data-declaration]');if(declaration&&declarationPilot)inspectDeclaration(declaration.dataset.declaration);
  const target=event.target.closest('[data-target]');if(target&&declarationPilot)inspectTarget(target.dataset.target);
});
document.addEventListener('toggle',event=>{const folder=event.target;if(!folder.matches?.('details[data-folder]'))return;if(folder.open)expanded.add(folder.dataset.folder);else expanded.delete(folder.dataset.folder);},true);
document.addEventListener('change',event=>{if(event.target.id==='relation-filter'&&scene){relationMode=event.target.value;$('#relation-mode').textContent=describeRelations(scene.setRelationMode(relationMode));}});
document.addEventListener('change',event=>{if(event.target.id==='pipeline-toggle'&&scene){pipelinesVisible=event.target.checked;$('#toggle-pipelines').setAttribute('aria-pressed',String(pipelinesVisible));$('#relation-mode').textContent=describeRelations(scene.setPipesVisible(pipelinesVisible));}});
$('#toggle-pipelines').addEventListener('click',()=>{if(!scene)return;pipelinesVisible=!pipelinesVisible;$('#toggle-pipelines').setAttribute('aria-pressed',String(pipelinesVisible));const result=scene.setPipesVisible(pipelinesVisible);if($('#pipeline-toggle'))$('#pipeline-toggle').checked=pipelinesVisible;if($('#relation-mode'))$('#relation-mode').textContent=describeRelations(result);});
$('#area-select').addEventListener('change',event=>{const folder=event.target.value;if(!folder||!scene)return;if(selected){clearSelection();const url=new URL(location.href);url.searchParams.delete('node');navIndex++;navMax=navIndex;history.pushState({cityIndex:navIndex},'',url);updateHistoryButtons();}scene.focusFolder(folder);$('#search').value='';const parts=folder.split('/');parts.forEach((_,i)=>expanded.add(parts.slice(0,i+1).join('/')));renderExplorer();const match=[...document.querySelectorAll('#city-list details[data-folder]')].find(element=>element.dataset.folder===folder);match?.querySelector('summary')?.scrollIntoView({block:'nearest'});});
$('#search').addEventListener('input',renderExplorer);
$('#search').addEventListener('keydown',event=>{if(event.key==='Enter'){const first=$('#city-list [data-node]');if(first){event.preventDefault();select(first.dataset.node);}}});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)){event.preventDefault();$('#search').focus();}if(event.key==='Escape'){if(!$('#floor-interior').hidden){$('#floor-interior').hidden=true;floorRoom?.hide();}else if(document.activeElement===$('#search')){$('#search').value='';renderExplorer();}}});
$('#nav-back').addEventListener('click',()=>history.back());
$('#nav-forward').addEventListener('click',()=>history.forward());
window.addEventListener('popstate',event=>{const id=new URL(location.href).searchParams.get('node');navIndex=Number.isInteger(event.state?.cityIndex)?event.state.cityIndex:0;if(id&&city?.nodes.some(node=>node.id===id))select(id,{record:false});else if(!id&&scene)clearSelection({resetCamera:true});updateHistoryButtons();});
document.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>{const direction={forward:[8,0],back:[-8,0],left:[0,-8],right:[0,8]}[button.dataset.move];scene?.move(...direction);}));
$('#reset').addEventListener('click',()=>scene.reset());
$('#focus-selected').addEventListener('click',()=>{if(selected)scene.focusBuilding(selected);});
$('#zoom-in').addEventListener('click',()=>scene.zoom(.7));
$('#zoom-out').addEventListener('click',()=>scene.zoom(1.4));
$('#floor-exit').addEventListener('click',()=>{$('#floor-interior').hidden=true;floorRoom?.hide();});

try {
  const responses=await Promise.all(['graph','mathlib','mathlib-bridge'].map(name=>fetch(`data/${name}.json`)));
  if(responses.some(response=>!response.ok))throw Error('Missing graph data. Run npm run build:data and npm run build:mathlib.');
  const [p,m,bridge]=await Promise.all(responses.map(response=>response.json()));physlib=p;mathlib=m;city=buildFullCity(p,m,bridge);
  try {const response=await fetch('data/city-declarations.json');if(response.ok){const d=await response.json();if(d?.source?.physlibRevision===p.source.revision&&d.source.mathlibRevision===m.source.revision&&d.source.toolchain===p.source.toolchain&&Array.isArray(d.declarations)&&Array.isArray(d.targets)&&Array.isArray(d.edges)&&d.edges.every(e=>d.targets.some(t=>t.id===e.to)&&d.declarations.some(v=>v.id===e.from)))declarationPilot=d;}} catch {}
  try {const response=await fetch('data/declarations.json');if(response.ok){const candidate=await response.json();if(!validateDeclarations(candidate,p).length)declarationSnapshot=candidate;}} catch {}
  floorIndex=buildFloorIndex(city.nodes,declarationSnapshot,declarationPilot);
  tree=makeFolderTree(city.nodes);$('#count').textContent=city.nodes.length;populateAreas();
  $('#city-counts').textContent=`${city.nodes.filter(n=>n.library==='Physlib').length} Physlib-family files · ${city.mathlibModules} directly imported Mathlib files · ${city.edges.length} shown imports`;
  $('#snapshot').innerHTML=`Physlib <a href="${p.source.repository}/commit/${p.source.revision}">${esc(p.source.revision.slice(0,10))} ↗</a><br>Mathlib <a href="${m.source.repository}/commit/${m.source.revision}">${esc(m.source.revision.slice(0,10))} ↗</a><br>${esc(p.source.toolchain)}`;
  renderExplorer();scene=createCityScene($('#city-canvas'),city,floorIndex,id=>select(id),inspectFloor);$('#loading').hidden=true;
  const requested=new URL(location.href).searchParams.get('node');
  if(requested&&city.nodes.some(node=>node.id===requested))select(requested,{focus:true,record:false});
  else if(requested){const map=requested.startsWith('map:')?p.maps.find(item=>item.path===requested.slice(4)):null;const module=m.modules.find(item=>item.id===requested);const link=map?sourceUrl(p.source,map.path):module?sourceUrl(m.source,module.path):null;$('#city-inspector').innerHTML=`<div class="empty"><h2>Not in this city</h2><p>${esc(requested)} is not a displayed file. Search the explorer for another file.${link?` <a href="${link}" target="_blank" rel="noreferrer">Open its source ↗</a>`:''}</p></div>`;}
} catch(error) {$('#loading').innerHTML=`<div class="error">Could not load city: ${esc(error.message)}</div>`;}
