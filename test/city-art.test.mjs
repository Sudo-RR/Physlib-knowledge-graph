import test from 'node:test';
import assert from 'node:assert/strict';
import { roofStyle, buildingStyle, createCityArt, createConstructionSite } from '../site/city-art.js';

test('roof variants are stable and do not change node data',()=>{
  const nodes=['Physlib.A','Physlib.B','Physlib.C','Physlib.D'].map(id=>({id,library:'Physlib'}));
  const original=JSON.stringify(nodes);
  const positions=new Map(nodes.map((n,i)=>[n.id,{x:i*4,z:0}]));
  const floors=new Map(nodes.map(n=>[n.id,{height:10}]));
  const art=createCityArt(nodes,positions,floors);
  assert.equal(art.children.slice(0,4).reduce((sum,mesh)=>sum+mesh.count,0),nodes.length);
  assert.equal(art.children[4].count,nodes.length);
  assert.equal(JSON.stringify(nodes),original);
  assert.equal(roofStyle(nodes[0].id),roofStyle(nodes[0].id));
  assert.equal(new Set(nodes.map(node=>buildingStyle(node.id).name)).size,4);
});

test('construction kit is an explicit wireframe and does not alter file data',()=>{
  const site=createConstructionSite(2,8,2);
  assert.equal(site.children[0].type,'LineSegments');
  assert.equal(site.children[1].type,'Mesh');
  assert.throws(()=>createConstructionSite(2,-1,2),/positive/);
  const nodes=[{id:'Physlib.A',library:'Physlib'}],positions=new Map([['Physlib.A',{x:3,z:4}]]),floors=new Map([['Physlib.A',{height:8}]]);
  const art=createCityArt(nodes,positions,floors,{constructionIds:new Set(['Physlib.A'])});
  assert.equal(art.children[0].children[0].type,'LineSegments');
  assert.equal(art.children.slice(1,5).reduce((sum,mesh)=>sum+mesh.count,0),0);
  assert.equal(nodes[0].constructionStatus,undefined);
});
