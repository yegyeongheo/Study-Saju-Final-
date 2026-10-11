import test from 'node:test';
import assert from 'node:assert/strict';
import {composeFreeReport} from '../dist/free-report-model.js';
import {buildInterpretation} from '../dist/interpretation-writer.js';
import {interpretationFacts} from '../dist/interpretation-plan.js';
import {STORIES} from '../dist/interpretation-stories.js';
const pillars={year:'壬寅',month:'甲辰',day:'丙辰',hour:'丙申'};
const payload={audience:'child',learner:{gender:'female',birthTime:{isUnknown:false}},personalization:{focus:{id:'stress'}}};
const candidate=(levels,states={})=>({pillars,features:{values:{dmStrength:0.5,flowRatio:0.4}},traits:Object.fromEntries(Object.entries(levels).map(([id,level])=>[id,{level,evidenceStrength:'STRONG',manifestation:{state:states[id]||'NORMAL'},evidenceRefs:[`${id}:positive`,`${id}:negative`]}])),evidence:Object.keys(levels).flatMap(id=>[{id:`${id}:positive`,featureId:'zhengyin',role:'PRIMARY',contribution:0.8,sourceValue:0.4},{id:`${id}:negative`,featureId:'wealth',role:'NEGATIVE',contribution:-0.2,sourceValue:0.1}])});
const calc=(...candidates)=>({subjects:{learner:{status:'ok',result:{subjects:[{subjectId:'learner',candidates}]}}}});
const render=(levels,p=payload,states={})=>buildInterpretation(calc(candidate(levels,states)),p);
const copy=r=>[...r.summary,...r.insights.flatMap(i=>i.paragraphs)].join('\n');
test('changing execution reverses the mechanism without changing the natal day or type',()=>{
 const slow=render({meaning_seeking:'HIGH',execution_speed:'LOW'}),fast=render({meaning_seeking:'HIGH',execution_speed:'HIGH'});
 assert.equal(slow.plan.selected,'understand-before-start');assert.equal(fast.plan.selected,'meaning-with-action');
 assert.notEqual(slow.headline,fast.headline);assert.doesNotMatch(copy(fast),/첫 시도가 뒤로 밀립니다/);
 assert.match(copy(slow),/이 아이는/);assert.doesNotMatch(copy(slow),/아이은|@who|@own/);
});
test('questionnaire changes context, never the selected mechanism or traits',()=>{
 const levels={achievement:'HIGH',pressure_sensitivity:'HIGH'};
 const a=render(levels),b=render(levels,{...payload,personalization:{focus:{id:'concentration'},environment:{id:'high-competition'}}});
 assert.equal(a.plan.selected,b.plan.selected);assert.deepEqual(a.plan.conditions,b.plan.conditions);
 assert.notEqual(copy(a),copy(b));assert.match(copy(b),/답했으므로/);
 const noMatch=render({achievement:'MID',pressure_sensitivity:'MID'});assert.equal(noMatch.plan.selected,null);
});
test('candidate disagreement excludes the combination and unknown hour is not interpreted',()=>{
 const c1=candidate({independence:'HIGH',uncertainty_tolerance:'LOW'}),c2=candidate({independence:'LOW',uncertainty_tolerance:'LOW'});
 const result=buildInterpretation(calc(c1,c2),payload);assert.equal(result.plan.selected,null);
 const facts=interpretationFacts(calc(c1),{...payload,learner:{birthTime:{isUnknown:true}}});assert.equal(facts.pillars.hour,undefined);
});
test('manifestation distinguishes latent independence from suppressed expression',()=>{
 const levels={independence:'HIGH',uncertainty_tolerance:'LOW'};
 const normal=render(levels),suppressed=render(levels,payload,{independence:'SUPPRESSED'});
 assert.equal(normal.plan.selected,suppressed.plan.selected);assert.notDeepEqual(normal.summary,suppressed.summary);
 assert.match(copy(suppressed),/행동에서는 눌려/);
 const a=candidate(levels,{independence:'SUPPRESSED'}),b=candidate(levels,{independence:'NORMAL'});
 assert.equal(interpretationFacts(calc(a,b),payload).traits.independence.state,null);
});
test('counterevidence is retained and a contrary trait qualifies the central claim',()=>{
 const r=render({exploration:'HIGH',repetition_tolerance:'LOW',persistence:'HIGH'});
 assert.equal(r.plan.selected,'exploration-needs-variation');assert.ok(r.plan.counterEvidence.length);
 assert.match(copy(r),/목표를 쉽게 포기하는 모습을 구분/);assert.deepEqual(r.plan.qualifier.condition,['persistence','high']);
 assert.match(r.source,/정인/);assert.ok(r.plan.evidence[0].refs.length);
});
test('every authored combination is reachable, linked to its strategy, and has no duplicate paragraphs',()=>{
 for(const story of STORIES){
  const levels=Object.fromEntries(story.when.map(([id,band])=>[id,band==='high'?'HIGH':'LOW']));
  for(const audience of ['child','self']){
   const r=render(levels,{...payload,audience});assert.equal(r.plan.selected,story.id);
   assert.equal(r.plan.strategy.cause,story.id);assert.equal(r.plan.quality.uniqueParagraphs,true);
   assert.equal(r.insights.length,3);assert.ok(copy(r).length>400);
   assert.doesNotMatch(copy(r),/과학적으로|참고용|아이은|@who|@own/);
  }
 }
});
test('preschool scenes and actions use play and do not demand exams or written error logs',()=>{
 const r=render({meaning_seeking:'HIGH',execution_speed:'LOW'},{...payload,learner:{...payload.learner,ageBand:'preschool'}});
 assert.match(copy(r),/블록|그림/);assert.doesNotMatch(r.plan.strategy.action,/예제|공식|시험|한 줄|문제/);
});
test('core data is immutable, single-signal fallback does not manufacture a conflict',()=>{
 const c=calc(candidate({planning:'HIGH'})),before=JSON.stringify(c);
 const m=composeFreeReport(c,payload);assert.equal(JSON.stringify(c),before);
 assert.equal(m.interpretation.plan.selected,'single-planning');assert.equal(m.type,null);
 assert.equal(m.interpretation.plan.conditions.length,1);
});

test('visible story has an opening, development, turn and linked resolution for every rule',()=>{
 for(const rule of STORIES){
  const levels=Object.fromEntries(rule.when.map(([id,band])=>[id,band==='high'?'HIGH':'LOW']));
  const result=render(levels),story=result.story;
  assert.deepEqual(story.sections.map(s=>s.role),['development','turn','resolution']);
  assert.ok(story.opening.length);assert.ok(story.closing.length);
  const body=story.sections.flatMap(s=>s.paragraphs);
  assert.equal(new Set([...story.opening,...body]).size,story.opening.length+body.length);
  assert.ok(story.sections[2].paragraphs.join(' ').includes(result.plan.strategy.action));
  assert.ok(body.every(p=>p.length<260));
  assert.doesNotMatch([...story.opening,...body].join(''),/@who|@own|아이은/);
 }
});

test('paragraph splitting preserves quoted questions and their Korean suffixes',async()=>{
 const {readableParagraphs}=await import('../dist/story-arc.js');
 const text='“그런데 이 경우에는?”이라는 질문을 남겨 보세요. 그 질문으로 다시 돌아오세요.';
 assert.equal(readableParagraphs(text,35).join(' '),text);
});
