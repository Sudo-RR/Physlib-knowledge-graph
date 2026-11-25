// Conservative Markdown extraction: preserve source paragraphs, numbered citations
// and explicitly authored TODO markers. No proof-status or task inference.
export function parseApiMap(text,path){
 const lines=text.split(/\r?\n/),sections=[],references=[],related=[],seen=new Set();
 let chapter='',heading='',headingLine=0,paragraph=[],start=0,entry=null,fence=false;
 const flush=()=>{if(!paragraph.length)return;const text=paragraph.join('\n').trim();if(text&&/^Content(?:\s|$|\()/.test(chapter)){
  const citations=[...new Set([...text.matchAll(/\[(\d+)\]/g)].map(m=>Number(m[1])))];
  const todoCount=[...text.matchAll(/\[TODO\]/g)].length;
  sections.push({line:start,endLine:start+paragraph.length-1,heading,headingLine,text,citations,todoCount});
 }paragraph=[];};
 const finishEntry=()=>{if(entry){entry.symbols=[...new Set([...entry.text.matchAll(/`([^`\n]+)`/g)].map(m=>m[1]).filter(s=>!s.endsWith('.lean')))];references.push(entry);entry=null;}};
 for(let i=0;i<lines.length;i++){
  const line=lines[i],n=i+1;
  if(/^\s*(?:```|~~~)/.test(line)){flush();fence=!fence;continue;}if(fence)continue;
  const h=line.match(/^##\s+(.+)$/);if(h){flush();finishEntry();chapter=h[1].trim();heading=chapter;headingLine=n;continue;}
  const sub=line.match(/^#{3,6}\s+(.+)$/);if(sub){flush();finishEntry();heading=sub[1].trim();headingLine=n;continue;}
  if(chapter==='Lean References'){
   const m=line.match(/^\s*(\d+)\.\s+`?((?:Physlib|PhyslibAlpha|QuantumInfo)\/[^\s`]+?\.lean)`?/);
   if(m){finishEntry();entry={number:Number(m[1]),path:m[2],line:n,text:line};}
   else if(/^\s*\d+\./.test(line)){finishEntry();}else if(entry&&line.trim())entry.text+='\n'+line;
   continue;
  }
  if(chapter==='References'){for(const m of line.matchAll(/(?:Physlib|PhyslibAlpha|QuantumInfo)\/[A-Za-z0-9_./-]+\/API-map\.md/g)){if(!seen.has(m[0])){related.push({path:m[0],line:n});seen.add(m[0]);}}continue;}
  if(!line.trim()){flush();continue;}if(!paragraph.length)start=n;paragraph.push(line);
 }
 flush();finishEntry();return {path,sections,references,related,todoCount:sections.reduce((n,s)=>n+s.todoCount,0)};
}
export function planApiMap(map,production){
 const idx=production.contributor,modules=idx.modules,owner=idx.owner;
 const byPath=new Map(Object.entries(modules).map(([id,m])=>[m.path,id])),complexes=new Map();
 const references=map.references.map(r=>{const module=byPath.get(r.path)||null,complex=module&&Object.hasOwn(owner,module)?owner[module]:null;if(complex){if(!complexes.has(complex))complexes.set(complex,new Set());complexes.get(complex).add(module);}return {...r,module,complex};});
 const known=new Set(references.map(r=>r.number));
 return {...map,references,complexes:[...complexes].map(([id,modules])=>({id,modules:[...modules].sort()})).sort((a,b)=>a.id.localeCompare(b.id)),sections:map.sections.map(s=>({...s,unresolvedCitations:s.citations.filter(n=>!known.has(n))})),related:map.related.map(r=>({...r,resolved:idx.maps.some(m=>m.path===r.path)}))};
}
