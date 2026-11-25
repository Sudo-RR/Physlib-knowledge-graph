export async function setupHistory(production){
 const host=document.getElementById('historyPanel'),add=(tag,text,p=host)=>{const e=document.createElement(tag);if(text!==null)e.textContent=text;p.append(e);return e;};
 try{const r=await fetch('data/geneva-history.json',{cache:'no-cache'});if(!r.ok)throw Error('HTTP '+r.status);const h=await r.json();if(h.version!==1||h.revision!==production.model.source.revision)throw Error('History revision mismatch');
 host.replaceChildren();add('p',h.sampling+'. Differences span intervals, not individual commits. Renames appear as removals and additions.');
 const table=add('table',null),head=add('tr',null,table);for(const t of ['Commit date','Modules','Imports','Maps'])add('th',t,head);
 for(const s of h.samples){const row=add('tr',null,table),cell=add('td',null,row),a=add('a',s.committedAt.slice(0,10)+' · '+s.revision.slice(0,7),cell);a.href='https://github.com/leanprover-community/physlib/tree/'+s.revision;a.target='_blank';a.rel='noopener noreferrer';for(const n of [s.modules,s.imports,s.maps])add('td',String(n),row);}
 for(const v of h.intervals){const d=add('details',null),a=h.samples.find(s=>s.revision===v.from),b=h.samples.find(s=>s.revision===v.to);add('summary',a.committedAt.slice(0,10)+' → '+b.committedAt.slice(0,10)+' · modules +'+v.modules.added.length+' / −'+v.modules.removed.length,d);
 for(const k of ['modules','imports','maps'])for(const change of ['added','removed']){const section=add('details',null,d),list=v[k][change];add('summary',k+' '+change+' ('+list.length+')',section);for(const item of list.slice(0,200)){const row=add('div',Array.isArray(item)?item.join(' → '):item,section);if(k==='modules'&&Object.hasOwn(production.contributor?.owner||{},item)){const a=add('a',' · Locate current complex',row);a.href='?complex='+encodeURIComponent(production.contributor.owner[item]);}}if(list.length>200)add('small','First 200; full JSON available.',section);}}
 if(h.missing.length){const d=add('details',null);add('summary','Omitted samples ('+h.missing.length+')',d);for(const m of h.missing)add('p',m.date.slice(0,10)+': '+m.reason,d);}
 const a=add('a','Download full sampled comparison');a.href='data/geneva-history.json';
 }catch(e){host.textContent='Historical snapshots unavailable: '+e.message;}
}
