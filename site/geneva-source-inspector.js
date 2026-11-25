// Exact recorded module imports and partial declaration inventory; no proof-edge claims.
import {contributorPanel} from './geneva-contributor-panel.js';
import {evidencePanel} from './geneva-evidence-panel.js';
import {setupElaboratedImport,elaboratedPanel} from './geneva-elaborated-panel.js';
import {attachDeclarationBrowser} from './geneva-declaration-browser.js';
export function createSourceInspector({production,roleNames,subjectColors,onSelect,onFilter,onChannel}){
 const {model,layout,modulePaths,declarationLines}=production,$=id=>document.getElementById(id),byId=new Map(model.complexes.map(c=>[c.id,c])),revision=model.source.revision;
 const node=(tag,text,parent)=>{const e=document.createElement(tag);if(text!==null)e.textContent=text;if(parent)parent.append(e);return e;};
 const link=(id,parent,line)=>{const path=modulePaths[id];if(!path){node('span',id,parent);return;}const a=node('a',id,parent);a.href='https://github.com/leanprover-community/physlib/blob/'+revision+'/'+path.split('/').map(encodeURIComponent).join('/')+(line?'#L'+line:'');a.target='_blank';a.rel='noopener noreferrer';};
 const details=(title,parent)=>{const d=node('details',null,parent);node('summary',title,d);return d;};
 const button=(text,parent,fn)=>{const b=node('button',text,parent);b.type='button';b.onclick=fn;return b;};
 let area='all',current=null,query='';
 const subject=$('subject'),search=$('searchSource'),list=$('sourceList'),panel=$('sourceDetails');
 for(const a of ['all',...model.areas]){const o=node('option',a==='all'?'All physics subjects':a.replace(/([a-z])([A-Z])/g,'$1 $2'),subject);o.value=a;}
 const counts=new Map();for(const c of model.complexes)counts.set(c.library,(counts.get(c.library)||0)+1);
 $('capacity').replaceChildren();for(const [lib,count] of counts){const d=node('div',null,$('capacity'));d.className='sector';node('b',lib,d);node('span',count+' complexes',d).className='metric';}
 function renderList(){list.replaceChildren();const matches=model.complexes.filter(c=>(area==='all'||c.area===area)&&(!query||(c.id+' '+c.moduleIds.join(' ')).toLowerCase().includes(query)));
 $('matchCount').textContent=matches.length+' complexes';for(const c of matches.slice(0,100)){const b=button(c.id,list,()=>onSelect(c.id,null,true));b.style.borderLeft='3px solid '+(subjectColors[c.area]||'#aab3bf');b.setAttribute('aria-current',String(current===c.id));}if(matches.length>100)node('small','First 100 results. Narrow the search.',list);}
 function inspect(id,building){const c=byId.get(id);if(!c)return;current=id;panel.replaceChildren();node('h3',c.id,panel);node('p',c.library+' · '+c.area+' · '+c.moduleIds.length+' modules · '+c.sourceLines+' source lines',panel);
 button('Focus complex',panel,()=>onSelect(id,null,true));
 if(building)button('Back to complex',panel,()=>onSelect(id,null,false));
 const modules=details('Source modules ('+c.moduleIds.length+')',panel);for(const m of c.moduleIds)link(m,node('div',null,modules));
 attachDeclarationBrowser(panel,production,c);
 elaboratedPanel(panel,production,c,onSelect);
 evidencePanel(panel,production,c);
 const roles=details('Buildings ('+c.buildings.length+')',panel);roles.open=true;
 for(const b of c.buildings){const d=details(roleNames[b.role]+' · '+b.declarationIds.length+' recorded commands',roles);d.open=building===b.id;button('Focus building',d,()=>onSelect(id,b.id,true));node('p',b.status==='unclassified'?'Incomplete lexical inventory; no claim of unfinished mathematics.':'Inferred functional role from recorded declaration kind; not a verified semantic classification.',d);
 for(const m of b.moduleIds)link(m,node('div',null,d));for(const decl of b.declarationIds.slice(0,100)){const rec=declarationLines[decl];if(!rec)continue;const div=node('div',null,d);link(rec[0],div,rec[1]);node('small',' — '+decl.split(':').at(-1),div);}if(b.declarationIds.length>100)node('small','First 100 commands; see linked source for the full file.',d);}
 for(const [title,edges,other] of [['Uses PhysLib',model.edges.filter(e=>e.from===id),'to'],['Used by PhysLib',model.edges.filter(e=>e.to===id),'from']]){
  const d=details(title+' ('+edges.length+' complexes)',panel);node('small','Direct recorded module imports, not theorem proof dependencies. Up to 14 arcs shown per direction.',d);
  for(const e of edges){const item=details(e[other]+' · '+e.count+' imports',d);button('Focus target',item,()=>onSelect(e[other],null,true));for(const imp of e.imports){const row=node('div',null,item);link(imp.from,row,imp.line);node('span',' → ',row);link(imp.to,row);}}
 }
 const station=details('Mathlib station ('+c.mathlib.length+' unique imports)',panel);station.open=building===id+'::mathlib-station';button('Focus Mathlib station',station,()=>onSelect(id,id+'::mathlib-station',true));for(const target of c.mathlib){const t=details(target.target,station);for(const m of target.sourceModules)link(m,node('div',null,t));}if(!c.mathlib.length)node('p','No recorded direct Mathlib imports.',station);
 contributorPanel(panel,production,c,onSelect);
 renderList();
 }
 function filter(v){area=v;subject.value=v;onFilter(v);renderList();}
 subject.onchange=()=>filter(subject.value);search.oninput=()=>{query=search.value.trim().toLowerCase();renderList();};$('channels').onchange=()=>onChannel($('channels').value);
 setupElaboratedImport(production,()=>{if(current)inspect(current,null);});
 function clear(){current=null;panel.replaceChildren();node('p','Select a building, station or complex.',panel);renderList();}
 renderList();return {inspect,filter,clear};
}
