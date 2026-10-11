import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=new URL('..',import.meta.url);
test('release gate rejects fabricated chapter registration, stale core and delivery flags',()=>{
  const dir=mkdtempSync(join(tmpdir(),'report-release-'));
  try {
    for(const p of ['dist','scripts','reports','package.json','core-engine.lock.json']) cpSync(new URL(p,root),join(dir,p),{recursive:true});
    const path=join(dir,'dist/report-readiness.js'),original=readFileSync(path,'utf8');
    for(const changed of [
      original.replace('chapters: []','chapters: [1]'),
      original.replace('deliveryVerified: false','deliveryVerified: true'),
      original.replace('cycleVerified: false','cycleVerified: true'),
      original.replace('bac8b553c650d667bd3854f829db26dc7785ec56','0000000000000000000000000000000000000000')
    ]) {
      assert.notEqual(changed,original);writeFileSync(path,changed);
      const run=spawnSync(process.execPath,['scripts/verify-report-release.mjs'],{cwd:dir,encoding:'utf8'});
      assert.notEqual(run.status,0);
      assert.match(run.stderr,/AssertionError/);
    }
  } finally {rmSync(dir,{recursive:true,force:true});}
});
