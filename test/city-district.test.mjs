import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {layoutFullCity} from '../site/city-layout.js';
import {planModularBuilding,storyHeight,createShowcaseDistrict,isShowcaseNode,districtCameraPose} from '../site/city-district.js';
import {selectedSkywalkEdges,skywalkCurve,createSkywalks} from '../site/city-skywalks.js';
import {summarizeFrames} from '../site/city-benchmark.js';
import {validateDistrictKit} from '../scripts/validate-assets.mjs';
import {clearDisposableGroup} from '../site/city-resources.js';
import {createLodShowcase,chooseLod,advanceLod,projectedHeight} from '../site/city-district-lod.js';
import {profileOptions,summarizePhaseTimings} from '../site/city-render-profile.js';

// Self-contained fixtures: tests never require ignored production snapshots.
const ids=['Physlib.Units.A','Physlib.Units.B','Physlib.Units.C','Physlib.Units.WithDim.D','Physlib.Other.A'];
const nodes=ids.map(id=>({id,library:'Physlib',module:{id,path:id.replaceAll('.','/')+'.lean',imports:[]}}));
const city={nodes,edges:[{from:ids[0],to:ids[1],line:8},{from:ids[0],to:ids[2],line:9},{from:ids[4],to:ids[0],line:3}]};
const layout=layoutFullCity(city),floors=new Map(nodes.map((n,i)=>[n.id,{height:8.357+i*3.12}]));

test('fixed-unit stories preserve semantic heights with only a sub-story remainder',()=>{
 for(const node of nodes)for(const height of [2.01,8.357,16.04165,30.7]){
  const plan=planModularBuilding(node,height);
  assert.ok(plan.serviceHeight>=0&&plan.serviceHeight<storyHeight+1e-12);
  assert.ok(plan.floors.every(f=>f.height===storyHeight));
  assert.ok(Math.abs(plan.podium+plan.floors.length*storyHeight+plan.serviceHeight+plan.roof-height)<1e-12);
  assert.ok(plan.podium<1);assert.deepEqual(plan,planModularBuilding(node,height));
 }
});

async function geometryOnlyTemplate(){
 const bytes=await readFile(new URL('../site/assets/models/kenney-district-kit.glb',import.meta.url));
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
 // Node has no image decoder. Preserve every shipped vertex/index/transform;
 // substitute the material only for this geometry/instancing test.
 delete json.images;delete json.textures;delete json.samplers;json.materials=[{pbrMetallicRoughness:{baseColorFactor:[1,1,1,1]}}];
 const pad=b=>Buffer.concat([b,Buffer.alloc((4-b.length%4)%4,32)]),metadata=pad(Buffer.from(JSON.stringify(json))),binary=bytes.subarray(28+bytes.readUInt32LE(12));
 const header=Buffer.alloc(20),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+metadata.length+binary.length,8);header.writeUInt32LE(metadata.length,12);header.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(binary.length);bh.writeUInt32LE(0x004e4942,4);
 const output=Buffer.concat([header,metadata,bh,binary]);return (await new GLTFLoader().parseAsync(output.buffer.slice(output.byteOffset,output.byteOffset+output.length),'')).scene;
}

test('genuine kit parses, instances share resources and graph/positions stay unchanged',async()=>{
 const receipt=await validateDistrictKit();assert.equal(receipt.parts.length,5);assert.ok(receipt.bytes<30000);
 const template=await geometryOnlyTemplate(),before=JSON.stringify(city),beforePositions=JSON.stringify([...layout.positions]);
 const district=createShowcaseDistrict({nodes:nodes.filter(isShowcaseNode),layout,floors,template});
 assert.equal(district.plans.size,4);assert.ok(district.instanceCount>500);assert.ok(district.batchCount<25);
 assert.ok(district.group.children.every(c=>c.isInstancedMesh));
 const assetGeometries=new Set();template.traverse(o=>{if(o.isMesh)assetGeometries.add(o.geometry);});
 assert.equal(district.group.children.filter(mesh=>assetGeometries.has(mesh.geometry)).length,5);
 const transform=new THREE.Matrix4();
 for(const mesh of district.group.children){mesh.geometry.computeBoundingBox();
  for(let i=0;i<mesh.count;i++){const id=mesh.userData.moduleIds[i];if(!id)continue;
   mesh.getMatrixAt(i,transform);const bounds=mesh.geometry.boundingBox.clone().applyMatrix4(transform),plan=district.plans.get(id),point=layout.positions.get(id);
   assert.ok(bounds.max.y<=plan.height+1e-5,`${id}: decorative crown exceeds semantic height`);
   assert.ok(bounds.min.y>=-1e-5,`${id}: building below grade`);
   assert.ok(bounds.min.x>=point.x-plan.footprint.width/2-1e-5&&bounds.max.x<=point.x+plan.footprint.width/2+1e-5,`${id}: art exceeds X footprint`);
   assert.ok(bounds.min.z>=point.z-plan.footprint.depth/2-1e-5&&bounds.max.z<=point.z+plan.footprint.depth/2+1e-5,`${id}: art exceeds Z footprint`);
  }
 }
 assert.equal(JSON.stringify(city),before);assert.equal(JSON.stringify([...layout.positions]),beforePositions);
 const archetypes=new Set(Array.from({length:40},(_,i)=>planModularBuilding({id:`Physlib.Units.N${i}`},12).archetype));assert.equal(archetypes.size,3);
});

test('skywalks are capped recorded selected local imports with explicit direction',()=>{
 const ids=new Set(nodes.filter(isShowcaseNode).map(n=>n.id));
 assert.deepEqual(selectedSkywalkEdges(city.edges,ids,city.nodes[0].id,'imports',1),[city.edges[0]]);
 assert.deepEqual(selectedSkywalkEdges(city.edges,ids,city.nodes[1].id,'importers'),[city.edges[0]]);
 assert.deepEqual(selectedSkywalkEdges(city.edges,ids,null),[]);assert.deepEqual(selectedSkywalkEdges(city.edges,ids,city.nodes[0].id,'none'),[]);
 const curve=skywalkCurve(city.edges[0],nodes.filter(isShowcaseNode),layout.positions,floors);
 assert.ok(curve.getPoints(40).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z)&&p.y>0));
 const bridges=createSkywalks({edges:[city.edges[0]],nodes:nodes.filter(isShowcaseNode),positions:layout.positions,floors});
 assert.ok(bridges.group.children.length<=5);assert.equal(bridges.arrows.length,1);
 let released=0;for(const mesh of bridges.group.children.filter(m=>m.isInstancedMesh))mesh.addEventListener('dispose',()=>released++);
 clearDisposableGroup(bridges.group);assert.equal(released,2);assert.equal(bridges.group.children.length,0);
});

test('comparison camera uses semantic inputs only; frame percentiles are measurable',()=>{
 assert.deepEqual(districtCameraPose(nodes,layout.positions,floors),districtCameraPose(nodes,layout.positions,floors));
 const samples=[10,20,30,40,100].map(ms=>({ms,calls:20,geometries:8,textures:2}));
 assert.deepEqual(summarizeFrames(samples,200),{frames:5,durationMs:200,fps:25,p50Ms:30,p95Ms:100,p99Ms:100,maxMs:100,calls:[20,20],geometries:8,textures:2});
});

test('benchmark evidence distinguishes foreground runs from interrupted focus',()=>{
 const frames=[true,false,true].map(foreground=>({ms:16,calls:20,geometries:8,textures:2,foreground}));
 const interrupted=summarizeFrames(frames,48);
 assert.equal(interrupted.foregroundFrames,2);assert.equal(interrupted.allFramesForeground,false);
 const valid=summarizeFrames(frames.filter(frame=>frame.foreground),32);
 assert.equal(valid.foregroundFrames,valid.frames);assert.equal(valid.allFramesForeground,true);
});

test('screen-space tiers have hysteresis, continuous weights and a real Low detail cap',()=>{
 assert.equal(chooseLod(130,{previous:'city'}),'city');
 assert.equal(chooseLod(130,{previous:'district'}),'district');
 assert.equal(chooseLod(240,{selected:true}),'building');
 assert.equal(chooseLod(600,{selected:true,quality:'low'}),'district');
 let weights=[1,0,0];for(let i=0;i<20;i++){
  const next=advanceLod(weights,'building',.02);assert.ok(Math.abs(next.reduce((a,b)=>a+b,0)-1)<1e-10);
  assert.ok(Math.abs(next[2]-weights[2])<=.02/.38+1e-10);weights=next;
 }
 assert.deepEqual(weights,[0,0,1]);assert.ok(projectedHeight(20,20,40,500)>projectedHeight(20,100,40,500));
});

test('LOD compaction reduces submitted triangles while preserving exact module plans',async()=>{
 const template=await geometryOnlyTemplate(),before=JSON.stringify(city),positions=JSON.stringify([...layout.positions]);
 const district=createLodShowcase({nodes:nodes.filter(isShowcaseNode),layout,floors,template});
 const camera=new THREE.PerspectiveCamera(40,1,.1,1000);camera.position.set(20,30,50);
 const settle=(quality,force,offset)=>{let stats;for(let i=0;i<8;i++)stats=district.update({camera,viewportHeight:500,quality,selected:nodes[0].id,force,now:offset+i*100});return stats;};
 const detail=settle('medium','building',0),shell=settle('medium','district',1000),silhouette=settle('low','city',2000);
 assert.ok(shell.triangles<detail.triangles*.25);assert.ok(silhouette.triangles<shell.triangles);
 assert.equal(shell.counts.district,4);assert.equal(silhouette.counts.city,4);
 for(const node of nodes.filter(isShowcaseNode)){const plan=district.plans.get(node.id);assert.equal(plan.height,floors.get(node.id).height);assert.equal(plan.moduleId,node.id);}
 assert.equal(JSON.stringify(city),before);assert.equal(JSON.stringify([...layout.positions]),positions);
 const attributes=new Set();template.traverse(object=>{if(object.isMesh){attributes.add(object.geometry.attributes.position);assert.equal(object.geometry.attributes.instanceLodWeight,undefined);}});
 assert.equal(district.batches.filter(b=>b.tier==='building'&&attributes.has(b.mesh.geometry.attributes.position)).length,5);
});

test('profiling variants isolate requested work and summarize CPU submission phases',()=>{
 assert.equal(profileOptions('quarter').pixelScale,.5);assert.equal(profileOptions('clear').clearOnly,true);
 assert.equal(profileOptions('live-shadows').liveShadows,true);assert.equal(profileOptions('nonsense').name,'normal');
 assert.deepEqual(summarizePhaseTimings([{updateMs:1,renderSubmitMs:2},{updateMs:3,renderSubmitMs:6}]),{updateMs:{median:3,p95:3},renderSubmitMs:{median:6,p95:6}});
});
