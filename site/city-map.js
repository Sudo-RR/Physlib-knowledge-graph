import { isTrackpadPan } from './city-navigation.js';

const TAU=Math.PI*2;
const NS='http://www.w3.org/2000/svg';
const palette=['#df9850','#d76060','#b45c87','#9865ad','#7478b7','#568dc0','#3ea69e','#86aa59','#d1a84b','#cc8063'];
const rootColors={Physlib:'#446bab',PhyslibAlpha:'#d18e4f',QuantumInfo:'#538f78',Mathlib:'#6475ab'};
const readable=text=>text.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/([A-Z])([A-Z][a-z])/g,'$1 $2');

// Sectors represent existing source folders, not inferred physics classifications.
export function radialGroups(nodes,underground=false) {
  const roots=new Map();
  for(const node of nodes){
    if((node.library==='Mathlib')!==underground)continue;
    const parts=node.module.path.replaceAll('\\','/').split('/'),root=parts[0].replace(/\.lean$/,'');
    const folder=parts.length>2?`${root}/${parts[1]}`:root;
    if(!roots.has(root))roots.set(root,new Map());
    const topics=roots.get(root);
    if(!topics.has(folder))topics.set(folder,{id:folder,name:parts.length>2?parts[1]:'General',root,nodes:[]});
    topics.get(folder).nodes.push(node);
  }
  const order=['Physlib','PhyslibAlpha','QuantumInfo','Mathlib'];
  const groups=[...roots].sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0])).map(([root,topics])=>({
    root,topics:[...topics.values()].sort((a,b)=>a.name.localeCompare(b.name))
  }));
  const topics=groups.flatMap(group=>group.topics);
  const weight=topic=>Math.sqrt(topic.nodes.length)+2;
  const total=topics.reduce((sum,topic)=>sum+weight(topic),0);
  let angle=-Math.PI/2;
  for(const group of groups){
    group.start=angle;
    for(const topic of group.topics){topic.start=angle;topic.end=angle+(total?TAU*weight(topic)/total:0);angle=topic.end;}
    group.end=angle;
  }
  return groups;
}

export function sectorPath(inner,outer,start,end) {
  const point=(r,a)=>[r*Math.cos(a),r*Math.sin(a)];
  // SVG cannot draw a full circle with a single arc.
  end=Math.min(end,start+TAU-.00001);
  const a=point(outer,start),b=point(outer,end),c=point(inner,end),d=point(inner,start),large=end-start>Math.PI?1:0;
  return `M ${a[0]} ${a[1]} A ${outer} ${outer} 0 ${large} 1 ${b[0]} ${b[1]} L ${c[0]} ${c[1]} A ${inner} ${inner} 0 ${large} 0 ${d[0]} ${d[1]} Z`;
}

function element(name,attrs={},text) {
  const item=document.createElementNS(NS,name);
  for(const [key,value] of Object.entries(attrs))item.setAttribute(key,String(value));
  if(text!==undefined)item.textContent=text;
  return item;
}

export function createRadialMap(host,city,onTopic,onFile) {
  let underground=false,view={x:-400,y:-400,size:800},drag=null,wasDragged=false;
  const svg=element('svg',{viewBox:'-400 -400 800 800',role:'group','aria-label':'Radial map of source folders. Select a sector to visit its buildings.'});
  const tooltip=document.createElement('div');tooltip.className='radial-tooltip';tooltip.hidden=true;
  const hint=document.createElement('div');hint.className='radial-hint';hint.textContent='Sectors: folders · Tiles: files · Select to explore';
  host.replaceChildren(svg,tooltip,hint);
  function updateView(){svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.size} ${view.size}`);}
  function zoom(factor){
    const next=Math.max(260,Math.min(1300,view.size*factor)),offset=(view.size-next)/2;
    view={x:view.x+offset,y:view.y+offset,size:next};updateView();
  }
  function draw() {
    svg.replaceChildren();
    const groups=radialGroups(city.nodes,underground);
    let colorIndex=0;
    const backdrop=element('circle',{r:342,fill:'#fff',stroke:'#eceff1','stroke-width':1});svg.append(backdrop);
    for(const group of groups){
      const a=(group.start+group.end)/2,rootColor=rootColors[group.root]||'#64748b',hub={x:65*Math.cos(a),y:65*Math.sin(a)};
      const root=element('path',{d:sectorPath(166,184,group.start,group.end),fill:rootColor,stroke:'#fff','stroke-width':2});svg.append(root);
      const rootText=element('text',{x:175*Math.cos(a),y:175*Math.sin(a),'text-anchor':'middle','dominant-baseline':'middle',class:'radial-root'},group.root);svg.append(rootText);
      svg.append(element('circle',{cx:hub.x,cy:hub.y,r:5,fill:rootColor,stroke:'#fff','stroke-width':1}));
      for(const topic of group.topics){
        const color=palette[colorIndex++%palette.length],sector=element('g',{role:'button',tabindex:0,class:'radial-sector','aria-label':`${readable(topic.name)}, ${topic.root}, ${topic.nodes.length} ${topic.nodes.length===1?'file':'files'}`});
        sector.append(element('path',{d:sectorPath(187,338,topic.start,topic.end),fill:color,stroke:'#fff','stroke-width':1.2}));
        const mid=(topic.start+topic.end)/2,degrees=mid*180/Math.PI,flip=Math.cos(mid)<0;
        const branch={x:150*Math.cos(mid),y:150*Math.sin(mid)};
        svg.append(element('path',{d:`M ${hub.x} ${hub.y} Q ${hub.x*.65+branch.x*.35} ${hub.y*.65+branch.y*.35} ${branch.x} ${branch.y}`,fill:'none',stroke:color,'stroke-width':1.7,'stroke-opacity':.8}));
        svg.append(element('circle',{cx:branch.x,cy:branch.y,r:3.5,fill:color,stroke:'#fff','stroke-width':.7}));
        const label=element('text',{transform:`rotate(${degrees}) translate(192 0) ${flip?'rotate(180) translate(-125 0)':''}`,class:'radial-topic','dominant-baseline':'middle'},readable(topic.name));
        sector.append(label);
        const span=topic.end-topic.start,columns=Math.max(1,Math.ceil(Math.sqrt(topic.nodes.length*Math.max(.3,span)*1.5))),rows=Math.ceil(topic.nodes.length/columns);
        topic.nodes.forEach((node,index)=>{
          const row=Math.floor(index/columns),col=index%columns,remaining=Math.min(columns,topic.nodes.length-row*columns);
          const start=topic.start+span*col/remaining,end=topic.start+span*(col+1)/remaining,inner=220+row*116/Math.max(1,rows),outer=220+(row+1)*116/Math.max(1,rows);
          const tile=element('path',{d:sectorPath(inner,outer,start,end),fill:color,stroke:'#fff','stroke-width':1,class:'radial-file','data-file':node.id,'aria-hidden':'true'});
          tile.append(element('title',{},node.id));sector.append(tile);
        });
        sector.addEventListener('click',event=>{
          if(wasDragged){wasDragged=false;return;}
          const file=event.target.closest?.('[data-file]');
          if(file)onFile(file.getAttribute('data-file'));else onTopic(topic.id);
        });
        sector.addEventListener('pointermove',event=>{const file=event.target.closest?.('[data-file]');tooltip.textContent=file?file.getAttribute('data-file'):`${readable(topic.name)} · ${topic.root} · ${topic.nodes.length} files`;const rect=host.getBoundingClientRect();tooltip.style.left=`${Math.min(rect.width-180,Math.max(8,event.clientX-rect.left+12))}px`;tooltip.style.top=`${Math.max(8,event.clientY-rect.top-28)}px`;tooltip.hidden=false;});
        sector.addEventListener('pointerleave',()=>{tooltip.hidden=true;});
        sector.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onTopic(topic.id);}});
        svg.append(sector);
      }
    }
    svg.append(element('circle',{r:46,fill:'#fff',stroke:'#edf0f2','stroke-width':1}));
    svg.append(element('text',{x:0,y:-4,'text-anchor':'middle',class:'radial-title'},underground?'Mathlib':'Physlib'));
    svg.append(element('text',{x:0,y:14,'text-anchor':'middle',class:'radial-meta'},`${groups.reduce((sum,g)=>sum+g.topics.reduce((n,t)=>n+t.nodes.length,0),0)} files`));
    svg.append(element('text',{x:0,y:28,'text-anchor':'middle',class:'radial-meta'},'Folder hierarchy'));
  }
  svg.addEventListener('wheel',event=>{
    event.preventDefault();
    if(isTrackpadPan(event)){const rect=svg.getBoundingClientRect(),scale=view.size/Math.max(1,Math.min(rect.width,rect.height));view.x+=event.deltaX*scale;view.y+=event.deltaY*scale;updateView();}
    else zoom(Math.exp(event.deltaY*.0015));
  },{passive:false});
  svg.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY,startX:view.x,startY:view.y};wasDragged=false;});
  svg.addEventListener('pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(dx,dy)>3&&!wasDragged){wasDragged=true;svg.setPointerCapture(event.pointerId);}const rect=svg.getBoundingClientRect(),scale=view.size/Math.max(1,Math.min(rect.width,rect.height));view.x=drag.startX-dx*scale;view.y=drag.startY-dy*scale;updateView();});
  svg.addEventListener('pointerup',()=>{drag=null;});svg.addEventListener('pointercancel',()=>{drag=null;});
  draw();
  return {setLayer:value=>{underground=value;view={x:-400,y:-400,size:800};updateView();draw();},zoom,reset:()=>{view={x:-400,y:-400,size:800};updateView();},get underground(){return underground;}};
}
