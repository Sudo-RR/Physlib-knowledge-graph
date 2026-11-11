import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rmdir, stat, unlink, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

test('failed refresh removes stale declaration data and reports failure',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'declaration-status-test-'));
  const site=path.join(root,'site'),data=path.join(site,'data'), snapshot=path.join(data,'declarations.json'),status=path.join(data,'declaration-status.json');
  try {
    await mkdir(data,{recursive:true});await writeFile(snapshot,'old data');
    execFileSync(process.execPath,[fileURLToPath(new URL('../scripts/write-declaration-status.mjs',import.meta.url))],{cwd:root,env:{...process.env,PREPARE_OUTCOME:'success',PILOT_OUTCOME:'failure'}});
    assert.equal(JSON.parse(await readFile(status,'utf8')).status,'failed');
    await assert.rejects(stat(snapshot),{code:'ENOENT'});
  } finally {await unlink(status).catch(()=>{});await unlink(snapshot).catch(()=>{});await rmdir(data);await rmdir(site);await rmdir(root);}
});
