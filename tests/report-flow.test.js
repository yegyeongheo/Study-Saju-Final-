import {PAID_REPORT_SPEC} from '../dist/paid-report-spec.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateReportAccess,fetchReportAccess} from '../dist/report-access.js';
import {createReportFlow} from '../dist/report-flow.js';
import {commerceResponse} from '../sites/commerce.js';
const snapshot=audience=>({calculation:{subjects:{learner:{status:'ok'}}},payload:{audience,learner:{gender:'female',birthTime:{isUnknown:true}}},report:null});
const valid=audience=>({schemaVersion:'study-report-access-v1',status:'ready',payment:{status:'verified',productId:'study-fortune-v1',amount:9900,currency:'KRW'},report:{id:'test-report-id',audience,freeResult:snapshot(audience),chapters:Array.from({length:10},(_,i)=>({number:i+1,status:'ready',...(i===8?{cycleVerified:true}:{}),sections:PAID_REPORT_SPEC[audience][i].sections.map(s=>({role:s.role,heading:s.heading,paragraphs:['테스트용 본문입니다.']}))}))}});

test('only complete verified report responses pass: audience, price, product, 10 chapters and cycle proof',()=>{
  for(const audience of ['self','child']){
    const data=valid(audience),parsed=validateReportAccess(data);assert.equal(parsed.report.chapters.length,10);
    parsed.report.chapters[0].sections[0].paragraphs[0]='changed';assert.notEqual(data.report.chapters[0].sections[0].paragraphs[0],'changed');
  }
  const bad=[v=>v.payment.status='pending',v=>v.payment.amount=99,v=>v.payment.currency='USD',v=>v.payment.productId='different',v=>v.report.freeResult.payload.audience='child',v=>v.report.chapters.pop(),v=>v.report.chapters[1].number=1,v=>v.report.chapters[8].cycleVerified=false,v=>v.report.chapters[0].sections.pop(),v=>v.report.chapters[0].sections[0].paragraphs=[],v=>v.report.freeResult.calculation=null];
  for(const mutate of bad){const v=valid('self');mutate(v);assert.throws(()=>validateReportAccess(v));}
  assert.throws(()=>validateReportAccess({paid:true}));
  assert.deepEqual(validateReportAccess({schemaVersion:'study-report-access-v1',status:'processing',report:valid('self').report}),{status:'processing'});
});
test('report access asks same-origin server; HTTP failures and nonpayment statuses never unlock',async()=>{
  let request;
  const ready=await fetchReportAccess({fetchImpl:async(url,options)=>{request={url,options};return Response.json(valid('self'));}});
  assert.equal(ready.status,'ready');assert.equal(request.url,'/api/study-reports/current');assert.equal(request.options.credentials,'same-origin');assert.equal(request.options.cache,'no-store');assert.equal(request.options.redirect,'error');
  for(const [code,status] of [[503,'unavailable'],[401,'payment_required'],[403,'payment_required']])assert.equal((await fetchReportAccess({fetchImpl:async()=>new Response(null,{status:code})})).status,status);
  await assert.rejects(fetchReportAccess({fetchImpl:async()=>new Response(null,{status:500})}));
});
test('current server accepts no payments, ignores forged paid flags and exposes no report body',async()=>{
  for(const [path,method] of [['/api/checkout/session','POST'],['/api/study-reports/current','GET']]){
    const response=commerceResponse(new Request('https://example.test'+path+'?paid=true&amount=9900',{method,headers:{'Cookie':'paid=true'}}));
    assert.equal(response.status,503);assert.equal(response.headers.get('Cache-Control'),'no-store');
    const value=await response.json();assert.equal(value.status,'unavailable');assert.equal(value.report,undefined);
  }
  assert.equal(commerceResponse(new Request('https://example.test/api/checkout/session')).status,405);
});
class Node {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.hidden=false;this.text='';this.attributes={};this.classList={remove(){}};}
  set textContent(v){this.text=String(v);this.children=[];}
  get textContent(){return this.text+this.children.map(c=>c.textContent).join('');}
  append(...children){for(const child of children){if(child.parent)child.parent.children=child.parent.children.filter(c=>c!==child);child.parent=this;this.children.push(child);}}
  replaceChildren(...children){this.children=[];this.text='';this.append(...children);}
  setAttribute(k,v){this.attributes[k]=v;}
  querySelectorAll(){return [];}
  scrollIntoView(){} focus(){}
}
function harness(loadAccess=async()=>({status:'unavailable'}),audience='self'){
  const nodes=new Map([...readFileSync('dist/start.html','utf8').matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Node()]));
  globalThis.document={getElementById:id=>{assert.ok(nodes.has(id),id);return nodes.get(id);},createElement:tag=>new Node(tag)};
  globalThis.window=new EventTarget();window.matchMedia=()=>({matches:true});
  let current=snapshot(audience);const calls=[];const restored=[];
  nodes.get('free-overview-home').append(nodes.get('free-overview'));
  const flow=createReportFlow({getSnapshot:()=>current,restoreSnapshot:s=>{restored.push(s);current=s;},navigate:v=>calls.push(v),loadAccess});
  return {nodes,flow,calls,restored,setSnapshot:s=>current=s};
}
const flush=()=>new Promise(setImmediate);
test('preview reuses free result and renders ten audience-specific chapters without granting access',()=>{
  for(const audience of ['self','child']){
    const h=harness(undefined,audience);h.flow.show('checkout');assert.equal(h.nodes.get('checkout-chapters').children.length,10);
    h.flow.show('reportPreview');assert.equal(h.nodes.get('full-paid-chapters').children.length,10);assert.match(h.nodes.get('full-report-notice').textContent,/구성 미리보기/);
    assert.equal(h.nodes.get('free-overview').parent,h.nodes.get('full-free-content'));assert.equal(h.restored.length,0);
    assert.match(h.nodes.get('full-report-title').textContent,audience==='child'?/우리 아이/:/나의/);
    h.nodes.get('full-report-back').onclick();assert.equal(h.calls.at(-1),'checkout');assert.equal(h.nodes.get('free-overview').parent,h.nodes.get('free-overview-home'));
  }
});
test('verified server result restores free + all ten chapters; pending and failed remain outside reader',async()=>{
  const h=harness(async()=>validateReportAccess(valid('child')));h.flow.show('fullReport');await flush();
  assert.equal(h.restored.length,1);assert.equal(h.nodes.get('full-report-content').hidden,false);assert.equal(h.nodes.get('full-paid-chapters').children.length,10);
  assert.match(h.nodes.get('full-paid-chapters').textContent,/테스트용 본문/);assert.match(h.nodes.get('full-report-title').textContent,/우리 아이/);
  h.nodes.get('full-report-back').onclick();assert.equal(h.restored.at(-1).payload.audience,'self');
  for(const status of ['unavailable','payment_required','processing','failed']){
    const p=harness(async()=>({status}));p.flow.show('fullReport');await flush();assert.equal(p.restored.length,0);assert.equal(p.nodes.get('full-report-content').hidden,true);p.flow.leave();
  }
});
test('leaving while verification runs aborts and ignores late data',async()=>{
  let finish,signal;const h=harness(options=>{signal=options.signal;return new Promise(r=>finish=r);});
  h.flow.show('fullReport');h.flow.leave();assert.equal(signal.aborted,true);
  finish(validateReportAccess(valid('self')));await flush();assert.equal(h.restored.length,0);assert.equal(h.nodes.get('full-report-content').hidden,true);
});
