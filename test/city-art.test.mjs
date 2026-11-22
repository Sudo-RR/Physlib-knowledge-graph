import test from 'node:test';
import assert from 'node:assert/strict';
import { roofStyle, buildingStyle, createCityArt } from '../site/city-art.js';

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
