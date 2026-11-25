import {indexElaborated} from './geneva-elaborated.js';
import {declarationLocator} from './geneva-declaration-navigation.js';
import {nativeLoader} from './geneva-native-metadata.js';
let loadNative=null;
let index=null,version=0,loadPublished=null,publication=null,locator=null,active=null,trail=[],travelUI=null;
const LIMIT=150*1024*1024;
export function setupElaboratedImport(production,refresh,onTravel,onReset){
 const input=document.getElementById('elaboratedFile'),status=document.getElementById('elaboratedStatus');
 let pending=null;
 const apply=(snapshot,label)=>{const next=indexElaborated(snapshot,production);index=next;locator=declarationLocator(production,index);loadNative=nativeLoader(index);if(active&&!locator.locate(active)){active=null;trail=[];onReset?.();}status.textContent=label+' · '+index.local.size.toLocaleString()+' PhysLib declarations · '+snapshot.dependencies.length.toLocaleString()+' recorded relationships · partial scope';refresh();travelUI?.render();if(active)travelUI?.select(active,false);};
 input.onchange=async()=>{const file=input.files[0];if(!file)return;const token=++version;try{if(file.size>LIMIT)throw Error('Snapshot exceeds 150 MiB browser import limit');const snapshot=JSON.parse(await file.text());if(token===version)apply(snapshot,'Loaded locally');}catch(e){if(token===version)status.textContent='Import rejected: '+e.message;}};
 const manifestPromise=fetch('data/geneva-elaborated-manifest.json',{cache:'no-cache'}).then(async r=>{
  if(!r.ok)return {status:'unavailable',reason:'No published extraction manifest.'};
  const m=await r.json(),s=m.source,p=production.model.source;
  if(m.schemaVersion!==1||s?.physlibRevision!==p.revision||s.toolchain!==p.toolchain||s.mathlibRevision!==production.mathlibRevision)throw Error('Published manifest does not match this city.');
  if(m.status==='unavailable')return m;
  if(m.status!=='available'||!Number.isInteger(m.bytes)||m.bytes<1||m.bytes>LIMIT||!/^[a-f0-9]{64}$/.test(m.sha256)||!Number.isInteger(m.counts?.declarations)||!Number.isInteger(m.counts?.dependencies))throw Error('Invalid publication manifest');
  return m;
 }).catch(e=>({status:'unavailable',reason:e.message})).then(m=>{publication=m;if(!index&&version===0)status.textContent=m.status==='available'?'Ready to load · '+m.counts.declarations.toLocaleString()+' declarations · '+m.counts.dependencies.toLocaleString()+' relationships · open a complex’s mathematical relationships to load.':m.reason||'No matching publication.';return m;});
 loadPublished=()=>{
  if(index)return Promise.resolve(true);if(pending)return pending;
  const token=version;
  pending=(async()=>{try{const m=await manifestPromise;if(token!==version)return false;if(m.status!=='available'){status.textContent=m.reason||'No matching publication.';return false;}
   status.textContent='Loading revision-matched mathematical graph…';
   const response=await fetch('data/geneva-elaborated.json?sha256='+m.sha256);if(!response.ok)throw Error('Snapshot HTTP '+response.status);
   const bytes=await response.arrayBuffer();if(bytes.byteLength!==m.bytes||bytes.byteLength>LIMIT)throw Error('Snapshot length mismatch');
   if(!globalThis.crypto?.subtle)throw Error('Secure context required to verify published snapshot');
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
   if(digest!==m.sha256)throw Error('Snapshot integrity mismatch');
   const snapshot=JSON.parse(new TextDecoder().decode(bytes));
   if(token!==version)return false;
   if(snapshot.declarations?.length!==m.counts.declarations||snapshot.dependencies?.length!==m.counts.dependencies)throw Error('Snapshot counts mismatch');
   apply(snapshot,'Published companion');return true;
  }catch(e){if(token===version)status.textContent='Published companion unavailable: '+e.message;return false;}finally{pending=null;}})();return pending;
 };
 const tools=document.getElementById('elaboratedTools');tools.addEventListener('toggle',()=>{if(tools.open&&!index)void loadPublished();});
 travelUI=setupTravel(production,onTravel);return travelUI;
}
function attachNative(parent,row,production){
 const add=(tag,text,p)=>{const e=document.createElement(tag);if(text!==null)e.textContent=text;p.append(e);return e;};
 const section=add('details',null,parent);section.dataset.nativeMetadata=row.id;add('summary','Native Lean signature, range and direct references',section);const content=add('div',null,section);let loaded=false,loading=false;
 const action=async()=>{if(loaded||loading)return;loading=true;content.textContent='Loading verified native metadata…';try{
  const metadata=await loadNative?.(row);content.replaceChildren();
  if(!metadata){add('p','No matching native metadata is published for this declaration yet.',content);content.dataset.nativeState='unavailable';return;}
  loaded=true;content.dataset.nativeState='loaded';
  if(metadata.statement){const pre=add('pre',metadata.statement,content);pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px';}else add('p','Signature unavailable from Lean pretty-printer.',content);
  const range=metadata.range,path=production.modulePaths[row.module];
  if(range){const link=add('a','Exact source: lines '+range.line+'–'+range.endLine+' · columns '+range.column+'–'+range.endColumn,content);link.href='https://github.com/leanprover-community/physlib/blob/'+production.model.source.revision+'/'+path.split('/').map(encodeURIComponent).join('/')+'#L'+range.line+'-L'+range.endLine;link.target='_blank';link.rel='noopener noreferrer';}
  else add('p','No exact declaration range recorded in the Lean environment.',content);
  const refs=metadata.directReferences;add('p','Direct expression constants, distinct from the scoped and potentially routed graph.',content);
  for(const [label,records] of [['Type references',refs.type],['Value references',refs.value]]){
   const d=add('details',null,content);add('summary',label+' ('+records.length+')',d);if(label==='Value references'&&!refs.valueAvailable){add('p','Lean value unavailable; this is not an empty proof.',d);continue;}
   let offset=0;const list=add('div',null,d);const more=()=>{for(const x of records.slice(offset,offset+60)){const line=add('div',x.id+' · '+x.module,list);line.className='qualified-edge';if(index?.nodes.get(x.id)?.module===x.module&&locator?.locate(x.id)){const b=add('button','Travel to exact declaration',line);b.type='button';b.onclick=()=>travelUI?.select(x.id);}else if(x.module.startsWith('Mathlib.')&&/^[A-Za-z0-9_.]+$/.test(x.module)){const a=add('a','Pinned Mathlib module',line);a.href='https://github.com/leanprover-community/mathlib4/blob/'+index.source.mathlibRevision+'/'+x.module.replaceAll('.','/')+'.lean';a.target='_blank';a.rel='noopener noreferrer';}}offset+=60;if(offset<records.length){const b=add('button','Show more',d);b.type='button';b.onclick=()=>{b.remove();more();};}};d.addEventListener('toggle',()=>{if(d.open&&!offset)more();});
  }
 }catch(e){content.textContent='Native metadata unavailable: '+e.message;content.dataset.nativeState='error';}finally{loading=false;}};
 section.addEventListener('toggle',()=>{if(section.open)void action();});
}
function setupTravel(production,onTravel){
 const $=id=>document.getElementById(id),root=$('declarationTravel'),query=$('qualifiedQuery'),kind=$('qualifiedKind'),results=$('qualifiedResults'),detail=$('qualifiedDetail'),back=$('declarationBack'),status=$('qualifiedStatus');
 const add=(tag,text,p)=>{const e=document.createElement(tag);if(text!==null)e.textContent=text;p.append(e);return e;};
 const button=(text,p,fn)=>{const b=add('button',text,p);b.type='button';b.onclick=fn;return b;};
 const kindText=k=>({statement:'Statement reference','theorem-proof-or-routed':'Theorem value / routed reference','value-or-routed':'Definition value / routed reference'})[k]||k;
 function render(){results.replaceChildren();if(!locator){status.textContent='Open to load the published mathematical graph.';return;}
  if(!query.value.trim()){status.textContent='Search exact or partial qualified names and module names.';return;}
  const {total,rows}=locator.search(query.value,kind.value);status.textContent=total.toLocaleString()+' matching local declarations'+(total>rows.length?' · first '+rows.length:'');
  for(const row of rows){const b=button(row.id+' · '+row.kind,results,()=>select(row.id));b.dataset.qualifiedResult=row.id;}
 }
 function renderDetail(){
  detail.replaceChildren();back.disabled=!trail.length;
  if(!active||!locator)return;
  const row=index.nodes.get(active),n=locator.neighborhood(active);if(!row||!n)return;
  const title=add('h3',row.id,detail);title.dataset.activeDeclaration=row.id;add('p',row.kind+' · '+row.module,detail);
  add('p',n.origin.placement==='inferred-role'?'Location: inferred role building within exact owning module complex.':'Location: exact owning module complex; no verified individual role building.',detail);
  const src=add('a',row.line?'Pinned source range':'Pinned source module',detail);src.href='https://github.com/leanprover-community/physlib/blob/'+production.model.source.revision+'/'+production.modulePaths[row.module].split('/').map(encodeURIComponent).join('/')+(row.line?'#L'+row.line:'');src.target='_blank';src.rel='noopener noreferrer';
  attachNative(detail,row,production);
  add('p',n.totals.out+' prerequisite records · '+n.totals.in+' dependent records · '+n.totals.sameComplex+' within this complex · '+n.totals.external+' external records. '+n.groups.length+' inter-complex directional groups. Map shows up to 14 groups per direction, subject to filters.',detail);
  add('small','Expression relationships may be routed through omitted declarations; not certified direct proof edges. Mathlib references are scoped; no fabricated external buildings.',detail);
  for(const [label,edges,key] of [['Prerequisites',index.uses.get(active)||[],'to'],['Dependents',index.usedBy.get(active)||[],'from']]){
   const section=add('details',null,detail);add('summary',label+' ('+edges.length+')',section);section.open=label==='Prerequisites';let offset=0;
   const list=add('div',null,section);const more=()=>{for(const e of edges.slice(offset,offset+60)){
    const target=index.nodes.get(e[key]),line=add('div',null,list);line.className='qualified-edge';add('div',target.id,line);add('small',kindText(e.kind)+' · '+target.module,line);
    if(locator.locate(target.id)){const b=button('Travel to declaration',line,()=>select(target.id));b.dataset.travelDeclaration=target.id;}
    else if(!index.local.has(target.id)&&target.module.startsWith('Mathlib.')&&/^[A-Za-z0-9_.]+$/.test(target.module)){const a=add('a','Open pinned Mathlib module',line);a.href='https://github.com/leanprover-community/mathlib4/blob/'+index.source.mathlibRevision+'/'+target.module.replaceAll('.','/')+'.lean';a.target='_blank';a.rel='noopener noreferrer';}
    else add('small',' · No verified city location',line);
   }offset+=60;if(offset<edges.length){const b=button('Show more',section,()=>{b.remove();more();});}};more();
  }
 }
 function select(id,remember=true){const n=locator?.neighborhood(id);if(!n)return false;if(remember&&active&&active!==id){trail.push(active);if(trail.length>100)trail.shift();}active=id;root.open=true;onTravel?.(n);renderDetail();return true;}
 function clear(){active=null;trail=[];renderDetail();}
 back.onclick=()=>{const id=trail.pop();if(id)select(id,false);};
 query.oninput=render;kind.onchange=render;
 root.addEventListener('toggle',async()=>{if(root.open&&!index){status.textContent='Loading mathematical graph…';if(!await loadPublished())status.textContent=$('elaboratedStatus').textContent;render();if(!index)status.textContent=$('elaboratedStatus').textContent;}});
 return {select,clear,render,async restore(id){root.open=true;if(!index&&!await loadPublished())return false;return select(id,false);}};
}
export function elaboratedPanel(parent,production,c,onSelect){
 const add=(tag,text,p)=>{const e=document.createElement(tag);if(text!==null)e.textContent=text;p.append(e);return e;};
 const d=add('details',null,parent);d.id='elaboratedBrowser';add('summary','Elaborated mathematical relationships',d);
 if(!index){const notice=add('p',publication?.status==='unavailable'?(publication.reason||'No matching publication.'):'Open to load the revision-matched published graph. The lexical inventory remains available.',d);const load=async()=>{if(!loadPublished)return;notice.textContent='Checking and loading mathematical graph…';if(!await loadPublished())notice.textContent=document.getElementById('elaboratedStatus').textContent;};d.addEventListener('toggle',()=>{if(d.open&&!index)void load();});const retry=add('button','Load / retry published graph',d);retry.type='button';retry.onclick=load;return;}
 const covered=c.moduleIds.filter(m=>index.coverage.has(m));
 if(!covered.length){add('p','This complex is outside the indexed extraction scope.',d);return;}
 add('p','Qualified Lean names. Edges may be routed through omitted declarations. Missing edges do not establish independence. This is not proof certification.',d);
 const module=add('select',null,d);module.setAttribute('aria-label','Elaborated module');
 for(const m of covered){const o=add('option',m,module);o.value=m;}
 const query=add('input',null,d);query.type='search';query.placeholder='Filter qualified name';query.setAttribute('aria-label','Filter elaborated name');
 const result=add('div',null,d);let limit=50;
 function render(){result.replaceChildren();const rows=(index.modules.get(module.value)||[]).filter(x=>x.id.toLowerCase().includes(query.value.toLowerCase()));add('p',rows.length+' recorded declarations · '+index.coverage.get(module.value).status,result);
 for(const row of rows.slice(0,limit)){const detail=add('details',null,result);add('summary',row.id+' · '+row.kind,detail);detail.ontoggle=()=>{if(!detail.open||detail.dataset.loaded)return;detail.dataset.loaded='1';
 const travel=add('button','Explore declaration in city',detail);travel.type='button';travel.dataset.exploreDeclaration=row.id;travel.onclick=()=>travelUI?.select(row.id);
 const flags=[row.hasSorry===true?'own sorry':null,row.sorryTainted===true?'reported sorry dependency':null,row.axiomTainted===true?'reported custom axiom dependency':null,row.isUnsafe===true?'unsafe/partial':null].filter(Boolean);if(flags.length)add('p',flags.join(' · '),detail);
 attachNative(detail,row,production);
 const path=production.modulePaths[row.module];const link=add('a',row.line?'Open pinned declaration range':'Open pinned source module',detail);link.href='https://github.com/leanprover-community/physlib/blob/'+production.model.source.revision+'/'+path.split('/').map(encodeURIComponent).join('/')+(row.line?'#L'+row.line+(row.range?.endLine?'-L'+row.range.endLine:''):'');link.target='_blank';link.rel='noopener noreferrer';
 for(const [title,edges,key] of [['Recorded prerequisites',index.uses.get(row.id)||[],'to'],['Recorded dependents',index.usedBy.get(row.id)||[],'from']]){const sub=add('details',null,detail);add('summary',title+' ('+edges.length+')',sub);let shown=0;const more=()=>{for(const e of edges.slice(shown,shown+100)){const target=index.nodes.get(e[key]),line=add('div',target.id+' · '+e.kind,sub);const location=locator?.locate(target.id);if(location){const b=add('button','Travel to '+target.id,line);b.type='button';b.onclick=()=>travelUI?.select(target.id);}else add('small',' · '+target.module,line);}shown+=100;if(shown<edges.length){const b=add('button','Show more relationships',sub);b.type='button';b.onclick=()=>{b.remove();more();};}};more();}
 };}if(rows.length>limit){const b=add('button','Show more declarations',result);b.type='button';b.onclick=()=>{limit+=50;render();};}}
 const reset=()=>{limit=50;render();};module.onchange=reset;query.oninput=reset;render();
}
