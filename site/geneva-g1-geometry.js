// G1 authored normalized geography, not surveyed GIS. North = negative Z.
export const VERSION='g1-masterplan-1';
export const FRAME={width:1000,height:800};
const smooth=(points,iterations=2)=>{let p=points;for(let j=0;j<iterations;j++){const q=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];q.push([.75*a[0]+.25*b[0],.75*a[1]+.25*b[1]],[.25*a[0]+.75*b[0],.25*a[1]+.75*b[1]]);}q.push(p.at(-1));p=q;}return p;};
const rev=p=>[...p].reverse();
const join=(...parts)=>parts.flat().filter((p,i,a)=>!i||p[0]!==a[i-1][0]||p[1]!==a[i-1][1]);
const lakeWest=smooth([[690,0],[666,72],[647,132],[653,205],[632,269],[639,310],[625,330]]);
const lakeEast=smooth([[669,349],[715,307],[752,256],[822,215],[902,179],[1000,156]]);
const rhoneNorth=smooth([[0,468],[87,452],[151,438],[220,410],[292,383],[365,367],[447,350],[521,351],[581,334],[625,330]]);
const rhoneInner=smooth([[253,448],[310,417],[382,398],[450,381],[520,380],[592,365],[669,349]]);
const downstreamSouth=smooth([[0,500],[87,486],[159,469],[206,457]]);
const arveInner=smooth([[253,448],[304,461],[365,491],[433,522],[501,548],[577,558],[660,590],[747,612],[829,602],[914,619],[1000,628]]);
const arveOuter=smooth([[206,457],[257,482],[300,493],[350,523],[420,554],[494,580],[565,590],[649,622],[747,644],[829,635],[914,651],[1000,660]]);
const water=join([[690,0],[1000,0],[1000,156]],rev(lakeEast),rev(rhoneInner),arveInner,[[1000,660]],rev(arveOuter),rev(downstreamSouth),[[0,468]],rhoneNorth,rev(lakeWest));
const sectors=[
 {id:'PhyslibAlpha',name:'Rive Droite',label:[285,184],polygon:join([[0,0],[690,0]],lakeWest,rev(rhoneNorth),[[0,0]])},
 {id:'Physlib',name:'Rive Gauche',label:[735,442],polygon:join(lakeEast,[[1000,628]],rev(arveInner),rhoneInner)},
 {id:'QuantumInfo',name:'Outre-Arve',label:[435,697],polygon:join(downstreamSouth,arveOuter,[[1000,800],[0,800],[0,500]])}
];
const parks=[
 {id:'jonction',name:'La Jonction park',sector:'Physlib',polygon:[[293,444],[312,432],[338,439],[325,451],[302,450]]},
 {id:'north-park',name:'Northern park',sector:'PhyslibAlpha',polygon:[[30,27],[153,20],[177,60],[123,106],[48,93]]},
 {id:'lake-park',name:'Lakefront park',sector:'Physlib',polygon:[[870,260],[949,226],[984,238],[979,300],[920,320],[880,305]]},
 {id:'south-park',name:'Southern park',sector:'QuantumInfo',polygon:[[760,719],[857,691],[945,716],[958,777],[787,780]]}
];
export function area(p){let a=0;for(let i=0;i<p.length;i++){const [x,y]=p[i],[u,v]=p[(i+1)%p.length];a+=x*v-u*y;}return Math.abs(a)/2;}
export function contains(p,point){let inside=false;const [x,y]=point;for(let i=0,j=p.length-1;i<p.length;j=i++){const [a,b]=p[i],[c,d]=p[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside;}return inside;}
function atX(p,x){for(let i=1;i<p.length;i++){const [a,b]=p[i-1],[c,d]=p[i];if(x>=Math.min(a,c)&&x<=Math.max(a,c)&&a!==c)return b+(d-b)*(x-a)/(c-a);}throw Error('No shoreline at x='+x);}
const bridges=[
 ...[315,432,555].map((x,i)=>({id:'rhone-'+(i+1),river:'Rhône',from:'PhyslibAlpha',to:'Physlib',a:[x,atX(rhoneNorth,x)-7],b:[x,atX(rhoneInner,x)+7],width:7})),
 ...[469,715,888].map((x,i)=>({id:'arve-'+(i+1),river:'Arve',from:'Physlib',to:'QuantumInfo',a:[x,atX(arveInner,x)-7],b:[x,atX(arveOuter,x)+7],width:6}))
];
const shorelines=[lakeWest,lakeEast,rhoneNorth,rhoneInner,downstreamSouth,arveInner,arveOuter];
export function masterplan(){return {version:VERSION,frame:FRAME,water,sectors,parks,bridges,shorelines,anchors:{lake:[815,85],outlet:[647,339],confluence:[220,446],rhoneOutlet:[0,484],arveEntry:[1000,644]}};}
export function capacity(complexes,worldUnitsPerPlanUnit=9){
 return sectors.map(s=>{const count=complexes.filter(c=>c.library===s.id).length,land=area(s.polygon)*worldUnitsPerPlanUnit**2,parkArea=parks.filter(p=>p.sector===s.id).reduce((n,p)=>n+area(p.polygon)*worldUnitsPerPlanUnit**2,0),usable=(land-parkArea)*.65,demand=count*148**2,headroom=demand?usable/demand-1:null;return {library:s.id,count,land,usable,demand,headroom};});
}
export function validatePlan(plan=masterplan()){
 const faces=[plan.water,...plan.sectors.map(s=>s.polygon)],total=faces.reduce((n,p)=>n+area(p),0);
 if(Math.abs(total-FRAME.width*FRAME.height)>1e-5)throw Error('Land/water area mismatch '+total);
 for(let x=3.17;x<FRAME.width;x+=7.3)for(let y=2.83;y<FRAME.height;y+=7.1)if(faces.filter(p=>contains(p,[x,y])).length!==1)throw Error('Face overlap/gap at '+x+','+y);
 for(const p of plan.parks){const sector=plan.sectors.find(s=>s.id===p.sector);for(const v of p.polygon)if(!contains(sector.polygon,v))throw Error('Park outside bank '+p.id);}
 for(const b of plan.bridges){const a=plan.sectors.find(s=>s.id===b.from),c=plan.sectors.find(s=>s.id===b.to);if(!contains(a.polygon,b.a)||!contains(c.polygon,b.b)||!contains(plan.water,[(b.a[0]+b.b[0])/2,(b.a[1]+b.b[1])/2]))throw Error('Invalid bridge '+b.id);}
 return {area:total,waterShare:area(plan.water)/total,bridges:plan.bridges.length};
}
