import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importsFromSource, mapFromSource } from '../scripts/extract.mjs';

test('extracts direct imports while ignoring nested comments', () => {
  const source = '/- header\n /- import Fake.Nested -/\n-/\nmodule\npublic import Physlib.A -- comment\nmeta import Mathlib.B\nimport Physlib.C Physlib.D\n-- import Fake.Line\n';
  assert.deepEqual(importsFromSource(source), [
    { module: 'Physlib.A', line: 5, kind: 'public' },
    { module: 'Mathlib.B', line: 6, kind: 'meta' },
    { module: 'Physlib.C', line: 7, kind: 'import' },
    { module: 'Physlib.D', line: 7, kind: 'import' }
  ]);
});

test('extracts only Lean References and handles repeated references', () => {
  const source = '# Energy\n\n## Abstract (Alpha)\n\nA short\nsummary.\n\n## Content\n\nPhyslib/Other.lean\n\n## Lean References\n\n1. Physlib/Energy/Basic.lean — `energy`\n2. Physlib/Energy/Basic.lean — `mass`\n3. QuantumInfo/Basic.lean — `x`\n\n## References\n\nPhyslib/NotAReference.lean\n';
  assert.deepEqual(mapFromSource(source, 'Physlib/Energy/API-map.md'), { path: 'Physlib/Energy/API-map.md', title: 'Energy', abstract: 'A short summary.', references: ['Physlib/Energy/Basic.lean', 'QuantumInfo/Basic.lean'] });
});
