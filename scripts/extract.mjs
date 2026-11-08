import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Preserve line breaks and character positions while discarding nested Lean comments.
export function stripComments(text) {
  let out = '', depth = 0, line = false, string = false, escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (line) { if (c === '\n') { line = false; out += c; } else out += ' '; continue; }
    if (depth) {
      if (c === '/' && n === '-') { depth++; out += '  '; i++; }
      else if (c === '-' && n === '/') { depth--; out += '  '; i++; }
      else out += c === '\n' ? '\n' : ' ';
      continue;
    }
    if (!string && c === '/' && n === '-') { depth = 1; out += '  '; i++; continue; }
    if (!string && c === '-' && n === '-') { line = true; out += '  '; i++; continue; }
    if (c === '"' && !escaped) string = !string;
    escaped = string && c === '\\' && !escaped;
    out += c;
  }
  return out;
}

export function importsFromSource(text) {
  const result = [];
  const lines = stripComments(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^\s*(?:(public|private)\s+)?(?:(meta)\s+)?import\s+(?:all\s+)?(.+?)\s*$/);
    if (!match) continue;
    // Lean headers can list multiple module names on one import line.
    for (const name of match[3].split(/\s+/)) {
      if (/^[\p{L}\p{N}_'«».-]+$/u.test(name)) result.push({ module: name, line: i + 1, kind: [match[1], match[2]].filter(Boolean).join(' ') || 'import' });
    }
  }
  return result;
}

export function mapFromSource(text, file) {
  const title = text.match(/^#\s+(.+)$/m)?.[1]?.trim() || file;
  const abstract = text.match(/^## Abstract(?: \(Alpha\))?\s*\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1]?.trim().replace(/\s+/g, ' ') || '';
  const section = text.match(/^## Lean References\s*\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1] || '';
  const references = [];
  for (const line of section.split(/\r?\n/)) {
    const match = line.match(/^\s*\d+\.\s+`?((?:Physlib|PhyslibAlpha|QuantumInfo)\/[^\s`]+?\.lean)`?/);
    if (match) references.push(match[1]);
  }
  return { path: file, title, abstract, references: [...new Set(references)] };
}

async function walk(dir, root) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) result.push(...await walk(full, root));
    else if (item.isFile() && (item.name.endsWith('.lean') || item.name === 'API-map.md')) result.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return result;
}

export async function buildGraph(root) {
  const sha = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (execFileSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8' }).trim()) throw new Error('Physlib checkout has uncommitted changes; use a clean checkout for a reproducible snapshot.');
  const roots = ['Physlib', 'PhyslibAlpha', 'QuantumInfo'];
  const files = (await Promise.all(roots.map(r => walk(path.join(root, r), root)))).flat();
  for (const r of roots) files.push(`${r}.lean`);
  files.sort();
  const modules = [], maps = [];
  for (const file of files) {
    const text = await readFile(path.join(root, file), 'utf8');
    if (file.endsWith('.lean')) modules.push({ id: file.slice(0, -5).replaceAll('/', '.'), path: file, library: file.split(/[/.]/)[0], imports: importsFromSource(text) });
    else maps.push(mapFromSource(text, file));
  }
  const paths = new Set(modules.map(m => m.path));
  return { schemaVersion: 1, source: { repository: 'https://github.com/leanprover-community/physlib', revision: sha, generatedAt: new Date().toISOString(), method: 'source-header scan; API-map Lean References' }, modules, maps, unresolvedMapReferences: maps.flatMap(m => m.references.filter(p => !paths.has(p)).map(p => ({ map: m.path, path: p }))) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = path.resolve(process.argv[2] || '.physlib-source');
  const output = path.resolve(process.argv[3] || 'site/data/graph.json');
  const graph = await buildGraph(root);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(graph));
  console.log(`Extracted ${graph.modules.length} modules, ${graph.maps.length} API maps, ${graph.unresolvedMapReferences.length} unresolved map references from ${graph.source.revision}.`);
}
