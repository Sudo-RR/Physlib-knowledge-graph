import {indexElaborated} from './geneva-elaborated.js';
let index=null,version=0,loadPublished=null,publication=null;
const LIMIT=150*1024*1024;
export function setupElaboratedImport(production,refresh){
 const input=document.getElementById('elaboratedFile'),status=document.getElementById('elaboratedStatus');
 let pending=null;
 const apply=(snapshot,label)=>{const next=indexElaborated(snapshot,production);index=next;status.textContent=label+' · '+index.local.size.toLocaleString()+' PhysLib declarations · '+snapshot.dependencies.length.toLocaleString()+' recorded relationships · partial scope';refresh();};
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
 const flags=[row.hasSorry===true?'own sorry':null,row.sorryTainted===true?'reported sorry dependency':null,row.axiomTainted===true?'reported custom axiom dependency':null,row.isUnsafe===true?'unsafe/partial':null].filter(Boolean);if(flags.length)add('p',flags.join(' · '),detail);
 if(row.statement){const pre=add('pre',row.statement,detail);pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font-size:11px';}
 if(row.directReferences){const refs=row.directReferences;for(const [title,records] of [['Direct type references',refs.type],['Direct value references',refs.value]]){const sub=add('details',null,detail);add('summary',title+' ('+records.length+')',sub);if(title==='Direct value references'&&!refs.valueAvailable)add('p','Lean value unavailable; absence cannot be inferred.',sub);let offset=0;const more=()=>{for(const x of records.slice(offset,offset+100))add('div',x.id+' · '+x.module,sub);offset+=100;if(offset<records.length){const b=add('button','Show more',sub);b.type='button';b.onclick=()=>{b.remove();more();};}};more();}}
 const path=production.modulePaths[row.module];const link=add('a',row.line?'Open pinned declaration range':'Open pinned source module',detail);link.href='https://github.com/leanprover-community/physlib/blob/'+production.model.source.revision+'/'+path.split('/').map(encodeURIComponent).join('/')+(row.line?'#L'+row.line+(row.range?.endLine?'-L'+row.range.endLine:''):'');link.target='_blank';link.rel='noopener noreferrer';
 for(const [title,edges,key] of [['Recorded prerequisites',index.uses.get(row.id)||[],'to'],['Recorded dependents',index.usedBy.get(row.id)||[],'from']]){const sub=add('details',null,detail);add('summary',title+' ('+edges.length+')',sub);let shown=0;const more=()=>{for(const e of edges.slice(shown,shown+100)){const target=index.nodes.get(e[key]),line=add('div',target.id+' · '+e.kind,sub);const owner=production.contributor?.owner?.[target.module];if(owner){const b=add('button','Locate '+target.module,line);b.type='button';b.onclick=()=>onSelect(owner,null,true);}else add('small',' · '+target.module,line);}shown+=100;if(shown<edges.length){const b=add('button','Show more relationships',sub);b.type='button';b.onclick=()=>{b.remove();more();};}};more();}
 };}if(rows.length>limit){const b=add('button','Show more declarations',result);b.type='button';b.onclick=()=>{limit+=50;render();};}}
 const reset=()=>{limit=50;render();};module.onchange=reset;query.oninput=reset;render();
}
