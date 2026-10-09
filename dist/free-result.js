import {calculateCore} from './core-client.js';
import {createFreeReportView} from './free-report-view.js';
import {suppliedStudyType} from './free-report-model.js';
// Core calculation is separate from the optional, future report adapter.
export function validateFreeResult(value) {
  const studyType=suppliedStudyType(value);
  if(studyType)return {studyType};
  const text = (key, max) => {
    if (typeof value?.[key] !== 'string' || !value[key].trim() || value[key].length > max) {
      throw new Error('Invalid free report');
    }
    return value[key].trim();
  };
  const result = {typeName:text('typeName', 80), headline:text('headline', 200), summary:text('summary', 4000), strengths:[]};
  if (typeof value.typeId === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(value.typeId)) result.typeId = value.typeId;
  if (value.strengths !== undefined) {
    if (!Array.isArray(value.strengths) || value.strengths.length > 6
      || value.strengths.some(item => typeof item !== 'string' || !item.trim() || item.length > 240)) {
      throw new Error('Invalid free report strengths');
    }
    result.strengths = value.strengths.map(item => item.trim());
  }
  return result;
}

export function createFreeResultController({calculate = calculateCore, createView = createFreeReportView} = {}) {
  const el = id => document.getElementById(id);
  const view = createView();
  let cardSubject = null;
  let state = 'unavailable', report = null, calculation = null, errorCode = null, generation = 0, controller = null, timer = 0;
  function cancel() {
    generation++;
    clearTimeout(timer); timer = 0;
    controller?.abort(); controller = null;
  }
  function render() {
    const ready = state === 'ready' || state === 'calculated';
    el('free-result-status').hidden = ready;
    el('free-result-content').hidden = !ready;
    el('retry-analysis').hidden = state !== 'error';
    el('free-result-view').setAttribute('aria-busy', String(state === 'loading'));
    if (ready) view.render(calculation, cardSubject, report);
    else view.reset();
    if (ready) {
      // Intake reveals the result after this synchronous render; observe on the next frame.
      window.requestAnimationFrame?.(()=>view.reveal?.());
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
    cancel(); report = null; calculation = null; cardSubject = null; errorCode = null; state = 'unavailable';
    window.dispatchEvent(new CustomEvent('studysaju:core-cleared'));
    render();
  }
  function prepare(payload, studyLabel) {
    reset();
    // Display model only needs gender, time-known flag, and questionnaire option IDs.
    cardSubject = {audience:payload.audience, learner:{gender:payload?.learner?.gender,
      birthTime:{isUnknown:payload?.learner?.birthTime?.isUnknown,period:payload?.learner?.birthTime?.period}},
      personalization:{environment:{id:payload.personalization?.environment?.id},focus:{id:payload.personalization?.focus?.id}}};
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
