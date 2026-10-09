import test from 'node:test';
import assert from 'node:assert/strict';
import {toCoreSubject, calculateCore, currentPeriod, analyzeCore} from '../dist/core-client.js';

const person = {name:'private',gender:'female',birthDate:{year:1990,month:5,day:12,calendar:'solar',isLeapMonth:false},birthTime:{period:'chen'},birthRegion:'서울특별시'};

test('input mapping preserves uncertainty, lunar date, leap flag and direction', () => {
  for (const [period, value] of Object.entries({zi:'子',chou:'丑',yin:'寅',mao:'卯',chen:'辰',si:'巳',wu:'午',wei:'未',shen:'申',you:'酉',xu:'戌',hai:'亥'})) {
    assert.deepEqual(toCoreSubject({...person,birthTime:{period}},'learner').birthTime, {mode:'branch',value,ziPart:'unspecified'});
  }
  assert.deepEqual(toCoreSubject({...person,birthTime:{period:'unknown'}},'learner').birthTime, {mode:'unknown'});
  const lunar = toCoreSubject({...person,gender:'male',birthDate:{...person.birthDate,calendar:'lunar',isLeapMonth:true}},'learner');
  assert.equal(lunar.birthDate, '1990-05-12');
  assert.equal(lunar.calendarSystem, 'korean_lunisolar');
  assert.equal(lunar.isLeapMonth, true);
  assert.equal(lunar.luckDirectionBasis, 'M');
  assert.equal(lunar.birthPlace.precision, 'region');
  assert.ok(!Object.hasOwn(lunar, 'name'));
  assert.throws(() => toCoreSubject({...person,birthRegion:'해외·기타'},'learner'), {code:'BIRTH_PLACE_REQUIRED'});
  assert.throws(() => toCoreSubject({...person,birthTime:{period:'noon'}},'learner'), {code:'INVALID_INPUT'});
});

test('Korean year boundary defines a query period, without computing any cycles', () => {
  assert.deepEqual(currentPeriod(new Date('2026-12-31T15:00:00Z')), {startUtc:'2027-01-01T00:00:00+09:00',endUtc:'2028-01-01T00:00:00+09:00'});
});

test('self/child responses preserve every nested field and omit unrelated personal data', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    const request = JSON.parse(options.body); requests.push(request);
    assert.equal(url, '/api/saju/v1/analyze');
    assert.ok(!options.body.includes('private'));
    return {ok:true,json:async () => ({schemaVersion:'1.0.0',requestId:request.requestId,status:'partial',warnings:[{code:'UNKNOWN_BIRTH_TIME'}],result:{kind:'timeline',subjects:[{unknownFutureField:{a:[1,2,null]}}],timeline:{untouched:true}}})};
  };
  const value = await calculateCore({schemaVersion:5,audience:'child',learner:person,guardian:person,study:'private',personalization:'private'}, {fetchImpl});
  assert.equal(requests.length, 2);
  assert.equal(requests[0].subjects[0].role, 'child');
  assert.equal(requests[1].subjects[0].role, 'person'); // Do not infer parent from grandparent.
  assert.deepEqual(value.subjects.learner.result.subjects[0].unknownFutureField, {a:[1,2,null]});
  assert.equal(value.subjects.guardian.result.timeline.untouched, true);
  assert.equal(value.subjects.learner.status, 'partial');
});

test('abort, HTTP failure, malformed and mismatched responses cannot succeed', async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(calculateCore({schemaVersion:5,audience:'self',learner:person}, {signal:controller.signal,fetchImpl:() => assert.fail()}), {name:'AbortError'});
  await assert.rejects(analyzeCore({}, {fetchImpl:async () => ({ok:false,json:async () => ({error:{code:'CORE_TIMEOUT'}})})}), {code:'CORE_TIMEOUT'});
  await assert.rejects(analyzeCore({}, {fetchImpl:async () => ({ok:true,json:async () => {throw new Error();}})}), {code:'INVALID_RESPONSE'});
  await assert.rejects(analyzeCore({requestId:'expected'}, {fetchImpl:async () => ({ok:true,json:async () => ({schemaVersion:'1.0.0',status:'ok',requestId:'other',result:{subjects:[]}})})}), {code:'INVALID_RESPONSE'});
});
