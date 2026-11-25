import {indexElaborated} from './geneva-elaborated.js';
let index=null,version=0;
export function setupElaboratedImport(production,refresh){
 const input=document.getElementById('elaboratedFile'),status=document.getElementById('elaboratedStatus');
 const apply=(snapshot,label)=>{index=indexElaborated(snapshot,production);status.textContent=label+' · '+index.local.size+' PhysLib declarations · partial scope';refresh();};
 input.onchange=async()=>{const file=input.files[0];if(!file)return;const token=++version;try{if(file.size>150*1024*1024)throw Error('Snapshot exceeds 150 MiB browser import limit');const snapshot=JSON.parse(await file.text());if(token===version)apply(snapshot,'Loaded locally');}catch(e){if(token===version)status.textContent='Import rejected: '+e.message;}};
 const token=version;
 fetch('data/geneva-elaborated.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(snapshot=>{if(snapshot&&token===version)apply(snapshot,'Published companion');}).catch(e=>{if(token===version)status.textContent='Published companion unavailable: '+e.message;});
}
export function elaboratedPanel(parent,production,c,onSelect){
 const add=(tag,text,p)=>{const e=document.createElement(tag);if(text!==null)e.textContent=text;p.append(e);return e;};
 const d=add('details',null,parent);d.id='elaboratedBrowser';add('summary','Elaborated mathematical relationships',d);
 if(!index){add('p','No compatible elaborated snapshot loaded. Import snapshot.json from the extraction workflow above; the lexical inventory remains available.',d);return;}
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
 const path=production.modulePaths[row.module];const link=add('a','Open pinned source module',detail);link.href='https://github.com/leanprover-community/physlib/blob/'+production.model.source.revision+'/'+path.split('/').map(encodeURIComponent).join('/');link.target='_blank';link.rel='noopener noreferrer';
 for(const [title,edges,key] of [['Recorded prerequisites',index.uses.get(row.id)||[],'to'],['Recorded dependents',index.usedBy.get(row.id)||[],'from']]){const sub=add('details',null,detail);add('summary',title+' ('+edges.length+')',sub);let shown=0;const more=()=>{for(const e of edges.slice(shown,shown+100)){const target=index.nodes.get(e[key]),line=add('div',target.id+' · '+e.kind,sub);const owner=production.contributor?.owner?.[target.module];if(owner){const b=add('button','Locate '+target.module,line);b.type='button';b.onclick=()=>onSelect(owner,null,true);}else add('small',' · '+target.module,line);}shown+=100;if(shown<edges.length){const b=add('button','Show more relationships',sub);b.type='button';b.onclick=()=>{b.remove();more();};}};more();}
 };}if(rows.length>limit){const b=add('button','Show more declarations',result);b.type='button';b.onclick=()=>{limit+=50;render();};}}
 const reset=()=>{limit=50;render();};module.onchange=reset;query.oninput=reset;render();
}
