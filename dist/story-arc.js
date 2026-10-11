// Editorial pacing for the already selected interpretation; never selects a trait or changes evidence.
const ARCS={
 'understand-before-start':{
  titles:['이해가 마음속에 자리를 잡는 과정','충분히 알겠다는 마음이 시작을 늦출 때','작은 시도부터 이해를 완성하세요'],
  closing:'첫 시도에서 남은 질문이 다음 배움의 방향이 됩니다.'},
 'depth-before-start':{
  titles:['하나의 질문 안으로 깊이 들어가는 힘','생각은 쌓이는데 결과가 남지 않을 때','첫 결과물 위에 깊이를 더하세요'],
  closing:'작게라도 밖으로 꺼낸 생각은 다시 깊어질 자리를 얻습니다.'},
 'autonomy-with-boundaries':{
  titles:['자기 방법을 고를 때 생기는 주도권','자유가 막막함으로 바뀌는 순간','끝은 분명하게, 과정은 스스로'],
  closing:'어디까지 가면 되는지 알 때, 자기 길을 선택하는 힘도 살아납니다.'},
 'exploration-needs-variation':{
  titles:['익숙한 지식에서 새 질문을 발견할 때','새로움이 사라진 뒤에도 배움은 이어져야 합니다','같은 개념에 다른 문을 열어 주세요'],
  closing:'하나의 개념으로 여러 번 돌아온 경험이 깊은 이해로 남습니다.'},
 'achievement-under-pressure':{
  titles:['잘하고 싶은 마음이 공부를 움직입니다','잘해야 한다는 마음에 시도가 줄어들 때','틀려도 되는 시간부터 마련하세요'],
  closing:'다시 해 볼 수 있는 자리가 있어야, 잘하고 싶은 마음도 앞으로 움직입니다.'},
 'analysis-with-intuition':{
  titles:['먼저 보이는 전체 그림, 뒤따르는 근거','첫 느낌과 확인하는 과정이 엇갈릴 때','예상하고, 확인하고, 생각을 고치세요'],
  closing:'처음 떠오른 답보다, 근거를 만나 달라진 생각이 배움으로 남습니다.'},
 'planning-with-flexibility':{
  titles:['계획을 세우고 상황에 맞게 길을 바꾸는 힘','방법을 바꾸다 목적지까지 달라질 때','오늘 남길 결과 하나를 붙잡으세요'],
  closing:'계획을 바꾼 날에도 남는 결과가 있다면 배움은 이어지고 있습니다.'},
 'autonomy-and-interference':{
  titles:['스스로 고른 방법에 마음이 실립니다','도움이 간섭으로 받아들여지는 순간','선택한 만큼 마무리할 자리를 주세요'],
  closing:'스스로 선택하고 끝낸 경험이 다음 공부의 주도권을 만듭니다.'},
 'expression-and-depth':{
  titles:['안에서 익힌 생각이 밖으로 나오는 과정','깊이 생각한 것과 잘 설명한 것 사이','처음의 질문으로 돌아와 보세요'],
  closing:'표현하다 발견한 빈틈은 다음 탐구가 시작되는 자리입니다.'},
 'mastery-with-persistence':{
  titles:['어제보다 나아진 한 부분이 주는 힘','같은 막힘까지 오래 반복하고 있다면','이어 갈 목표와 바꿀 방법을 구분하세요'],
  closing:'오래 한 시간 속에 달라진 방법이 남을 때, 꾸준함은 실력이 됩니다.'},
 'meaning-with-action':{
  titles:['이유를 찾은 마음이 행동으로 이어집니다','빠른 시도 뒤에 남겨야 할 한 가지','해 본 다음, 왜 되는지 설명하세요'],
  closing:'해 보는 속도에 이유를 되짚는 시간이 더해지면 배움이 단단해집니다.'},
 'analysis-with-planning':{
  titles:['복잡한 과제에 순서가 생기는 순간','계획대로 풀리지 않는 문제를 만났을 때','막힌 한 단계부터 다시 살펴보세요'],
  closing:'한 번 고쳐 본 순서는 다음 과제를 스스로 풀어 갈 기준이 됩니다.'},
 'quick-start-slow-finish':{
  titles:['첫 행동이 다음 길을 보여 줍니다','처음의 기세가 잦아드는 순간','다시 돌아올 자리를 남겨 두세요'],
  closing:'멈추지 않는 것만큼, 멈춘 자리에서 다시 이어 가는 경험이 중요합니다.'},
 'achievement-and-evaluation':{
  titles:['성과를 향한 마음에 다른 사람의 시선이 더해집니다','비교가 오늘 필요한 연습을 밀어낼 때','어제의 나와 달라진 한 부분을 찾으세요'],
  closing:'다른 사람의 반응이 없는 날에도 알아볼 수 있는 변화가 공부를 지탱합니다.'}
};
// The narrative retells the same rule in sequence: strength first, tension later.
// It never adds an event from the reader's past or a new trait.
const TELLING={
 'understand-before-start':[
  '배움은 “왜 그런지” 납득하는 순간부터 깊어집니다. 설명을 들을 때도 결론만 기억하기보다, 그 결론이 자기 생각과 맞물리는지 확인하려는 마음이 먼저 움직입니다.',
  '새 개념을 만났을 때 정의와 예시를 오가며 연결을 찾는 장면을 떠올려 보세요. 한 가지를 이해하면 다음 질문이 생기고, 그 질문을 따라가며 지식이 자기 안에 자리를 잡습니다. 이 과정이 배움에 이유를 붙여 줍니다.',
  '그런데 질문이 모두 풀려야 시작할 수 있다고 느끼는 순간, 이해를 깊이는 힘이 첫 시도의 문턱이 됩니다. 자료를 더 읽는 동안 직접 해 보는 시간은 뒤로 밀립니다. 바로 이때, 작은 시도 역시 이해를 만드는 과정에 포함해야 흐름이 달라집니다.'
 ],
 'depth-before-start':[
  '마음에 들어온 질문을 오래 들여다보는 데서 배움이 시작됩니다. 빨리 훑고 넘어가기보다, 스스로 납득할 답을 만들 때까지 생각을 이어 가는 힘이 있습니다.',
  '하나의 주제를 만나 관련 자료를 찾아보고 여러 설명을 비교하는 장면입니다. 처음에는 보이지 않던 차이가 드러나고, 생각 속에서 질문의 모양이 점점 구체적으로 바뀝니다. 충분히 들여다볼 시간이 배움의 밀도를 만듭니다.',
  '하지만 생각이 모두 정리되기를 기다리면 첫 결과물이 늦어집니다. 안에서는 많은 일이 일어났는데 밖으로 남은 것은 적어 답답해지는 지점입니다. 작은 초안을 먼저 만들면, 그다음 탐구가 어디를 채워야 할지 분명해집니다.'
 ],
 'autonomy-with-boundaries':[
  '배움에서도 자신의 선택과 판단을 남기려는 마음이 있습니다. 남이 정한 길을 그대로 따르기보다, 어떤 방법으로 해 볼지 직접 고를 때 과제가 자기 일이 됩니다.',
  '익숙한 과제에서는 순서나 도구를 스스로 정하며 공부의 주도권을 잡습니다. 자기 방식으로 한 번 해 보고 결과를 확인하는 경험이 쌓이면 다음 선택에도 기준이 생깁니다.',
  '다만 처음 보는 과제에서 목표까지 모호해지면 자유가 막막함으로 바뀝니다. 스스로 하고 싶지만 무엇부터 해야 할지 확인하고 싶은 마음도 함께 있기 때문입니다. 결과의 기준을 분명히 하고 방법을 선택하게 하면 두 요구가 만납니다.'
 ],
 'exploration-needs-variation':[
  '이미 아는 것에서 새로운 질문을 발견할 때 마음이 움직입니다. 같은 개념이어도 예시와 관점이 달라지면 다시 들여다볼 이유가 생깁니다.',
  '문제를 풀다가 조건 하나를 바꿔 보고, 다른 상황에서도 같은 원리가 통하는지 확인하는 장면입니다. 이렇게 새 연결을 만드는 동안 배움은 정해진 답을 기억하는 일을 넘어 탐색으로 이어집니다.',
  '그런데 형식이 익숙해지고 새로움이 줄면 같은 활동을 이어 가는 일이 버거워집니다. 그때마다 다른 자료로 옮겨 가면 시작한 것에 비해 충분히 연습한 것은 적어집니다. 목표는 유지하면서 연습하는 방법에 변화를 주어야 탐색과 복습이 이어집니다.'
 ],
 'achievement-under-pressure':[
  '노력한 만큼 달라졌다는 감각이 공부를 움직입니다. 목표에 가까워지는 모습을 확인하면 다음 단계로 나아갈 이유가 선명해집니다.',
  '전에는 풀지 못했던 과제를 해결하거나 정해 둔 목표를 마친 순간을 생각해 보세요. 결과가 보일 때 공부의 의미가 구체적으로 다가옵니다. 성취를 바라는 마음이 행동을 모아 주는 장면입니다.',
  '하지만 평가가 가까워지면 잘하고 싶은 마음이 실수하지 않아야 한다는 부담과 얽힙니다. 새로운 방법을 배우는 데 쓰일 주의가 결과를 지키는 쪽으로 향하는 것입니다. 틀리며 배우는 시간과 실력을 확인하는 시간을 나누는 데서 전환이 시작됩니다.'
 ],
 'analysis-with-intuition':[
  '전체 흐름이 먼저 눈에 들어오고, 뒤이어 그 이유를 확인하려는 생각이 움직입니다. 감을 잡는 힘과 구조를 나누어 살피는 힘이 배움 안에서 함께 작동합니다.',
  '문제를 보는 순간 답의 방향을 예상한 뒤 조건을 하나씩 대입하는 장면입니다. 예상이 탐색할 길을 열어 주고, 분석이 맞는 부분과 고칠 부분을 구분해 줍니다. 두 과정이 이어지면 답뿐 아니라 설명도 남습니다.',
  '둘을 한 번에 끝내려 하면 첫 느낌을 너무 빨리 확정하거나, 근거가 부족하다는 이유로 떠오른 생각을 지워 버립니다. 예상은 잠정적인 출발점으로 두고 검증하는 시간을 따로 마련해야 두 강점을 함께 쓸 수 있습니다.'
 ],
 'planning-with-flexibility':[
  '먼저 순서를 세워 방향을 잡고, 상황이 달라지면 가능한 길을 다시 찾습니다. 준비하는 힘과 조정하는 여유가 배움을 함께 받쳐 줍니다.',
  '예상보다 어려운 내용을 만났을 때 오늘 다룰 분량이나 활동 순서를 바꾸는 장면입니다. 계획은 처음 정한 틀인 동시에 지금 무엇을 조절해야 할지 살피는 기준이 됩니다.',
  '다만 방법을 바꿀 때마다 목표까지 함께 바꾸면 무엇을 끝냈는지 흐려집니다. 유연함이 방향을 잃지 않으려면 오늘 남길 결과가 필요합니다. 목적지를 남겨 두고 가는 길을 조절하는 것이 전환점입니다.'
 ],
 'autonomy-and-interference':[
  '자기 판단으로 방법을 고를 때 배움에 마음이 실립니다. 스스로 선택한 과제는 지시받은 일을 넘어, 자신의 방식으로 해결해 보고 싶은 일이 됩니다.',
  '풀이 순서나 도구를 골라 직접 시도하는 장면을 떠올려 보세요. 왜 그 방법을 택했는지 설명할 자리가 있으면 결과를 보고 다른 방법과 비교할 여지도 생깁니다.',
  '그런데 세부 과정까지 지시받으면 과제보다 결정권에 신경이 쓰입니다. 도움을 더할수록 오히려 흐름이 끊기는 이유가 여기에 있습니다. 책임질 결과와 스스로 선택할 과정을 나누어야 대화가 다시 배움으로 돌아옵니다.'
 ],
 'expression-and-depth':[
  '한 주제를 깊이 생각하고, 그 생각을 말과 글로 펼치는 두 힘이 함께 있습니다. 안에서 익힌 내용을 밖으로 꺼낼 때 이해의 윤곽이 선명해집니다.',
  '배운 내용을 처음 듣는 사람에게 설명하는 장면입니다. 막연히 안다고 여겼던 부분도 직접 말해 보면 어떤 연결이 필요한지 드러납니다. 그 빈틈을 다시 찾아보는 동안 탐구와 표현이 서로를 돕습니다.',
  '하지만 읽은 양이나 말한 양만 늘고 처음의 질문으로 돌아오지 않으면 초점이 흐려집니다. 깊게 생각한 것과 필요한 답을 설명한 것은 다를 수 있습니다. 출발할 때의 질문을 다시 펼쳐야 배움이 하나의 결과로 모입니다.'
 ],
 'mastery-with-persistence':[
  '어제 막혔던 부분이 오늘 풀리는 경험이 공부를 이어 갈 이유가 됩니다. 실력이 나아지는 감각에, 흥미가 줄어든 뒤에도 과제를 이어 가는 힘이 더해집니다.',
  '한 번 틀린 과제로 돌아가 전보다 혼자 해결한 부분을 찾는 장면입니다. 작은 개선을 알아차릴수록 반복에는 목적이 생깁니다. 꾸준히 돌아오는 시간이 배움의 기반을 만들어 줍니다.',
  '그런데 오래 했다는 사실만으로 방법도 맞다고 여기면 같은 오류까지 반복합니다. 이때 필요한 변화는 목표를 포기하는 것이 아니라 접근 방법을 점검하는 일입니다. 계속할 것과 고칠 것을 나누어야 지속성이 경험으로 쌓입니다.'
 ],
 'meaning-with-action':[
  '배울 이유가 연결되면 직접 해 보려는 마음이 빠르게 움직입니다. 의미를 찾는 힘과 행동으로 옮기는 속도가 함께 배움의 문을 엽니다.',
  '새 개념이 어디에 쓰이는지 예시를 본 뒤 비슷한 과제에 곧바로 적용하는 장면입니다. 질문은 오래 머무는 이유가 되기보다 다음 시도를 정하는 방향이 됩니다. 해 보는 과정에서 설명의 의미도 구체적으로 다가옵니다.',
  '다만 시도한 뒤 바로 다음 과제로 넘어가면 무엇 때문에 그 방법이 통했는지 놓칠 수 있습니다. 시작 전에 찾은 이유를 끝난 뒤 다시 확인하는 시간이 필요합니다. 빠른 행동에 짧은 설명을 더하는 것이 배움을 남기는 전환점입니다.'
 ],
 'analysis-with-planning':[
  '복잡한 내용을 나누어 살피고 접근할 순서를 세울 때 생각이 정돈됩니다. 막연해 보이던 과제에도 어디부터 손대면 될지 길이 생깁니다.',
  '조건과 질문을 따로 적은 뒤 필요한 개념을 연결하는 장면입니다. 구조를 보는 힘이 확인할 대상을 정하고, 계획하는 힘이 그 대상을 다룰 순서를 만듭니다. 두 과정이 이어지면 큰 과제도 작은 단계로 나뉩니다.',
  '하지만 잘 정리한 순서가 실제 문제에서 그대로 통하지 않을 때가 있습니다. 계획을 더 자세히 쓰는 것만으로는 그 막힘이 풀리지 않습니다. 직접 해 본 결과를 바탕으로 멈춘 단계 하나를 수정할 때 계획이 살아 있는 방법이 됩니다.'
 ],
 'quick-start-slow-finish':[
  '결정한 것을 첫 행동으로 옮기는 힘이 있습니다. 새로운 과제를 만나면 첫 식이나 초안을 만들며 다음 길을 찾아갑니다.',
  '준비를 모두 끝내기 전에 한 번 해 보고, 그 결과에 따라 방법을 고치는 장면입니다. 시작한 뒤에야 보이는 정보를 빠르게 얻는 것이 이 방식의 장점입니다.',
  '다만 첫 시도를 여는 힘과 흥미가 줄어든 뒤 이어 가는 힘은 다르게 움직입니다. 처음의 기세가 잦아들면 다음 행동이 비어 버리는 지점이 생깁니다. 멈출 때 다시 돌아올 위치를 남겨 두면 시작의 힘을 다음 시간에도 쓸 수 있습니다.'
 ],
 'achievement-and-evaluation':[
  '목표를 이루었다는 감각이 공부를 움직입니다. 여기에 다른 사람이 자신의 노력을 어떻게 보는지 살피는 마음도 함께 들어옵니다.',
  '진도와 결과를 확인하면서 현재 위치를 가늠하는 장면입니다. 외부의 반응은 목표를 구체적으로 느끼게 하고, 더 나아가고 싶은 마음을 자극합니다.',
  '그러나 비교 대상이 바뀔 때마다 계획까지 흔들리면 지금 필요한 연습을 놓칩니다. 보여 주기 좋은 성과를 좇다가 복습할 자리가 줄어드는 것입니다. 오늘 바꿀 행동은 자신의 과제에서 찾고, 외부 평가는 위치를 확인하는 자료로 둘 필요가 있습니다.'
 ]
};
// Split only at complete sentences. Keep the actual claims and their conditional wording intact.
export function readableParagraphs(text,max=190){
 if(!text)return [];
 const sentences=text.match(/[\s\S]+?(?:[.!?][”’"']?(?=\s|$)|$)/gu)||[text];
 const result=[];let current='';
 for(const part of sentences){const sentence=part.trim();if(!sentence)continue;
  if(current&&current.length+sentence.length+1>max){result.push(current);current='';}
  current+=(current?' ':'')+sentence;
 }
 if(current)result.push(current);return result;
}
export function makeStoryArc({rule,opening,mechanism,scene,expression,qualifier,context,action,observe,payload}){
 const meta=ARCS[rule.id]||{titles:['배움에 강점이 쓰이는 순간','다른 과제에서도 같은 힘을 쓰려면','작은 적용부터 시작하세요'],closing:'익숙한 강점을 새로운 과제에 써 본 경험이 다음 배움의 발판이 됩니다.'};
 const child=payload.audience==='child';
 const title=t=>child?t.replace('어제의 나와','아이의 어제와'):t;
 const telling=TELLING[rule.id];
 const isPreschool=payload.learner?.ageBand==='preschool';
 const development=telling?(isPreschool?scene:telling[1]):mechanism;
 const turn=telling?telling[2]:rule.trap;
 const sections=[
  {role:'development',title:title(meta.titles[0]),paragraphs:readableParagraphs(development)},
  {role:'turn',title:title(meta.titles[1]),paragraphs:[...readableParagraphs(turn),...readableParagraphs(expression),...readableParagraphs(qualifier?.text)]},
  {role:'resolution',title:title(meta.titles[2]),paragraphs:[...readableParagraphs(context),...readableParagraphs(action),...readableParagraphs(observe)]}
 ];
 // Highlight one actionable sentence, with the rest of the paragraph retaining its context.
 const actionSentence=action.match(/^[^.!?]+[.!?]/u)?.[0]||action;
 sections[2].emphasis=actionSentence;
 return {version:'story-arc-1',opening:readableParagraphs(telling?telling[0]:opening),sections,closing:meta.closing};
}
