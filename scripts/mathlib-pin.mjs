import { readMathlibPin } from './extract-mathlib.mjs';

console.log(await readMathlibPin(process.argv[2] || '.physlib-source'));
