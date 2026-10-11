import {learnerResult,pillarInfo} from './natal-display.js';
const LEVELS=['VERY_LOW','LOW','MID','HIGH','VERY_HIGH'];
const STATES=['NORMAL','AMPLIFIED','SOFTENED','SUPPRESSED','CONTEXT_DEPENDENT'];
export const FEATURE_NAMES={bijian:'비견',jiecai:'겁재',shishen:'식신',shangguan:'상관',piancai:'편재',zhengcai:'정재',qisha:'편관',zhengguan:'정관',pianyin:'편인',zhengyin:'정인',resource:'인성',output:'식상',wealth:'재성',authority:'관성',peer:'비겁',wood:'목',fire:'화',earth:'토',metal:'금',water:'수',yangRatio:'음양 구성',rootedness:'통근',dmStrength:'일간의 강약',resourceOutput:'인성과 식상의 관계',gwaninHarmony:'관성과 인성의 관계',outputToWealth:'식상과 재성의 관계',qishaControlled:'편관의 제화',qishaUncontrolled:'편관의 제화 조건',clashCount:'지지의 충',flowRatio:'오행의 흐름',elementConcentration:'오행의 집중'};
export const TRAIT_NAMES={meaning_seeking:'의미를 납득하려는 마음',depth_orientation:'깊이 파고드는 성향',execution_speed:'행동으로 옮기는 속도',independence:'자기 판단을 지키려는 마음',uncertainty_tolerance:'불확실함을 견디는 성향',exploration:'새로운 관점을 찾는 성향',repetition_tolerance:'반복을 이어 가는 성향',achievement:'성과를 이루려는 마음',pressure_sensitivity:'압박에 민감한 성향',evaluation_sensitivity:'평가를 의식하는 성향',planning:'순서를 설계하는 성향',adaptive_flexibility:'방법을 바꾸는 유연함',verbal_expression:'말과 글로 펼치는 성향',analytical:'구조를 나누어 살피는 성향',intuitive:'전체 흐름을 먼저 보는 성향',control_sensitivity:'세부 간섭에 민감한 성향',mastery:'실력 향상에서 얻는 동기',persistence:'배움을 이어 가는 성향',self_direction:'스스로 시작하는 성향',failure_resilience:'실패 뒤 다시 시도하는 성향',collaboration:'함께 배우는 성향',immediate_reward:'빠른 피드백에 반응하는 성향'};
export function interpretationFacts(calculation,payload={}){
 const cs=learnerResult(calculation)?.candidates||[];
 const traits={};
 for(const id of Object.keys(cs[0]?.traits||{})){
  const ts=cs.map(c=>c.traits?.[id]);
  if(ts.some(t=>!LEVELS.includes(t?.level)))continue;
  const stateValues=ts.map(t=>t.manifestation?.state);
  const state=stateValues.every(s=>s===stateValues[0]&&STATES.includes(s))?stateValues[0]:null;
  const evidence=cs.map((c,i)=>{
   const refs=new Set(ts[i].evidenceRefs||[]);
   return (c.evidence||[]).filter(e=>refs.has(e.id)).map(e=>({id:e.id,featureId:e.featureId,role:e.role,sourceValue:e.sourceValue,contribution:e.contribution,ruleId:e.ruleId,modifier:e.modifier||[]}));
  });
  const common=evidence[0]?.filter(e=>evidence.every(es=>es.some(x=>x.featureId===e.featureId&&x.role===e.role&&typeof x.contribution==='number'&&Math.sign(x.contribution)===Math.sign(e.contribution))))||[];
  traits[id]={levels:ts.map(t=>t.level),state,stateValues,evidence,evidenceStrength:ts.every(t=>t.evidenceStrength==='STRONG')?'STRONG':null,
   support:common.filter(e=>e.contribution>0),counter:common.filter(e=>e.contribution<0)};
 }
 const common=(read)=>{const vs=cs.map(read);return vs.length&&vs.every(v=>v!==undefined&&v!==null&&JSON.stringify(v)===JSON.stringify(vs[0]))?vs[0]:null;};
 const unknown=payload.learner?.birthTime?.isUnknown||payload.learner?.birthTime?.period==='unknown';
 const pillars=Object.fromEntries(['year','month','day',...(!unknown?['hour']:[])].map(k=>[k,common(c=>c.pillars?.[k])]).filter(([,v])=>pillarInfo(v)));
 const details={};
 for(const key of ['bijian','jiecai','shishen','shangguan','piancai','zhengcai','qisha','zhengguan','pianyin','zhengyin'])for(const suffix of ['inMonth','rooted','exposed','branchMain']){
  const id=`details.tenGods.${key}.${suffix}`;
  const value=common(c=>c.features?.featureDetails?.find(d=>d.id===id)?.value);
  if(value!==null)details[id]=value;
 }
 const features={};
 for(const key of ['dayMaster','dmStrength','rootedness','dominantElement','flowRatio','chainLength']){
  const v=common(c=>c.features?.values?.[key]);if(v!==null)features[key]=v;
 }
 return {traits,pillars,features,details,candidateCount:cs.length,unknownHour:!!unknown,
  coverage:{traits:Object.keys(traits).length,evidence:cs.some(c=>c.evidence?.length>0),features:cs.some(c=>c.features?.values),manifestation:Object.values(traits).some(t=>t.state),scope:'natal'}};
}
export function matchesCondition(facts,[id,band]){
 const t=facts.traits[id];return !!t&&t.levels.every(l=>(band==='high'?['HIGH','VERY_HIGH']:['LOW','VERY_LOW']).includes(l));
}
// These are editorial combinations of existing Trait levels, not new natal scores or type IDs.
export function selectInterpretation(facts,rules){
 const ranked=rules.filter(r=>r.when.every(c=>matchesCondition(facts,c))).map((r,index)=>({r,index,
  direct:r.when.filter(([id])=>facts.traits[id].evidenceStrength==='STRONG').length,
  distinct:new Set(r.when.flatMap(([id])=>facts.traits[id].support.map(e=>e.featureId))).size
 })).sort((a,b)=>b.r.when.length-a.r.when.length||b.direct-a.direct||b.distinct-a.distinct||a.index-b.index);
 const selected=ranked[0]?.r||null;
 const refs=selected?.when.map(([id,band])=>({id,band,...facts.traits[id]}))||[];
 return {version:'interpretation-2',selected: selected?.id||null,conditions:selected?.when||[],
  thesis:selected?.thesis||null,evidence:refs.map(t=>({traitId:t.id,support:t.support,counter:t.counter,refs:t.evidence.flat().map(e=>e.id)})),
  expression:refs.map(t=>({traitId:t.id,state:t.state})),alternatives:ranked.slice(1).map(x=>x.r.id),
  coverage:facts.coverage,rule:selected};
}
export function evidenceParagraph(plan){
 const names=[];
 for(const e of plan.evidence)for(const s of e.support){const key=s.featureId?.split('.')[0],n=FEATURE_NAMES[key];if(n&&!names.includes(n))names.push(n);}
 if(!names.length)return null;
 const traits=plan.conditions.map(([id])=>TRAIT_NAMES[id]).filter(Boolean);
 return `이 해석은 원국의 ${names.slice(0,3).join('·')}이 학습 기질에 함께 작용하는 관계에서 출발합니다. 그 관계를 공부의 관점에서 읽으면 ${traits.join('과 ')}이 함께 드러납니다. 각각을 따로 설명하기보다, 두 힘이 실제 과제를 만났을 때 어떤 순서로 움직이는지 살펴보는 것이 중요합니다.`;
}
