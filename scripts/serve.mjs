import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
const root = path.resolve('site');
createServer(async (req, res) => {
  // Opt-in local QA evidence sink. Never packaged into the static Pages site.
  if(req.method==='POST'&&req.url==='/__city-benchmark'){
    if(!['127.0.0.1','::1'].includes(req.socket.remoteAddress)||
      !['http://127.0.0.1:4173','http://localhost:4173'].includes(req.headers.origin)||
      !req.headers['content-type']?.startsWith('application/json')){res.writeHead(403).end();return;}
    try{
      let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>32768)throw Error('Report too large');}
      const data=JSON.parse(body);if(!Number.isFinite(data.fps)||!Array.isArray(data.calls)||typeof data.allFramesForeground!=='boolean')throw Error('Invalid benchmark');
      const directory=path.resolve('dist/city-benchmarks');await mkdir(directory,{recursive:true});
      await writeFile(path.join(directory,`${Date.now()}-${randomUUID()}.json`),JSON.stringify(data,null,2));
      res.writeHead(201).end('Saved');
    }catch{res.writeHead(400).end('Invalid report');}return;
  }
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` }).end(body);
  } catch { res.writeHead(404).end('Not found. Generate data with npm run build:data.'); }
}).listen(4173, '127.0.0.1', () => console.log('http://127.0.0.1:4173'));
