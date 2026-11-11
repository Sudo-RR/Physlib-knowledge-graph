import { unlink, writeFile } from 'node:fs/promises';

const ready = process.env.PREPARE_OUTCOME === 'success' && process.env.PILOT_OUTCOME === 'success';
if (!ready) await unlink('site/data/declarations.json').catch(e=>{if(e.code!=='ENOENT')throw e;});
await writeFile('site/data/declaration-status.json',JSON.stringify({status:ready?'available':'failed'}));
