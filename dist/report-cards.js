import {DAY_ANIMAL_IMAGES, STUDY_TYPE_IMAGES} from './card-assets.js';

// Presentation metadata only. The core remains the sole source of the day pillar.
export const ELEMENTS = Object.freeze({
  wood:{label:'목 木', color:'푸른', totem:'생명의 가지', meaning:'성장'},
  fire:{label:'화 火', color:'붉은', totem:'불꽃 구슬', meaning:'열정'},
  earth:{label:'토 土', color:'노란', totem:'산 모양 돌', meaning:'안정'},
  metal:{label:'금 金', color:'하얀', totem:'은빛 거울', meaning:'명료함'},
  water:{label:'수 水', color:'검은', totem:'물방울 수정', meaning:'유연함'}
});
const STEMS = '甲乙丙丁戊己庚辛壬癸';
const STEM_NAMES = '갑을병정무기경신임계';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
const BRANCH_NAMES = '자축인묘진사오미신유술해';
const ELEMENT_ORDER = ['wood','fire','earth','metal','water'];
const ANIMALS = [
  ['rat','쥐'], ['ox','소'], ['tiger','호랑이'], ['rabbit','토끼'],
  ['dragon','용'], ['snake','뱀'], ['horse','말'], ['goat','양'],
  ['monkey','원숭이'], ['rooster','닭'], ['dog','개'], ['pig','돼지']
];

export function dayAnimalCard(dayPillar, gender) {
  if (typeof dayPillar !== 'string' || dayPillar.length !== 2 || !['female','male'].includes(gender)) return null;
  const stem = STEMS.indexOf(dayPillar[0]), branch = BRANCHES.indexOf(dayPillar[1]);
  if (stem < 0 || branch < 0 || stem % 2 !== branch % 2) return null;
  const element = ELEMENT_ORDER[Math.floor(stem / 2)];
  const [animal, animalName] = ANIMALS[branch];
  return {
    key:`${element}-${animal}-${gender}`, element, animal, gender, dayPillar,
    dayName:`${STEM_NAMES[stem]}${BRANCH_NAMES[branch]}`,
    title:`${ELEMENTS[element].color} ${animalName}`, ...ELEMENTS[element]
  };
}

export function resolveDayAnimalCard(calculation, gender) {
  const response = calculation?.subjects?.learner;
  if (!['ok','partial'].includes(response?.status)) return {status:'unavailable'};
  const subjects = response.result?.subjects;
  const learner = Array.isArray(subjects) ? subjects.find(subject => subject.subjectId === 'learner') : null;
  const candidates = learner?.candidates;
  if (!Array.isArray(candidates) || !candidates.length) return {status:'unavailable'};
  const cards = candidates.map(candidate => dayAnimalCard(candidate?.pillars?.day, gender));
  if (cards.some(card => !card)) return {status:'unavailable'};
  // Do not pick the most probable candidate when the day itself is uncertain.
  if (new Set(cards.map(card => card.dayPillar)).size !== 1) return {status:'ambiguous'};
  return {status:'ready', card:cards[0]};
}

export function cardImageFilename(registry, key) {
  if (!key || !Object.hasOwn(registry, key)) return null;
  const filename = registry[key];
  return typeof filename === 'string' && /^[a-z0-9][a-z0-9._-]*\.(?:webp|png|jpe?g)$/i.test(filename) ? filename : null;
}

export function createReportCards({dayImages = DAY_ANIMAL_IMAGES, studyImages = STUDY_TYPE_IMAGES} = {}) {
  const el = id => document.getElementById(id);
  function artwork(kind, filename, alt, placeholder) {
    const image = el(`${kind}-card-image`), fallback = el(`${kind}-card-placeholder`);
    image.onload = null; image.onerror = null; image.hidden = true;
    image.removeAttribute('src'); image.alt = '';
    fallback.hidden = false;
    fallback.textContent = placeholder;
    if (!filename) return;
    image.alt = alt;
    image.onload = () => {image.hidden = false; fallback.hidden = true;};
    image.onerror = () => {
      image.hidden = true; fallback.hidden = false;
      fallback.textContent = '카드 이미지를 불러오지 못했어요.';
    };
    image.src = filename;
  }
  function reset() {
    el('report-cards').hidden = true;
    ['day-card-title','day-card-pillar','day-card-symbol','study-card-title','study-card-caption'].forEach(id => el(id).textContent = '');
    artwork('day', null, '', ''); artwork('study', null, '', '');
    el('day-card-symbol').hidden = true;
    el('card-symbol-note').hidden = true;
  }
  function render(calculation, payload, report) {
    reset();
    if (!calculation) return;
    el('report-cards').hidden = false;
    const gender = payload?.learner?.gender;
    const selected = resolveDayAnimalCard(calculation, gender);
    if (selected.status === 'ready') {
      const card = selected.card;
      el('day-card-title').textContent = card.title;
      el('day-card-pillar').textContent = `${card.dayPillar} · ${card.dayName}일주`;
      el('day-card-symbol').textContent = `${card.label} · ${card.totem}\n${card.meaning}의 상징`;
      el('day-card-symbol').hidden = false;
      el('card-symbol-note').hidden = false;
      artwork('day', cardImageFilename(dayImages, card.key), `${card.dayName}일주 ${card.title} · ${gender === 'female' ? '여자아이' : '남자아이'} 일주 동물 카드`, '일주 동물 카드\n이미지 준비 중');
    } else {
      el('day-card-title').textContent = selected.status === 'ambiguous' ? '일주를 더 살펴보고 있어요' : '일주를 확인할 수 없어요';
      el('day-card-pillar').textContent = selected.status === 'ambiguous' ? '태어난 시간에 따라 일주가 달라질 수 있어요.' : '입력 정보와 계산 결과를 확인해 주세요.';
      artwork('day', null, '', '일주 확인 후\n카드가 열려요');
    }
    const isChild = payload?.audience === 'child';
    el('study-card-title').textContent = report?.typeName || (isChild ? '아이에게 맞는 공부 방식' : '나에게 맞는 공부 방식');
    el('study-card-caption').textContent = report ? (isChild ? '아이의 학습 성향을 담은 카드' : '나의 학습 성향을 담은 카드') : '공부 유형 해석을 준비하고 있어요.';
    const studyKey = report?.typeId && ['female','male'].includes(gender) ? `${report.typeId}-${gender}` : null;
    artwork('study', cardImageFilename(studyImages, studyKey), `${report?.typeName || '공부 유형'} 카드`, '공부 유형 카드\n이미지 준비 중');
  }
  return {render, reset};
}
