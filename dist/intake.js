import {createConsentController} from './consent.js';
import {QUESTIONNAIRES, createAnswers, countCharacters, limitQuestion, buildPersonalization} from './questionnaire.js';

(() => {
  'use strict';
  const birthTimes = [
    ['unknown', '시간 모름', null, null],
    ['zi', '자시 · 23:00–00:59', '23:00', '01:00'],
    ['chou', '축시 · 01:00–02:59', '01:00', '03:00'],
    ['yin', '인시 · 03:00–04:59', '03:00', '05:00'],
    ['mao', '묘시 · 05:00–06:59', '05:00', '07:00'],
    ['chen', '진시 · 07:00–08:59', '07:00', '09:00'],
    ['si', '사시 · 09:00–10:59', '09:00', '11:00'],
    ['wu', '오시 · 11:00–12:59', '11:00', '13:00'],
    ['wei', '미시 · 13:00–14:59', '13:00', '15:00'],
    ['shen', '신시 · 15:00–16:59', '15:00', '17:00'],
    ['you', '유시 · 17:00–18:59', '17:00', '19:00'],
    ['xu', '술시 · 19:00–20:59', '19:00', '21:00'],
    ['hai', '해시 · 21:00–22:59', '21:00', '23:00']
  ];
  const regions = ['서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도', '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도', '해외·기타'];
  const studyLabels = {kindergarten:'유치원', school:'학교 공부·내신', college:'대학 입시', 'civil-service':'공무원 시험', professional:'전문직 시험', other:'자격증·어학·기타'};
  const relationLabels = {father:'부', mother:'모', grandparent:'조부모'};
  const personLabels = {child:'아이', self:'본인', guardian:'보호자'};
  const form = document.getElementById('intake-form');
  const consent = createConsentController();
  const sections = Object.fromEntries([...document.querySelectorAll('[data-person]')].map(el => [el.dataset.person, el]));
  const views = {choose:document.getElementById('choose-view'), input:document.getElementById('details-view'), review:document.getElementById('review-view'), questions:document.getElementById('questions-view')};
  const headings = {choose:document.getElementById('choose-title'), input:document.getElementById('details-title'), review:document.getElementById('review-title'), questions:document.getElementById('question-title')};
  const studyDrafts = {child:'', self:''};
  const answerDrafts = {child:createAnswers(), self:createAnswers()};
  let questionIndex = 0;
  let audience = null;
  let lastPayload = null;

  const field = (section, key) => section.querySelector(`[data-field="${key}"]`);
  const calendar = section => section.querySelector('[data-field="calendar"]:checked').value;
  function addOption(select, value, label) {
    select.add(new Option(label, String(value)));
  }
  function syncDate(section) {
    const year = Number(field(section, 'year').value);
    const month = Number(field(section, 'month').value);
    const day = field(section, 'day');
    const oldDay = day.value;
    const lunar = calendar(section) === 'lunar';
    const leap = field(section, 'leap');
    leap.disabled = !lunar;
    if (!lunar) leap.checked = false;
    section.querySelector('.lunar-hint').hidden = !lunar;
    // Lunar month lengths and leap-month existence require the app's calendar engine.
    const maximum = lunar ? 30 : month ? new Date(year || 2000, month, 0).getDate() : 31;
    day.replaceChildren(new Option('일', ''));
    for (let d = 1; d <= maximum; d++) addOption(day, d, `${d}일`);
    day.value = Number(oldDay) <= maximum ? oldDay : '';
    validatePerson(section);
  }
  function validatePerson(section) {
    const name = field(section, 'name');
    name.setCustomValidity(name.value && !name.value.trim() ? '이름을 입력해 주세요.' : '');
    const year = Number(field(section, 'year').value);
    const month = Number(field(section, 'month').value);
    const day = field(section, 'day');
    day.setCustomValidity('');
    if (calendar(section) === 'solar' && year && month && day.value) {
      const date = new Date(year, month - 1, Number(day.value));
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (date > today) day.setCustomValidity('생년월일은 오늘 또는 이전 날짜로 선택해 주세요.');
    }
  }
  Object.entries(sections).forEach(([key, section]) => {
    const fragment = document.getElementById('person-fields-template').content.cloneNode(true);
    fragment.querySelectorAll('[data-field]').forEach(control => {
      const type = control.dataset.field;
      control.name = `${key}-${type}`;
      control.id = `${key}-${type}${type === 'calendar' ? '-' + control.value : ''}`;
      if (control.dataset.caption) control.setAttribute('aria-label', `${personLabels[key]} ${control.dataset.caption}`);
    });
    fragment.querySelectorAll('[data-label]').forEach(label => label.htmlFor = `${key}-${label.dataset.label}`);
    section.querySelector('.person-fields').append(fragment);
    const year = field(section, 'year');
    for (let y = new Date().getFullYear(); y >= 1900; y--) addOption(year, y, `${y}년`);
    for (let m = 1; m <= 12; m++) addOption(field(section, 'month'), m, `${m}월`);
    birthTimes.forEach(([value, label]) => addOption(field(section, 'time'), value, label));
    regions.forEach(region => addOption(field(section, 'region'), region, region));
    section.querySelectorAll('[data-field="calendar"], [data-field="year"], [data-field="month"]').forEach(control => control.addEventListener('change', () => syncDate(section)));
    field(section, 'day').addEventListener('change', () => validatePerson(section));
    field(section, 'name').addEventListener('input', () => validatePerson(section));
    syncDate(section);
  });

  function selectAudience(next) {
    if (audience) studyDrafts[audience] = form.querySelector('[name="study"]:checked')?.value || '';
    audience = next;
    consent.setAudience(next);
    Object.entries(sections).forEach(([key, section]) => {
      const active = audience === 'child' ? key !== 'self' : audience === 'self' && key === 'self';
      section.hidden = !active;
      section.disabled = !active;
    });
    form.querySelectorAll('[name="study"]').forEach(input => input.checked = input.value === studyDrafts[audience]);
    const isChild = audience === 'child';
    document.getElementById('audience-caption').textContent = isChild ? '우리 아이의 학습 비책' : '나를 위한 공부 비책';
    // Only fixed copy is assigned as HTML; entered personal information uses textContent.
    headings.input.innerHTML = isChild ? '아이의 이야기를<br><em>들려주세요.</em>' : '나의 이야기를<br><em>들려주세요.</em>';
  }
  function showView(view, moveFocus = true) {
    consent.closeDialog();
    Object.entries(views).forEach(([key, el]) => el.hidden = key !== view);
    document.body.classList.toggle('is-form', view !== 'choose');
    if (moveFocus) {
      window.scrollTo({top:0, behavior:'instant'});
      headings[view].focus({preventScroll:true});
    }
  }
  function go(view, step = 0) {
    if ((view === 'questions' || view === 'review') && !consent.isReady()) view = 'input';
    if (view === 'questions') renderQuestion(step);
    if (view === 'review') renderReview();
    const hash = view === 'choose' ? '' : view === 'input' ? '#information' : view === 'questions' ? '#question-' + (questionIndex + 1) : '#check';
    history.pushState({view, audience, step:view === 'questions' ? questionIndex : null}, '', location.pathname + hash);
    showView(view);
  }
  const choiceButtons = [...document.querySelectorAll('[data-choice]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pendingChoice = null;
  let choiceTimer = 0;
  function cancelChoice() {
    clearTimeout(choiceTimer);
    choiceTimer = 0;
    pendingChoice = null;
    views.choose.classList.remove('is-dissolving');
    views.choose.removeAttribute('aria-busy');
    choiceButtons.forEach(button => {
      button.disabled = false;
      button.classList.remove('is-chosen');
    });
  }
  function finishChoice() {
    if (!pendingChoice) return;
    const next = pendingChoice;
    cancelChoice();
    selectAudience(next);
    lastPayload = null;
    go('input');
  }
  choiceButtons.forEach(button => button.addEventListener('click', () => {
    if (pendingChoice) return;
    pendingChoice = button.dataset.choice;
    if (reduceMotion.matches) { finishChoice(); return; }
    choiceButtons.forEach(item => item.disabled = true);
    button.classList.add('is-chosen');
    views.choose.setAttribute('aria-busy', 'true');
    views.choose.classList.add('is-dissolving');
    choiceTimer = window.setTimeout(finishChoice, 540);
  }));
  reduceMotion.addEventListener('change', () => { if (reduceMotion.matches) finishChoice(); });
  window.addEventListener('pagehide', cancelChoice);
  document.getElementById('change-audience').addEventListener('click', () => history.back());
  document.getElementById('edit-information').addEventListener('click', () => go('input'));
  document.getElementById('edit-answers').addEventListener('click', () => go('questions', 0));
  window.addEventListener('popstate', event => {
    cancelChoice();
    cancelQuestionTransition();
    const state = event.state || {view:'choose'};
    if (state.audience) selectAudience(state.audience);
    const hasInput = lastPayload && lastPayload.audience === audience && consent.isReady();
    let view = 'choose';
    if (audience && ['input', 'questions', 'review'].includes(state.view)) view = 'input';
    if (state.view === 'questions' && hasInput) {
      view = 'questions';
      renderQuestion(state.step || 0);
    }
    if (state.view === 'review' && hasInput) {
      view = lastPayload.personalization ? 'review' : 'questions';
      if (view === 'review') renderReview(); else renderQuestion(2);
    }
    showView(view);
  });

  function readPerson(key) {
    const section = sections[key];
    const selectedTime = birthTimes.find(item => item[0] === field(section, 'time').value);
    return {
      name:field(section, 'name').value.trim(),
      birthDate:{year:Number(field(section, 'year').value), month:Number(field(section, 'month').value), day:Number(field(section, 'day').value), calendar:calendar(section), isLeapMonth:calendar(section) === 'lunar' && field(section, 'leap').checked},
      birthTime:{period:selectedTime[0], start:selectedTime[2], end:selectedTime[3]},
      birthRegion:field(section, 'region').value
    };
  }
  function appendSummary(person, title, relationship) {
    const card = document.createElement('article'); card.className = 'review-person';
    const heading = document.createElement('h2'); heading.textContent = title;
    const list = document.createElement('dl');
    const b = person.birthDate;
    const dateLabel = `${b.year}년 ${b.month}월 ${b.day}일 · ${b.calendar === 'solar' ? '양력' : b.isLeapMonth ? '음력 윤달' : '음력'}`;
    const entries = [['이름', person.name], ['생년월일', dateLabel], ['태어난 시간', birthTimes.find(time => time[0] === person.birthTime.period)[1]], ['태어난 지역', person.birthRegion]];
    if (relationship) entries.unshift(['관계', relationLabels[relationship]]);
    entries.forEach(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt'); term.textContent = label;
      const description = document.createElement('dd'); description.textContent = value;
      row.append(term, description); list.append(row);
    });
    card.append(heading, list); document.getElementById('review-people').append(card);
  }

  const questionStage = document.getElementById('question-stage');
  const questionOptions = document.getElementById('question-options');
  const personalQuestionForm = document.getElementById('personal-question-form');
  const personalQuestion = document.getElementById('personal-question');
  const finishQuestions = document.getElementById('finish-questions');
  let pendingQuestion = null;
  let questionTimer = 0;
  let composingQuestion = false;

  function cancelQuestionTransition() {
    clearTimeout(questionTimer);
    questionTimer = 0;
    pendingQuestion = null;
    composingQuestion = false;
    questionStage.inert = false;
    questionStage.classList.remove('is-dissolving');
    views.questions.removeAttribute('aria-busy');
  }
  function finishQuestionTransition() {
    if (!pendingQuestion) return;
    const next = pendingQuestion;
    cancelQuestionTransition();
    next();
  }
  function transitionQuestion(next) {
    if (pendingQuestion) return;
    pendingQuestion = next;
    if (reduceMotion.matches) { finishQuestionTransition(); return; }
    questionStage.classList.remove('is-entering');
    questionStage.classList.add('is-dissolving');
    questionStage.inert = true;
    views.questions.setAttribute('aria-busy', 'true');
    questionTimer = window.setTimeout(finishQuestionTransition, 540);
  }
  function renderQuestion(step) {
    const answers = answerDrafts[audience];
    questionIndex = Math.max(0, Math.min(2, step));
    if (questionIndex > 0 && !answers.environment) questionIndex = 0;
    if (questionIndex > 1 && !answers.focus) questionIndex = 1;
    const question = QUESTIONNAIRES[audience][questionIndex];
    const intro = document.getElementById('personalization-intro');
    intro.hidden = questionIndex !== 0;
    intro.textContent = audience === 'child'
      ? `${lastPayload.learner.name}의 공부를 더 깊이 이해하기 위해,\n세 가지만 여쭤볼게요.`
      : `${lastPayload.learner.name}님을 더 깊이 이해하기 위해,\n세 가지만 여쭤볼게요.`;
    headings.questions.textContent = question.title;
    document.getElementById('question-description').textContent = question.description;
    document.getElementById('question-progress').textContent = `질문 ${questionIndex + 1} / 3`;
    document.getElementById('question-back').textContent = questionIndex === 0 ? '이전 화면' : '이전 질문';
    questionOptions.replaceChildren();
    questionOptions.hidden = !question.options;
    personalQuestionForm.hidden = !!question.options;
    if (question.options) {
      question.options.forEach(([id, label]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'question-option';
        button.textContent = label;
        button.setAttribute('aria-pressed', String(answers[question.key] === id));
        button.addEventListener('click', () => {
          if (pendingQuestion) return;
          answers[question.key] = id;
          delete lastPayload.personalization;
          [...questionOptions.children].forEach(option => option.setAttribute('aria-pressed', String(option === button)));
          const nextStep = questionIndex + 1;
          transitionQuestion(() => go('questions', nextStep));
        });
        questionOptions.append(button);
      });
    } else {
      personalQuestion.value = answers.freeText;
      personalQuestion.placeholder = question.placeholder;
      updatePersonalQuestion();
    }
    questionStage.classList.remove('is-entering', 'is-dissolving');
    // Restart entry animation for back/forward navigation as well as answer selection.
    void questionStage.offsetWidth;
    questionStage.classList.add('is-entering');
  }
  function updatePersonalQuestion() {
    const raw = personalQuestion.value;
    const limited = limitQuestion(raw);
    const answers = answerDrafts[audience];
    if (raw !== limited) personalQuestion.value = limited;
    if (answers.freeText !== limited) {
      answers.freeText = limited;
      delete lastPayload.personalization;
    }
    const count = countCharacters(limited);
    document.getElementById('question-count').textContent = `${count}/150자`;
    document.getElementById('question-limit').hidden = raw === limited;
    finishQuestions.disabled = !limited.trim();
  }
  function completeQuestions(skipped) {
    if (pendingQuestion || composingQuestion) return;
    updatePersonalQuestion();
    const answers = answerDrafts[audience];
    if (!skipped && !answers.freeText.trim()) { personalQuestion.focus(); return; }
    answers.skipped = skipped;
    const personalization = buildPersonalization(audience, answers);
    transitionQuestion(() => {
      lastPayload.personalization = personalization;
      go('review');
      // The app should start its free interpretation only after this completed event.
      window.dispatchEvent(new CustomEvent('studysaju:intake-ready', {detail:lastPayload}));
    });
  }
  document.getElementById('question-back').addEventListener('click', () => {
    cancelQuestionTransition();
    history.back();
  });
  personalQuestion.addEventListener('compositionstart', () => { composingQuestion = true; });
  personalQuestion.addEventListener('compositionend', () => { composingQuestion = false; updatePersonalQuestion(); });
  personalQuestion.addEventListener('input', event => { if (!composingQuestion && !event.isComposing) updatePersonalQuestion(); });
  personalQuestionForm.addEventListener('submit', event => { event.preventDefault(); completeQuestions(false); });
  document.getElementById('skip-question').addEventListener('click', () => completeQuestions(true));
  reduceMotion.addEventListener('change', () => { if (reduceMotion.matches) finishQuestionTransition(); });
  window.addEventListener('pagehide', cancelQuestionTransition);

  function renderReview() {
    const payload = lastPayload;
    document.getElementById('review-people').replaceChildren();
    appendSummary(payload.learner, audience === 'child' ? '아이의 정보' : '나의 정보');
    if (payload.guardian) appendSummary(payload.guardian, '보호자의 정보', payload.guardian.relationship);
    document.getElementById('review-study').textContent = studyLabels[payload.study];
    const answers = payload.personalization;
    const rows = [
      [audience === 'child' ? '교육 환경' : '공부 환경', answers.environment.label],
      [audience === 'child' ? '가장 중요한 고민' : '이루고 싶은 목표', answers.focus.label],
      ['마지막 장에서 답변받고 싶은 질문', answers.personalQuestion.skipped ? '질문을 남기지 않았어요.' : answers.personalQuestion.text]
    ];
    const list = document.getElementById('review-answers');
    list.replaceChildren();
    rows.forEach(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt'); term.textContent = label;
      const description = document.createElement('dd'); description.textContent = value;
      row.append(term, description); list.append(row);
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!consent.requireSelection()) return;
    Object.values(sections).filter(section => !section.disabled).forEach(validatePerson);
    if (!form.reportValidity()) return;
    const payload = {
      schemaVersion:3,
      audience,
      learner:readPerson(audience),
      guardian:audience === 'child' ? {...readPerson('guardian'), relationship:form.querySelector('[name="guardian-relationship"]:checked').value} : null,
      study:form.querySelector('[name="study"]:checked').value,
      consent:consent.snapshot()
    };
    lastPayload = payload;
    go('questions', 0);
  });
  history.replaceState({view:'choose', audience:null}, '', location.pathname);
  showView('choose', false);
})();
