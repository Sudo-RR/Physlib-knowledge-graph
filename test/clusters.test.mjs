import test from 'node:test';
import assert from 'node:assert/strict';
import { clusterModules } from '../scripts/cluster-modules.mjs';

test('groups modules sharing non-hub local imports and records the evidence', () => {
  const m=(id,imports=[])=>({id,imports:imports.map(module=>({module}))});
  const graph={modules:[m('A',['X','Y']),m('B',['X','Y']),m('C',['X']),m('X'),m('Y')]};
  const result=clusterModules(graph);
  assert.deepEqual(result.groups,[['A','B']]);
  assert.deepEqual(result.evidence,[{modules:['A','B'],sharedImports:['X','Y']}]);
  assert.deepEqual(clusterModules(graph,{maxImporters:1}).groups,[]);
});
