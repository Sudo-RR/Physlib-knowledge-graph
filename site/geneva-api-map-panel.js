import {planApiMap} from './geneva-api-maps.js';
export function setupApiMaps(production,onOverlay,onLocate){
 const $=id=>document.getElementById(id),root=$('apiPlanning'),query=$('apiQuery'),only=$('apiTodoOnly'),list=$('apiMapList'),detail=$('apiMapDetail'),status=$('apiMapStatus');
 const maps=(production.apiMaps||[]).map(m=>planApiMap(m,production)),byPath=new Map(maps.map(m=>[m.path,m]));let active=null;
 const add=(tag,text,parent)=>{const e=document.createElement(tag);if(text!==null)e.textContent=text;parent.append(e);return e;};
 const button=(text,parent,fn)=>{const b=add('button',text,parent);b.type='button';b.onclick=fn;return b;};
 const link=(path,text,parent,line,end)=>{const a=add('a',text,parent);a.href='https://github.com/leanprover-community/physlib/blob/'+production.model.source.revision+'/'+path.split('/').map(encodeURIComponent).join('/')+(line?'#L'+line+(end?'-L'+end:''):'');a.target='_blank';a.rel='noopener noreferrer';return a;};
 function renderList(){list.replaceChildren();const q=query.value.trim().toLowerCase(),matches=maps.filter(m=>(!only.checked||m.todoCount>0)&&(!q||(m.title+' '+m.path+' '+m.abstract).toLowerCase().includes(q)));status.textContent=matches.length+' of '+maps.length+' indexed maps · '+maps.reduce((n,m)=>n+m.todoCount,0)+' explicit TODO markers';for(const m of matches){const b=button(m.title+' · '+m.todoCount+' TODO',list,()=>select(m.path));b.dataset.apiMap=m.path;b.setAttribute('aria-current',String(active?.path===m.path));}}
 function select(path){const m=byPath.get(path);if(!m)return false;active=m;root.open=true;onOverlay(m);renderList();detail.replaceChildren();const title=add('h3',m.title,detail);title.dataset.activeApiMap=m.path;link(m.path,'Read original API map',detail);if(m.abstract)add('p',m.abstract,detail);
  add('p',m.complexes.length+' referenced city complexes · '+m.references.filter(r=>r.module).length+' resolved numbered file references · '+m.references.filter(r=>!r.module).length+' unresolved file references · '+m.todoCount+' explicit TODO markers.',detail);
  add('small','References indicate citations, not verified implementation or proof status. TODO paragraphs may contain several claims; no inferred missing mathematics or completion percentage.',detail);
  const locations=add('details',null,detail);add('summary','Referenced city complexes',locations);for(const c of m.complexes){const row=add('div',null,locations);add('div',c.id,row);add('small',c.modules.join(', '),row);const b=button('Locate complex',row,()=>onLocate(c.id));b.dataset.apiLocate=c.id;}
  const refs=add('details',null,detail);add('summary','Numbered Lean references ('+m.references.length+')',refs);
  for(const r of m.references){const row=add('div',null,refs);row.className='qualified-edge';link(m.path,'['+r.number+'] '+r.path,row,r.line);if(r.symbols.length)add('div',r.symbols.join(', '),row);if(r.complex)button('Locate cited module',row,()=>onLocate(r.complex));else add('small','Unresolved file citation',row);}
  const work=add('details',null,detail);add('summary','Explicit TODO passages ('+m.sections.filter(s=>s.todoCount).length+')',work);work.open=true;
  for(const s of m.sections.filter(s=>s.todoCount)){const row=add('div',null,work);row.className='qualified-edge';link(m.path,s.heading+' · lines '+s.line+'–'+s.endLine,row,s.line,s.endLine);add('p',s.text,row);add('small',s.todoCount+' TODO marker(s) · cited Lean references: '+(s.citations.join(', ')||'none')+(s.unresolvedCitations.length?' · unresolved numbers: '+s.unresolvedCitations.join(', '):''),row);}
  if(!m.todoCount)add('p','No explicit TODO markers in indexed content. This is not a completeness claim.',work);
  const content=add('details',null,detail);add('summary','Content outline and cited passages',content);
  for(const s of m.sections){const d=add('details',null,content);add('summary',s.heading+' · L'+s.line+(s.todoCount?' · TODO':''),d);add('p',s.text,d);link(m.path,'Pinned passage',d,s.line,s.endLine);for(const n of s.citations){for(const r of m.references.filter(r=>r.number===n)){if(r.complex)button('Locate reference ['+n+'] '+r.module,d,()=>onLocate(r.complex));}}}
  const related=add('details',null,detail);add('summary','Related API maps ('+m.related.length+')',related);for(const r of m.related){if(r.resolved)button(r.path,related,()=>select(r.path));else link(r.path,'Unindexed reference '+r.path,related);}
  return true;
 }
 function clear(){active=null;onOverlay(null);detail.replaceChildren();renderList();}
 query.oninput=renderList;only.onchange=renderList;$('clearApiMap').onclick=clear;renderList();return {select,clear};
}
