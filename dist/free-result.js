// Optional host adapter: window.studySajuAnalyze(payload, {signal}).
// The standalone preview never invents a type, score, or interpretation.
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

export function createFreeResultController() {
  const el = id => document.getElementById(id);
  let state = 'unavailable', report = null, generation = 0, controller = null, timer = 0;
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
      loading:['공부 운명서의 첫 장을 준비하고 있어요.', '잠시만 기다려 주세요.'],
      error:['분석을 완료하지 못했어요.', '잠시 후 다시 시도해 주세요.\n입력한 정보는 그대로 남아 있어요.']
    };
    el('free-result-status-title').textContent = messages[state][0];
    el('free-result-status-message').textContent = messages[state][1];
  }
  function reset() {
    cancel(); report = null; state = 'unavailable';
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
    if (typeof analyze !== 'function') return;
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
      return analyze(JSON.parse(JSON.stringify(payload)), {signal});
    }).then(value => {
      if (request !== generation) return;
      report = validateFreeResult(value);
      clearTimeout(timer); timer = 0; controller = null;
      state = 'ready'; render();
    }).catch(() => {
      if (request !== generation) return;
      clearTimeout(timer); timer = 0; controller = null;
      state = 'error'; render();
    });
  }
  window.addEventListener('pagehide', () => {
    if (state === 'loading') { cancel(); state = 'error'; render(); }
  });
  return {prepare, reset, render};
}
