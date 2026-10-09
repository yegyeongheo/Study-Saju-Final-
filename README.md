# 공부사주 · Study Saju

모바일 중심의 네이비·라벤더 랜딩페이지와 학습 비책 입력 화면입니다. 최신 버전은 **v5.6 — 푸른빛·금빛 영기**입니다.

## 포함된 화면

- 산수화·구름 배경, 리포트 이미지와 스크롤 애니메이션
- 자녀 / 본인 선택 및 대상별 생년월일·생시·지역 입력
- 공부 종류 8개 선택(2열·4행)과 대상별 개인화 질문 3단계
- 필수 개인정보 동의, 자녀 법정대리인 동의 및 상세 안내 모달
- 자녀 / 본인별 무료 해석 인트로 4장, 탭 전환·건너뛰기·푸른빛·금빛 영기 안개 CTA 전환
- 입력 내용과 답변 확인 화면

## 실행하기

별도 설치나 빌드가 없는 HTML·CSS·JavaScript 프로젝트입니다. 저장소 루트에서 다음 명령을 실행합니다.

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
| `dist/report-intro.js`, `report-intro.css` | 무료 해석 인트로 문구·자동 재생·푸른빛·금빛 영기 전환 |
| `dist/consent.js` | 동의 UI, 상태 및 교체 가능한 정책 문구 |
| `dist/landscape.webp`, `report-stack.webp` | 사용 중인 배경·리포트 이미지 |
| `dist/third-party-licenses.txt` | 포함 아이콘의 라이선스 |
| [INTEGRATION.md](INTEGRATION.md) | 앱·코어 연결 지점, 데이터 구조와 상세 안내 |

## 앱과 연결하기

현재는 프런트엔드 UI입니다. 실제 사주 계산·무료 해석·결제·서버 저장은 아직 연결하지 않았습니다.

개인화 질문을 완료하면 `window`에서 `studysaju:intake-ready` 이벤트가 발생합니다. `event.detail`에 대상 정보, 공부 종류, 동의 선택 및 개인화 답변이 담깁니다. 이 이벤트에서 결과 데이터를 준비할 수 있습니다. 인트로의 최종 버튼과 영기 전환이 끝나면 `studysaju:intro-complete` 이벤트가 같은 데이터로 발생합니다. 실제 무료 해석 화면으로의 이동은 이 두 번째 이벤트에 연결하세요. 현재는 기존 입력 확인 화면으로 이어집니다.

개인정보 정책은 초안이며 보유기간·정책 버전·법정대리인 확인 절차·동의 기록 저장은 추후 연결할 구조입니다. 현재 입력 및 동의 선택은 페이지 메모리에만 유지되고 새로고침하면 초기화됩니다.

## 가져온 버전

- 원본 소스 기준: `a109b78ead0ef942651a0acb16c7d9f732d895fe`
- 실행에 필요한 현재 소스와 사용 중인 이미지를 포함했습니다.
- 이전 시안의 미사용 `study-report.png`와 원본 Sites 전용 호스팅 설정은 제외했습니다.
