import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { decodeScreenshot, compareScreenshots } from '../scripts/compare-screenshots.mjs';

// Small valid unfiltered RGB images; decoder deliberately ignores chunk CRCs.
function png(red) {
  const chunk=(name,data)=>{const h=Buffer.alloc(8),crc=Buffer.alloc(4);h.writeUInt32BE(data.length);h.write(name,4);return Buffer.concat([h,data,crc]);};
  const header=Buffer.alloc(13);header.writeUInt32BE(2,0);header.writeUInt32BE(1,4);header[8]=8;header[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.from([0,red,0,0,0,0,0]))),chunk('IEND',Buffer.alloc(0))]);
}
test('screenshot comparison flags a large visual change and rejects size mismatches',()=>{
  const a=decodeScreenshot(png(0)),b=decodeScreenshot(png(255));
  assert.equal(compareScreenshots(a,a).fraction,0);
  assert.equal(compareScreenshots(a,b).fraction,.5);
  assert.throws(()=>compareScreenshots(a,{...b,width:1}),/dimensions/);
});
