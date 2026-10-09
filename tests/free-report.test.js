import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNatalDisplay,characterInfo} from '../dist/natal-display.js';
import {composeFreeReport,suppliedStudyType,traitSignals} from '../dist/free-report-model.js';
import {selectApprovedType} from '../dist/study-type-rules.js';
import {shareSnapshot,createResultShare} from '../dist/result-share.js';
import {createFreeReportView} from '../dist/free-report-view.js';
import {readFileSync} from 'node:fs';

const base={year:'甲子',month:'丁卯',day:'戊辰',hour:'辛酉'};
const high={analytical:'HIGH',planning:'VERY_HIGH',independence:'HIGH',pressure_sensitivity:'HIGH'};
const candidate=(pillars=base,levels=high)=>({pillars,traits:Object.fromEntries(Object.entries(levels).map(([id,level])=>[id,{level,score:0}])),features:{values:{wood:9999,fire:-9999}}});
const calculation=(candidates=[candidate()])=>({subjects:{learner:{status:'ok',result:{subjects:[{subjectId:'learner',candidates}]}}}});
const payload={audience:'self',learner:{name:'SECRET_NAME',gender:'female',birthDate:{year:2000,month:2,day:3},birthTime:{isUnknown:false,hour:9,minute:21}},personalization:{environment:{id:'work-study'},focus:{id:'exam-admission'},personalQuestion:{text:'SECRET_QUESTION'}}};

test('8 visible characters: representative branch elements and yin/yang, never hidden stems or scores',()=>{
  const result=buildNatalDisplay(calculation(),payload);
  assert.equal(result.total,8);
  assert.deepEqual(Object.fromEntries(Object.entries(result.ranges).map(([k,v])=>[k,v.min])),{wood:2,fire:1,earth:2,metal:2,water:1,yin:4,yang:4});
  assert.match(result.notice,/여덟 글자/);
  assert.equal(result.columns[2].values[0].stem.reading,'무');
  assert.equal(result.columns[2].values[0].branch.reading,'진');
  assert.equal(characterInfo('辰','branch').element,'earth');
});
test('unknown hour is excluded even if core supplies hour candidates; exactly six characters',()=>{
  const p={...payload,learner:{...payload.learner,birthTime:{isUnknown:true}}};
  const result=buildNatalDisplay(calculation([candidate(),candidate({...base,hour:'壬子'})]),p);
  assert.equal(result.total,6);assert.equal(result.columns[3].unknown,true);assert.deepEqual(result.columns[3].values,[]);
  assert.equal(result.ranges.metal.max,0);assert.equal(result.ranges.water.max,1);
  assert.equal(result.varied,false);assert.match(result.notice,/시주를 제외한 여섯/);
  assert.equal(result.ranges.yin.min+result.ranges.yang.min,6);
});
test('boundary candidates produce count ranges instead of an arbitrary chart',()=>{
  const result=buildNatalDisplay(calculation([candidate(),candidate({...base,day:'己巳'})]),payload);
  assert.equal(result.varied,true);assert.equal(result.columns[2].values.length,2);
  assert.deepEqual(result.ranges.fire,{min:1,max:2});assert.deepEqual(result.ranges.earth,{min:1,max:2});
  assert.deepEqual(result.ranges.yin,{min:4,max:6});
  assert.equal(buildNatalDisplay(calculation([candidate({...base,day:null})]),payload).status,'unavailable');
});
test('interpretation chooses stable detailed traits and separates questionnaire context from calculation',()=>{
  const core=calculation(),before=JSON.stringify(core),self=composeFreeReport(core,payload);
  assert.equal(self.type,null);assert.equal(self.strengths.length,2);assert.equal(self.temperament.sentences.length,2);assert.equal(self.temperament.keywords.length,3);
  assert.ok(self.summary.length>=3&&self.summary.length<=5);assert.equal(self.trap.id,'pressure_sensitivity');assert.match(self.key.text,/일과 공부를 병행/);
  const child=composeFreeReport(core,{...payload,audience:'child',personalization:{focus:{id:'stress'}}});
  assert.match(child.key.text,/아이와/);assert.notEqual(child.summary.at(-1),self.summary.at(-1));
  assert.equal(JSON.stringify(core),before);
  const uncertain=composeFreeReport(calculation([candidate(),candidate(base,{...high,analytical:'LOW',independence:'LOW'})]),payload);
  assert.equal(uncertain.strengths.some(s=>s.id==='analytical'),false);assert.equal(uncertain.temperament,null);
  assert.deepEqual(traitSignals(calculation([candidate(),candidate(base,{...high,planning:'HIGH'})])).planning.levels,['VERY_HIGH','HIGH']);
});
test('existing approved classifier has explicit priorities; no implicit defaults or tied winners',()=>{
  const copy={headline:'문장',description:['첫째.','둘째.','셋째.']};
  const types={a:{name:'A',hanja:'甲',self:copy},b:{name:'B',hanja:'乙',self:copy}};
  const rules=[{typeId:'a',priority:2,all:[{trait:'analytical',levels:['HIGH']}]},{typeId:'b',priority:1,all:[{trait:'analytical',levels:['HIGH']}]}];
  const traits={analytical:{levels:['HIGH']}};
  assert.equal(selectApprovedType(traits,'self'),null);
  assert.equal(selectApprovedType(traits,'self',types,rules).typeId,'a');
  assert.equal(selectApprovedType(traits,'self',types,rules.map(r=>({...r,priority:1}))),null);
  assert.equal(selectApprovedType({analytical:{levels:['HIGH','LOW']}},'self',types,rules),null);
  assert.equal(suppliedStudyType({studyType:{typeId:'a',typeName:'A',hanja:'甲',...copy}}).typeId,'a');
  assert.equal(suppliedStudyType({typeId:'a',typeName:'A',hanja:'甲',headline:'x',description:['too short']}),null);
});
test('share snapshot has only card and public copy fields, no form data or question',()=>{
  const model=composeFreeReport(calculation(),payload);Object.assign(model,{payload,name:'SECRET_NAME',birthDate:payload.learner.birthDate,question:'SECRET_QUESTION'});
  const snapshot=shareSnapshot(model,'female');
  assert.deepEqual(Object.keys(snapshot).sort(),['typeName','headline','hanja','guardianTitle','studyImage','guardianImage'].sort());
  assert.doesNotMatch(JSON.stringify(snapshot),/SECRET|2000|birth|minute|question/);
  assert.equal(snapshot.guardianTitle,'노란 용');
});

class Node {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.hidden=false;this.disabled=false;this.attributes={};this.style={setProperty(){}};this.classList={remove(){},add(){}};this.listeners={};this.value='';}
  set textContent(v){this.value=String(v);this.children=[];}
  get textContent(){return this.value+this.children.map(n=>n.textContent).join('');}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.value='';this.children=nodes;}
  setAttribute(k,v){this.attributes[k]=v;}
  removeAttribute(k){delete this.attributes[k];delete this[k];}
  addEventListener(k,f){this.listeners[k]=f;}
  click(){this.listeners.click?.();}
}
function dom(){
  const nodes=new Map([...readFileSync(new URL('../dist/start.html',import.meta.url),'utf8').matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Node()]));
  globalThis.document={getElementById(id){assert.ok(nodes.has(id),`Unknown HTML id: ${id}`);return nodes.get(id);},createElement:tag=>new Node(tag),querySelectorAll:()=>[]};
  globalThis.window={};return nodes;
}
test('full view renders five ordered sections, both audiences, six-letter table, honest offer and clean reset',()=>{
  const nodes=dom(),shared=[];
  const view=createFreeReportView({createShare:()=>({prepare:s=>shared.push(s),reset(){}})});
  view.render(calculation(),payload,null);
  assert.equal(nodes.get('study-section-title').textContent,'당신의 공부유형은');
  assert.equal(nodes.get('guardian-section-title').textContent,'당신의 수호카드');
  assert.match(nodes.get('study-card-title').textContent,/준비 중/);
  assert.equal(nodes.get('study-strengths').children.length,2);
  assert.equal(nodes.get('combined-insights').children.length,3);
  assert.equal(nodes.get('paid-report-chapters').children.length,10);assert.equal(nodes.get('open-paid-report').disabled,true);
  assert.match(nodes.get('paid-report-price').textContent,/확정 후 안내/);
  assert.equal(nodes.get('element-bars').children.length,5);
  view.render(calculation(),{...payload,audience:'child',learner:{...payload.learner,birthTime:{isUnknown:true}}},null);
  assert.equal(nodes.get('study-section-title').textContent,'우리 아이의 공부유형은');
  assert.equal(nodes.get('guardian-section-title').textContent,'우리 아이의 수호카드');
  assert.match(nodes.get('natal-basis').textContent,/6글자 기준 · 시주 제외/);assert.match(nodes.get('natal-table').textContent,/미상/);
  assert.equal(nodes.get('open-paid-report').textContent,'우리 아이 공부 운명서 펼치기');
  view.reset();assert.equal(nodes.get('combined-insights').textContent,'');assert.equal(nodes.get('natal-table').textContent,'');assert.equal(nodes.get('report-cards').hidden,true);
});
test('image export ignores stale asynchronous results and revokes previous private blobs',async()=>{
  const nodes=dom(),pending=[];const controller=createResultShare({makeBlob:()=>new Promise(resolve=>pending.push(resolve))});
  controller.prepare({});await Promise.resolve();controller.reset();pending[0](new Blob(['old']));await new Promise(setImmediate);
  assert.equal(nodes.get('save-result-image').disabled,true);
  controller.prepare({});await Promise.resolve();pending[1](new Blob(['new']));await new Promise(setImmediate);
  assert.equal(nodes.get('save-result-image').disabled,false);assert.match(nodes.get('result-image-download').href,/^blob:/);
  controller.reset();assert.equal(nodes.get('result-image-download').href,undefined);assert.equal(nodes.get('share-result-image').disabled,true);
});
