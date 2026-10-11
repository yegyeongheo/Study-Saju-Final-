import {learnerResult,buildNatalDisplay} from './natal-display.js';
import {resolveDayAnimalCard} from './report-cards.js';
import {selectApprovedType} from './study-type-rules.js';
import {STRENGTH_BLOCKS,TRAP_BLOCKS,TEMPERAMENT_BLOCKS,contextualKey} from './interpretation-blocks.js';
import {buildInterpretation} from './interpretation-writer.js';
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
  return {typeId:src.typeId,typeName,headline,hanja,description:[...description],pain:safeText(src.pain),hook:safeText(src.hook)};
}
export function composeFreeReport(calculation,payload,provided=null) {
  const audience=payload.audience==='child'?'child':'self',child=audience==='child',traits=traitSignals(calculation);
  const serverType=calculation?.subjects?.learner?.studySaju;
  const type=(serverType?.status==='ready'&&serverType.audience===audience?suppliedStudyType(serverType):null)||suppliedStudyType(provided)||selectApprovedType(traits,audience);
  const allStrengths=STRENGTH_BLOCKS.filter(b=>matches(b,traits));
  const interpretation=buildInterpretation(calculation,payload,{strengths:allStrengths});
  const order=interpretation.strengthOrder||[];
  const rank=id=>order.includes(id)?order.indexOf(id):order.length;
  const strengths=[...allStrengths].sort((a,b)=>rank(a.id)-rank(b.id)).slice(0,2);
  const focus=payload.personalization?.focus?.id;
  const traps=TRAP_BLOCKS.filter(b=>matches(b,traits));
  const trap=traps.find(b=>b.focus.includes(focus))||traps[0]||(type?.pain?{id:`${type.typeId}-pain`,keyword:'공부가 막히는 지점',scene:type.pain,bridge:type.pain}:null);
  const temperament=TEMPERAMENT_BLOCKS.find(b=>matches(b,traits))||null;
  const key=contextualKey(payload,trap?.[audience]?trap:null);
  const weapon=strengths[0]||null;
  const summary=interpretation.summary;
  const guardian=resolveDayAnimalCard(calculation,payload.learner?.gender);
  return {audience,type,strengths,trap,temperament,key,weapon,summary,interpretation,guardianDescription:interpretation.guardian,guardianKeywords:interpretation.keywords,guardian,natal:buildNatalDisplay(calculation,payload),
    evidence:{strengths:strengths.map(b=>b.id),trap:trap?.id||null,temperament:temperament?.id||null},
    purchaseLead:type?.hook?`${type.hook}. ${child?'아이의':'나의'} 현재 공부 환경과 고민을 함께 놓고, 10장 운명서에서 구체적인 실천으로 이어갈 예정이에요.`:(weapon?`${child?'아이의':'나의'} ‘${weapon.keyword}’을 실제 공부에 어떻게 이어 갈까요? 집중이 끊기는 순간부터 복습과 회복까지, 더 구체적인 실행 방법을 살펴보세요.`:'성향을 이해한 다음에는 일상에서 적용할 방법이 필요해요. 공부의 시작부터 회복까지, 다음 실천을 위한 안내를 준비하고 있어요.')};
}
