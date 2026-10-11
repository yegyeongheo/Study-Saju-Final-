# 유료 공부 운명서 10장 제공 가능 범위 검증

검증일: 2026-10-11 (Asia/Seoul). **자녀용 0/10장, 본인용 0/10장 제공 인증. 판매 비활성 유지.**

## 확인 기준과 한계

- 앱 기준: `c67f832286d1fed9f32ee15480986dd53410406a`.
- 코어 main: `4c8885486d9e1bb2f75d599ca0c76c50c0a9d210`. 앱이 고정한 `bac8b553c650d667bd3854f829db26dc7785ec56`과 비교한 파일 차이는 없음(병합 커밋만 추가).
- 코어 소스 `src/saju_core/api.py`, `traits.py`, `manifestation.py`, `cycles.py`, 고정 `registry/trait_catalog.json` 및 앱 `CORE_API.md`, `RANGE_INTEGRATION_VERIFICATION.md`, 서버·프런트·테스트를 대조했다.
- 과거 기록은 코어 Phase 1–10 159개와 실제 HTTP 연결 검증 통과를 보고한다. 이번 작업에서 이 Python 코어 검사를 재실행한 것은 아니다. 운영 서버/실제 결제/실사용자의 리포트를 검증하지 않았다.
- `server/app.py`는 코어 JSON API이며 유료 본문 생성·주문·결제·리포트 저장/재열람 API가 없다. `window.studySajuCheckout`는 연결 자리다. 현재 GitHub main에는 진행 중인 열린 PR이 없었다.
- `dist/interpretation-blocks.js`와 `free-report-model.js`는 무료 해석만 제공한다. `dist/study-type-rules.js`의 기존 규칙 연결 자리는 비어 있다. 이번 작업은 판정 규칙을 추가하거나 변경하지 않는다.

## 계산 결과와 상품 해석의 경계

`calculation.subjects.learner`는 코어 응답 봉투다. 그 아래 `result.subjects`에서 `subjectId === 'learner'`를 선택한다. 보호자의 결과를 학습자 결과로 대체하면 안 된다.

| 계층 | 실제 제공 필드 | 사용 조건 / 해석 계층의 일 |
| --- | --- | --- |
| 원국 | `candidates[].pillars`, `structure`, `time`, `weightFraction` | 후보·생시 정밀도 보존. 임의 대표 원국 선택 금지 |
| Feature | `candidates[].features.values`, `featureDetails` | 항목의 `availability`/`reason` 확인. 0과 누락 구별. 단순 화면 오행 개수를 Trait 대신 사용하지 않음 |
| Trait40 | `candidates[].traits[id].level/score/grade/evidenceRefs` | 코어 점수·등급 그대로. 문장은 `evidenceRefs`가 실제 `candidates[].evidence`에 연결되는지 추적 |
| Manifestation | `traits[id].manifestation.state/ruleId` | NORMAL·AMPLIFIED·SOFTENED·SUPPRESSED·CONTEXT_DEPENDENT. Trait와 별도 설명. 없는 발현 규칙을 만들지 않음 |
| 후보 요약 | `summary.traits`, `summary.manifestations` | 후보 차이·안정성을 보존. C등급과 생시 모름의 코어 3단계 정책 유지 |
| Cycle | `result.timeline.availability/data.segments[]` | 계산 수신은 구현. 유료 시기 해석 필드 매핑·본문·검수는 미구현 |

## 장별 대조

아래 Trait 목록은 **유료 모듈 설계에 사용할 입력 후보**다. 새 판정 공식이나 승인된 유료 본문 규칙이 아니다. 1–8장은 공통으로 원국·Feature 근거·Trait·Manifestation을 연결해 설명해야 한다. 모든 장은 두 대상별 본문 생성·검증·전달이 아직 없어 미제공이다.

| 장 | 자녀용 / 본인용 (현재 코드의 제목) | 사용할 수 있는 계산 입력 | 필요한 해석 모듈과 아직 없는 기능 |
| --- | --- | --- | --- |
| 1 | 우리 아이의 공부 체질 / 나의 공부 체질 | self_direction, independence, analytical, intuitive, exploration, depth_orientation; 원국 구조와 각 Trait의 Feature 근거 | 이해·탐색·시작 방식의 통합 서술, 상충 특성 해소, 실제 1장 본문. 8유형을 포함하려면 기존 승인 판정 연결도 필요 |
| 2 | 집중력과 실행력 / 집중력과 루틴 | execution_speed, persistence, repetition_tolerance, planning, conscientiousness | 시작·지속·마무리 병목 구분, 과제 크기와 루틴 제안. 실제 집중 시간·성적을 측정한 값은 없음 |
| 3 | 아이를 움직이는 동기 / 나를 움직이는 동기 | achievement, mastery, competitiveness, immediate_reward, meaning_seeking | 보상·칭찬·목표 납득의 우선순위와 역효과, 상황별 문구. 참여 응답과의 연결 필요 |
| 4 | 성적을 만드는 공부법 / 동일 | analytical, intuitive, verbal_expression, planning, repetition_tolerance | 개념→문제→오답→복습 계획. 학습 종류별 분기와 2장 루틴·3장 동기의 중복 제거 |
| 5 | 스트레스와 회복 / 스트레스와 회복 전략 | pressure_sensitivity, failure_resilience, emotional_volatility, uncertainty_tolerance 및 해당 발현 상태 | 부담을 받는 상황→겉으로 드러나는 반응→회복 순서. 성향·발현이 다른 경우의 설명 및 회복 실천 |
| 6 | 부모가 알아야 할 지도법 / 시험에서 실력을 발휘하는 법 | 자녀: control_sensitivity, authority_acceptance, independence, evaluation_sensitivity. 본인: planning, execution_speed, pressure_sensitivity, conscientiousness, failure_resilience | 자녀: 개입·선택권·피드백의 구체적 대화. 본인: 실전 시간배분·실수점검. 보호자 원국 두 개만으로 궁합 판정 불가; 궁합은 별도 Pair 연결·상품 |
| 7 | 학원,학교,교육환경 / 공부환경과 선택 | social_energy, collaboration, independence, change_seeking, evaluation_sensitivity | 혼자/수업/스터디와 피드백 강도 비교. 실제 학교·학원의 품질·입학 가능성을 계산하는 기능은 없음 |
| 8 | 진로,전공,예체능 / 진로,전공,직업 | exploration, depth_orientation, verbal_expression, analytical, practicality 및 원국 근거 | 분야별 탐색 매핑, 흥미·경험을 묻는 추가 입력과 추천 근거. 코어에 전공·직업·예체능 추천 결과 필드는 없음 |
| 9 | 학업운, 시험운, 합격운 흐름 / 공부운,시험운,합격운 | 아래 Cycle 계약 참조 | **미제공 고정**. 학업·시험·합격 흐름을 만드는 해석 규칙, 입력별 필드 매핑과 시기별 본문 검증 필요 |
| 10 | 우리 아이 맞춤 실행 가이드 / 나만의 실행 전략 | 앞선 장의 검증된 해석 + `payload.personalization`의 실제 고민·환경·동기·질문 | 현재 무료 코드에는 일부 실천 팁만 있음. 질문별 답변·우선순위·실행 계획·앞 장과의 모순 검사·질문 미입력 처리가 없음 |

Feature 예: 분석성은 metal 등, 계획성은 zhengyin 등, 지속성은 earth 등, 압박민감도는 authority.branch 등으로 연결된다. 실제 근거는 단일 대표 Feature가 아니라 코어의 기여·조건·modifier·가시성·발현 evidence 전체를 사용한다. 이 문서는 가중치나 산식을 재정의하지 않는다.

## 9장에 추가로 필요한 검증

1. `result.layers.cycle`뿐 아니라 `timeline.availability`, 각 segment의 `candidateId`, `startUtc/endUtc`, `solarYear`, `daeunPillar/seunPillar`와 `cycle.daeun/seun/combined.availability`를 검사한다.
2. Cycle12: competition, expression, finance, responsibility, pressure, learning, movement, relationActive, relationTension, expansion, overload, recovery. 학업·시험·합격 해석에 어떤 신호·조합을 쓸지 별도 모듈에서 정의·검수해야 한다. `learning`이 높다는 이유만으로 합격 결론을 만들지 않는다. 코어에는 합격확률·합격년도 결과가 없다.
3. 정확 시각은 해당 segment, 시진/생시 모름은 `daeunRanges`, `daeunSummary`, `segments[].daeunRange.options`와 각 옵션의 Cycle/Interaction을 보존한다. 다중 후보를 하나로 확정하지 않는다.
4. `NOT_STARTED`의 SEUN_ONLY와 UNAVAILABLE, 순역행 기준 누락, 복수 대운, 입춘·교운 경계를 각기 검사한다. 대운 없음과 세운 없음은 다르다.
5. 현재 `currentPeriod()` 기본 요청은 서울 기준 올해 1년뿐이다. 3년 흐름을 판매하려면 명시적인 3년 요청·범위 검증·연도별 문장 검수가 추가로 필요하다.
6. 실제 API fixture→시기 해석→해당 대상의 9장 출력까지 일치시킨 후에만 인증한다. 실패·누락·기간 부족은 미제공. 현재는 “시기 해석 연결·검증 미완료로 현재 제공하지 않습니다.”만 표시한다.

## 구현된 출시 차단

- `dist/report-readiness.js`: 대상별 깊은 동결 allowlist. 현재 child/self 모두 `chapters:[]`, `cycleVerified:false`, `deliveryVerified:false`.
- `REPORT_OFFER.providedChapters`는 두 대상의 검증 장 교집합에서 파생된다. 수동 숫자 추가나 외부 offer의 `cycleVerified:true`만으로 검증을 통과하지 못한다.
- 1~10의 정수, 중복 없는 정확한 10장, 해당 대상 인증, 별도 Cycle 인증, 전달 인증, 유효한 KRW 정수 가격, 명시적인 available, 연결된 checkout을 모두 요구한다. 유료 10장 상품을 암묵적으로 1장/9장 상품으로 축소하지 않는다.
- UI는 렌더·클릭·비동기 종료 때 검사한다. UI 검사는 서버 결제 권한이 아니다. 현재 서버에는 결제 API가 없고 실제 결제는 불가능하다. 향후 서버가 자체 인증 목록과 가격·리포트 소유권·주문 상태를 재검증해야 한다.
- `inspectChapterInputs`는 1–8장의 원국/계층/필수 Trait·발현·근거 누락을 후보별로 진단하는 별도 함수다. 이것은 전체 코어 schema 검증이나 해석 품질 인증이 아니며, 입력이 있어도 `provided:false`다. 9·10장은 미연결 사유를 반환한다.
- `scripts/verify-report-release.mjs`: 코어 고정 버전·인증 목록·증거 기록의 일치 검사. 제공 장을 추가할 때 본문 모듈, 실제 수용 테스트, 검수 출력 기록의 파일 해시와 수용 테스트 재실행이 필요하다. 누락·파일 변경·실패·skip/todo는 차단한다.
- `reports/verification-evidence.json`은 빈 실제 검증 기록이다. 가상의 통과 증거를 등록하지 않았다. 검사 스크립트가 장의 문장 품질 자체를 판단하지는 않는다. reviewFile에 실제 생성 본문·입력·근거 추적과 검수 결과를 보관해야 한다.
- `npm test`는 기존 전체 JS 검사와 신규 검사를 실행한다. `npm run verify:report`는 출시 인증 검사를 실행하며 GitHub Actions에 연결했다. 브랜치 보호 필수 검사 설정은 이번 작업 범위에 포함하지 않았다.

## 결제 활성화 전 구체적 완료 조건

1. 각 대상의 1–10장 생성 모듈을 구현하고 실제 호출 경로에 연결한다. 모듈별 필수 입력, 근거 추적, 누락/후보 차이 처리, 실제 본문 출력 계약을 작성한다.
2. 실제 코어 fixture와 결합한 대상별 수용 테스트·본문 검수를 통과하고 증거 파일 해시/테스트/검수 기록을 등록한다. 9장은 위 별도 경계 사례, 10장은 질문·답변·계획 일치 검사를 추가한다.
3. 상품 전체를 저장하고 재열람할 수 있는 전달 기능을 구현한다. 서버에서 생성 가능 여부·가격·대상·10장 범위를 다시 검사하고, 결제 웹훅 검증·중복 처리 방지·생성 실패 처리·구매자만 열람을 시험한다.
4. 대상별 전달 인증이 있어야 `deliveryVerified`를 변경한다. 이번 스크립트는 서버 가격/범위, 입력 검증, webhook, idempotency, report ownership, 생성 실패, 영속 전달, 결제 후 조회 검사를 요구한다.
5. 가격과 판매 개시는 사용자 결정으로 별도 반영한다. 현재 `price:null`, `available:false`, `cycleVerified:false`를 보존하는 출시 전 회귀 검사도 함께 검토한다. 이번 작업은 금액 확정·결제 활성화를 하지 않는다.

실행 테스트로 확인 가능한 것은 소프트웨어 계약과 차단 동작이다. 실제 유료 본문과 서버 전달 기능이 없는 현재 상태를 리포트 완성으로 판정하지 않는다.
