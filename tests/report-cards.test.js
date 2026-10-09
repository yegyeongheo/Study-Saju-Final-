import test from 'node:test';
import assert from 'node:assert/strict';
import {dayAnimalCard, resolveDayAnimalCard, cardImageFilename, createReportCards} from '../dist/report-cards.js';

const calculation = days => ({subjects:{learner:{status:'partial',result:{subjects:[
  {subjectId:'learner',candidates:days.map(day=>({pillars:{day},features:{values:{wood:0,water:100}}}))}
]}}}});

test('60 valid day pillars and two genders address 120 distinct cards', () => {
  const keys = new Set(), stems='甲乙丙丁戊己庚辛壬癸', branches='子丑寅卯辰巳午未申酉戌亥';
  for (let i=0;i<60;i++) for (const gender of ['female','male']) keys.add(dayAnimalCard(stems[i%10]+branches[i%12],gender).key);
  assert.equal(keys.size,120);
  assert.equal(dayAnimalCard('甲子','female').key,'wood-rat-female');
  assert.equal(dayAnimalCard('甲子','female').totem,'생명의 가지');
  assert.equal(dayAnimalCard('丁卯','male').key,'fire-rabbit-male');
  assert.equal(dayAnimalCard('戊辰','female').totem,'산 모양 돌');
  assert.equal(dayAnimalCard('辛酉','female').totem,'은빛 거울');
  assert.equal(dayAnimalCard('癸亥','male').totem,'물방울 수정');
});

test('use only learner day stem/branch, preserve uncertainty and reject invalid inputs', () => {
  const value=calculation(['甲子','甲子']);
  value.subjects.guardian=calculation(['壬戌']).subjects.learner;
  const original=JSON.stringify(value), resolved=resolveDayAnimalCard(value,'female');
  assert.equal(resolved.card.key,'wood-rat-female');
  assert.equal(JSON.stringify(value),original);
  assert.equal(resolveDayAnimalCard(calculation(['甲子','乙丑']),'female').status,'ambiguous');
  assert.equal(resolveDayAnimalCard(calculation(['甲子',null]),'female').status,'unavailable');
  assert.equal(resolveDayAnimalCard(calculation([]),'male').status,'unavailable');
  assert.equal(dayAnimalCard('甲丑','female'),null);
  assert.equal(dayAnimalCard('甲子',''),null);
  assert.equal(resolveDayAnimalCard(null,'male').status,'unavailable');
});

test('artwork is registered local artwork only', () => {
  assert.equal(cardImageFilename({'wood-rat-female':'card-day-wood-rat-female.webp'},'wood-rat-female'),'card-day-wood-rat-female.webp');
  for(const file of ['https://example.com/card.webp','../card.png','data:image/png;base64,AA','card.svg']) assert.equal(cardImageFilename({x:file},'x'),null);
  assert.equal(cardImageFilename({},'constructor'),null);
});

test('both slots render, missing artwork stays honest, image failure and reset clear the display', () => {
  const nodes=new Map();globalThis.document={getElementById(id){if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:'',removeAttribute(k){delete this[k]}});return nodes.get(id)}};
  const cards=createReportCards({dayImages:{'wood-rat-female':'day.webp'},studyImages:{'test-type-female':'study.webp'}});
  const payload={audience:'child',learner:{gender:'female'}};
  cards.render(calculation(['甲子']),payload,null);
  assert.equal(nodes.get('day-card-title').textContent,'푸른 쥐');
  assert.equal(nodes.get('study-card-title').textContent,'아이에게 맞는 공부 방식');
  assert.equal(nodes.get('day-card-image').src,'day.webp');
  assert.equal(nodes.get('study-card-image').src,undefined);
  nodes.get('day-card-image').onload();assert.equal(nodes.get('day-card-placeholder').hidden,true);
  cards.render(calculation(['甲子']),payload,{typeName:'검증용 유형',typeId:'test-type'});
  assert.equal(nodes.get('study-card-image').src,'study.webp');
  nodes.get('study-card-image').onerror();assert.equal(nodes.get('study-card-image').hidden,true);
  assert.match(nodes.get('study-card-placeholder').textContent,/불러오지/);
  cards.render(calculation(['甲子','乙丑']),payload,null);assert.equal(nodes.get('day-card-image').src,undefined);
  cards.reset();assert.equal(nodes.get('report-cards').hidden,true);assert.equal(nodes.get('day-card-title').textContent,'');
});
