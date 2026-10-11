// Product verification is independent of the core's calculation availability.
// This is a reviewed release allowlist, NOT user input or checkout configuration.
// No paid chapter generator or delivery integration exists in this release.
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
export const REPORT_VERIFICATION = freeze({
  version: 'paid-report-readiness-v1',
  coreCommit: 'bac8b553c650d667bd3854f829db26dc7785ec56',
  coreSourceManifestSha256: 'a51f203ff36ed3bd4a02ade69cd3afc9fbac46ebcdb5cec3a38579d10bd13a0f',
  child: {chapters: [], cycleVerified: false, deliveryVerified: false},
  self: {chapters: [], cycleVerified: false, deliveryVerified: false}
});

// Candidate inputs for the future paid interpretation modules, not new scoring
// rules. Changing this mapping does not register a chapter as supplied.
export const CHAPTER_INPUTS = freeze({
  1: ['self_direction','independence','analytical','intuitive','exploration','depth_orientation'],
  2: ['execution_speed','persistence','repetition_tolerance','planning','conscientiousness'],
  3: ['achievement','mastery','competitiveness','immediate_reward','meaning_seeking'],
  4: ['analytical','intuitive','verbal_expression','planning','repetition_tolerance'],
  5: ['pressure_sensitivity','failure_resilience','emotional_volatility','uncertainty_tolerance'],
  6: {
    child: ['control_sensitivity','authority_acceptance','independence','evaluation_sensitivity'],
    self: ['planning','execution_speed','pressure_sensitivity','conscientiousness','failure_resilience']
  },
  7: ['social_energy','collaboration','independence','change_seeking','evaluation_sensitivity'],
  8: ['exploration','depth_orientation','verbal_expression','analytical','practicality'],
  9: [],
  10: []
});

export function verifiedChapters(audience) {
  return ['child','self'].includes(audience)
    ? [...REPORT_VERIFICATION[audience].chapters] : [];
}

// Validate the requested scope against the release allowlist. A ten-chapter
// product must not silently become a one/nine-chapter product.
export function validateReportOffer(offer, audience, checkoutConnected = false) {
  const reasons = [];
  const release = ['child','self'].includes(audience) ? REPORT_VERIFICATION[audience] : null;
  const supplied = offer?.providedChapters;
  const validScope = Array.isArray(supplied) && supplied.every(n => Number.isInteger(n) && n >= 1 && n <= 10)
    && new Set(supplied).size === supplied.length;
  if (!release) reasons.push('INVALID_AUDIENCE');
  if (!validScope) reasons.push('INVALID_CHAPTER_LIST');
  if (!validScope || supplied.length !== 10) reasons.push('INCOMPLETE_TEN_CHAPTER_PRODUCT');
  if (validScope && supplied.some(n => !release?.chapters.includes(n))) reasons.push('UNVERIFIED_CHAPTER');
  if (offer?.cycleVerified !== true || release?.cycleVerified !== true) reasons.push('CYCLE_NOT_VERIFIED');
  if (release?.deliveryVerified !== true) reasons.push('DELIVERY_NOT_VERIFIED');
  if (!Number.isSafeInteger(offer?.price) || offer.price < 0 || offer?.currency !== 'KRW') reasons.push('INVALID_PRICE');
  if (offer?.available !== true) reasons.push('SALE_DISABLED');
  if (checkoutConnected !== true) reasons.push('CHECKOUT_NOT_CONNECTED');
  return {purchasable: reasons.length === 0, reasons,
    providedChapters: validScope ? supplied.filter(n => release?.chapters.includes(n)) : [],
    cycleVerified: offer?.cycleVerified === true && release?.cycleVerified === true};
}

// Diagnostic only: these fields being present does NOT certify interpretation.
// The full core schema/semantic checks remain the responsibility of the core.
export function inspectChapterInputs(calculation, audience, chapter) {
  const missing = [];
  if (!['child','self'].includes(audience) || !Number.isInteger(chapter) || chapter < 1 || chapter > 10)
    return {inputsPresent:false, missing:['INVALID_CHAPTER_OR_AUDIENCE'], provided:false};
  if (chapter === 9 || chapter === 10) return {inputsPresent:false,
    missing:[chapter === 9 ? 'CYCLE_INTERPRETATION_NOT_CONNECTED' : 'PERSONALIZED_REPORT_NOT_IMPLEMENTED'], provided:false};
  const response = calculation?.subjects?.learner;
  const subjects = response?.result?.subjects;
  const subject = Array.isArray(subjects) ? subjects.find(s => s?.subjectId === 'learner') : null;
  const candidates = subject?.candidates;
  if (!['ok','partial'].includes(response?.status)) missing.push('CORE_RESPONSE_UNAVAILABLE');
  for (const layer of ['calendarTime','candidates','features','traits','manifestation'])
    if (response?.result?.layers?.[layer]?.availability !== 'AVAILABLE') missing.push(`LAYER:${layer}`);
  if (!Array.isArray(candidates) || candidates.length === 0) missing.push('LEARNER_CANDIDATES_MISSING');
  const ids = chapter === 6 ? CHAPTER_INPUTS[chapter][audience] : CHAPTER_INPUTS[chapter];
  for (const [index,c] of (Array.isArray(candidates) ? candidates : []).entries()) {
    if (!c || !['year','month','day','hour'].every(k => typeof c.pillars?.[k] === 'string' && c.pillars[k].length === 2)) missing.push(`CANDIDATE:${index}:PILLARS`);
    if (!Array.isArray(c?.features?.featureDetails) || !c.features.featureDetails.some(f => f?.availability === 'AVAILABLE')) missing.push(`CANDIDATE:${index}:FEATURES`);
    const evidence = new Set((Array.isArray(c?.evidence) ? c.evidence : []).filter(e=>typeof e?.id==='string').map(e => e.id));
    for (const id of ids) {
      const t = c?.traits?.[id];
      if (!['VERY_LOW','LOW','MID','HIGH','VERY_HIGH'].includes(t?.level) || !Number.isFinite(t?.score)) missing.push(`CANDIDATE:${index}:TRAIT:${id}`);
      if (!['NORMAL','AMPLIFIED','SOFTENED','SUPPRESSED','CONTEXT_DEPENDENT'].includes(t?.manifestation?.state) || !t.manifestation.ruleId) missing.push(`CANDIDATE:${index}:MANIFESTATION:${id}`);
      if (!Array.isArray(t?.evidenceRefs) || !t.evidenceRefs.length || t.evidenceRefs.some(ref => !evidence.has(ref))) missing.push(`CANDIDATE:${index}:EVIDENCE:${id}`);
    }
  }
  return {inputsPresent:missing.length === 0, missing, provided:false};
}
