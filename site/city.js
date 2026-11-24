import {districtIdentity,boroughColors,contrast} from './city-colors.js';
import {atomicPlan} from './city-atomic-plan.js';
import { buildFullCity, cityNeighborhood } from './city-model.js';
import { makeFolderTree, renderFolderTree } from './city-explorer.js';
import { createCityScene } from './city-scene.js';
import { createRadialMap } from './city-map.js';
import { buildFloorIndex } from './city-floors.js';
import { validateDeclarations } from './declarations.js';
import { createFloorRoom } from './floor-room.js';
import { mathlibPipelines, relationGroups } from './city-relations.js';
import {createGeographyMap} from './city-geography-map.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceUrl = (source, path, line) => `${source.repository}/blob/${source.revision}/${path.split('/').map(encodeURIComponent).join('/')}${line ? `#L${line}` : ''}`;
let city, physlib, mathlib, scene, radialMap, tree, selected, declarationPilot, declarationSnapshot, floorIndex, floorRoom;
let geographyMiniMap;
let navIndex=0, navMax=0, relationMode='imports',pipelinesVisible=true;
const expanded = new Set(['Physlib','Physlib/ClassicalMechanics']);
const visualMode=new URL(location.href).searchParams.get('visual')||(new URL(location.href).searchParams.has('district')||new URL(location.href).searchParams.has('assetFixture')||new URL(location.href).searchParams.get('layout')==='legacy'?'c':'c4'),chromatic=['c2','c3','c4'].includes(visualMode),atomicMode=['c1','c2','c3','c4'].includes(visualMode);
const urban=new URL(location.href).searchParams.get('layout')!=='legacy';
function breadcrumbs(path=''){
 let nav=$('#geography-breadcrumbs');if(!nav){nav=document.createElement('nav');nav.id='geography-breadcrumbs';nav.setAttribute('aria-label','Source geography');$('.title-block').append(nav);}
 nav.replaceChildren();const home=document.createElement('button');home.textContent='Surface overview';home.onclick=()=>{if(showCity())scene.overview();breadcrumbs();};nav.append(home);
 const parts=path.split('/').filter(Boolean);for(let i=0;i<parts.length;i++){const button=document.createElement('button');button.textContent=parts[i]==='@root'?'Root Modules':parts[i];const folder=parts.slice(0,i+1).join('/');button.onclick=()=>visitFolder(folder);if(chromatic&&!folder.startsWith('Mathlib')){const identity=districtIdentity(folder),color=i===0?boroughColors[parts[0]]:identity.primary;button.style.borderBottomColor=color;button.style.borderBottomWidth='3px';button.dataset.districtColor=color;button.title=folder;}nav.append(button);}
}
function ensureScene(){
  if(!scene){scene=createCityScene($('#city-canvas'),city,floorIndex,id=>select(id),inspectFloor);if(urban){
    const mini=document.createElement('details');mini.className='geography-minimap';mini.open=false;const summary=document.createElement('summary');summary.textContent='City map · select a district';const map=document.createElement('div');mini.append(summary,map);$('#city-canvas').append(mini);geographyMiniMap=createGeographyMap(map,scene.manifest,visitFolder,id=>select(id));
  }}
  return scene;
}
function showMap(underground=false){
  if(!radialMap)return;
  $('#floor-interior').hidden=true;floorRoom?.hide();scene?.pause();
  $('#city-canvas').inert=true;$('#city-canvas').setAttribute('aria-hidden','true');
  radialMap.setLayer(underground);$('#city-map').hidden=false;$('.canvas-wrap').classList.add('map-open');
  $('#toggle-layer').setAttribute('aria-pressed',String(underground));
  $('#toggle-layer').textContent=underground?'Return to surface':'Explore Mathlib below';
}
function showCity(){
  try{ensureScene();}catch(error){let message=$('#city-map .map-error');if(!message){message=document.createElement('div');message.className='map-error';message.setAttribute('role','alert');$('#city-map').append(message);}message.textContent=`Could not open the 3D city: ${error.message}`;return false;}
  if($('#city-map').hidden)return true;
  $('#city-map').hidden=true;$('.canvas-wrap').classList.remove('map-open');
  $('#city-canvas').inert=false;$('#city-canvas').removeAttribute('aria-hidden');scene?.resume();
  return true;
}
function describeRelations(result){if(relationMode==='none')return 'File arrows hidden';return `${result.drawn} of ${result.total} ${relationMode==='imports'?'imports':relationMode==='importers'?'importers':'relationships'} shown${result.total>result.drawn?' · all listed in inspector':''}`;}

function renderExplorer() {
  const list=$('#city-list'),scroll=list.scrollTop;
  list.innerHTML = renderFolderTree(tree, {selected, query:$('#search').value, expanded, escape:esc});
  if(chromatic&&$('#search').value)for(const button of list.querySelectorAll('[data-node]')){const node=city.nodes.find(n=>n.id===button.dataset.node);if(!node||node.library==='Mathlib')continue;const identity=districtIdentity(node.module.path),address=document.createElement('small');address.textContent=identity.key.replace('/@root',' / Root Modules');address.setAttribute('aria-hidden','true');button.setAttribute('aria-label',node.id);button.style.borderBottom='2px solid '+identity.primary;button.dataset.districtColor=identity.primary;button.append(address);}
  list.scrollTop=scroll;
}

function updateHistoryButtons(){$('#nav-back').disabled=navIndex<=0;$('#nav-forward').disabled=navIndex>=navMax;}
function clearSelection({resetCamera=false}={}){selected=null;scene?.select(null);if(resetCamera)scene?.reset();radialMap?.setSelected(null);$('.canvas-wrap').classList.remove('map-selection');$('#current-selection').textContent='Select a file';$('#city-inspector').innerHTML='<div class="empty"><h2>Select a file.</h2><p>Explore its imports and recorded declarations.</p></div>';$('#floor-interior').hidden=true;floorRoom?.hide();renderExplorer();}
function visitFolder(folder){
  if(!folder||!city)return;
  if(urban){if(showCity()){scene.focusFolder(folder);breadcrumbs(folder);geographyMiniMap?.setScope(folder);}const url=new URL(location.href);url.searchParams.delete('view');url.searchParams.set('folder',folder);navIndex++;navMax=navIndex;history.pushState({cityIndex:navIndex},'',url);updateHistoryButtons();return;}
  if($('#city-map').hidden||radialMap.underground!==folder.startsWith('Mathlib'))showMap(folder.startsWith('Mathlib'));
  if(selected)clearSelection();
  radialMap.setScope(folder);$('#search').value='';
  const url=new URL(location.href);url.searchParams.delete('node');url.searchParams.set('view','map');url.searchParams.set('folder',folder);
  navIndex++;navMax=navIndex;history.pushState({cityIndex:navIndex},'',url);updateHistoryButtons();
  const parts=folder.split('/');parts.forEach((_,i)=>expanded.add(parts.slice(0,i+1).join('/')));
  renderExplorer();
  const match=[...document.querySelectorAll('#city-list details[data-folder]')].find(element=>element.dataset.folder===folder);
  match?.querySelector('summary')?.scrollIntoView({block:'nearest'});
}
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
  const selection=scene?.select(id);if(selection)$('#relation-mode').textContent=describeRelations(selection);
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
  if($('#city-map').hidden)try {floorRoom??=createFloorRoom($('#floor-room'));floorRoom.show();} catch {$('#floor-room').classList.add('room-fallback');}
  for(const button of document.querySelectorAll('[data-floor]'))button.classList.toggle('active',Number(button.dataset.floor)===index);
  if($('#city-map').hidden)scene?.selectFloor(id,index);
}

function inspectDeclaration(id) {
  const targets=new Map(declarationPilot.targets.map(d=>[d.id,d]));
  const edges=declarationPilot.edges.filter(edge=>edge.from===id);
  $('#declaration-result').innerHTML=`<h3>${esc(id)}</h3><p class="note">${edges.length} recorded Mathlib relationships in the pilot scope. “Value” includes definition bodies or theorem proofs. Some edges may be routed through omitted declarations.</p>${edges.length?`<ul class="inspect-list">${edges.map(edge=>{const target=targets.get(edge.to);return `<li>${esc(edge.to)} · ${esc(edge.kind)}<br>${mathlibTarget(target)}</li>`;}).join('')}</ul>`:'<p class="note">No Mathlib relationships recorded within the included scope.</p>'}<p class="note">Absence does not establish non-use.</p>`;
  const shown=scene?.showDeclarationLinks(edges.map(edge=>({from:selected,to:targets.get(edge.to).module})))??0;
  $('#relation-mode').textContent=`Declaration links · ${shown} displayed module pairs · partial, may be routed`;
  if(!$('#floor-interior').hidden)$('#floor-dependencies').innerHTML=$('#declaration-result').innerHTML;
}

function inspectTarget(id) {
  const declarations=new Map(declarationPilot.declarations.map(d=>[d.id,d]));
  const edges=declarationPilot.edges.filter(edge=>edge.to===id);
  $('#target-result').innerHTML=`<h3>${esc(id)}</h3><p class="note">${edges.length} recorded Physlib relationships in the partial pilot. Some may be routed through omitted declarations.</p><ul class="inspect-list">${edges.map(edge=>{const declaration=declarations.get(edge.from);return `<li>${esc(edge.from)} · ${esc(edge.kind)}<br><button data-node="${esc(declaration.module)}">${esc(declaration.module)}</button></li>`;}).join('')}</ul>`;
  const shown=scene?.showDeclarationLinks(edges.map(edge=>({from:declarations.get(edge.from).module,to:selected})))??0;
  $('#relation-mode').textContent=`Declaration links · ${shown} displayed module pairs · partial, may be routed`;
  if(!$('#floor-interior').hidden)$('#floor-dependencies').innerHTML=$('#target-result').innerHTML;
}

function select(id,{focus=true,record=true,stayMap=!$('#city-map').hidden}={}) {
  const hood=cityNeighborhood(city,id);if(!hood)return;
  if(!stayMap&&!showCity())return;
  const changed=selected!==id;
  selected=id;$('#floor-interior').hidden=true;floorRoom?.hide();const {node,imports,importers}=hood,source=node.library==='Mathlib'?mathlib.source:physlib.source;
  const folder=node.module.path.replaceAll('\\','/').split('/').slice(0,-1).join('/');
  if(urban){breadcrumbs(folder||node.id);if(chromatic){const leaf=document.createElement('span');leaf.textContent=node.module.path.split('/').at(-1);leaf.setAttribute('aria-current','page');leaf.className='breadcrumb-file';$('#geography-breadcrumbs').append(leaf);}geographyMiniMap?.setSelected(id);geographyMiniMap?.setScope(folder);}
  const parts=folder.split('/');parts.forEach((_,i)=>expanded.add(parts.slice(0,i+1).join('/')));
  const maps=node.library==='Physlib'?physlib.maps.filter(map=>map.references.includes(node.module.path)):[];
  const pipelineCount=mathlibPipelines(city,id).length;
  const groups=relationGroups(city,id);
  const measure=floorIndex.get(id).lineCount;
  $('#city-inspector').innerHTML=`<span class="label">${esc(node.id.split('.')[0].toUpperCase())} · FILE</span><h2>${esc(atomicMode&&!id.startsWith('Mathlib')?id.split('.').at(-1):id)}</h2><p class="city-path">${esc(node.module.path)}</p>${chromatic&&!id.startsWith('Mathlib')?`<p class="district-context" data-district-color="${districtIdentity(node.module.path).primary}"><i style="background:${districtIdentity(node.module.path).primary}" aria-hidden="true"></i>${esc(districtIdentity(node.module.path).key.replace('/@root',' / Root Modules'))} · directory address</p>`:''}<p class="note">${measure===null?'Source line count unavailable; height uses available declaration data.':`${measure.toLocaleString()} source lines · height is logarithmic`}</p>${new URL(location.href).searchParams.get('visual')==='c1'&&!id.startsWith('Mathlib')?`<p class="visual-encoding">Display: ${atomicPlan(node,floorIndex.get(id).height).height.toFixed(1)} units · ${atomicPlan(node,floorIndex.get(id).height).name}. Architectural storeys are decorative; source floors below retain exact ranges.</p>`:''}<div class="city-inspector-links"><a href="${sourceUrl(source,node.module.path)}" target="_blank" rel="noreferrer">Lean source ↗</a></div><div class="relation-controls"><label for="relation-filter">Connections in the city</label><select id="relation-filter"><option value="imports">Imports (${imports.length})</option><option value="importers">Imported by (${importers.length})</option><option value="both">Both directions</option><option value="none">Hide selected pipes</option></select><p>Pink: files this file imports. Orange: files importing it. Up to 12 selected pipes are highlighted; all file imports remain in the lists below.</p><label class="pipeline-toggle"><input type="checkbox" id="pipeline-toggle" ${pipelinesVisible?'checked':''}> Show city pipes (${pipelineCount} Mathlib links for this file)</label><p>These routes represent direct file imports, not declaration-level usage.</p><button type="button" id="view-foundations" ${pipelineCount?'':'disabled'}>Focus Mathlib pipes</button></div>${declarationSection(node)}<h3>Imports · ${imports.length} in city</h3>${relationList(imports,'to')}<h3>Imported by · ${importers.length} in city</h3>${relationList(importers,'from')}<h3>API maps</h3>${maps.length?`<ul class="inspect-list">${maps.map(map=>`<li><a href="${sourceUrl(physlib.source,map.path)}" target="_blank" rel="noreferrer">${esc(map.title)} ↗</a></li>`).join('')}</ul>`:'<p class="note">No linked API maps in this snapshot.</p>'}<p class="city-note">A file import does not establish declaration usage. Declaration links are partial and may be routed. Other relationships may lie outside this city.</p>`;
  $('#relation-filter').value=relationMode;
  $('#relation-filter').closest('.relation-controls').insertAdjacentHTML('afterbegin',`<div class="relation-groups" aria-label="Relationship categories"><button type="button" data-rel-group="mathlib" class="group-math" ${groups.mathlib.length?'':'disabled'}><span aria-hidden="true"></span><strong>Mathlib</strong><small>${groups.mathlib.length} pipelines</small></button><button type="button" data-rel-group="uses" class="group-uses" ${groups.uses.length?'':'disabled'}><span aria-hidden="true"></span><strong>Uses in Physlib</strong><small>${groups.uses.length} files</small></button><button type="button" data-rel-group="usedBy" class="group-usedby" ${groups.usedBy.length?'':'disabled'}><span aria-hidden="true"></span><strong>Used by Physlib</strong><small>${groups.usedBy.length} files</small></button></div>`);
  $('#current-selection').innerHTML=`<span>${esc(node.id.split('.')[0])} · Selected file</span><strong>${esc(id)}</strong><small id="relation-mode"></small>`;
  if(stayMap){$('.canvas-wrap').classList.add('map-selection');radialMap.setSelected(id);$('#focus-selected').textContent='View in 3D';$('#relation-mode').textContent='Open 3D to view pipes';}else{if(focus)scene.focusBuilding(id);const graph=scene.select(id);$('#relation-mode').textContent=describeRelations(graph);}renderExplorer();
  const url=new URL(location.href);url.searchParams.set('node',id);
  if(stayMap)url.searchParams.set('view','map');else{url.searchParams.delete('view');url.searchParams.delete('folder');}
  if(record&&changed){navIndex++;navMax=navIndex;history.pushState({cityIndex:navIndex},'',url);}else history.replaceState({cityIndex:navIndex},'',url);
  updateHistoryButtons();
}

document.addEventListener('click',event=>{
  const category=event.target.closest('[data-rel-group]');if(category&&scene){const kind=category.dataset.relGroup;if(kind==='mathlib'){if(!pipelinesVisible){pipelinesVisible=true;scene.setPipesVisible(true);$('#toggle-pipelines').setAttribute('aria-pressed','true');$('#pipeline-toggle').checked=true;}scene.focusFoundations();}else{relationMode=kind==='uses'?'imports':'importers';$('#relation-filter').value=relationMode;$('#relation-mode').textContent=describeRelations(scene.setRelationMode(relationMode));}}
  if(event.target.closest('#view-foundations'))scene?.focusFoundations();
  const folder=event.target.closest('summary')?.parentElement;if(folder?.dataset.folder)visitFolder(folder.dataset.folder);
  const node=event.target.closest('[data-node]');if(node)select(node.dataset.node);
  const floor=event.target.closest('[data-floor]');if(floor)inspectFloor(selected,Number(floor.dataset.floor));
  const declaration=event.target.closest('[data-declaration]');if(declaration&&declarationPilot)inspectDeclaration(declaration.dataset.declaration);
  const target=event.target.closest('[data-target]');if(target&&declarationPilot)inspectTarget(target.dataset.target);
});
document.addEventListener('toggle',event=>{const folder=event.target;if(!folder.matches?.('details[data-folder]'))return;if(folder.open)expanded.add(folder.dataset.folder);else expanded.delete(folder.dataset.folder);},true);
document.addEventListener('change',event=>{if(event.target.id==='relation-filter'&&scene){relationMode=event.target.value;$('#relation-mode').textContent=describeRelations(scene.setRelationMode(relationMode));}});
document.addEventListener('change',event=>{if(event.target.id==='pipeline-toggle'&&scene){pipelinesVisible=event.target.checked;$('#toggle-pipelines').setAttribute('aria-pressed',String(pipelinesVisible));$('#relation-mode').textContent=describeRelations(scene.setPipesVisible(pipelinesVisible));}});
$('#toggle-pipelines').addEventListener('click',()=>{if(!scene)return;pipelinesVisible=!pipelinesVisible;$('#toggle-pipelines').setAttribute('aria-pressed',String(pipelinesVisible));const result=scene.setPipesVisible(pipelinesVisible);if($('#pipeline-toggle'))$('#pipeline-toggle').checked=pipelinesVisible;if($('#relation-mode'))$('#relation-mode').textContent=describeRelations(result);});
$('#area-select').addEventListener('change',event=>visitFolder(event.target.value));
$('#search').addEventListener('input',renderExplorer);
$('#search').addEventListener('keydown',event=>{if(event.key==='Enter'){const first=$('#city-list [data-node]');if(first){event.preventDefault();select(first.dataset.node);}}});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)){event.preventDefault();$('#search').focus();}if(event.key==='Escape'){if(!$('#floor-interior').hidden){$('#floor-interior').hidden=true;floorRoom?.hide();}else if(document.activeElement===$('#search')){$('#search').value='';renderExplorer();}}});
$('#nav-back').addEventListener('click',()=>history.back());
$('#nav-forward').addEventListener('click',()=>history.forward());
window.addEventListener('popstate',event=>{const params=new URL(location.href).searchParams,id=params.get('node'),folder=params.get('folder'),map=params.get('view')==='map'||(!urban&&!id);navIndex=Number.isInteger(event.state?.cityIndex)?event.state.cityIndex:0;if(map){showMap((folder||id||'').startsWith('Mathlib'));if(folder)radialMap.setScope(folder);}if(id&&city?.nodes.some(node=>node.id===id))select(id,{record:false,stayMap:map});else if(!urban)clearSelection({resetCamera:!map});if(urban&&showCity()){if(folder){scene.focusFolder(folder);breadcrumbs(folder);}else if(!id){scene.overview();breadcrumbs();}}updateHistoryButtons();});
document.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>{const direction={forward:[8,0],back:[-8,0],left:[0,-8],right:[0,8]}[button.dataset.move];scene?.move(...direction);}));
$('#reset').addEventListener('click',()=>{if(urban){if(showCity())scene.overview();breadcrumbs();}else showMap(false);});
$('#focus-selected').addEventListener('click',()=>{if(selected&&showCity()){select(selected,{focus:true,record:false,stayMap:false});}});
$('#city-canvas').addEventListener('city-layer-change',event=>{const below=event.detail.underground;$('#toggle-layer').setAttribute('aria-pressed',String(below));$('#toggle-layer').textContent=below?'Return to surface':'Explore Mathlib below';});
$('#overview').addEventListener('click',()=>{if(urban){if(showCity())scene.overview();breadcrumbs();}else showMap($('#toggle-layer').getAttribute('aria-pressed')==='true');});
$('#toggle-layer').addEventListener('click',event=>{const below=event.currentTarget.getAttribute('aria-pressed')!=='true';if(!$('#city-map').hidden)showMap(below);else scene?.setLayer(below);event.currentTarget.setAttribute('aria-pressed',String(below));event.currentTarget.textContent=below?'Return to surface':'Explore Mathlib below';});
$('#quality').addEventListener('change',event=>scene?.setQuality(event.target.value));

$('#zoom-in').addEventListener('click',()=>$('#city-map').hidden?scene.zoom(.7):radialMap.zoom(.7));
$('#zoom-out').addEventListener('click',()=>$('#city-map').hidden?scene.zoom(1.4):radialMap.zoom(1.4));
$('#floor-exit').addEventListener('click',()=>{$('#floor-interior').hidden=true;floorRoom?.hide();});

try {
  const responses=await Promise.all(['graph','mathlib','mathlib-bridge'].map(name=>fetch(`data/${name}.json`,{cache:'no-cache'})));
  if(responses.some(response=>!response.ok))throw Error('Missing graph data. Run npm run build:data and npm run build:mathlib.');
  const [p,m,bridge]=await Promise.all(responses.map(response=>response.json()));physlib=p;mathlib=m;city=buildFullCity(p,m,bridge);
  try {const response=await fetch('data/city-declarations.json',{cache:'no-cache'});if(response.ok){const d=await response.json();if(d?.source?.physlibRevision===p.source.revision&&d.source.mathlibRevision===m.source.revision&&d.source.toolchain===p.source.toolchain&&Array.isArray(d.declarations)&&Array.isArray(d.targets)&&Array.isArray(d.edges)&&d.edges.every(e=>d.targets.some(t=>t.id===e.to)&&d.declarations.some(v=>v.id===e.from)))declarationPilot=d;}} catch {}
  try {const response=await fetch('data/declarations.json',{cache:'no-cache'});if(response.ok){const candidate=await response.json();if(!validateDeclarations(candidate,p).length)declarationSnapshot=candidate;}} catch {}
  floorIndex=buildFloorIndex(city.nodes,declarationSnapshot,declarationPilot);
  tree=makeFolderTree(city.nodes);$('#count').textContent=city.nodes.length;populateAreas();
  $('#city-counts').textContent=`${city.nodes.filter(n=>n.library==='Physlib').length} Physlib-family files · ${city.mathlibModules} directly imported Mathlib files · ${city.edges.length} shown imports`;
  $('#snapshot').innerHTML=`Physlib <a href="${p.source.repository}/commit/${p.source.revision}">${esc(p.source.revision.slice(0,10))} ↗</a><br>Mathlib <a href="${m.source.repository}/commit/${m.source.revision}">${esc(m.source.revision.slice(0,10))} ↗</a><br>${esc(p.source.toolchain)}`;
  renderExplorer();radialMap=urban&&!((new URL(location.href).searchParams.get('folder')||new URL(location.href).searchParams.get('node')||'').startsWith('Mathlib'))?createGeographyMap($('#city-map'),ensureScene().manifest,visitFolder,id=>select(id,{stayMap:true})):createRadialMap($('#city-map'),city,visitFolder,id=>select(id,{stayMap:true}));$('#loading').hidden=true;
  const params=new URL(location.href).searchParams,requested=params.get('node'),folder=params.get('folder'),mapView=params.get('view')==='map';
  if(mapView){showMap((folder||requested||'').startsWith('Mathlib'));if(folder)radialMap.setScope(folder);}
  if(requested&&city.nodes.some(node=>node.id===requested))select(requested,{focus:true,record:false,stayMap:mapView});
  else if(requested){const map=requested.startsWith('map:')?p.maps.find(item=>item.path===requested.slice(4)):null;const module=m.modules.find(item=>item.id===requested);const link=map?sourceUrl(p.source,map.path):module?sourceUrl(m.source,module.path):null;$('#city-inspector').innerHTML=`<div class="empty"><h2>Not in this city</h2><p>${esc(requested)} is not a displayed file. Search the explorer for another file.${link?` <a href="${link}" target="_blank" rel="noreferrer">Open its source ↗</a>`:''}</p></div>`;}
  if(!mapView&&(!requested||!city.nodes.some(node=>node.id===requested))){if(urban){if(showCity())scene.overview();breadcrumbs();if(folder)visitFolder(folder);}else showMap(false);}
  if(['units','procedural'].includes(params.get('district'))&&!mapView){
    if(!requested)select('Physlib.Units.ISQDimensionBase',{focus:false,record:false,stayMap:false});
    if(showCity())scene.focusShowcaseView(params.get('districtView')||'overview');
  }
  if(urban&&folder&&!mapView&&showCity()){scene.focusFolder(folder);breadcrumbs(folder);}
  if(params.has('reviewPose')&&!mapView){try{scene.reviewPose(JSON.parse(params.get('reviewPose')));}catch{}}
} catch(error) {$('#loading').innerHTML=`<div class="error">Could not load city: ${esc(error.message)}</div>`;}

// Reversible cinematic mode: existing source panels become non-modal drawers.
if(chromatic){
 const controls=document.querySelector('.city-toolbar .controls'),explore=document.createElement('button'),files=document.createElement('button'),inspect=document.createElement('button');
 explore.id='explore-mode';explore.textContent='Explore';explore.setAttribute('aria-pressed','false');files.id='explore-files';files.textContent='Files';files.setAttribute('aria-controls','city-list');inspect.id='explore-inspector';inspect.textContent='Inspector';inspect.setAttribute('aria-controls','city-inspector');
 controls.append(explore,files,inspect);document.querySelector('.city-layer-key small').textContent='District colour = directory address, not scientific rank or proof status. White streets and civic landmarks are scenery. Selected skywalk arrows are recorded imports; all destinations remain in the Inspector. Source floors retain exact ranges. Drag to pan, right-drag to orbit, wheel to zoom; W A S D and Home recover navigation.';
 function panel(name){for(const n of ['files','inspector'])document.body.classList.toggle('explore-'+n+'-open',name===n);files.setAttribute('aria-expanded',String(name==='files'));inspect.setAttribute('aria-expanded',String(name==='inspector'));}
 explore.onclick=()=>{const active=!document.body.classList.contains('explore-city');document.body.classList.toggle('explore-city',active);explore.setAttribute('aria-pressed',String(active));explore.textContent=active?'Exit Explore':'Explore';panel(null);const u=new URL(location.href);active?u.searchParams.set('explore','1'):u.searchParams.delete('explore');history.replaceState(history.state,'',u);};
 files.onclick=()=>{const active=!document.body.classList.contains('explore-files-open');panel(active?'files':null);if(active)document.querySelector('#search').focus();};inspect.onclick=()=>panel(document.body.classList.contains('explore-inspector-open')?null:'inspector');
 document.addEventListener('keydown',e=>{if(!document.body.classList.contains('explore-city'))return;if(e.key==='Escape'){panel(null);explore.focus();}if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){panel('files');document.querySelector('#search').focus();}});
 if(new URL(location.href).searchParams.get('explore')==='1')explore.click();
}
