// Read-only architectural plan projection, derived from existing city geometry.
export function convexOutline(points){
 const p=[...new Map(points.map(v=>[v.join(','),v])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 if(p.length<3)return p;
 const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),half=seq=>{const h=[];for(const v of seq){while(h.length>1&&cross(h.at(-2),h.at(-1),v)<=1e-10)h.pop();h.push(v);}return h;};
 return [...half(p).slice(0,-1),...half([...p].reverse()).slice(0,-1)];
}
export function meshPlanOutline(geometry){
 if(!geometry)return null;const p=geometry.getAttribute('position'),points=[];for(let i=0;i<p.count;i++)points.push([p.getX(i),p.getZ(i)]);
 return convexOutline(points);
}
const rect=(w,d)=>[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]];
export function roofOutline(t,meshOutline=null){
 const {w,d}=t;
 if(t.role==='provisional')return rect(w,d);
 if(meshOutline?.length>=3)return meshOutline.map(([x,z])=>[x*w,z*d]);
 if(t.style===2||t.style===4){const scale=t.style===2?1.12:1.04;return Array.from({length:24},(_,i)=>[Math.cos(i*Math.PI/12)*w*scale/2,Math.sin(i*Math.PI/12)*d*scale/2]);}
 return rect(w*(t.style===3?1.07:.98),d*(t.style===3?1.07:.98));
}
export function parcelDistance(t,x,z){
 const c=Math.cos(t.angle||0),s=Math.sin(t.angle||0),dx=x-t.x,dz=z-t.z;
 return Math.hypot(Math.max(0,Math.abs(c*dx-s*dz)-t.w/2),Math.max(0,Math.abs(s*dx+c*dz)-t.d/2));
}
// Bounded nearest-parcel assignment; each grid cell belongs to at most one
// borough. Iterate local windows rather than scanning all parcels per cell.
// SVG clipping uses the exact bank polygons, and roads/parks/water overdraw.
export function boroughEnvelopes(sites,frame,{step=3,buffer=16}={}){
 const nx=Math.ceil(frame.width/step),nz=Math.ceil(frame.height/step),owners=new Int32Array(nx*nz).fill(-1),scores=new Float64Array(nx*nz).fill(Infinity),groups=[],index=new Map();
 const ordered=[...sites].sort((a,b)=>a.id.localeCompare(b.id));
 for(const t of ordered){const key=t.library+'|'+t.area;if(!index.has(key)){index.set(key,groups.length);groups.push({key,library:t.library,area:t.area,siteIds:[],cells:0,runs:[],edges:[]});}const k=index.get(key),group=groups[k];group.siteIds.push(t.id);
  const r=Math.hypot(t.w,t.d)/2+buffer;
  for(let j=Math.max(0,Math.floor((t.z-r)/step));j<Math.min(nz,Math.ceil((t.z+r)/step));j++)for(let i=Math.max(0,Math.floor((t.x-r)/step));i<Math.min(nx,Math.ceil((t.x+r)/step));i++){
   const d=parcelDistance(t,(i+.5)*step,(j+.5)*step),at=j*nx+i;
   if(d<=buffer&&d<scores[at]-1e-9){scores[at]=d;owners[at]=k;}
  }
 }
 const at=(i,j)=>i<0||j<0||i>=nx||j>=nz?-1:owners[j*nx+i];
 for(let j=0;j<nz;j++){
  for(let i=0;i<nx;){const k=at(i,j);if(k<0){i++;continue;}let e=i+1;while(e<nx&&at(e,j)===k)e++;
   const g=groups[k],x=i*step,z=j*step,w=(e-i)*step;g.runs.push(`M${x} ${z}h${w}v${step}h-${w}Z`);g.cells+=e-i;
   for(let q=i;q<e;q++){const xx=q*step;if(at(q,j-1)!==k)g.edges.push(`M${xx} ${z}h${step}`);if(at(q,j+1)!==k)g.edges.push(`M${xx} ${z+step}h${step}`);}
   g.edges.push(`M${x} ${z}v${step}`,`M${e*step} ${z}v${step}`);i=e;
  }
 }
 return groups.filter(g=>g.cells).map(({runs,edges,...g})=>({...g,path:runs.join(''),boundary:edges.join('')}));
}
