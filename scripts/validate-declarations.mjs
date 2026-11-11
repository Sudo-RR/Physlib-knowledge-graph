import { readDeclarationPair } from './declaration-query.mjs';

const [graphFile, declarationFile] = process.argv.slice(2);
if (!graphFile || !declarationFile) throw Error('Usage: node scripts/validate-declarations.mjs <graph.json> <declarations.json>');
const { declarations } = await readDeclarationPair(graphFile, declarationFile);
console.log(`Declaration snapshot valid for ${declarations.source.revision}: ${declarations.declarations.length} declarations, ${declarations.dependencies.length} recorded dependencies.`);
