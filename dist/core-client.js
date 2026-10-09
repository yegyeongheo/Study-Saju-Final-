// Input transport only. Calendar conversion, pillars and scoring belong to the core.
const BRANCHES = {zi:'子', chou:'丑', yin:'寅', mao:'卯', chen:'辰', si:'巳', wu:'午', wei:'未', shen:'申', you:'酉', xu:'戌', hai:'亥'};
// Approximate representative points, NOT the person's exact birthplace or a
// geographic centroid. Province anchors use the named city in CORE_API.md.
// Always mark region precision so the core returns ESTIMATED_LOCATION.
const REGIONS = {
  '서울특별시':[126.98,37.57], '부산광역시':[129.08,35.18],
  '대구광역시':[128.60,35.87], '인천광역시':[126.71,37.46],
  '광주광역시':[126.85,35.16], '대전광역시':[127.38,36.35],
  '울산광역시':[129.31,35.54], '세종특별자치시':[127.29,36.48],
  '경기도':[127.03,37.26], '강원특별자치도':[127.73,37.88],
  '충청북도':[127.49,36.64], '충청남도':[126.66,36.60],
  '전북특별자치도':[127.15,35.82], '전라남도':[126.46,34.81],
  '경상북도':[128.73,36.57], '경상남도':[128.68,35.23],
  '제주특별자치도':[126.53,33.50]
};

export class CoreError extends Error {
  constructor(code, response = null) {
    super(code); this.name = 'CoreError'; this.code = code; this.response = response;
  }
}

export function toCoreSubject(person, id, role = 'person') {
  const birth = person?.birthDate;
  const coordinates = Object.hasOwn(REGIONS, person?.birthRegion) ? REGIONS[person.birthRegion] : null;
  if (!coordinates) throw new CoreError('BIRTH_PLACE_REQUIRED');
  if (!birth || !['solar','lunar'].includes(birth.calendar)
      || ![birth.year,birth.month,birth.day].every(Number.isInteger)
      || birth.year < 1900 || birth.year > 2099 || birth.month < 1 || birth.month > 12
      || birth.day < 1 || birth.day > 31 || typeof birth.isLeapMonth !== 'boolean'
      || !['male','female'].includes(person.gender)) throw new CoreError('INVALID_INPUT');
  const time = person.birthTime;
  let birthTime;
  if (time && Object.hasOwn(time, 'isUnknown')) {
    if (time.isUnknown === true) birthTime = {mode:'unknown'};
    else if (time.isUnknown === false && Number.isInteger(time.hour) && time.hour >= 0 && time.hour <= 23
      && Number.isInteger(time.minute) && time.minute >= 0 && time.minute <= 59) {
      birthTime = {mode:'exact',value:`${String(time.hour).padStart(2,'0')}:${String(time.minute).padStart(2,'0')}:00`,uncertaintySeconds:0};
    } else throw new CoreError('INVALID_INPUT');
  } else {
    const period = time?.period;
    if (period !== 'unknown' && !Object.hasOwn(BRANCHES, period)) throw new CoreError('INVALID_INPUT');
    birthTime = period === 'unknown' ? {mode:'unknown'} : {mode:'branch',value:BRANCHES[period],ziPart:'unspecified'};
  }
  return {
    id, role,
    birthDate:`${birth.year}-${String(birth.month).padStart(2,'0')}-${String(birth.day).padStart(2,'0')}`,
    calendar:birth.calendar,
    calendarSystem:birth.calendar === 'solar' ? 'gregorian' : 'korean_lunisolar',
    isLeapMonth:birth.isLeapMonth,
    birthTime,
    birthPlace:{ianaTz:'Asia/Seoul', longitude:coordinates[0], latitude:coordinates[1], precision:'region'},
    luckDirectionBasis:person.gender === 'male' ? 'M' : 'F'
  };
}

export function currentPeriod(now = new Date()) {
  const year = Number(new Intl.DateTimeFormat('en-US', {year:'numeric', timeZone:'Asia/Seoul'}).format(now));
  return {startUtc:`${year}-01-01T00:00:00+09:00`, endUtc:`${year + 1}-01-01T00:00:00+09:00`};
}

export async function analyzeCore(request, {signal, fetchImpl = globalThis.fetch} = {}) {
  const response = await fetchImpl('/api/saju/v1/analyze', {
    method:'POST', headers:{'Content-Type':'application/json'}, cache:'no-store',
    credentials:'same-origin', body:JSON.stringify(request), signal
  });
  let value;
  try { value = await response.json(); }
  catch { throw new CoreError('INVALID_RESPONSE'); }
  if (!response.ok || value?.status === 'error') throw new CoreError(value?.error?.code || 'HTTP_ERROR', value);
  if (!['ok','partial'].includes(value?.status) || !['1.0.0','1.1.0'].includes(value.schemaVersion)
      || value.requestId !== request.requestId || value.result?.kind !== request.operation
      || !Array.isArray(value.result?.subjects)) throw new CoreError('INVALID_RESPONSE', value);
  return value; // Preserve every core field; never project into a report schema.
}

export async function calculateCore(payload, {signal, period = currentPeriod(), fetchImpl} = {}) {
  if (![5,6].includes(payload?.schemaVersion) || !['self','child'].includes(payload.audience)) throw new CoreError('INVALID_INPUT');
  const entries = [['learner', toCoreSubject(payload.learner, 'learner', payload.audience === 'child' ? 'child' : 'person')]];
  if (payload.audience === 'child') entries.push(['guardian', toCoreSubject(payload.guardian, 'guardian', 'person')]);
  const result = {schemaVersion:'studysaju-calculation-v1', period:{...period}, subjects:{}};
  for (const [key, subject] of entries) {
    signal?.throwIfAborted();
    // Timeline includes the COMPLETE natal, yin/yang, element, Feature, Trait,
    // manifestation and evidence payload, plus cycles and interactions.
    const request = {schemaVersion:'1.0.0', requestId:crypto.randomUUID(), operation:'timeline',
      subjects:[subject], period:{...period}, options:{ruleProfile:'public-v1', ziPolicy:'dual'}, locale:'ko-KR'};
    result.subjects[key] = await analyzeCore(request, {signal, fetchImpl});
  }
  signal?.throwIfAborted();
  return result;
}
