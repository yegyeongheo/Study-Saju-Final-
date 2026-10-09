// Editorial interpretation blocks, not core formulas, diagnoses, or measured abilities.
// Each block requires the named Trait to be high/low in ALL candidate charts.
export const STRENGTH_BLOCKS=[
 {id:'analytical',band:'high',keyword:'조건을 나누는 힘',scene:'문제에서 주어진 조건과 구할 것을 따로 적고, 어느 조건부터 써야 할지 연결해 봅니다.',summary:'복잡한 내용을 작은 단위로 나눠 볼 때 배운 것을 자기 방식으로 정리할 수 있어요.'},
 {id:'planning',band:'high',keyword:'순서를 설계하는 힘',scene:'공부할 분량을 본 뒤 개념 확인, 연습, 오답 정리의 순서를 정하고 시작합니다.',summary:'다음에 무엇을 할지 보이는 공부에서 시작과 마무리의 흐름을 만들기 쉬워요.'},
 {id:'persistence',band:'high',keyword:'한 걸음 더 이어가기',scene:'바로 풀리지 않은 문제에 표시를 남기고, 다음 공부 시간에 다시 돌아와 시도합니다.',summary:'한 번의 속도보다 다시 돌아오는 반복이 공부의 자산이 될 수 있어요.'},
 {id:'exploration',band:'high',keyword:'새로운 연결 찾기',scene:'배운 개념이 다른 문제나 생활 속 장면에도 적용되는지 예시를 바꿔 확인합니다.',summary:'이미 아는 것과 새로운 내용을 연결하는 시간이 이해의 폭을 넓혀 줄 수 있어요.'},
 {id:'verbal_expression',band:'high',keyword:'설명하며 정리하기',scene:'풀이를 소리 내어 설명하다가 말이 막히는 부분을 찾아 개념을 다시 확인합니다.',summary:'생각을 밖으로 꺼내는 과정이 이해한 부분과 더 살펴볼 부분을 구분해 줄 수 있어요.'},
 {id:'execution_speed',band:'high',keyword:'일단 시도하는 추진력',scene:'새 문제를 만나면 첫 식이나 초안을 적어 보고, 풀어 가며 방법을 고칩니다.',summary:'첫 시도를 빨리 만드는 힘을 짧은 확인 절차와 연결하면 공부 흐름을 살릴 수 있어요.'},
 {id:'mastery',band:'high',keyword:'어제보다 나아지기',scene:'정답 개수뿐 아니라 전보다 설명이 쉬워졌는지, 도움 없이 풀 수 있는지를 확인합니다.',summary:'실력이 조금씩 달라지는 지점을 알아차릴 때 공부를 이어 갈 이유가 생길 수 있어요.'},
 {id:'meaning_seeking',band:'high',keyword:'이유를 붙잡는 이해',scene:'공식을 외우기 전에 왜 이 방법을 쓰는지 묻고, 한 가지 예제로 이유를 확인합니다.',summary:'공부의 이유를 납득하는 시간이 생기면 연습 문제에도 스스로 의미를 연결할 수 있어요.'},
 {id:'self_direction',band:'high',keyword:'스스로 여는 첫 장',scene:'해야 할 과제를 보고 먼저 끝낼 작은 목표를 정한 뒤 자료를 꺼내 시작합니다.',summary:'시작할 일을 직접 정할 수 있을 때 공부의 주도권을 느끼기 쉬워요.'},
 {id:'collaboration',band:'high',keyword:'함께 풀어 보는 힘',scene:'각자 푼 방법을 비교하고, 다른 사람이 놓친 조건을 서로 설명하면서 이해를 보완합니다.',summary:'혼자 정리한 것을 함께 확인하는 과정이 새로운 관점을 더해 줄 수 있어요.'},
 {id:'intuitive',band:'high',keyword:'전체 그림 먼저 보기',scene:'단원 제목과 예시를 훑어 큰 흐름을 잡고, 예상한 방식이 맞는지 문제에서 확인합니다.',summary:'먼저 전체 지도를 그린 뒤 근거를 채워 넣는 순서가 이해를 돕는 단서가 될 수 있어요.'},
 {id:'repetition_tolerance',band:'high',keyword:'반복을 쌓는 힘',scene:'비슷한 문제를 다시 풀면서 매번 달라지는 조건을 표시해 실수의 패턴을 찾아갑니다.',summary:'익숙한 연습 속 작은 차이를 찾는 과정이 복습의 밀도를 높여 줄 수 있어요.'}
];
export const TRAP_BLOCKS=[
 {id:'pressure_sensitivity',band:'high',focus:['stress'],keyword:'평가가 다가올 때',scene:'시험 시간이 가까워지면 알고 있는 내용도 자꾸 다시 확인하고, 첫 문제를 시작하기까지 오래 머물 수 있어요.',bridge:'평가를 의식하는 순간에는 준비한 만큼 드러내지 못한다고 느낄 수 있어요.',self:'오늘은 시간 제한을 빼고 한 문제를 푼 뒤, 같은 유형 한 문제에만 짧은 제한 시간을 붙여 보세요.',child:'오늘은 시간 제한 없이 한 문제를 풀게 한 뒤, 아이와 합의한 한 문제에만 짧은 제한 시간을 붙여 주세요.'},
 {id:'control_sensitivity',band:'high',focus:['study-habit','motivation'],keyword:'방법을 정해 줄 때',scene:'풀어 볼 순서까지 누군가 정해 주면 과제보다 지시 방식에 신경이 쓰여 시작을 미룰 수 있어요.',bridge:'도움이 세부 지시로 느껴지는 상황에서는 원래의 추진력도 약해질 수 있어요.',self:'오늘 할 과제 두 개 중 시작할 것을 직접 고르고, 끝나는 기준 한 가지만 적어 두세요.',child:'“이것부터 해” 대신 과제 두 개를 보여 주고 시작할 것을 고르게 해 주세요. 끝나는 기준만 함께 정해 보세요.'},
 {id:'immediate_reward',band:'high',focus:['motivation','progress'],keyword:'변화가 바로 안 보일 때',scene:'공부한 만큼 달라졌다는 신호가 없으면 다른 과제로 옮겨 가거나 공부를 멈추고 싶어질 수 있어요.',bridge:'성과가 늦게 드러나는 공부에서는 중간의 작은 변화가 보이지 않을 때 흐름이 끊길 수 있어요.',self:'오늘 목표를 세 문제로 줄이고, 맞힌 수와 별개로 새로 이해한 한 가지를 끝날 때 적어 보세요.',child:'오늘은 세 문제마다 새로 알게 된 한 가지를 아이가 말하게 해 주세요. 점수 대신 달라진 행동을 짚어 주세요.'},
 {id:'planning',band:'low',focus:['study-habit'],keyword:'할 일이 한꺼번에 보일 때',scene:'책과 과제가 여러 개 펼쳐져 있으면 쉬운 것부터 오가다가 중요한 과제를 뒤로 미룰 수 있어요.',bridge:'여러 일을 동시에 펼쳐 두면 해야 할 양보다 선택해야 할 순서에서 에너지가 새기 쉬워요.',self:'책상에는 첫 과제만 남기고 “개념 한 쪽 → 문제 두 개 → 표시한 곳 확인”의 세 순서를 적어 보세요.',child:'책상에는 첫 과제만 남겨 주세요. 아이와 세 단계의 순서를 적고 끝낸 단계는 직접 지우게 해 보세요.'},
 {id:'repetition_tolerance',band:'low',focus:['concentration','study-habit'],keyword:'같은 형식이 이어질 때',scene:'같은 형태의 문제가 길게 이어지면 익숙한 답을 빨리 적거나, 문제를 끝까지 읽지 않고 넘길 수 있어요.',bridge:'익숙해진 뒤에도 같은 방식만 계속되면 집중을 유지하기가 더 어려울 수 있어요.',self:'같은 유형 세 문제 뒤에 설명하기 한 번을 끼워 넣어, 연습 형식을 짧게 바꿔 보세요.',child:'비슷한 문제 세 개 뒤에는 아이가 선생님처럼 설명하는 차례를 한 번 넣어 주세요.'},
 {id:'execution_speed',band:'low',focus:['study-habit'],keyword:'준비가 길어질 때',scene:'자료와 계획을 충분히 갖추려다 실제 문제를 푸는 시간이 뒤로 밀릴 수 있어요.',bridge:'충분히 준비하려는 마음이 첫 행동의 문턱을 높이는 순간이 있을 수 있어요.',self:'자료를 더 찾기 전에 이미 가진 문제 하나에 첫 문장이나 첫 식부터 적어 보세요.',child:'준비물을 더 챙기기 전에 지금 있는 문제 하나를 함께 펼쳐 주세요. 첫 줄만 시작하는 것을 목표로 잡아 보세요.'},
 {id:'exploration',band:'high',focus:['concentration'],keyword:'새로운 자료가 눈에 들어올 때',scene:'흥미로운 강의나 다른 풀이를 찾다 보면 처음 하려던 과제를 마무리하기 전에 자료가 늘어날 수 있어요.',bridge:'새로운 것을 찾는 힘은 탐색을 끝낼 기준이 있을 때 마무리와 함께 작동해요.',self:'더 찾아보고 싶은 내용은 옆 종이에 한 줄로 남기고, 현재 문제 두 개를 마친 뒤 확인해 보세요.',child:'새로운 질문은 “나중에 찾아볼 목록”에 함께 적어 주세요. 지금 정한 두 문제를 끝낸 뒤 한 가지를 찾아보게 해 주세요.'},
 {id:'evaluation_sensitivity',band:'high',focus:['stress','progress'],keyword:'다른 사람의 속도와 비교할 때',scene:'주변의 진도나 점수를 확인한 뒤 자신의 계획을 급히 바꾸거나, 모르는 부분을 질문하기 어려워할 수 있어요.',bridge:'다른 사람의 반응이 공부의 기준이 되면 필요한 연습보다 비교에 시간을 쓰기 쉬워요.',self:'오늘은 다른 사람의 진도 대신 어제 틀린 한 문제를 다시 풀고, 달라진 과정을 기록해 보세요.',child:'다른 아이와 비교하기보다 어제 아이가 어려워한 한 문제를 다시 펼쳐 주세요. 달라진 풀이 과정만 함께 찾아보세요.'}
];
export const TEMPERAMENT_BLOCKS=[
 {id:'independence',band:'high',keywords:['자율','선택','주관'],sentences:['자신에게 중요한 선택은 직접 해 보고 싶은 기질로 읽힙니다.','주변의 제안을 듣더라도 마지막 결정에는 자신의 판단과 속도를 남겨 두려는 모습이 나타날 수 있어요.'],bridge:'선택의 여지가 있어야 자신의 방식을 충분히 써 볼 수 있는 기질이에요.'},
 {id:'empathy',band:'high',keywords:['공감','관찰','배려'],sentences:['주변 사람의 표정이나 분위기 변화를 살피는 기질로 읽힙니다.','누군가 불편해 보이면 상황을 이해하려고 묻거나 자신의 행동을 조절하는 모습이 나타날 수 있어요.'],bridge:'관계의 분위기도 자신의 에너지에 영향을 줄 수 있는 기질이에요.'},
 {id:'adaptive_flexibility',band:'high',keywords:['유연','전환','조율'],sentences:['상황이 달라지면 처음의 생각을 다시 살펴볼 수 있는 기질로 읽힙니다.','계획이 어긋나도 가능한 방법을 바꾸어 찾거나 다른 관점을 받아들이는 모습이 나타날 수 있어요.'],bridge:'한 가지 방식에 묶이기보다 상황에 맞게 길을 바꿔 볼 수 있는 기질이에요.'},
 {id:'depth_orientation',band:'high',keywords:['깊이','몰입','내면'],sentences:['마음이 향한 대상을 오래 들여다보려는 기질로 읽힙니다.','여러 가지를 넓게 접하는 시간과 별개로 혼자 충분히 생각하고 자기만의 답을 만드는 시간이 필요할 수 있어요.'],bridge:'겉으로 드러난 속도와 안에서 생각이 익는 속도가 다를 수 있는 기질이에요.'},
 {id:'self_confidence',band:'high',keywords:['확신','중심','결단'],sentences:['스스로 납득한 판단을 쉽게 놓지 않는 기질로 읽힙니다.','주변 의견이 달라도 자신의 기준을 설명하며 선택을 이어 가는 모습이 나타날 수 있어요.'],bridge:'자신의 기준이 선명한 만큼 점검할 여지를 함께 두면 균형을 잡기 좋아요.'},
 {id:'emotional_expressiveness',band:'high',keywords:['표현','온기','반응'],sentences:['마음의 움직임이 말이나 표정에 비교적 잘 드러나는 기질로 읽힙니다.','즐거움이나 서운함을 나누며 주변과 관계를 맞춰 가는 모습이 나타날 수 있어요.'],bridge:'마음을 표현하고 반응을 주고받는 과정이 에너지를 정리하는 통로가 될 수 있어요.'},
 {id:'collaboration',band:'high',keywords:['연결','협력','상호작용'],sentences:['각자의 역할을 나누고 함께 무언가를 만드는 데 편안함을 느끼는 기질로 읽힙니다.','다른 사람의 생각을 확인하며 자기 생각을 보완하고, 공동의 과정에서 힘을 얻는 모습이 나타날 수 있어요.'],bridge:'다른 사람과 생각을 주고받을 때 자신에게 필요한 관점을 발견하기 쉬워요.'}
];

export function contextualKey(payload, fallback) {
  const child=payload.audience==='child', focus=payload.personalization?.focus?.id,env=payload.personalization?.environment?.id;
  if (!child && env==='work-study') return {keyword:'짧게 끝낼 수 있는 한 단위',text:'일과 공부를 병행하고 있다고 답했어요. 오늘 확보한 시간에는 새 계획을 늘리기보다 한 개념과 예제 한 문제만 끝내는 단위를 잡아 보세요.'};
  if (!child && env==='not-started') return {keyword:'첫 10분의 진입점',text:'아직 본격적으로 시작하지 않았다고 답했어요. 오늘은 사용할 자료 한 개를 정하고 첫 예제 하나를 10분 동안 살펴보세요.'};
  if (child && focus==='stress') return {keyword:'끝나는 기준을 함께 정하기',text:'부담과 스트레스를 고민으로 골랐어요. 오늘은 아이와 끝낼 분량 한 가지를 정하고, 끝난 뒤 더 추가하지 않는 약속부터 지켜 주세요.'};
  if (child && focus==='method-career') return {keyword:'방법 두 가지를 작은 과제로 비교',text:'아이에게 맞는 방법이나 진로가 궁금하다고 답했어요. 같은 개념을 말로 설명하기와 그림으로 정리하기로 짧게 경험하게 하고, 어느 쪽에서 더 편했는지 물어보세요.'};
  if (!child && focus==='exploring') return {keyword:'작은 경험으로 방향 찾기',text:'아직 구체적인 목표를 찾는 중이라고 답했어요. 관심 분야의 입문 과제 하나를 오늘 해 보고, 계속 알고 싶은 질문 한 가지만 남겨 보세요.'};
  if (child && env==='high-competition') return {keyword:'아이 자신의 전후를 비교하기',text:'교육열이 높은 환경이라고 답했어요. 오늘은 주변의 진도 대신 아이가 지난번 어려워한 과제 하나를 다시 보고, 달라진 과정 한 가지만 함께 찾아 주세요.'};
  if (child && env==='low-competition' && focus==='potential') return {keyword:'작은 탐색의 기회 열어 주기',text:'경쟁이 비교적 적은 환경에서 잠재력을 키우고 싶다고 답했어요. 오늘 아이가 궁금해하는 질문 하나를 직접 고르게 하고, 책이나 짧은 체험으로 함께 확인해 주세요.'};
  if (fallback) return {keyword:'오늘 바꿔 볼 한 가지',text:fallback[child?'child':'self']};
  return {keyword:'하나의 장면부터 관찰하기',text:child?'오늘 아이가 과제를 시작할 때와 멈출 때의 모습을 한 번씩 기록해 주세요. 어느 지점에서 도움이 필요했는지 아이에게 물어보세요.':'오늘 공부를 시작한 순간과 멈춘 순간을 한 번씩 기록해 보세요. 무엇이 시작을 돕고 무엇이 흐름을 끊었는지 확인해 보세요.'};
}
