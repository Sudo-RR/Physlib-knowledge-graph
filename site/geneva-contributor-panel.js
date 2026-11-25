import {createContributorQueries} from './geneva-contributor.js';
export function contributorPanel(parent,production,c,onSelect,onApiMap){
 const index=production.contributor;if(!index||index.revision!==production.model.source.revision)return;
 const queries=createContributorQueries(index),rev=index.revision;
 const add=(tag,text,p)=>{const n=document.createElement(tag);if(text!==null)n.textContent=text;p.append(n);return n;};
 const details=(title,p)=>{const d=add('details',null,p);add('summary',title,d);return d;};
 const link=(path,text,p,line)=>{const a=add('a',text,p);a.href='https://github.com/leanprover-community/physlib/blob/'+rev+'/'+path.split('/').map(encodeURIComponent).join('/')+(line?'#L'+line:'');a.target='_blank';a.rel='noopener noreferrer';return a;};
 const maps=queries.relatedMaps(c.moduleIds),md=details('API maps ('+maps.length+')',parent);
 add('p','Explicit file references in the indexed Lean References section, not declaration-level matches.',md);
 for(const m of maps){const d=details(m.title,md);link(m.path,'Read API map at indexed revision',d);if(onApiMap){const b=add('button','Open city planning layer',d);b.type='button';b.onclick=()=>onApiMap(m.path);}
  if(m.abstract)add('p',m.abstract,d);
  const matching=add('p','References in this complex: '+m.matchingModules.length,d);
  for(const r of m.references){const row=add('div',null,d);if(r.module){link(r.path,r.module,row);const b=add('button','Locate',row);b.onclick=()=>onSelect(index.owner[r.module],null,true);}else add('span',r.path+' — unresolved file reference',row);}
 }
 if(!maps.length)add('p','No indexed API-map file references to these modules.',md);
 const tools=details('Import paths and potential impact',parent);
 add('p','Uses explicit module imports only. Reachability does not prove theorem use, redundancy or breakage.',tools);
 const from=add('select',null,tools);from.setAttribute('aria-label','Starting module');
 for(const id of c.moduleIds){const opt=add('option',id,from);opt.value=id;}
 const row=add('div',null,tools),target=add('input',null,row);target.type='search';target.placeholder='Exact target module ID';target.setAttribute('aria-label','Target module');const data=add('datalist',null,row);data.id='import-targets';target.setAttribute('list',data.id);
 for(const id of queries.ids){const option=add('option',null,data);option.value=id;}
 const output=add('div',null,tools);output.setAttribute('aria-live','polite');
 const buttons=add('div',null,tools);tools.insertBefore(buttons,output);
 function button(text,fn){const b=add('button',text,buttons);b.type='button';b.onclick=()=>{output.replaceChildren();try{fn();}catch(e){add('p',e.message,output);}};}
 function edge(e,p){link(index.modules[e.from].path,e.from,p,e.line);add('span',' → ',p);link(index.modules[e.to].path,e.to,p);}
 button('Find import path',()=>{const r=queries.path(from.value,target.value.trim(),{depth:12,limit:5000});if(!r.found){add('p','No path found within the indexed graph'+(r.depthLimited||r.nodeLimited?' and search bounds.':'.'),output);return;}add('p',r.edges.length+' import steps (shortest within indexed graph)',output);for(const e of r.edges)edge(e,add('div',null,output));});
 for(const [label,direction] of [['Prerequisites','uses'],['Potential impact','usedBy']])button(label,()=>{const r=queries.walk(from.value,{direction,depth:3,limit:100});add('p',r.records.length+' reachable modules within 3 imports'+(r.depthLimited||r.nodeLimited?' — results bounded/truncated.':'.'),output);for(const n of r.records){const d=details(n.id+' · depth '+n.depth,output);edge(n.edge,d);const b=add('button','Locate complex',d);b.onclick=()=>onSelect(index.owner[n.id],null,true);}});
}
