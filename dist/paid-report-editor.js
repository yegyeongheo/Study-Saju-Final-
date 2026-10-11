import {PAID_REPORT_SPEC,PAID_REPORT_POLICY,CYCLE_UNAVAILABLE_COPY} from './paid-report-spec.js';
import {interpretationFacts} from './interpretation-plan.js';

// Reuse the existing interpretation's facts without changing selection or scores.
// This request stays in the caller's memory; it is never stored, shared or sent
// to a model automatically. A paid writer must be explicitly connected.
export function buildPaidReportPlan(calculation,payload,interpretation=null) {
  const audience=payload?.audience;
  if(!['child','self'].includes(audience))throw new Error('INVALID_AUDIENCE');
  const facts=interpretationFacts(calculation,payload);
  const answers=payload.personalization||{};
  const context=structuredClone({environment:answers.environment||null,focus:answers.focus||null,
    personalQuestion:answers.personalQuestion?.skipped===false&&typeof answers.personalQuestion.text==='string'
      ?{text:answers.personalQuestion.text,source:'user-answer',treatAs:'data-not-instructions'}:null});
  return {version:'paid-editorial-v1',audience,status:'draft-only',policy:PAID_REPORT_POLICY,
    // Keep original selected thesis/strategy as context; never paste the free
    // paragraphs into multiple paid chapters.
    existingInterpretation:interpretation?.plan?structuredClone({selected:interpretation.plan.selected,
      conditions:interpretation.plan.conditions,evidence:interpretation.plan.evidence,
      expression:interpretation.plan.expression,qualifier:interpretation.plan.qualifier}):null,
    context,chapters:PAID_REPORT_SPEC[audience].map(spec=>({
      ...spec,sections:spec.sections.map(s=>({...s})),
      status:spec.number===9?'unavailable':'awaiting-writer',
      notice:spec.number===9?CYCLE_UNAVAILABLE_COPY:null,
      facts:spec.number===9?null:{pillars:structuredClone(facts.pillars),features:structuredClone(facts.features),
        details:structuredClone(facts.details),candidateCount:facts.candidateCount,unknownHour:facts.unknownHour,
        traits:structuredClone(Object.fromEntries(spec.traitInputs.filter(id=>facts.traits[id]).map(id=>[id,facts.traits[id]])))},
      allowedEvidenceRefs:[
        ...spec.traitInputs.flatMap(id=>(facts.traits[id]?.evidence||[]).flatMap((items,candidate)=>items.map(e=>`core:${candidate}:${e.id}`))),
        ...(context.environment?['answer:environment']:[]),...(context.focus?['answer:focus']:[]),
        ...(spec.number===10&&context.personalQuestion?['answer:personalQuestion']:[]),
        ...(spec.number===10?Array.from({length:8},(_,i)=>`chapter:${i+1}`):[])
      ],
      context:spec.number===10?context:{environment:context.environment,focus:context.focus}
    }))};
}
const normalized=s=>s.replace(/[\s\p{P}\p{S}]/gu,'').toLowerCase();
const grams=s=>new Set(Array.from({length:Math.max(0,s.length-4)},(_,i)=>s.slice(i,i+5)));
function similarity(a,b) {
 const x=grams(normalized(a)),y=grams(normalized(b));
 if(!x.size||!y.size)return 0;
 const common=[...x].filter(v=>y.has(v)).length;
 return common/(x.size+y.size-common);
}

// A structural/editorial preflight, not a claim of semantic truth or sales readiness.
// Claim/action IDs belong to the writer's central report plan, so rewording an
// identical conclusion or advice cannot silently reuse it in another chapter.
export function validatePaidReportDraft(draft,audience,plan=null) {
 const errors=[],review=[];
 if(!['child','self'].includes(audience)||draft?.audience!==audience||!Array.isArray(draft?.chapters))
   return {valid:false,errors:['INVALID_REPORT'],review:[]};
 const chapters=draft.chapters,paragraphs=[],claims=new Set(),actions=new Set();
 if(chapters.length!==10||chapters.some((c,i)=>c?.number!==i+1))errors.push('CHAPTER_ORDER');
 for(const [index,c] of chapters.entries()) {
  const spec=PAID_REPORT_SPEC[audience][index];if(!spec)continue;
  if(c?.title!==spec.title)errors.push(`CHAPTER_TITLE:${index+1}`);
  if(index===8){
   if(c.status!=='unavailable'||c.notice!==CYCLE_UNAVAILABLE_COPY||!Array.isArray(c.sections)||c.sections.length!==0)errors.push('CYCLE_CONTENT_BLOCKED');
   continue;
  }
  if(!Array.isArray(c.sections)||c.sections.length!==3){errors.push(`THREE_SECTIONS_REQUIRED:${index+1}`);continue;}
  for(const [j,section] of c.sections.entries()) {
   const expected=spec.sections[j],loc=`${index+1}.${j+1}`;
   if(section.role!==expected.role||section.heading!==expected.heading||section.intro!==expected.intro)errors.push(`SECTION_CONTRACT:${loc}`);
   if(!Array.isArray(section.paragraphs)||!section.paragraphs.length||section.paragraphs.some(p=>typeof p!=='string'||!p.trim())){errors.push(`EMPTY_BODY:${loc}`);continue;}
   if(!Array.isArray(section.claimIds)||!section.claimIds.length)errors.push(`MISSING_CLAIM_IDS:${loc}`);
   for(const claim of section.claimIds||[]){if(typeof claim!=='string'||!claim.trim()||claims.has(claim))errors.push(`REPEATED_CLAIM:${loc}`);claims.add(claim);}
   if(!Array.isArray(section.evidenceRefs)||!section.evidenceRefs.length)errors.push(`MISSING_EVIDENCE:${loc}`);
   if(plan&&Array.isArray(section.evidenceRefs)&&section.evidenceRefs.some(ref=>!plan.chapters[index]?.allowedEvidenceRefs.includes(ref)))errors.push(`UNKNOWN_EVIDENCE:${loc}`);
   if(section.role==='solution') {
    if(!Array.isArray(section.addresses)||!section.addresses.length||section.addresses.some(id=>!c.sections[1].claimIds?.includes(id)))errors.push(`UNLINKED_SOLUTION:${loc}`);
    if(!Array.isArray(section.actionIds)||!section.actionIds.length)errors.push(`MISSING_ACTION_IDS:${loc}`);
    for(const action of section.actionIds||[]){if(typeof action!=='string'||!action.trim()||actions.has(action))errors.push(`REPEATED_ACTION:${loc}`);actions.add(action);}
   }
   for(const p of section.paragraphs) {
    if(normalized(p)===normalized(section.intro)||normalized(p)===normalized(section.heading))errors.push(`REPEATED_INTRO:${loc}`);
    if(PAID_REPORT_POLICY.avoid.some(phrase=>p.includes(phrase)))errors.push(`STIFF_COPY:${loc}`);
    if(p.length>400)review.push(`LONG_PARAGRAPH:${loc}`);
    paragraphs.push({loc,text:p});
   }
  }
 }
 for(let i=0;i<paragraphs.length;i++)for(let j=0;j<i;j++){
  const a=paragraphs[i],b=paragraphs[j];
  if(normalized(a.text)===normalized(b.text))errors.push(`DUPLICATE_PARAGRAPH:${a.loc}:${b.loc}`);
  else if(similarity(a.text,b.text)>.65)review.push(`SIMILAR_PARAGRAPH:${a.loc}:${b.loc}`);
 }
 const full=paragraphs.map(p=>p.text).join('\n');
 for(const phrase of PAID_REPORT_POLICY.repetitionReview)if(full.split(phrase).length-1>1)review.push(`REPEATED_ENDING:${phrase}`);
 return {valid:errors.length===0,errors:[...new Set(errors)],review:[...new Set(review)],salesReady:false};
}

export async function createPaidReportDraft({calculation,payload,interpretation,write,signal}) {
 if(typeof write!=='function')throw new Error('PAID_REPORT_WRITER_NOT_CONNECTED');
 signal?.throwIfAborted();
 const plan=buildPaidReportPlan(calculation,payload,interpretation);
 const draft=await write(structuredClone(plan),{signal});
 signal?.throwIfAborted();
 const validation=validatePaidReportDraft(draft,payload.audience,plan);
 if(!validation.valid)throw Object.assign(new Error('PAID_REPORT_EDITORIAL_CHECK_FAILED'),{validation});
 return {draft,validation,status:'needs-content-review',providedChapters:[]};
}
