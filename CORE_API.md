# 코어 계산 API 연결

계산은 별도 비공개 `Saju-Core-Engine` 체크아웃의 `saju_core.api.analyze`만 수행한다. 이 저장소에는 엔진 소스·동결 사양·설정·계산식을 복사하거나 수정하지 않는다. 사이트는 입력 변환, HTTP 전송, 원본 JSON 보관만 담당한다. 유형 분류, 해석 문구, 리포트 생성은 구현하지 않는다.

## 실행 준비

Python **3.12.14**와 Git, 테스트용 Node.js 20 이상이 필요하다. 엔진 저장소에 접근 가능한 계정으로 두 저장소를 나란히 받는다. 이미 체크아웃이 있으면 다시 복제할 필요가 없다.

```powershell
git clone https://github.com/yegyeongheo/Saju-Core-Engine.git ../Saju-Core-Engine
git -C ../Saju-Core-Engine checkout --detach 015ce53c416032f164404cbae62e1bda5d9750b3
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r ../Saju-Core-Engine/requirements.lock
.venv/Scripts/python.exe -B -m server.app --port 8000
```

macOS/Linux에서는 `.venv/bin/python`을 사용한다. 다른 위치의 엔진은 `SAJU_CORE_ROOT` 환경변수로 지정한다. `/start.html`에서 기존 입력 흐름을 사용한다. 서버는 로컬 `127.0.0.1`에만 바인딩되며 `dist`와 API를 같은 출처로 제공한다. 서버 시작 시 Python·의존성·동결 파일·원본 소스 112개를 검증한다. 고정 버전이 다르면 실행을 중단한다.

`core-engine.lock.json`의 Git 커밋, buildId, manifest SHA-256을 기준으로 실행한다. 서비스는 체크아웃 밖의 lock에서 읽은 해시를 코어의 `SAJU_EXPECTED_SOURCE_SHA256`에 전달한다. 별도 환경변수가 지정되면 lock과 같은 값이어야 한다. `SAJU_CORE_ROOT`나 lock 변경으로 새 엔진을 도입할 때는 별도의 검토가 필요하다. 실행 중 원본 파일 변경도 코어의 요청별 무결성 검사에서 거부한다.

## HTTP 계약

`POST /api/saju/v1/analyze`, `Content-Type: application/json`

요청과 응답은 **기존 코어 public-v1 JSON 규격 그대로**다. `natal`, `timeline`, `pair`를 모두 지원한다. 코어의 `run_api.py` 입력을 그대로 POST할 수 있다. `timeline` 응답은 원국 계산 전체와 대운·세운·상호작용을 함께 포함하므로 사이트는 이 연산을 사용한다.

```json
{
  "schemaVersion": "1.0.0",
  "requestId": "example-2026",
  "operation": "timeline",
  "subjects": [{
    "id": "learner",
    "role": "person",
    "birthDate": "1990-05-12",
    "calendar": "solar",
    "calendarSystem": "gregorian",
    "isLeapMonth": false,
    "birthTime": {"mode": "exact", "value": "07:40:00", "uncertaintySeconds": 0},
    "birthPlace": {"ianaTz": "Asia/Seoul", "longitude": 126.98, "latitude": 37.57, "precision": "city"},
    "luckDirectionBasis": "F"
  }],
  "period": {"startUtc": "2026-01-01T00:00:00Z", "endUtc": "2027-01-01T00:00:00Z"},
  "options": {"ruleProfile": "public-v1", "ziPolicy": "dual"},
  "locale": "ko-KR"
}
```

| 결과 | 코어 JSON 경로 |
| --- | --- |
| 원국 및 후보별 확률 | `result.subjects[].candidates[].pillars`, `weight`, `weightFraction` |
| 음양·오행 | `candidates[].features.values.yangRatio`, `wood/fire/earth/metal/water` 및 `features.featureDetails` |
| Feature 전체 | `candidates[].features` |
| Trait·발현·근거 | `candidates[].traits`, `candidates[].evidence` |
| 후보 통합 요약 | `result.subjects[].summary` |
| 대운·세운·상호작용·전환·근거 | `result.timeline.data.segments[]` 전체 |
| 관계 계산 | `result.pair` (`operation: pair` 요청 시) |
| 버전·재현 식별자·경고·가용성 | `versions`, `inputDigest`, `warnings`, `result.layers` |

표에 없는 필드도 그대로 반환한다. JSON 값 전체를 원본 CLI 응답과 비교하는 테스트를 포함한다. 구조 단순화, 후보 선택, 반올림, 점수 재계산, 임의 기본값 채우기를 하지 않는다. `GET /api/saju/v1/health`는 시작 시 검증한 buildId, manifest 해시, 검증 파일 수를 제공한다. 성공 응답에는 `X-Saju-Build-ID` 헤더가 있다.

HTTP 200은 코어 `ok` 또는 `partial`, 422는 코어 입력 오류다. 부분 결과는 성공적으로 수신한 계산 결과이며, `availability`, `reason`, 경고를 보존한다. 400은 JSON 파싱·유한값·UTF-8·32단계 중첩 제한 오류, 413은 32 KiB 초과, 415는 잘못된 미디어 유형, 403은 다른 Origin, 503은 실행 불가/버전 불일치/작업 수 초과, 504는 25초 엔진 실행 제한이다. 코어가 반환한 오류 JSON은 그대로 전달하고, HTTP 전송 계층 자체 오류는 `{status:"error", error:{code}}`다. 계산 JSON은 캐시하지 않는다.

## 사이트 연결과 결과 사용

기존 정보 확인 → 분석 버튼 → 인트로 → 결과 화면 흐름을 유지한다. 분석 버튼에서 `calculateCore`가 시작되며 기존 오류·재시도 UI를 사용한다. 성공하면 기존 상태 영역에 계산 완료와 해석 준비 중 안내를 표시한다. HTML, CSS, 이미지, 인트로, 설문 단계는 변경하지 않는다.

```javascript
window.addEventListener('studysaju:core-ready', event => {
  const calculation = event.detail;
  const learner = calculation.subjects.learner; // 원본 코어 응답 전체
  const guardian = calculation.subjects.guardian; // 자녀 흐름에서만 존재
  // 이후 별도로 개발할 사이트 기능에서 읽는다.
});
const latest = window.studySajuCore.getResult(); // 독립 복사본 또는 null
window.addEventListener('studysaju:core-cleared', () => {
  // 별도 기능이 보관한 이전 결과도 폐기한다.
});
```

결과의 외부 포장만 `{schemaVersion:"studysaju-calculation-v1", period, subjects:{learner, guardian?}}`이며 각 subject에는 원본 코어 응답이 들어 있다. 기본 조회 기간은 **한국 시간 기준 올해 1월 1일 이상 ~ 다음 해 1월 1일 미만**이다. 더 넓은 기간은 `calculateCore(payload, {signal, period})` 또는 원본 `timeline` API로 요청한다. 자동으로 평생 대운표를 생성하지 않는다.

자녀 흐름에서는 자녀와 보호자 각각의 원국·타임라인을 받는다. 보호자가 조부모일 수도 있으므로 보호자 역할을 임의로 `parent`로 바꾸거나 관계 연산을 자동으로 요청하지 않는다. `pair`는 명시적 원본 요청으로 이용할 수 있다.

결과는 페이지 메모리에만 보관한다. 이름, 공부 종류, 개인화 질문, 동의 객체는 코어에 전송하지 않는다. 입력 수정·재시도·페이지 이탈 때 결과를 비우고 이전 응답을 무시한다. 30초 초과 시 프런트 요청을 취소하며 서버에서 이미 시작한 계산은 최대 25초 제한 내에서 종료한다. 페이지가 BFCache에서 복원되어도 이전 결과는 재사용하지 않는다.

기존 `window.studySajuAnalyze` 리포트 확장 지점은 유지하지만 구현은 제공하지 않는다. 별도 개발 시 `(payload, {signal, calculation})`으로 이미 받은 코어 데이터를 전달받는다. 이 함수가 없어도 코어 계산과 결과 보관은 정상 동작하며 해석 문구를 생성하지 않는다.

## 입력 매핑과 현재 한계

- 양력은 `gregorian`, 음력은 `korean_lunisolar`. 입력 날짜와 윤달 여부를 그대로 보내며 음양력 변환과 유효성 판단은 코어에서 수행한다.
- 남성/여성은 코어의 `luckDirectionBasis: M/F` 입력에 대응한다. 보호자 관계로 성별을 추정하지 않는다.
- 12시진은 `mode: branch`, 자시도 `ziPart: unspecified`, 시간 모름은 `mode: unknown`. 임의의 정각·정오로 바꾸지 않는다.
- **현재 UI는 정확한 생시를 수집하지 않으므로 대운은 `BIRTH_TIME_UNCERTAIN`으로 계산 불가가 반환된다.** 세운, 원국, Feature, Trait 등 계산 가능한 값은 전달된다. 원본 API에 정확한 시각을 요청하면 대운도 반환됨을 테스트한다. 대운을 UI에서 계산 가능하게 하려면 정확한 시각 수집을 별도 작업으로 추가해야 한다.
- 국내 지역은 `Asia/Seoul`과 아래 추정 대표 좌표를 전달하며 항상 `precision: region`으로 표시한다. 코어가 `ESTIMATED_LOCATION` 경고를 반환한다. 대표점은 지역의 실제 경계 중심이나 사용자의 실제 출생 좌표가 아니다. 경계 시각에 민감한 정확 계산에는 더 구체적인 위치 수집이 필요하다.
- `해외·기타`는 국가/시간대/좌표가 없어 `BIRTH_PLACE_REQUIRED`로 중단한다. 서울 좌표로 대체하지 않는다. 원본 API는 위치·IANA 시간대를 직접 제공하는 해외 입력도 지원한다.

| 지역 | 대표점 기준 | 경도 | 위도 |
| --- | --- | ---: | ---: |
| 서울 | 서울 | 126.98 | 37.57 |
| 부산 | 부산 | 129.08 | 35.18 |
| 대구 | 대구 | 128.60 | 35.87 |
| 인천 | 인천 | 126.71 | 37.46 |
| 광주 | 광주 | 126.85 | 35.16 |
| 대전 | 대전 | 127.38 | 36.35 |
| 울산 | 울산 | 129.31 | 35.54 |
| 세종 | 세종 | 127.29 | 36.48 |
| 경기 | 수원 | 127.03 | 37.26 |
| 강원 | 춘천 | 127.73 | 37.88 |
| 충북 | 청주 | 127.49 | 36.64 |
| 충남 | 홍성 | 126.66 | 36.60 |
| 전북 | 전주 | 127.15 | 35.82 |
| 전남 | 무안 | 126.46 | 34.81 |
| 경북 | 안동 | 128.73 | 36.57 |
| 경남 | 창원 | 128.68 | 35.23 |
| 제주 | 제주 | 126.53 | 33.50 |

## 검증

```powershell
node --test tests/core-client.test.js tests/free-result.test.js
.venv/Scripts/python.exe -B -m unittest discover -s tests -p test_api.py -v
```

실제 로컬 HTTP 서버와 변경하지 않은 코어를 사용한다. 원본 CLI와 응답 전체 동등성, 남녀 대운/세운, 자시/모름의 부분 결과, 음력/윤달, 관계 API, 잘못된 날짜/시간대, 본인·자녀/보호자의 사이트 어댑터 호출을 검사한다. 프런트 테스트는 입력 매핑·데이터 보존·취소·지연 응답·오류·재시도·페이지 이탈을 검사한다. 테스트 데이터는 합성 입력이다.

## 배포 경계

**이번 작업은 실제 배포하지 않는다. 배포 전 사용자 승인이 필요하다.**

승인 후 Python 서비스와 `dist`를 같은 HTTPS 출처에 연결해야 한다. 정적 호스팅만으로는 Python 코어를 실행할 수 없다. WSGI 서버의 진입점은 `server.wsgi:application`이다. `server.app`의 개발 서버는 운영 서버가 아니다. 역방향 프록시에서 `/api/saju/v1/*`를 WSGI로, 나머지를 `dist`로 전달하고 외부 요청/응답 본문을 로그에 남기지 않는다. Origin 검사에는 신뢰할 수 있는 프록시의 실제 scheme/Host 전달이 필요하다. 시간 제한·요청량 제한은 운영 서버에서 설정한다.

코어 저장소는 서버 전용 위치에 두며 정적 `dist`나 공개 사이트 저장소에 넣지 않는다. GitHub 자격 증명은 서버 설치 과정에만 사용한다. 기존 동의 정책은 초안이므로 실제 이용자 대상 배포 시 서비스 정책과 별도 개발 범위를 검토한다.
