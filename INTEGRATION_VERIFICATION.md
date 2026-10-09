# 코어 연결 검증 — 2026-10-09

이 문서는 초기 v1.0 코어 연결 당시의 검증 기록이다. 이후 사용자 요청으로 코어의 시진/시간 모름 대운 계산을 범위 계산으로 수정했으며, 최신 동작은 [CORE_API.md](CORE_API.md)의 v1.1 계약을 따른다. 아래 `BIRTH_TIME_UNCERTAIN` 결과는 변경 전 기록이다.

- 기준 사이트: `ff786b070010e9695d0fcde6d0d3b7c40f534987`
- 원본 코어: `015ce53c416032f164404cbae62e1bda5d9750b3`
- 실행: Windows, Python 3.12.14, 코어 `requirements.lock` 전부 설치, Node.js 21.6.2
- 실제 배포·병합: 하지 않음

| 검증 | 결과 |
| --- | --- |
| `node --test tests/core-client.test.js tests/free-result.test.js` | 8개 통과 |
| `python -X utf8 -B -m unittest discover -s tests -p test_api.py -v` | 5개 통과, 75.555초 |
| 원본 `verify_release.py --expected-sha256 …` | 112개 파일 검증, external-pin 일치 |
| 코어 `git diff --exit-code` 및 `git status --porcelain` | 변경 없음 |
| 사이트 `git diff --check` | 통과 |

HTTP 통합 검사는 합성 입력으로 실제 `127.0.0.1` 서버를 실행했다. 남녀 원국/타임라인, 자시, 시간 모름, 음력, 윤달, parentChild 관계를 포함한 9개 정상 요청에서 HTTP 응답 JSON **전체**가 기존 `run_api.py` 응답과 동일했다. 잘못된 날짜·시간대·윤달 등 5개 요청의 원본 오류 응답도 동일했다.

사이트에서 사용하는 JS 어댑터를 실제 HTTP 서버로 연결하여 본인 및 자녀/보호자 양쪽 경로와 잘못된 날짜를 검증했다. 원국·음양오행·Feature·Trait·근거·요약·세운·대운 가용성 필드를 확인했다. 정확한 생시의 대운/세운은 계산되며, 시진/모름 입력은 원본 규칙대로 대운 불가 사유 `BIRTH_TIME_UNCERTAIN`과 세운을 반환했다.

프런트 검사는 12시진·모름 매핑, 음력/윤달 보존, 이름/개인화 질문 미전송, 응답의 추가 필드 보존, 오류·취소·시간 초과·지연 응답 무시·결과 초기화·페이지 이탈을 확인했다. HTTP 검사는 JSON/입력 크기/중첩/출처/정적 파일 접근 경계와 승인 해시 불일치 거부를 확인했다.

HTML·CSS·이미지·설문·인트로 파일은 변경하지 않았다. 프런트 상태 테스트는 DOM 대역을 사용했으며 실제 모바일 브라우저 시각 검수 및 운영 호스팅 검증은 수행하지 않았다. 현재 UI의 시진/모름 입력, 추정 지역 좌표, 해외·기타 입력 제한은 [CORE_API.md](CORE_API.md)에 명시했다.
