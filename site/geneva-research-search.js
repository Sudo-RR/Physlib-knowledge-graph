// External results are discovery candidates, not verified declaration identities.
export function resolveModule(input,production){
 const id=input.trim().replace(/\.lean$/,'').replaceAll('/','.'),owner=production.contributor?.owner||{};
 return Object.hasOwn(owner,id)?{module:id,complex:owner[id]}:null;
}
const name=x=>Array.isArray(x)&&x.length&&x.every(s=>typeof s==='string'&&s.length)?x.join('.'):null;
export function resolveRecord(record,production){
 const module=name(record?.module_name),qualified=name(record?.name);
 if(!module||!qualified)return null;
 return {module,qualified,complex:resolveModule(module,production)?.complex||null,title:typeof record.informal_name==='string'?record.informal_name:qualified,signature:typeof record.signature==='string'?record.signature:null,description:typeof record.informal_description==='string'?record.informal_description:null};
}
export function loogleUrl(q){return 'https://loogle.lean-lang.org/?q='+encodeURIComponent(q.trim());}
export function setupResearchSearch(production,onSelect){
 const $=id=>document.getElementById(id),host=$('researchResults'),status=$('researchStatus'),q=$('researchQuery');
 const add=(tag,text,p=host)=>{const e=document.createElement(tag);if(text!==null)e.textContent=text;p.append(e);return e;};
 function locate(r,p){if(!r.complex){add('p','Module not indexed in current city.',p);return;}const b=add('button','Locate module complex',p);b.type='button';b.onclick=()=>onSelect(r.complex,null,true);}
 function render(records){host.replaceChildren();let count=0;for(const raw of records.slice(0,30)){const r=resolveRecord(raw?.result??raw,production);if(!r)continue;count++;const d=add('details',null);add('summary',r.title,d);add('p',r.qualified+' · '+r.module,d);if(r.signature)add('pre',r.signature,d);if(r.description)add('p',r.description,d);locate(r,d);const a=add('a','Browse external module',d);a.href='https://physlibsearch.net/browse/'+r.module.split('.').map(encodeURIComponent).join('/');a.target='_blank';a.rel='noopener noreferrer';}
 status.textContent=count+' external candidates. Index revision not supplied; only exact module IDs are matched.';}
 $('openLoogle').onclick=()=>window.open(loogleUrl(q.value),'_blank','noopener,noreferrer');
 $('locateResearchModule').onclick=()=>{host.replaceChildren();const r=resolveModule(q.value,production);status.textContent=r?'Exact current module ID.':'No exact module ID. Enter a module name or repository-relative Lean path.';if(r){add('p',r.module);locate(r,host);}};
 $('pasteSearchResults').onclick=()=>{try{const d=JSON.parse($('researchPaste').value);render(Array.isArray(d)?(Array.isArray(d[0])?d[0]:d):[d]);}catch(e){status.textContent='Invalid JSON; paste a PhyslibSearch API result or response.';}};
 $('runPhyslibSearch').onclick=async()=>{const query=q.value.trim();if(!query){status.textContent='Enter a query.';return;}const b=$('runPhyslibSearch');b.disabled=true;status.textContent='Querying external PhyslibSearch…';host.replaceChildren();
 try{const r=await fetch('https://physlibsearch.net/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:[query],num_results:10}),credentials:'omit',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(!Array.isArray(data)||!Array.isArray(data[0]))throw Error('Unexpected response');render(data[0]);}
 catch(e){status.textContent='External search unavailable ('+e.message+'). Cross-origin access may be restricted. Open the website or paste API results.';}finally{b.disabled=false;}
 };
}
