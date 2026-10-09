import {learnerResult,buildNatalDisplay} from './natal-display.js';
import {resolveDayAnimalCard} from './report-cards.js';
import {selectApprovedType} from './study-type-rules.js';
import {STRENGTH_BLOCKS,TRAP_BLOCKS,TEMPERAMENT_BLOCKS,contextualKey} from './interpretation-blocks.js';
const VALID_LEVELS=['VERY_LOW','LOW','MID','HIGH','VERY_HIGH'];
export function traitSignals(calculation) {
  const learner=learnerResult(calculation),candidates=learner?.candidates;
  if (!Array.isArray(candidates)||!candidates.length)return {};
  const ids=Object.keys(candidates[0]?.traits||{}),out={};
  for(const id of ids){
    const levels=candidates.map(c=>c?.traits?.[id]?.level);
    if(levels.some(level=>!VALID_LEVELS.includes(level)))continue;
    const unique=[...new Set(levels)];
    out[id]={levels:unique,level:unique.length===1?unique[0]:learner.summary?.traits?.[id]?.level||null};
  }
  return out;
}
const matches=(block,traits)=>traits[block.id]?.levels.every(level=>(block.band==='high'?['HIGH','VERY_HIGH']:['LOW','VERY_LOW']).includes(level));
const safeText=(value,max=600)=>typeof value==='string'&&value.trim()&&value.length<=max?value.trim():null;
export function suppliedStudyType(report) {
  const src=report?.studyType || report;
  if(!src || !/^[a-z][a-z0-9-]{0,63}$/.test(src.typeId||''))return null;
  const typeName=safeText(src.typeName,80),headline=safeText(src.headline,200),hanja=safeText(src.hanja,40);
  const description=src.description;
  if(!typeName||!headline||!hanja||!Array.isArray(description)||description.length<3||description.length>4||description.some(s=>!safeText(s)))return null;
  return {typeId:src.typeId,typeName,headline,hanja,description:[...description]};
}
export function composeFreeReport(calculation,payload,provided=null) {
  const audience=payload.audience==='child'?'child':'self',child=audience==='child',traits=traitSignals(calculation);
  const type=suppliedStudyType(provided)||selectApprovedType(traits,audience);
  const strengths=STRENGTH_BLOCKS.filter(b=>matches(b,traits)).slice(0,2);
  const focus=payload.personalization?.focus?.id;
  const traps=TRAP_BLOCKS.filter(b=>matches(b,traits));
  const trap=traps.find(b=>b.focus.includes(focus))||traps[0]||null;
  const temperament=TEMPERAMENT_BLOCKS.find(b=>matches(b,traits))||null;
  const key=contextualKey(payload,trap);
  const weapon=strengths[0]||null;
  const summary=[];
  if(type)summary.push(`${child?'아이의':'당신의'} ${type.typeName}은 공부를 이해하는 하나의 출발점이에요.`);
  if(weapon&&temperament)summary.push(`${child?'아이의':'당신의'} ‘${weapon.keyword}’과 ‘${temperament.keywords[0]}’ 기질을 함께 살펴보면, 익숙한 강점을 편안하게 쓸 수 있는 공부 조건을 찾는 실마리가 돼요.`);
  else if(weapon)summary.push(`${child?'아이가':'내가'} ‘${weapon.keyword}’을 자연스럽게 쓰는 과제에서 수월했던 경험을 찾아 다음 공부의 시작점으로 삼아 보세요.`);
  if(temperament)summary.push(temperament.bridge);
  if(trap)summary.push(trap.bridge);
  if(summary.length)summary.push(`${child?'아이에게 맞는 도움은':'나에게 맞는 변화는'} 강점을 더 쓰게 하고, 막히는 순간의 부담을 한 가지 줄이는 데서 시작해 보세요.`);
  const guardian=resolveDayAnimalCard(calculation,payload.learner?.gender);
  return {audience,type,strengths,trap,temperament,key,weapon,summary:summary.slice(0,5),guardian,natal:buildNatalDisplay(calculation,payload),
    evidence:{strengths:strengths.map(b=>b.id),trap:trap?.id||null,temperament:temperament?.id||null},
    purchaseLead:weapon?`${child?'아이의':'나의'} ‘${weapon.keyword}’을 실제 공부에 어떻게 이어 갈까요? 집중이 끊기는 순간부터 복습과 회복까지, 더 구체적인 실행 방법을 살펴보세요.`:'성향을 이해한 다음에는 일상에서 적용할 방법이 필요해요. 공부의 시작부터 회복까지, 다음 실천을 위한 안내를 준비하고 있어요.'};
}
