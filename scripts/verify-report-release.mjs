// Release evidence is checked against actual files and rerun tests. Neither
// a chapter number nor a boolean alone is proof of a supplied report.
import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {REPORT_VERIFICATION,verifiedChapters} from '../dist/report-readiness.js';
import {REPORT_OFFER} from '../dist/report-offer.js';

const root=realpathSync(fileURLToPath(new URL('..',import.meta.url)));
const read=p=>readFileSync(resolve(root,p),'utf8');
const lock=JSON.parse(read('core-engine.lock.json'));
const evidence=JSON.parse(read('reports/verification-evidence.json'));
assert.equal(REPORT_VERIFICATION.coreCommit,lock.commit,'Stale core commit');
assert.equal(REPORT_VERIFICATION.coreSourceManifestSha256,lock.sourceManifestSha256,'Stale core manifest');
assert.equal(evidence.coreCommit,lock.commit,'Stale verification evidence');
assert.equal(evidence.version,REPORT_VERIFICATION.version);
assert.ok(Array.isArray(evidence.chapters)&&Array.isArray(evidence.delivery));

function verifyRecord(record,checks) {
  assert.ok(Array.isArray(record.files)&&record.files.length>=3,'Source, tests and reviewed output evidence are required');
  assert.equal(new Set(record.files.map(f=>f.path)).size,record.files.length,'Duplicate evidence files');
  for(const file of record.files) {
    assert.ok(typeof file.path==='string'&&!isAbsolute(file.path));
    const path=realpathSync(resolve(root,file.path)),rel=relative(root,path);
    assert.ok(rel&&!rel.startsWith('..')&&!isAbsolute(rel),'Evidence must remain in repository');
    assert.match(file.sha256,/^[a-f0-9]{64}$/);
    assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),file.sha256,`Stale evidence: ${file.path}`);
  }
  for(const key of ['moduleFile','testFile','reviewFile']) assert.ok(record.files.some(f=>f.path===record[key]),`Missing ${key}`);
  assert.equal(new Set([record.moduleFile,record.testFile,record.reviewFile]).size,3);
  assert.match(record.testFile,/^tests\/[a-zA-Z0-9_/-]+\.test\.js$/);
  assert.ok(Array.isArray(record.checks)&&checks.every(c=>record.checks.includes(c)),'Incomplete acceptance coverage');
  // Review file must contain the reviewed child/self output and its input/evidence
  // trace, not merely an approval flag. Human content review remains necessary.
  assert.ok(read(record.reviewFile).trim().length>0,'Empty review record');
  const run=spawnSync(process.execPath,['--test',record.testFile],{cwd:root,encoding:'utf8',timeout:120000});
  assert.equal(run.status,0,`Acceptance test failed: ${record.testFile}\n${run.stdout}\n${run.stderr}`);
  assert.match(run.stdout,/(?:#|ℹ) tests [1-9][0-9]*/,'Acceptance test executed no tests');
  assert.match(run.stdout,/(?:#|ℹ) skipped 0/,'Skipped acceptance tests');
  assert.match(run.stdout,/(?:#|ℹ) todo 0/,'Pending acceptance tests');
}
const baseChecks=['real-core-fixtures','all-candidates','missing-fields','evidence-trace','audience-copy','full-chapter-output','generation-integration'];
const cycleChecks=['cycle-api-mapping','exact-time','unknown-time','multiple-daeun-options','seun-only','unavailable-cycle','period-boundaries','interpretation-review'];
for(const audience of ['child','self']) {
  const release=REPORT_VERIFICATION[audience];
  const records=evidence.chapters.filter(r=>r.audience===audience);
  assert.deepEqual(records.map(r=>r.chapter).sort((a,b)=>a-b),verifiedChapters(audience).sort((a,b)=>a-b),'Allowlist/evidence mismatch');
  assert.equal(new Set(release.chapters).size,release.chapters.length);
  for(const record of records) {
    assert.ok(Number.isInteger(record.chapter)&&record.chapter>=1&&record.chapter<=10);
    verifyRecord(record,[...baseChecks,...(record.chapter===9?cycleChecks:[]),...(record.chapter===10?['question-answering','no-answer-invention','plan-consistency']:[])]);
  }
  assert.equal(release.cycleVerified,release.chapters.includes(9),'Cycle certificate/allowlist mismatch');
  const delivery=evidence.delivery.filter(r=>r.audience===audience);
  assert.equal(delivery.length,release.deliveryVerified?1:0,'Delivery certificate mismatch');
  delivery.forEach(r=>verifyRecord(r,['server-price-and-scope','server-input-validation','payment-webhook','idempotency','report-ownership','generation-failure','durable-delivery','retrieval-after-payment']));
}
assert.ok(evidence.chapters.every(r=>['child','self'].includes(r.audience)));
assert.ok(evidence.delivery.every(r=>['child','self'].includes(r.audience)));
assert.deepEqual(REPORT_OFFER.providedChapters,verifiedChapters('child').filter(n=>verifiedChapters('self').includes(n)));
// This task explicitly preserves the unlaunched product configuration.
assert.equal(REPORT_OFFER.price,null);
assert.equal(REPORT_OFFER.available,false);
assert.equal(REPORT_OFFER.cycleVerified,false);
console.log('Report release verified: unlaunched; child/self supplied chapters = '+REPORT_OFFER.providedChapters.length);
