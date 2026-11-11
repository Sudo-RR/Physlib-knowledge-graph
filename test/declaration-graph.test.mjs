import test from 'node:test';
import assert from 'node:assert/strict';
import { declarationGraph } from '../site/declaration-graph.js';

const s={declarations:['A','B','C','D'].map(id=>({id})),dependencies:[{from:'A',to:'B',kind:'statement'},{from:'B',to:'C',kind:'proof'},{from:'D',to:'A',kind:'unspecified'},{from:'A',to:'External',kind:'unspecified'}]};
test('follows dependency direction, breadth and indexed boundaries',()=>{const v=declarationGraph(s,'A',{depth:2});assert.equal(v.nodes.find(n=>n.id==='D').role,'importer');assert.equal(v.nodes.find(n=>n.id==='C').distance,2);assert.equal(v.nodes.find(n=>n.id==='External').indexed,false);assert.ok(v.edges.some(e=>e.from==='B'&&e.to==='C'));assert.equal(declarationGraph(s,'missing'),null);});
test('reports nodes omitted by the display limit',()=>{const v=declarationGraph(s,'A',{limit:1});assert.equal(v.nodes.filter(n=>n.role==='import').length,1);assert.equal(v.omitted,1);});
