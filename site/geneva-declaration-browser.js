// A source-command browser, not an elaborated declaration index.
export function declarationRows(records,module,kind='all',query=''){
 const q=query.trim().toLowerCase();
 return records.filter(r=>r.module===module&&(kind==='all'||r.kind===kind)&&(!q||r.name.toLowerCase().includes(q))).sort((a,b)=>(a.line??Infinity)-(b.line??Infinity)||a.id.localeCompare(b.id));
}
export function attachDeclarationBrowser(parent,production,complex){
 const records=(production.declarationRecords||[]).filter(r=>complex.moduleIds.includes(r.module));
 const add=(tag,text,p=parent)=>{const e=document.createElement(tag);if(text!==null)e.textContent=text;p.append(e);return e;};
 const d=add('details',null);d.id='declarationBrowser';add('summary','Browse declarations by file',d);
 add('p','Partial lexical source inventory. Names are as recorded in source; they are not verified fully-qualified Lean identifiers. Statements and proof dependencies are not indexed.',d);
 const module=add('select',null,d);module.id='declModule';module.setAttribute('aria-label','Declaration source module');
 for(const id of complex.moduleIds){const o=add('option',id,module);o.value=id;}
 const kind=add('select',null,d);kind.id='declKind';kind.setAttribute('aria-label','Declaration kind');
 for(const k of ['all',...new Set(records.map(r=>r.kind).sort())]){const o=add('option',k==='all'?'All kinds':k,kind);o.value=k;}
 const query=add('input',null,d);query.type='search';query.id='declQuery';query.placeholder='Filter recorded name';query.setAttribute('aria-label','Filter recorded declaration name');
 const result=add('div',null,d);result.id='declResults';const count=add('p',null,d);count.id='declCount';count.setAttribute('aria-live','polite');
 let limit=100;
 function render(){const rows=declarationRows(records,module.value,kind.value,query.value);result.replaceChildren();count.textContent=rows.length+' recorded commands'+(rows.length>limit?' · showing '+limit:'');for(const r of rows.slice(0,limit)){const row=add('div',null,result);add('small',r.kind+' · ',row);const p=production.modulePaths[r.module];if(!p){add('span',r.name,row);continue;}const a=add('a',r.name,row);a.href='https://github.com/leanprover-community/physlib/blob/'+production.model.source.revision+'/'+p.split('/').map(encodeURIComponent).join('/')+(r.line?'#L'+r.line:'');a.target='_blank';a.rel='noopener noreferrer';}
 if(!rows.length)add('p','No matching recorded commands. Partial coverage does not establish absence.',result);
 if(rows.length>limit){const b=add('button','Show more',result);b.type='button';b.onclick=()=>{limit+=100;render();};}}
 function reset(){limit=100;render();}module.onchange=reset;kind.onchange=reset;query.oninput=reset;render();
}
