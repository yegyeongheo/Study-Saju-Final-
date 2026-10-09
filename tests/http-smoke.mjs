import assert from 'node:assert/strict';
import {calculateCore, CoreError} from '../dist/core-client.js';

const person = {name:'합성 테스트', gender:'female', birthDate:{year:1990,month:5,day:12,calendar:'solar',isLeapMonth:false}, birthTime:{period:'chen'}, birthRegion:'서울특별시'};
const period = {startUtc:'2026-01-01T00:00:00Z',endUtc:'2027-01-01T00:00:00Z'};
let calls = 0;
const fetchImpl = async (path, options) => {
  calls++;
  assert.ok(!options.body.includes('합성 테스트'));
  return fetch(process.env.SAJU_TEST_URL + path, options);
};
for (const audience of ['self','child']) {
  const output = await calculateCore({schemaVersion:5,audience,learner:person,guardian:{...person,birthTime:{period:'unknown'}},personalization:{freeText:'not sent'}}, {period,fetchImpl});
  assert.equal(output.schemaVersion, 'studysaju-calculation-v1');
  assert.deepEqual(Object.keys(output.subjects), audience === 'self' ? ['learner'] : ['learner','guardian']);
  for (const result of Object.values(output.subjects)) {
    assert.equal(result.status, 'ok');
    assert.equal(result.schemaVersion, '1.1.0');
    assert.ok(result.result.subjects[0].candidates[0].traits);
    assert.ok(result.result.subjects[0].candidates[0].features.values.yangRatio >= 0);
    assert.ok(result.result.timeline.data.segments.length);
    assert.ok(result.result.timeline.data.segments.every(s => s.daeunUnavailableReason !== 'BIRTH_TIME_UNCERTAIN'));
    assert.ok(result.result.timeline.data.daeunRanges.length);
    assert.ok(result.result.timeline.data.daeunSummary.length);
    assert.ok(result.result.timeline.data.segments.some(s => s.daeunRange.options.some(o => o.daeunPillar)));
    assert.ok(result.warnings.some(w => w.code === 'ESTIMATED_LOCATION'));
  }
}
assert.equal(calls, 3);
const exact = await calculateCore({schemaVersion:6,audience:'self',learner:{...person,birthTime:{isUnknown:false,hour:7,minute:40}}},{period,fetchImpl});
assert.equal(exact.subjects.learner.status,'ok');
assert.ok(exact.subjects.learner.result.timeline.data.segments.some(s=>s.daeunPillar));
const unknown = await calculateCore({schemaVersion:6,audience:'self',learner:{...person,birthTime:{isUnknown:true,hour:null,minute:null}}},{period,fetchImpl});
assert.equal(unknown.subjects.learner.status,'ok');
assert.ok(unknown.subjects.learner.result.timeline.data.daeunRanges.length);
await assert.rejects(calculateCore({schemaVersion:5,audience:'self',learner:{...person,birthDate:{...person.birthDate,month:2,day:30}}},{period,fetchImpl}), e => e instanceof CoreError && e.response.status === 'error');
console.log('PASS: self + child/guardian browser adapter -> HTTP -> unchanged core, and invalid date');
