import {interpretationFacts,selectInterpretation,evidenceParagraph,matchesCondition,TRAIT_NAMES,FEATURE_NAMES} from './interpretation-plan.js';
import {STORIES} from './interpretation-stories.js';
import {makeStoryArc} from './story-arc.js';
const STEM_SYMBOLS={甲:['큰 나무','위를 향해 줄기를 세우는 모습'],乙:['가지와 덩굴','주변과 연결되며 길을 넓히는 모습'],丙:['태양','주위를 넓게 비추는 모습'],丁:['등불','한 곳에 빛을 모으는 모습'],戊:['큰 산','넓은 자리를 지키는 모습'],己:['밭의 흙','작은 생명을 품고 가꾸는 모습'],庚:['단단한 쇠','형태를 분명하게 세우는 모습'],辛:['보석','작은 차이로 빛이 달라지는 모습'],壬:['큰 물','여러 흐름을 한데 받아들이는 모습'],癸:['스며드는 물','틈을 따라 안으로 스며드는 모습']};
const STAGES=['시작','이해','연습','표현·실전','마무리','회복'];
function textFor(text,payload){return text.replaceAll('@who은',payload.audience==='child'?'이 아이는':'당신은').replaceAll('@who',payload.audience==='child'?'이 아이':'당신').replaceAll('@own',payload.audience==='child'?'아이':'당신');}
function fallbackRules(strengths){
 return strengths.map(s=>({id:`single-${s.id}`,when:[[s.id,'high']],thesis:`${s.keyword}에서 배움의 출발점을 찾습니다`,strong:[s.id],stages:['이해','연습'],
 opening:`@who의 배움에서는 ‘${s.keyword}’이 먼저 눈에 들어옵니다. ${s.summary} 이 특성을 실제로 쓸 수 있는 과제와 순서를 마련하는 것이 공부의 출발점입니다.`,
 mechanism:`이 성향을 살리려면 강점이 쓰이는 과정과 결과를 구분해 살펴야 합니다. ${s.scene} 그 과정에서 무엇을 이해했고 무엇이 남았는지 확인하면 다음 연습의 목적이 분명해집니다.`,
 scene:'익숙한 과제를 한 번 해 본 뒤, 새 과제에서도 같은 방법을 적용해 보는 장면을 떠올려 보세요. 편했던 단계와 도움이 필요했던 단계를 나누어 보면 이 강점을 어디까지 활용할지 구체적으로 정할 수 있습니다.',
 trap:'강점을 쓴다는 이유로 익숙한 방법만 반복하지 않도록 점검하세요. 배운 내용을 다른 과제에도 적용할 수 있는지 확인하는 과정이 필요합니다.',
 action:'오늘 배운 개념 하나를 고르고 익숙한 예제와 조건이 다른 예제를 차례로 다루세요. 같은 방법이 통하는 부분과 바꿔야 하는 부분을 한 줄씩 남기세요.',childAction:'익숙한 활동 하나와 조건이 조금 다른 활동 하나를 함께 해 주세요. 아이에게 무엇은 같고 무엇은 달라졌는지 물어보며 적용하는 과정을 살펴보세요.',observe:'맞힌 개수와 별개로 새로운 과제에서도 스스로 이어 간 단계가 있는지 확인하세요.'}));
}
function expressionNote(plan){
 const relevant=plan.expression.filter(x=>x.state&&x.state!=='NORMAL');
 if(!relevant.length)return null;
 const states=[...new Set(relevant.map(x=>x.state))];
 const labels=relevant.map(x=>TRAIT_NAMES[x.traitId]).filter(Boolean).join('·');
 if(states.length>1)return `${labels}은 같은 세기로 겉에 드러나지 않습니다. 마음속에서 중요하게 여기는 것과 실제로 행동에 옮기는 모습을 함께 살펴야 합니다. 의욕을 말하는 순간보다 처음 시도하고 도움을 요청하는 순간에 어떤 방식이 편한지 살펴보세요.`;
 const copy={SUPPRESSED:'마음속에 자리해도 행동에서는 눌려 나타납니다. 혼자 결정하고 싶은 마음이 곧바로 자신 있는 행동으로 이어진다고 읽어서는 흐름을 놓칩니다. 먼저 작은 선택을 해 본 뒤 결과를 확인할 자리가 필요합니다.',SOFTENED:'겉으로는 부드럽게 드러납니다. 자기 의견을 지키더라도 주변과 조율하는 통로가 있으므로, 큰 반응이 없다는 이유로 속마음의 기준까지 약하다고 읽지 않는 것이 중요합니다.',AMPLIFIED:'겉으로 더 선명하게 드러납니다. 특히 자신의 방식이나 결과가 걸린 순간에는 반응의 크기가 커집니다. 행동을 바로 고치기 전에 무엇이 건드려졌는지 짚어 주어야 대화가 배움으로 돌아옵니다.',CONTEXT_DEPENDENT:'상황에 따라 드러나는 모습이 달라집니다. 익숙한 과제와 낯선 과제를 나누어 보고, 혼자일 때와 함께할 때의 차이를 살피면 편안하게 힘을 쓰는 조건이 드러납니다.'};
 return `${labels}은 ${copy[states[0]]}`;
}
function sourceNote(plan,facts){
 const evidence=evidenceParagraph(plan);if(!evidence)return null;
 const details=plan.evidence.flatMap(e=>e.support);
 const names=[...new Set(details.map(e=>FEATURE_NAMES[e.featureId?.split('.')[0]]).filter(Boolean))].slice(0,3);
 const note=plan.expression.some(x=>x.state&&x.state!=='NORMAL')?' 여기에 기질이 겉으로 드러나는 양상까지 함께 읽었습니다.':'';
 // Describe model provenance as interpretation, never as observed learning ability.
 const structures=[];
 for(const e of details){const key=e.featureId?.split('.')[0],label=FEATURE_NAMES[key];if(!label||structures.length)continue;
  const inMonth=facts.details[`details.tenGods.${key}.inMonth`]===true,exposed=facts.details[`details.tenGods.${key}.exposed`]===true,rooted=facts.details[`details.tenGods.${key}.rooted`]===true;
  if(inMonth)structures.push(`${label}은 월지에도 자리하여 이 기질을 읽는 배경이 됩니다.`);
  else if(exposed&&rooted)structures.push(`${label}이 천간에 드러나고 지지에도 뿌리를 두는 배치를 함께 읽었습니다.`);
 }
 return `원국의 ${names.join('·')}이 함께 작용하는 관계를 공부의 관점에서 읽은 해석입니다. ${structures.join(' ')}${note}`.trim();
}
function contextNote(payload){
 const child=payload.audience==='child',focus=payload.personalization?.focus?.id,env=payload.personalization?.environment?.id;
 const focusText={stress:'공부 부담을 고민으로 골랐으므로, 아래 방법은 결과를 재촉하기보다 다시 시도할 여유를 만드는 데 적용해 주세요.',concentration:'집중에 대한 고민은 이 해석과 함께 살펴볼 현재의 상황입니다. 시작부터 어려운지, 반복할 때 흐름이 끊기는지를 나누어 관찰해 주세요.','study-habit':'습관을 고민으로 골랐으므로, 여러 방법을 한꺼번에 바꾸기보다 아래 방법을 한 과제에 일관되게 적용해 보세요.',progress:'노력에 비해 성적이 오르지 않는다는 답변은 현재의 고민입니다. 해석에서 읽은 기질과 별개로, 개념 이해·연습·실전 중 어느 단계에서 결과가 달라지는지 함께 살펴주세요.',motivation:'의욕에 대한 고민은 현재의 상황으로 함께 살펴봅니다. 과제의 의미, 시작의 부담, 결과를 확인하는 간격 중 무엇을 바꿀 때 참여가 달라지는지 확인해 주세요.'};
 const envText={'work-study':'일과 공부를 병행한다고 답했으므로, 아래 활동을 한 번에 끝낼 작은 단위로 잡으세요. 확보한 시간의 크기는 타고난 기질과 별개로 계획에 반영해야 합니다.','not-started':'아직 공부를 시작하기 전이라고 답했으므로, 아래 방법을 첫 예제 하나에 적용해 보세요. 시작 전에 실제 습관까지 정해져 있다고 가정할 필요는 없습니다.','high-competition':'교육열이 높은 환경이라고 답했으므로, 다른 사람의 진도보다 같은 과제에서 달라진 과정을 먼저 비교해 주세요.'};
 return envText[env]||(child?focusText[focus]:null)||null;
}
function ageScene(rule,payload){
 if(payload.learner?.ageBand!=='preschool')return rule.scene;
 const scenes={
 'understand-before-start':'그림책을 읽다가 “왜?”라는 질문에 오래 머무는 장면이라면, 설명을 더하기 전에 블록이나 그림으로 한 번 표현하게 해 주세요. 직접 해 본 뒤 생긴 질문을 다시 이야기하면 이해와 시도가 만납니다.',
 'depth-before-start':'한 가지 놀이를 오래 바라보는 장면이라면 완성된 결과를 기다리지 말고, 블록 하나를 놓거나 그림 한 부분을 그리는 첫 시도를 함께 해 주세요. 그 작은 결과에서 다음 생각을 이어 갈 수 있습니다.',
 'exploration-needs-variation':'같은 그림책을 다시 읽을 때 오늘은 등장인물의 마음을, 다음에는 다른 결말을 이야기해 보세요. 책을 계속 바꾸지 않아도 같은 이야기 안에서 발견할 것을 달리하면 반복에 목적이 생깁니다.'};
 return scenes[rule.id]||'그림책·블록·역할놀이처럼 아이가 익숙한 활동에서 먼저 살펴보세요. 오늘 해 볼 것 하나를 함께 정하고, 아이가 고른 방법으로 표현하게 한 뒤 다음 시도에서 무엇을 바꾸고 싶은지 들어 주세요.';
}
const preschoolActions={
 'understand-before-start':['궁금한 내용을 블록이나 그림으로 먼저 한 번 표현하게 해 주세요. 해 보다가 생긴 질문 하나를 함께 찾아보고 같은 활동을 다시 이어 주세요.','설명을 들은 시간보다 첫 시도를 했는지, 해 본 뒤 질문이 달라졌는지를 살펴보세요.'],
 'depth-before-start':['완성된 생각을 기다리기보다 그림 한 부분이나 블록 하나부터 함께 시작해 주세요. 만든 것을 보며 다음에 더하고 싶은 부분을 골라 주세요.','처음 만든 것에 아이의 생각이 어떻게 더해지는지 살펴보세요.'],
 'autonomy-with-boundaries':['두 가지 놀이 중 하나를 고르게 하고 언제 마칠지 먼저 알려 주세요. 만드는 순서와 재료는 아이가 고르도록 도와주세요.','선택권과 끝나는 기준을 함께 주었을 때 시작이 편해지는지 살펴보세요.'],
 'exploration-needs-variation':['같은 이야기를 읽고, 그림으로 표현하고, 다른 결말로 이야기해 보세요. 매번 새 책을 꺼내기보다 익숙한 내용에서 발견할 것을 바꿔 주세요.','같은 내용으로 다시 돌아와도 스스로 찾아내는 것이 있는지 살펴보세요.'],
 'achievement-under-pressure':['맞고 틀림을 바로 평가하기보다 한 번 더 만들어 보게 해 주세요. 처음과 달라진 부분을 아이가 직접 찾게 하고, 완성한 뒤 충분히 마무리할 시간을 주세요.','실수한 뒤 활동을 다시 해 보려는 모습이 생기는지 살펴보세요.'],
 'analysis-with-intuition':['그림책의 다음 장면을 먼저 예상하게 하고, 어떤 그림을 보고 그렇게 생각했는지 물어보세요. 다음 장을 본 뒤 생각을 바꿔도 괜찮은 자리를 주세요.','맞혔는지보다 예상의 이유를 표현하고 새 장면을 받아들이는 과정을 살펴보세요.'],
 'analysis-with-planning':['블록이나 그림 활동을 두세 단계로 함께 나눠 주세요. 직접 해 보며 순서를 바꿔야 하는 부분을 아이와 찾아보세요.','정한 순서가 실제 활동에서 어떻게 쓰이는지 살펴보세요.'],
 'quick-start-slow-finish':['놀이를 마칠 때 다음에 이어 만들 부분 하나를 아이가 고르게 해 주세요. 다음 활동은 그 부분에서 시작해 주세요.','새로운 놀이를 시작한 횟수보다 전에 하던 놀이로 돌아와 이어 간 모습을 살펴보세요.']
};
function qualify(rule,facts,payload){
 const candidates=[
 {ids:['autonomy-with-boundaries','autonomy-and-interference'],when:['planning','high'],text:'자기 방식을 고르는 힘에 순서를 설계하는 성향도 함께 보입니다. 따라서 자율성을 즉흥적으로 하는 모습과 같게 읽을 필요는 없습니다. 스스로 정한 순서를 유지할 수 있도록, 계획을 세우는 단계부터 참여할 자리를 마련해 주세요.'},
 {ids:['exploration-needs-variation'],when:['persistence','high'],text:'한편 장기 목표를 이어 가는 힘은 함께 나타납니다. 같은 형식에 지루해하는 모습과 목표를 쉽게 포기하는 모습을 구분해야 합니다. 목표를 유지하면서 연습 형식을 바꾸는 방향이 이 차이에 맞습니다.'},
 {ids:['achievement-under-pressure','achievement-and-evaluation'],when:['failure_resilience','high'],text:'부담을 느끼는 모습과 실패 뒤 돌아오는 힘은 별개입니다. 이 원국에서는 다시 시도하는 성향도 함께 읽히므로, 긴장하는 순간 이후에 다시 시도하는 힘까지 함께 살펴야 합니다. 다시 돌아왔을 때 무엇부터 할지 마련하는 데 도움의 초점을 두세요.'}
 ];
 return candidates.find(x=>x.ids.includes(rule.id)&&matchesCondition(facts,x.when))||null;
}
export function buildInterpretation(calculation,payload,blocks={}){
 const facts=interpretationFacts(calculation,payload);
 const rules=[...STORIES,...fallbackRules(blocks.strengths||[])];
 const plan=selectInterpretation(facts,rules),r=plan.rule;
 const day=facts.pillars.day,symbol=STEM_SYMBOLS[day?.[0]];
 const guardian=symbol?[`${day} 일주의 일간 ${day[0]}은 ${symbol[0]}의 상징을 지닙니다. ${symbol[1]}이 수호카드의 바탕입니다.`, '이 카드는 타고난 기질을 떠올리는 첫 장면입니다. 아래에서는 원국의 다른 요소와 함께 읽으며, 그 기질이 배움 속에서 어떤 방식으로 움직이는지 살펴봅니다.']:[];
 if(!r)return {plan,guardian,keywords:symbol?[symbol[0],'기질','배움']:[],summary:[],headline:null,insights:[],source:null};
 const opening=textFor(r.opening,payload),mechanism=textFor(r.mechanism,payload),expression=expressionNote(plan);
 const primary=r.when.map(([id])=>id),counter=[];
 // Preserve contrary and boundary data internally; do not turn negative coefficients into unsupported behavior claims.
 for(const id of primary)counter.push(...facts.traits[id].counter.map(e=>({traitId:id,...e})));
 plan.counterEvidence=counter;
 plan.natalContext={pillars:facts.pillars,features:facts.features,details:facts.details};
 plan.phaseCoverage=Object.fromEntries(STAGES.map(s=>[s,r.stages.some(x=>s.includes(x))]));
 plan.context={environment:payload.personalization?.environment?.id||null,focus:payload.personalization?.focus?.id||null,source:'questionnaire'};
 plan.layers={need:r.thesis,processing:r.mechanism,behavior:ageScene(r,payload),outcomeConditions:r.trap};
 plan.strategy={cause:r.id,action:payload.audience==='child'?r.childAction:r.action,observe:r.observe};
 const qualifier=qualify(r,facts,payload);
 plan.qualifier=qualifier?{condition:qualifier.when,effect:qualifier.text}:null;
 const summary=[opening,mechanism,...(expression?[expression]:[]),...(qualifier?[qualifier.text]:[])];
 const scene=ageScene(r,payload),context=contextNote(payload);
 if(payload.learner?.ageBand==='preschool'){
  const adapted=preschoolActions[r.id]||['익숙한 놀이 하나를 고르고, 아이가 선택한 방법으로 작은 결과를 만들게 해 주세요. 완성한 뒤 다음에 바꾸고 싶은 부분을 하나만 함께 이야기해 주세요.','정답 수보다 스스로 시작한 행동과 다시 시도한 장면을 살펴보세요.'];
  plan.strategy.action=adapted[0];plan.strategy.observe=adapted[1];
 }

 const insights=[
 {label:'배움이 움직이는 장면',title:r.stages.join(' → '),paragraphs:[scene]},
 {label:'흐름이 막히는 지점',title:'강점을 쓰는 조건을 바꿔 보세요',paragraphs:[r.trap]},
 {label:payload.audience==='child'?'아이를 돕는 방법':'나에게 맞는 실천',title:payload.audience==='child'?'다음 활동에서 이렇게 도와주세요':'다음 공부에서 이렇게 시작하세요',paragraphs:[plan.strategy.action,...(context?[context]:[]),plan.strategy.observe]}
 ];
 const full=[...summary,...insights.flatMap(x=>x.paragraphs)];
 plan.quality={uniqueParagraphs:new Set(full).size===full.length,strategyLinked:plan.strategy.cause===r.id,conditionsSupported:r.when.every(([id])=>!!facts.traits[id])};
 const story=makeStoryArc({rule:r,opening,mechanism,scene,expression,qualifier,context,action:plan.strategy.action,observe:plan.strategy.observe,payload});
 return {plan,story,guardian,keywords:symbol?[symbol[0],'기질','배움']:[],summary,headline:r.thesis,insights,source:sourceNote(plan,facts),strengthOrder:r.strong};
}
