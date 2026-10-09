# 공부사주 · Study Saju

모바일 중심의 네이비·라벤더 랜딩페이지와 학습 비책 입력 화면입니다. 정확한 생시 입력·코어 연결 뒤 다섯 구역의 무료 결과를 제공합니다.

## 무료 결과

공부유형 → 수호카드 → 개인화 종합 해석 → 원국과 오행·음양 → 유료 운명서 안내 순서입니다. 자녀는 부모의 관찰·도움, 본인은 자기 이해·실천 관점으로 표시합니다. 모바일 한 열과 스크롤 등장 효과를 유지합니다.

수호카드는 **일간 오행 × 일지 동물 × 학습자 성별**로 120개 이미지 키 중 선택합니다. 전체 사주의 우세 오행은 사용하지 않습니다. 원국 후보가 다르면 임의로 하나를 확정하지 않고 가능한 범위를 보여줍니다. 생시 모름은 시주를 제외한 6글자, 그 외 8글자의 대표 오행과 음양을 셉니다.

두 카드와 유형 이름·핵심 문장은 이미지로 저장·공유할 수 있습니다. 이름·생년월일·출생시간·질문은 제외합니다. **기존 8유형 판정표와 최종 카드 이미지, 가격·실제 유료 제공 범위는 아직 연결 대기**입니다. 없는 결과나 결제 기능을 있는 것처럼 표시하지 않습니다.

현재 계약과 적용 파일은 [FREE_REPORT.md](FREE_REPORT.md), 이미지 등록은 [CARD_ASSETS.md](CARD_ASSETS.md)에 있습니다.

## 포함된 화면

- 산수화·구름 배경, 리포트 이미지와 스크롤 애니메이션
- 자녀 / 본인 선택 및 대상별 성별·생년월일·정확한 시·분·지역 입력
- “태어난 시간 모름” 체크 시 시·분 선택 비활성화, 해제 시 이전 선택 복원
- 공부 종류 8개 선택(2열·4행)과 대상별 개인화 질문 3단계
- 필수 개인정보 동의, 자녀 법정대리인 동의 및 상세 안내 모달
- 자녀 / 본인별 무료 해석 인트로 4장, 탭 전환·건너뛰기·금빛 영기 안개 CTA 전환
- 질문 뒤 입력 내용과 답변 확인 → 분석 시작 → 인트로 → 황금 안개 → 무료 결과 화면

## 실행하기

화면만 미리 볼 때는 별도 빌드가 필요하지 않습니다. 실제 계산까지 확인하려면 [코어 API 실행 안내](CORE_API.md)를 따라 Python 서비스와 함께 실행하세요. 정적 미리보기만 실행하면 계산 요청은 실패하며 기존 재시도 UI를 표시합니다.

```bash
python3 -m http.server 8000 --directory dist
```

- 랜딩페이지: http://localhost:8000/
- 입력 화면: http://localhost:8000/start.html

JavaScript 모듈을 사용하므로 HTML 파일을 직접 더블클릭하는 대신 HTTP 서버로 열어 주세요. 서체는 Google Fonts에서 불러옵니다. 정적 호스팅 시 배포 디렉터리는 `dist`입니다.

## 파일 구성

| 경로 | 용도 |
| --- | --- |
| `dist/index.html`, `style.css`, `app.js` | 랜딩페이지와 스크롤 연출 |
| `dist/start.html`, `intake.css`, `intake.js` | 대상 선택, 정보 입력과 단계 이동 |
| `dist/questionnaire.js` | 개인화 질문과 답변 데이터 |
| `dist/report-intro.js`, `report-intro.css` | 무료 해석 인트로 문구·자동 재생·금빛 영기 전환 |
| `dist/free-result.js` | 무료 결과 상태·실제 엔진 어댑터·취소 및 재시도 |
| `dist/free-report-*.js`, `free-report.css`, `interpretation-blocks.js`, `study-type-rules.js` | 다섯 구역·대상별 문구·승인 규칙 연결 |
| `dist/natal-display.js`, `result-share.js`, `report-offer.js` | 원국 집계·이미지 저장/공유·상품 안내 설정 |
| `dist/consent.js` | 동의 UI, 상태 및 교체 가능한 정책 문구 |
| `dist/landscape.webp`, `report-stack.webp` | 사용 중인 배경·리포트 이미지 |
| `dist/third-party-licenses.txt` | 포함 아이콘의 라이선스 |
| [INTEGRATION.md](INTEGRATION.md) | 앱·코어 연결 지점, 데이터 구조와 상세 안내 |

## 앱과 연결하기

기존 Saju Core Engine의 계산 API를 연결했습니다. 별도 엔진 체크아웃을 수정 없이 실행하고, 원국·음양오행·Feature·Trait·대운·세운 등 코어 JSON 전체를 받습니다. 무료 결과에는 원본 Trait에 맞춰 미리 작성한 해석 블록을 조합하는 계층을 추가했습니다. 승인된 공부유형 분류·완성 카드·유료 리포트 생성·결제·서버 저장은 별도 연결이 필요합니다. 코어 API와 기존 백엔드는 변경하지 않았습니다.

개인화 질문을 완료하면 `studysaju:intake-ready` 이벤트가 발생하고 입력·답변 확인 화면이 나옵니다. `event.detail`은 성별과 정확한 생시를 포함한 schemaVersion 6 데이터입니다. “타고난 공부 기질 알아보기”를 누르면 인트로가 시작되고, 금빛 안개 전환 뒤 `studysaju:intro-complete` 이벤트와 함께 무료 결과 화면이 열립니다.

생시는 `birthTime: {isUnknown, hour, minute}`로 전달합니다. 모름은 `isUnknown:true`와 `hour:null, minute:null`로 전달하며 임의 시각을 만들지 않습니다. 기존 시진 범위에서 정확한 시·분을 추정하지 마세요.

분석 버튼은 `/api/saju/v1/analyze`를 호출합니다. 결과는 `studysaju:core-ready` 이벤트와 `window.studySajuCore.getResult()`로 이용할 수 있습니다. v1.1 코어는 시진 입력에서는 해당 시간 범위로, 시간 모름에서는 출생 날짜 전체로 대운을 계산합니다. 공통/가능한 대운과 시작 시점 범위를 원본 그대로 받으며, 정확한 생시를 보내는 API는 기존 시각 계산을 유지합니다. 기존 확장 지점 `window.studySajuAnalyze(payload, {signal, calculation})`은 유지하며, 새 공부유형 구역은 FREE_REPORT.md의 `studyType` 확장 계약을 사용합니다. 어댑터가 없으면 확인된 원국·세부 특성만 표시하고 공부유형은 준비 중으로 남깁니다. 입력 수정·페이지 이탈 시 이전 요청과 결과를 폐기합니다. 실행, 전체 JSON 계약, 지역 매핑 및 제한은 [CORE_API.md](CORE_API.md)를 참조하세요.

개인정보 정책은 초안이며 보유기간·정책 버전·법정대리인 확인 절차·동의 기록 저장은 추후 연결할 구조입니다. 현재 입력 및 동의 선택은 페이지 메모리에만 유지되고 새로고침하면 초기화됩니다.

## 가져온 버전

최신 검증 결과: [대운 범위 계산 연결 검증](RANGE_INTEGRATION_VERIFICATION.md).

- 원본 소스 기준: `fb049870443a83d08d0529bce951e95a2de24c67`
- 실행에 필요한 현재 소스와 사용 중인 이미지를 포함했습니다.
- 이전 시안의 미사용 `study-report.png`와 원본 Sites 전용 호스팅 설정은 제외했습니다.
