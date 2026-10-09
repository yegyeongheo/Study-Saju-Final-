// Personalization answers supply context; they do not change calculated saju facts.
export const QUESTIONNAIRES = {
  child: [
    {
      key: 'environment', title: '자녀가 공부하는 지역의 교육 환경은 어떤 편인가요?',
      description: '가장 가까운 한 가지를 선택해 주세요.',
      options: [
        ['high-competition', '교육열이 높은 학군지'],
        ['general', '일반적인 교육 환경'],
        ['low-competition', '교육 경쟁이 비교적 적은 지역'],
        ['unknown', '잘 모르겠어요']
      ]
    },
    {
      key: 'focus', title: '현재 자녀의 공부에서 가장 고민되는 부분은 무엇인가요?',
      description: '가장 중요한 한 가지를 선택해 주세요.',
      options: [
        ['study-habit', '스스로 공부하는 습관이 부족해요'],
        ['concentration', '집중력이 부족하고 쉽게 산만해져요'],
        ['motivation', '공부에 대한 의욕과 동기가 부족해요'],
        ['progress', '노력에 비해 성적이 잘 오르지 않아요'],
        ['stress', '공부에 대한 부담과 스트레스가 커요'],
        ['method-career', '아이에게 맞는 공부법이나 진로를 알고 싶어요'],
        ['potential', '특별한 고민보다는 아이의 잠재력을 키우고 싶어요']
      ]
    },
    {
      key: 'freeText', title: '자녀의 공부에 대해 특별히 궁금한 점이 있나요?',
      description: '질문을 남겨주시면 사주 분석과 함께 리포트 마지막 장에서 맞춤형으로 답변해 드려요.',
      placeholder: '아이의 공부에 대해 궁금한 점을 남겨주세요.'
    }
  ],
  self: [
    {
      key: 'environment', title: '현재 어떤 환경에서 주로 공부하고 있나요?',
      description: '가장 가까운 한 가지를 선택해 주세요.',
      options: [
        ['classes', '학교나 학원에서 정해진 수업을 듣고 있어요'],
        ['independent', '혼자 계획을 세워 공부하고 있어요'],
        ['work-study', '직장이나 다른 일을 병행하며 공부하고 있어요'],
        ['group', '스터디나 그룹 학습을 하고 있어요'],
        ['not-started', '아직 본격적으로 시작하지 않았어요']
      ]
    },
    {
      key: 'focus', title: '지금 공부를 통해 가장 이루고 싶은 목표는 무엇인가요?',
      description: '가장 중요한 한 가지를 선택해 주세요.',
      options: [
        ['exam-admission', '시험 합격이나 원하는 학교 진학'],
        ['career', '취업·이직·승진을 위한 역량 강화'],
        ['achievement', '성적이나 학업 성취도 향상'],
        ['study-habit', '꾸준히 공부하는 습관 형성'],
        ['self-development', '자기계발이나 관심 분야 탐구'],
        ['exploring', '아직 구체적인 목표를 찾는 중이에요']
      ]
    },
    {
      key: 'freeText', title: '지금 공부와 관련해 가장 궁금한 점은 무엇인가요?',
      description: '현재 고민이나 목표를 자유롭게 남겨주세요. 리포트 마지막 장에서 개인화된 해석을 제공해 드려요.',
      placeholder: '지금의 고민이나 이루고 싶은 목표를 남겨주세요.'
    }
  ]
};
export function createAnswers() {
  return {environment: null, focus: null, freeText: '', skipped: true};
}
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ko', {granularity: 'grapheme'}) : null;
function characters(text) {
  return segmenter ? Array.from(segmenter.segment(text), item => item.segment) : Array.from(text);
}
export function countCharacters(text) { return characters(text).length; }
export function limitQuestion(text) { return characters(text).slice(0, 150).join(''); }
export function buildPersonalization(audience, answers) {
  const questions = QUESTIONNAIRES[audience];
  if (!questions) throw new Error('학습 비책의 대상을 선택해 주세요.');
  const environment = questions[0].options.find(([id]) => id === answers.environment);
  const focus = questions[1].options.find(([id]) => id === answers.focus);
  if (!environment || !focus) throw new Error('첫 번째와 두 번째 질문에 답해 주세요.');
  const text = answers.skipped ? null : answers.freeText.trim();
  if (!answers.skipped && (!text || countCharacters(text) > 150)) throw new Error('질문을 150자 이내로 입력하거나 건너뛰어 주세요.');
  return {
    version: 1,
    audience,
    environment: {id: environment[0], label: environment[1]},
    focus: {kind: audience === 'child' ? 'concern' : 'goal', id: focus[0], label: focus[1]},
    personalQuestion: {text, skipped: answers.skipped, answerInChapter: 10}
  };
}
