import test from 'node:test';
import assert from 'node:assert/strict';
import { moduleLabel, wrapLabel } from '../site/labels.js';

test('keeps the complete file name rather than truncating its prefix', () => {
  assert.equal(moduleLabel('Physlib.ClassicalMechanics.Pendulum.SimplePendulum.Basic'), 'SimplePendulum.Basic');
  assert.equal(moduleLabel('Physlib.ClassicalMechanics.SimplePendulum'), 'ClassicalMechanics.SimplePendulum');
});

test('wraps long labels without losing characters', () => {
  const label = 'VeryLongModuleName.SimplePendulum';
  const lines = wrapLabel(label, 10, text => text.length);
  assert.equal(lines.join(''), label);
  assert.ok(lines.every(line => line.length <= 10));
});
