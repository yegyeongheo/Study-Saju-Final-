import test from 'node:test';
import assert from 'node:assert/strict';
import {createFreeResultController} from '../dist/free-result.js';

const flush = () => new Promise(resolve => setImmediate(resolve));
function harness(calculate) {
  const nodes = new Map();
  globalThis.document = {getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, {textContent:'',hidden:false,setAttribute(){},replaceChildren(){},append(){}});
    return nodes.get(id);
  }};
  globalThis.window = new EventTarget();
  window.setTimeout = setTimeout;
  const controller = createFreeResultController({calculate});
  return {controller,nodes};
}
const payload = {audience:'self',learner:{name:'테스트'}};

test('calculation success never invents a report; consumers receive independent snapshots', async () => {
  const calculation = {subjects:{learner:{status:'partial',extra:[1]}}};
  const {controller,nodes} = harness(async () => calculation);
  let ready;
  window.addEventListener('studysaju:core-ready', event => {ready = event.detail; ready.subjects.learner.extra.push(2);});
  controller.prepare(payload, '공부'); await flush();
  assert.equal(nodes.get('free-result-status-title').textContent, '사주 계산이 완료됐어요.');
  assert.equal(nodes.get('free-result-content').hidden, true);
  assert.ok(ready);
  const copy = controller.getCalculation(); copy.subjects.learner.extra.push(3);
  assert.deepEqual(controller.getCalculation().subjects.learner.extra, [1]);
  controller.reset(); assert.equal(controller.getCalculation(), null);
});

test('input edit cancels request and ignores late old response; retry accepts latest', async () => {
  const pending = [];
  const {controller} = harness((_, {signal}) => new Promise(resolve => pending.push({resolve,signal})));
  controller.prepare(payload, '공부'); await flush();
  controller.reset(); assert.equal(pending[0].signal.aborted, true);
  controller.prepare(payload, '공부'); await flush();
  pending[0].resolve({old:true}); await flush();
  assert.equal(controller.getCalculation(), null);
  pending[1].resolve({new:true}); await flush();
  assert.deepEqual(controller.getCalculation(), {new:true});
  window.dispatchEvent(new Event('pagehide'));
  assert.equal(controller.getCalculation(), null);
});

test('error enables retry and unsupported location provides an actionable message', async () => {
  const {controller,nodes} = harness(async () => {throw Object.assign(new Error(), {code:'BIRTH_PLACE_REQUIRED'});});
  controller.prepare(payload, '공부'); await flush();
  assert.equal(nodes.get('retry-analysis').hidden, false);
  assert.match(nodes.get('free-result-status-message').textContent, /정확한 위치와 시간대/);
  assert.equal(controller.getCalculation(), null);
  controller.reset();
});

test('timeout aborts and ignores subsequent response', async () => {
  let finish, signal, timeout;
  const {controller,nodes} = harness((_, options) => {signal = options.signal; return new Promise(resolve => {finish = resolve;});});
  window.setTimeout = callback => {timeout = callback; return 0;};
  controller.prepare(payload, '공부'); await flush(); timeout();
  assert.equal(signal.aborted, true);
  finish({late:true}); await flush();
  assert.equal(controller.getCalculation(), null);
  assert.equal(nodes.get('retry-analysis').hidden, false);
  controller.reset();
});
