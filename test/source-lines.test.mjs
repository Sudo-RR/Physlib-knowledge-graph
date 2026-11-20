import test from 'node:test';import assert from 'node:assert/strict';import {sourceLineCount} from '../scripts/extract.mjs';
test('source line counts handle empty and trailing newline files',()=>{
 assert.equal(sourceLineCount(''),0);assert.equal(sourceLineCount('a'),1);assert.equal(sourceLineCount('a\n'),1);assert.equal(sourceLineCount('a\r\nb\r\n'),2);assert.equal(sourceLineCount('\n'),1);
});
