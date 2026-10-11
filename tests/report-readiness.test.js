import test from 'node:test';
import assert from 'node:assert/strict';
import {REPORT_OFFER} from '../dist/report-offer.js';
import {REPORT_VERIFICATION,CHAPTER_INPUTS,verifiedChapters,validateReportOffer,inspectChapterInputs} from '../dist/report-readiness.js';
const attempted={price:9900,currency:'KRW',available:true,cycleVerified:true,providedChapters:Array.from({length:10},(_,i)=>i+1)};
test('both audiences remain unlaunched; neither raw timelines nor booleans certify chapters',()=>{
  for(const audience of ['child','self']) {
    assert.deepEqual(verifiedChapters(audience),[]);
    const result=validateReportOffer(attempted,audience,true);
    assert.equal(result.purchasable,false);
    assert.deepEqual(result.providedChapters,[]);
    for(const reason of ['UNVERIFIED_CHAPTER','CYCLE_NOT_VERIFIED','DELIVERY_NOT_VERIFIED']) assert.ok(result.reasons.includes(reason));
  }
  assert.equal(REPORT_OFFER.price,null);assert.equal(REPORT_OFFER.available,false);assert.equal(REPORT_OFFER.cycleVerified,false);
  assert.throws(()=>REPORT_OFFER.providedChapters.push(1),TypeError);
  assert.throws(()=>REPORT_VERIFICATION.self.chapters.push(9),TypeError);
  assert.throws(()=>REPORT_VERIFICATION.child.cycleVerified=true,TypeError);
});
test('malformed/partial/duplicate chapter lists cannot open a ten-chapter checkout',()=>{
  for(const scope of [undefined,null,{},'1',[],[1],[1,2,3,4,5,6,7,8,10],[1,1,2,3,4,5,6,7,8,10],[0],[11],['9'],[NaN],[1.5]]) {
    const result=validateReportOffer({...attempted,providedChapters:scope},'self',true);
    assert.equal(result.purchasable,false);
    assert.ok(result.reasons.some(r=>['INVALID_CHAPTER_LIST','INCOMPLETE_TEN_CHAPTER_PRODUCT'].includes(r)));
  }
  for(const audience of [undefined,null,'guardian','__proto__']) assert.equal(validateReportOffer(attempted,audience,true).purchasable,false);
});
test('strict price, availability, currency and callback validation',()=>{
  for(const price of [null,undefined,'9900',NaN,Infinity,-1,0.1,Number.MAX_SAFE_INTEGER+1]) assert.ok(validateReportOffer({...attempted,price},'self',true).reasons.includes('INVALID_PRICE'));
  assert.ok(validateReportOffer({...attempted,currency:'USD'},'self',true).reasons.includes('INVALID_PRICE'));
  assert.ok(validateReportOffer({...attempted,available:'true'},'self',true).reasons.includes('SALE_DISABLED'));
  assert.ok(validateReportOffer(attempted,'self','true').reasons.includes('CHECKOUT_NOT_CONNECTED'));
  assert.equal(validateReportOffer(null,'self').purchasable,false);
});
function fixture() {
  const ids=[...new Set(Object.values(CHAPTER_INPUTS).flatMap(v=>Array.isArray(v)?v:Object.values(v).flat()))];
  const candidate={pillars:{year:'甲子',month:'丁卯',day:'戊辰',hour:'辛酉'},features:{featureDetails:[{id:'wood',availability:'AVAILABLE',value:0}]},
    traits:Object.fromEntries(ids.map(id=>[id,{level:'MID',score:0,manifestation:{state:'NORMAL',ruleId:'M-DEFAULT'},evidenceRefs:[id]}])),evidence:ids.map(id=>({id}))};
  return {subjects:{learner:{status:'partial',result:{layers:Object.fromEntries(['calendarTime','candidates','features','traits','manifestation'].map(l=>[l,{availability:'AVAILABLE'}])),subjects:[{subjectId:'learner',candidates:[candidate,structuredClone(candidate)]}]}}}};
}
test('input diagnostics inspect every candidate, retain zero values, never certify paid output',()=>{
  const calculation=fixture(),before=JSON.stringify(calculation);
  for(const audience of ['self','child']) for(let chapter=1;chapter<=8;chapter++) assert.deepEqual(inspectChapterInputs(calculation,audience,chapter),{inputsPresent:true,missing:[],provided:false});
  assert.equal(JSON.stringify(calculation),before);
  const candidates=calculation.subjects.learner.result.subjects[0].candidates;
  delete candidates[1].traits.analytical;
  assert.equal(inspectChapterInputs(calculation,'self',1).inputsPresent,false);
  for(const chapter of [9,10]) assert.equal(inspectChapterInputs(fixture(),'self',chapter).inputsPresent,false);
});
test('missing layers, learner, fields, manifestation or evidence cannot pass input diagnostics',()=>{
  for(const mutate of [
    c=>{c.subjects.learner.status='error';},
    c=>{c.subjects.learner.result.layers.traits.availability='UNAVAILABLE';},
    c=>{c.subjects.learner.result.subjects[0].subjectId='guardian';},
    c=>{c.subjects.learner.result.subjects[0].candidates=[];},
    c=>{c.subjects.learner.result.subjects[0].candidates[0].traits.analytical.manifestation=null;},
    c=>{c.subjects.learner.result.subjects[0].candidates[0].evidence=[];},
    c=>{c.subjects.learner.result.subjects[0].candidates[0].features.featureDetails=[];}
  ]) {const c=fixture();mutate(c);assert.equal(inspectChapterInputs(c,'self',1).inputsPresent,false);}
  assert.equal(inspectChapterInputs(null,'self',1).inputsPresent,false);
});
