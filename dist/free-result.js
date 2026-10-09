import {calculateCore} from './core-client.js';
// Core calculation is separate from the optional, future report adapter.
export function validateFreeResult(value) {
  const text = (key, max) => {
    if (typeof value?.[key] !== 'string' || !value[key].trim() || value[key].length > max) {
      throw new Error('Invalid free report');
    }
    return value[key].trim();
  };
  const result = {typeName:text('typeName', 80), headline:text('headline', 200), summary:text('summary', 4000), strengths:[]};
  if (value.strengths !== undefined) {
    if (!Array.isArray(value.strengths) || value.strengths.length > 6
      || value.strengths.some(item => typeof item !== 'string' || !item.trim() || item.length > 240)) {
      throw new Error('Invalid free report strengths');
    }
    result.strengths = value.strengths.map(item => item.trim());
  }
  return result;
}

export function createFreeResultController({calculate = calculateCore} = {}) {
  const el = id => document.getElementById(id);
  let state = 'unavailable', report = null, calculation = null, errorCode = null, generation = 0, controller = null, timer = 0;
  function cancel() {
    generation++;
    clearTimeout(timer); timer = 0;
    controller?.abort(); controller = null;
  }
  function render() {
    const ready = state === 'ready';
    el('free-result-status').hidden = ready;
    el('free-result-content').hidden = !ready;
    el('retry-analysis').hidden = state !== 'error';
    el('free-result-view').setAttribute('aria-busy', String(state === 'loading'));
    if (ready) {
      el('free-result-type').textContent = report.typeName;
      el('free-result-headline').textContent = report.headline;
      el('free-result-summary').textContent = report.summary;
      const list = el('free-result-strengths');
      list.replaceChildren();
      report.strengths.forEach(text => {
        const item = document.createElement('li'); item.textContent = text; list.append(item);
      });
      list.hidden = !report.strengths.length;
      return;
    }
    const messages = {
      unavailable:['무료 해석 연결 전이에요.', '현재는 화면 미리보기이며,\n실제 사주 분석 결과는 아직 제공되지 않아요.'],
      calculated:['사주 계산이 완료됐어요.', '계산 결과를 정상적으로 받았어요.\n무료 해석은 준비 중이에요.'],
      loading:['공부 운명서의 첫 장을 준비하고 있어요.', '잠시만 기다려 주세요.'],
      error:['분석을 완료하지 못했어요.', '잠시 후 다시 시도해 주세요.\n입력한 정보는 그대로 남아 있어요.']
    };
    el('free-result-status-title').textContent = messages[state][0];
    el('free-result-status-message').textContent = messages[state][1];
    if (state === 'error' && errorCode === 'BIRTH_PLACE_REQUIRED') {
      el('free-result-status-message').textContent = '해외·기타 출생지는 정확한 위치와 시간대가 필요해요.\n현재 입력 화면에서는 국내 출생지만 계산할 수 있어요.';
    }
  }
  function reset() {
    cancel(); report = null; calculation = null; errorCode = null; state = 'unavailable';
    window.dispatchEvent(new CustomEvent('studysaju:core-cleared'));
    ['free-result-type','free-result-headline','free-result-summary'].forEach(id => el(id).textContent = '');
    el('free-result-strengths').replaceChildren();
    render();
  }
  function prepare(payload, studyLabel) {
    reset();
    el('free-result-title').textContent = payload.audience === 'child'
      ? `${payload.learner.name}의 공부 운명서` : `${payload.learner.name}님의 공부 운명서`;
    el('free-result-context').textContent = studyLabel;
    const analyze = window.studySajuAnalyze;
    state = 'loading'; render();
    const request = generation;
    controller = new AbortController();
    const signal = controller.signal;
    timer = window.setTimeout(() => {
      if (request !== generation) return;
      cancel(); state = 'error'; render();
    }, 30000);
    // A private snapshot prevents host-side mutation of the editable form draft.
    Promise.resolve().then(() => {
      if (request !== generation) return;
      return calculate(JSON.parse(JSON.stringify(payload)), {signal});
    }).then(async value => {
      if (request !== generation) return;
      calculation = value;
      window.dispatchEvent(new CustomEvent('studysaju:core-ready', {detail:structuredClone(calculation)}));
      if (request !== generation) return;
      if (typeof analyze === 'function') {
        const reportValue = await analyze(JSON.parse(JSON.stringify(payload)), {signal, calculation:structuredClone(calculation)});
        if (request !== generation) return;
        report = validateFreeResult(reportValue);
      }
      clearTimeout(timer); timer = 0; controller = null;
      state = report ? 'ready' : 'calculated'; render();
    }).catch(error => {
      if (request !== generation) return;
      clearTimeout(timer); timer = 0; controller = null;
      errorCode = error?.code;
      state = 'error'; render();
    });
  }
  window.addEventListener('pagehide', () => {
    reset();
  });
  return {prepare, reset, render, getCalculation:() => calculation ? structuredClone(calculation) : null};
}
