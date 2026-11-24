import {createMetropolisCentres} from './city-metropolis.js';
import * as THREE from 'three';
import {boroughColors,mixColor} from './city-colors.js';

/** Opaque, ordered ground layers: no coplanar transparency or distant depth fighting. */
export function createChromaticGeography(manifest){
 const metropolis=manifest.visual==='c3';const group=new THREE.Group();group.name='Chromatic repository territories';
 const layers=new Map(),color=new THREE.Color();
 function polygon(points,tint,order){if(!layers.has(order))layers.set(order,{vertices:[],colors:[]});const b=layers.get(order);color.set(tint);for(let i=1;i<points.length-1;i++)for(const p of [points[0],points[i+1],points[i]]){b.vertices.push(p[0],0,p[1]);b.colors.push(color.r,color.g,color.b);}}
 const rect=(b,c,order)=>polygon([[b.minX,b.minZ],[b.maxX,b.minZ],[b.maxX,b.maxZ],[b.minX,b.maxZ]],c,order);
 const inset=(b,n)=>({minX:b.minX+n,minZ:b.minZ+n,maxX:b.maxX-n,maxZ:b.maxZ-n});
 for(const b of manifest.boroughs){rect(b.bounds,mixColor(boroughColors[b.id],'#f1e6d0',metropolis?.94:.68),-100);for(const x of [b.bounds.minX+1,b.bounds.maxX-4])rect({minX:x,maxX:x+3,minZ:0,maxZ:b.bounds.maxZ},boroughColors[b.id],-75);}
 for(const r of manifest.rivers){rect(r.bounds,'#318b9a',-98);const points=[...r.centerline.map(p=>[p.x-r.width/2,p.z]),...r.centerline.slice().reverse().map(p=>[p.x+r.width/2,p.z])];polygon(points,'#36b8c6',-97);}
 for(const p of manifest.parcels){const id=p.identity;if(p.depth===1){polygon(p.polygon,id.dark,-94);const centre=[p.polygon.reduce((s,v)=>s+v[0],0)/4,p.polygon.reduce((s,v)=>s+v[1],0)/4],inner=p.polygon.map(v=>v.map((n,i)=>n+(centre[i]-n)*.018));polygon(inner,metropolis?mixColor(id.primary,'#f2ead7',.76):id.ground,-93);}else if(p.depth===2)rect(p.bounds,metropolis?mixColor(id.primary,'#f2ead7',.83):id.neighborhood,-92);}
 for(const p of manifest.parks){const district=manifest.parcels.find(d=>d.depth===1&&d.id===p.id.split('/park/')[0]);rect(p.bounds,metropolis?'#d0dcc0':'#7cae7a',-90);}
 for(const c of manifest.courtyards){const district=manifest.parcels.find(d=>d.id===c.directoryPath)||manifest.parcels.find(d=>d.id===c.directoryPath.split('/').slice(0,2).join('/'));rect(c.bounds,mixColor(district?.identity.primary||'#d9b43a','#f9efd5',.68),-89);}
 for(const c of manifest.corridors){if(c.kind==='street')rect(c.bounds,'#f6efd9',-85);else if(c.kind==='pipe-service')rect(c.bounds,'#72828b',-86);}
 for(const m of Object.values(manifest.modules)){
  const b=m.decorativeBounds;rect(b,mixColor(m.identity.primary,'#fff6e5',.78),-84);
  // Cheap offset contact shade under the architectural mass, not an illuminated foundation.
  rect({minX:m.position.x-m.footprint.width*.44+.55,maxX:m.position.x+m.footprint.width*.48+.55,minZ:m.position.z-m.footprint.depth*.44+.7,maxZ:m.position.z+m.footprint.depth*.48+.7},mixColor(m.identity.primary,'#27334d',.55),-83);
 }
 for(const l of manifest.landmarks){rect({minX:l.bounds.minX-2,maxX:l.bounds.maxX+2,minZ:l.bounds.minZ-3,maxZ:l.bounds.maxZ+3},mixColor(l.identity.primary,'#fff5de',.55),-82);}
 for(const [order,b] of layers){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(b.vertices,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(b.colors,3));geometry.computeBoundingSphere();const material=new THREE.MeshBasicMaterial({vertexColors:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=order;mesh.userData={civic:true,decorative:true,layer:order};group.add(mesh);}
 const box=new THREE.BoxGeometry(1,1,1),dome=new THREE.SphereGeometry(.5,10,5,0,Math.PI*2,0,Math.PI/2),ring=new THREE.TorusGeometry(.42,.06,6,18),orb=new THREE.OctahedronGeometry(.5),batches=new Map(),part=new THREE.Object3D();
 const white=new THREE.MeshStandardMaterial({color:0xfff2db,roughness:.65,metalness:.1}),enamel=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.42,metalness:.15});
 function add(l,shape,mat,x,y,z,w,h,d,detail=false,tint=l.identity.primary){if(l.kind==='district-landmark'){x*=1.6;z*=1.6;w*=1.6;d*=1.6;}const key=shape.uuid+mat.uuid+detail;if(!batches.has(key))batches.set(key,{shape,mat,detail,items:[]});part.position.set(l.position.x+x,y,l.position.z+z);part.rotation.set(0,0,l.slope||0);part.scale.set(w,h,d);part.updateMatrix();batches.get(key).items.push({matrix:part.matrix.clone(),tint,id:l.id});}
 for(const l of metropolis?[]:manifest.landmarks){
  const addPart=(shape,mat,x,y,z,w,h,d,detail=false,tint)=>add(l,shape,mat,x,y,z,w,h,d,detail,tint);
  if(manifest.composition==='porcelain'){addPart(box,white,0,4,0,16,8,10);addPart(dome,enamel,0,8,0,16,10,12);addPart(orb,enamel,0,25,0,8,16,8);}
  else if(l.shape===0){for(const x of [-6,6])addPart(box,enamel,x,13,0,2,26,3);addPart(box,white,0,27,0,17,2,5);addPart(orb,enamel,0,30,0,5,7,5);}
  else if(l.shape===1){addPart(box,white,0,5,0,16,10,12);addPart(dome,enamel,0,10,0,17,13,13);addPart(orb,enamel,0,24,0,3,8,3);}
  else if(l.shape===2){for(const x of [-5,0,5])addPart(box,enamel,x,13+Math.abs(x)*.4,0,2.4,26+Math.abs(x)*.8,5);addPart(box,white,0,8,0,17,1.5,8);}
  else {addPart(ring,enamel,0,16,0,17,30,3);for(const x of [-5,5])addPart(box,white,x,3,0,2,6,4);addPart(orb,white,0,17,0,4,6,4);}
  for(let i=0;i<l.identity.bands;i++)addPart(box,enamel,0,2+i*.7,5.5,15,.22,.6,true);
  for(let i=0;i<l.identity.finCount;i++)addPart(box,white,-6+i*4,4,6,1,8,.5,true);
 }
 // Bridge decks and bank-coloured balustrades are civic scenery, never import endpoints.
 for(const c of manifest.crossings){const b=c.bounds,l={id:c.id,position:{x:(b.minX+b.maxX)/2,z:(b.minZ+b.maxZ)/2},identity:{primary:'#f3c356'}};add(l,box,white,0,1,0,b.maxX-b.minX,.5,b.maxZ-b.minZ);for(const z of [-3,3])add(l,box,enamel,0,1.7,z,b.maxX-b.minX,.7,.22,false,boroughColors[manifest.rivers[manifest.crossings.indexOf(c)].between[0]]);}
 for(const a of manifest.approaches){const b=a.bounds,l={id:a.id,position:{x:(b.minX+b.maxX)/2,z:(b.minZ+b.maxZ)/2},identity:{primary:'#f3c356'},slope:a.slope};add(l,box,white,0,.55,0,b.maxX-b.minX,.25,b.maxZ-b.minZ);}
 for(const t of manifest.vegetation){add(t,box,white,0,1.3,0,.35,2.6,.35,true);add(t,orb,enamel,0,2.8,0,3,3.2,3,true,'#51a778');}
 const positions=new Map([...manifest.landmarks,...manifest.vegetation].map(l=>[l.id,new THREE.Vector3(l.position.x,14,l.position.z)]));
 for(const b of batches.values()){b.mesh=new THREE.InstancedMesh(b.shape,b.mat,b.items.length);b.items.forEach((i,n)=>{b.mesh.setMatrixAt(n,i.matrix);b.mesh.setColorAt(n,color.set(b.mat===white?'#ffffff':i.tint));});b.mesh.computeBoundingSphere();b.mesh.castShadow=!b.detail;b.mesh.userData={civic:true,decorative:true};group.add(b.mesh);}
 const outline=new THREE.LineLoop(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x17243a,depthTest:false,depthWrite:false}));outline.visible=false;outline.renderOrder=-70;group.add(outline);
 group.userData.setScope=id=>{const p=manifest.parcels.find(p=>p.depth===1&&(p.id===id||id?.startsWith(p.id+'/')));outline.visible=Boolean(p);if(p){outline.geometry.dispose();outline.geometry=new THREE.BufferGeometry().setFromPoints(p.polygon.map(([x,z])=>new THREE.Vector3(x,.2,z)));}};
 group.userData.civicBatches=batches;let last=-Infinity;group.userData.update=({camera,quality,distance=1000})=>{if(performance.now()-last<200)return;last=performance.now();for(const mesh of group.children)if(mesh.userData.layer===-86)mesh.visible=quality!=='low'&&distance<350;for(const b of batches.values()){if(!b.detail)continue;let n=0;if(quality!=='low')for(const item of b.items){if(camera.position.distanceTo(positions.get(item.id))>240)continue;b.mesh.setMatrixAt(n,item.matrix);b.mesh.setColorAt(n,color.set(b.mat===white?'#ffffff':item.tint));n++;}b.mesh.count=n;b.mesh.visible=n>0;b.mesh.instanceMatrix.needsUpdate=true;}};
 if(metropolis){const centres=createMetropolisCentres(manifest);group.add(centres);const old=group.userData.update;group.userData.update=args=>{old(args);centres.userData.update(args);};group.userData.metropolisCentres=centres;}return group;
}
