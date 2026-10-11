# 무료 해석 공부유형 확정 원고

적용 버전: `study-type-story-v1.1.1`

사용자가 마지막으로 확정한 제목과 본문을 무료 해석의 고정 원고로 사용한다. 본문은 v1.1 패키지와 같고, 제목은 마지막 메시지의 짧은 문구가 우선한다. 자녀용·본인용 모두 5문장을 한 문단으로 표시한다. 질문 답변이나 외부 리포트 어댑터가 이 원고를 다시 작성하지 않는다.

| 유형 ID | 유형 | 확정 제목 |
| --- | --- | --- |
| explorer | 탐구형 | 이유를 묻는 사람 |
| analyst | 분석형 | 구조를 푸는 사람 |
| executor | 실행형 | 행동으로 배우는 사람 |
| immerser | 몰입형 | 깊이를 파고드는 사람 |
| expressor | 표현형 | 말로 배우는 사람 |
| strategist | 전략형 | 목표를 겨누는 사람 |
| balancer | 균형형 | 꾸준히 쌓아가는 사람 |
| resonator | 공명형 | 분위기를 읽는 사람 |

원고 원본은 `config/study-type-story-v1.1.1.json`, 실제 사용 모듈은 `public/study-type-copy.js`다. 두 파일의 일치는 자동 검증한다. 서버 응답과 무료 화면은 같은 모듈을 사용한다. 기존 description 데이터 계약은 유지하고 화면에서 하나의 문단으로 합친다.

변경 파일: 위 원고 2개, `public/free-report-model.js`, `public/free-report-view.js`, `server/study-type-response.js`, `build.mjs`, 관련 테스트 2개와 이 문서.

## 유지한 기준

- 코어 커밋: `bac8b553c650d667bd3854f829db26dc7785ec56`
- 코어 빌드: `core-v1.1.0-daeun-range-20261009.1`
- 코어 소스 매니페스트 SHA-256: `a51f203ff36ed3bd4a02ade69cd3afc9fbac46ebcdb5cec3a38579d10bd13a0f`
- 실제 코어에서 생성한 24,000건의 기존 기준 분포, 분류 점수·규칙·동점 처리, 16개 유형 카드 이미지 유지. 이번에는 분포를 재생성하지 않았다.
- 기존 개인화 종합 해석, 수호카드, 원국, 유료 챕터·결제 흐름 유지.
- 내부 분류 기준은 공개 자산에 포함하지 않는다.

입력 ZIP SHA-256: `5ac934b73e10e6aad7f44b6e21d48a372f976693910e980fe24148bf763d1e2b`. 패키지 체크섬 34개 검증, 16개 카드 이미지의 현재 파일과 바이트 일치 확인.

## 검증

`npm run build`, `npm test`: 71개 통과. 8유형 × 자녀/본인 화면의 제목·본문 정확 일치, 단일 문단 렌더링, 어댑터 문구 덮어쓰기 방지, 서버와 빌드된 Worker의 고정 원고 응답을 확인했다. DOM 테스트이며 실제 모바일 브라우저 시각 검수는 수행하지 않았다.

사이트: https://studysaju-navy.doubleh19may.chatgpt.site/start.html#free-result

## GitHub 프런트엔드 사본

이 저장소에서는 위 `public/` 경로가 `dist/`에 대응한다. 원고·화면 연결·관련 프런트엔드 테스트를 동기화한다. 서버 응답 및 빌드 변경은 비공개 Site 소스에서 관리한다.
