import {complexEvidence,palettes} from './geneva-evidence.js';
export function evidencePanel(parent,production,c){
 const doc=parent.ownerDocument,make=(tag,text,host)=>{const el=doc.createElement(tag);if(text!==null)el.textContent=text;host.append(el);return el;};
 const d=make('details',null,parent);d.id='evidenceDetails';make('summary','Source activity and review evidence',d);
 const e=complexEvidence(production,c);
 if(!e.available){make('p','Evidence companion unavailable for this revision.',d);return;}
 const link=(text,url,host)=>{const a=make('a',text,host);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
 const base='https://github.com/leanprover-community/physlib/';
 make('p','Source activity: '+palettes.freshness[e.freshness][1]+' · '+e.activity.length+'/'+c.moduleIds.length+' paths recorded. Age at indexed commit; newest path change in the complex, not mathematical freshness.',d);
 for(const row of [...e.activity].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))){
  const line=make('div',row.module+' · '+row.date.slice(0,10)+' · ',d);link(row.sha.slice(0,10),base+'commit/'+row.sha,line);
 }
 make('p','Review: '+palettes.review[e.review][1]+' · '+e.marks.length+' mapped module marks. Fingerprint validity has not been evaluated; marks are not proof certification.',d);
 const review=production.evidence.review;
 make('p',review.trackedFiles+' tracked review files · '+review.unmapped+' unmapped declaration or module marks · '+review.invalid+' invalid files (whole snapshot).',d);
 for(const mark of e.marks){
  const line=make('div',mark.module+' · '+mark.status+' · '+mark.reviewer+' ('+mark.reviewerId+') · '+(mark.date||'date unavailable')+' · ',d);
  link('Recorded mark file',base+'blob/'+production.model.source.revision+'/'+mark.path.split('/').map(encodeURIComponent).join('/'),line);
 }
 if(!e.marks.length)make('p','No mapped marks is not evidence of absent review. Declaration marks require an exact elaborated identity mapping.',d);
}
