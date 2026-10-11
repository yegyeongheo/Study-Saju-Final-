# 9,900원 구매 → 무료 해석 + 유료 10장

2026-10-11 적용. 실제 결제 서비스 연결은 Render 이전 후 진행한다.

## 현재 화면

1. 무료 해석 하단 버튼: **9,900원 결제하기** (자녀/본인 공통).
2. `start.html#checkout`: 상품명, 9,900원, 무료 해석 + 10개 챕터, 목차, 결제 준비 중 안내.
3. 이 화면의 실제 결제 버튼은 disabled이며 결제 요청을 보내지 않는다.
4. `전체 리포트 구성 미리보기` → `#report-preview`. 기존 무료 결과 DOM을 그대로 옮겨 보여주고, 10개의 장 제목·설명·현재 모습/주의점/해결책 구성을 이어서 보여준다. 유료 개인화 본문이 아닌 목차 미리보기임을 명시한다.
5. 자녀/본인 선택에 맞게 제목과 기존 10장 목차를 적용한다. 무료 결과는 유지되며, 뒤로 가면 원래 위치로 복원한다.
6. 긴 리포트 상단의 고정 목차로 무료 부분과 01~10장에 바로 이동한다. 모바일은 단일 열이다.

## 결제 완료 후 준비된 경로

결제 서버의 확인을 거쳐 `start.html#full-report`로 돌아온다. 페이지가 새로 로드되어 입력 폼 메모리가 없어도 이 경로를 인식한다.

`GET /api/study-reports/current`를 `credentials:same-origin`, `cache:no-store`로 요청한다. 현재 Sites 서버는 503 `PAYMENTS_NOT_CONNECTED`를 반환한다. `paid=true`, localStorage, URL의 결제 성공 문구, 클라이언트 이벤트로 유료 본문을 열지 않는다.

응답 상태:
- `unavailable`: 결제 연결 전 안내
- `payment_required` / HTTP 401·403: 구매 계정 및 구매 내역 확인
- `processing`: 서버에서 결제를 확인했지만 리포트 준비 중
- `failed`: 다시 결제하지 말고 조회 재시도 안내
- `ready`: 서버가 제공한 무료 결과와 10장 본문 표시

요청 실패·20초 지연에는 재시도할 수 있다. 화면 이탈 시 요청을 취소하고 늦게 온 이전 응답은 무시한다.

## Render 연결 계약

실제 주문 저장·결제 PG·웹훅·로그인/구매자 인증·유료 본문 생성기는 이번 변경의 구현 범위가 아니다. 아래 조건으로 별도 연결한다.

1. 서버에서 현재 분석 결과의 불변 스냅샷 및 보고서 ID를 저장한다. 재분석이나 다른 사람의 결과로 기존 구매 문서가 바뀌면 안 된다. 제공·보유 정책에 맞춰 개인정보를 저장한다.
2. `POST /api/checkout/session`: 인증된 사용자의 보고서 ID를 받아 주문을 생성한다. 상품은 `study-fortune-v1`, 금액은 서버에서 9900 KRW로 고정한다. 클라이언트가 보낸 금액·소유자·결제 여부는 신뢰하지 않는다. 완성된 10장 제공 여부/시기 해석 검증 등 출시 조건을 서버에서 확인한 후에만 결제를 받는다.
3. PG의 공식 확인 API/서명된 웹훅으로 주문·금액·통화·상품·구매자를 대조하고 멱등 처리한다. redirect 성공만으로 결제를 확정하지 않는다. 취소·실패·환불도 서버 상태에 반영한다.
4. 인증 세션에 구매 권한을 연결한다. 결제 완료 후 동일 출처의 `start.html#full-report`로 이동한다. 입력 생년월일·이름·질문을 URL에 넣지 않는다.
5. `GET /api/study-reports/current`는 로그인/구매 세션과 보고서 소유권을 **매번 서버에서 검증**하고, 환불되거나 타인인 경우 본문을 반환하지 않는다. 보고서가 여러 개인 경우 서버의 결제 세션/선택 보고서 ID로 정확한 주문에 귀속한다.
6. 유료 본문은 정적 JS/HTML에 포함하지 않는다. 검증 후 API로만 전달하며 개인화 응답은 `Cache-Control: private, no-store`를 사용한다.
7. 실제 결제 연동 시 `checkout-pay` 버튼에 서버 주문 생성 및 PG 이동을 연결하고 비활성화를 해제한다. 지금은 버튼의 준비 중 상태와 두 API의 503 응답을 유지한다.

프런트의 응답 검사는 화면 오류 방지를 위한 스키마 검사다. 보안 및 구매 권한 판정은 반드시 서버에서 수행한다.

### ready 응답 형식

```js
{
  schemaVersion: 'study-report-access-v1',
  status: 'ready',
  payment: {
    status: 'verified',
    productId: 'study-fortune-v1',
    amount: 9900,
    currency: 'KRW'
  },
  report: {
    id: '서버가 발급한 불투명 ID',
    audience: 'self', // 또는 child
    freeResult: {
      calculation: {/* 기존 core-client 계산 결과, subjects.learner 포함 */},
      payload: {/* 최소 표시 컨텍스트: audience, learner, study, 질문 선택 ID */},
      report: null // 기존 무료 해석 어댑터의 studyType 데이터가 있으면 포함
    },
    chapters: [
      {
        number: 1,
        status: 'ready',
        sections: [
          {role:'state', heading:'승인된 현재 상태 소제목', paragraphs:['현재 모습 본문']},
          {role:'pain', heading:'승인된 주의점 소제목', paragraphs:['주의점 본문']},
          {role:'solution', heading:'승인된 해결책 소제목', paragraphs:['해결 방법 본문']}
        ]
      }
      // 2~10장 모두 포함. 9장은 실제 검증 완료 시 cycleVerified:true 필요.
    ]
  }
}
```

`freeResult`는 무료 화면과 동일한 결과를 복원하기 위한 최소 표시 데이터다. 클라이언트 `getSnapshot()`은 현재 화면에서 이 형태를 만들지만, 서버가 구매 대상 분석 스냅샷과 대조해야 한다. 구매 권한이나 사주 사실의 증거로 신뢰하면 안 된다. 실제 출생 원문은 공유 이미지에 추가하지 않는다.

## 변경 위치와 검증

- `public/report-offer.js`: 9,900원 상품 설정
- `public/free-report-view.js`: 구매 안내 CTA
- `public/free-result.js`: 무료 결과 메모리 스냅샷/복원
- `public/start.html`, `public/intake.js`: 구매·미리보기·전체 리포트 화면과 이력 이동
- `public/report-flow.js`, `public/report-flow.css`: 독서 화면·목차·상태 표시
- `public/report-access.js`: 서버 조회·응답 검증
- `server/commerce.js`, `server/worker.js`, `build.mjs`: 연결 전 API 503 응답 및 패키징
- `tests/report-flow.test.mjs`: 결제 미연결, 잘못된 결제/장수/대상/시기 플래그, 두 대상 목차, 무료 결과 복원, 요청 취소·지연 응답 검사

기존 검사 포함 자동 테스트 58개 통과. 실제 PG 결제는 연결하지 않았으며, 실제 모바일 브라우저 직접 조작 검수는 수행하지 못했다.

동시 작업의 `9474d3d` 리포트 편집 구조를 병합했다. `paid-report-spec.js`의 승인된 60개 소제목·도입문을 미리보기와 목차에서 재사용한다. 실제 응답의 section.role은 state/pain/solution 순서이며 heading은 해당 spec과 일치해야 한다. 실제 구매 허용은 report-readiness의 제공 검증과 서버 결제 검증을 함께 통과해야 한다. 현재 제공 인증을 임의로 추가하지 않았다.
