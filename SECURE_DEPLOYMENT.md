# 운영 API 보호

운영 진입점 `server.wsgi:application`은 `SAJU_API_TOKEN`이 없거나 형식이 잘못되면 시작하지 않는다. `python -m server.app`은 127.0.0.1 전용 개발 서버이며 운영에 사용하지 않는다.

토큰은 `secrets.token_urlsafe(32)`로 생성한 무작위 값처럼 URL-safe 43자 이상이어야 한다. Render와 Sites의 비밀 환경변수에 같은 값을 저장한다. 채팅, 저장소, dist, 브라우저 환경변수에 저장하지 않는다. 키 교체 시 양쪽을 함께 갱신한다.

Sites의 서버 전용 `sites/worker.js` 중계는 `SAJU_API_ORIGIN`(Render HTTPS origin)과 `SAJU_API_TOKEN`을 사용한다. 배포 시 기존 Sites 소스와 정적 자산 바인딩에 통합해야 한다. 현재 파일 추가만으로 기존 Sites에 배포되지는 않는다. 서버 중계만 Bearer 인증을 추가하며 브라우저가 보낸 인증/식별 헤더는 전달하지 않는다. Cloudflare가 제공하는 CF-Connecting-IP를 비밀키로 HMAC 처리하여 클라이언트 식별자를 만든다. 플랫폼에서 해당 헤더가 신뢰 가능하게 제공되는지 배포 전 확인해야 하며 누락 시 요청을 거부한다.

Render는 인증 후 클라이언트당 60초에 6건, 프로세스 전체 30건을 허용한다. 초과 시 429와 Retry-After를 반환한다. 이 제한은 사용자 계정 기준이 아닌 IP 기반이며 공유 네트워크 사용자가 한도를 공유한다. 메모리 기반이므로 재시작 시 초기화된다. 현재 설정은 단일 인스턴스, Gunicorn `--workers 1 --threads 4`를 전제로 한다. 다중 인스턴스 운영 시 공유 제한 저장소가 필요하다. 분산 공격 방어 전체를 대체하지 않는다.

요청 본문 32 KiB, 코어 계산 동시 2건, 계산 제한 25초를 유지한다. 인증 실패는 본문 읽기와 계산 전에 반환한다. 운영 health는 status만 반환한다. 접근 로그에 Authorization, 입력 본문, 출생정보를 추가하지 않는다.

기존 안내의 `829aaa3...` 커밋에는 운영 인증이 없으므로 배포하지 않는다. 보안 수정이 포함된 커밋을 고정해서 배포해야 한다. Render 주소와 양쪽 비밀 환경변수 설정 후 실제 인증/비인증 및 Sites 경유 요청을 검증해야 운영 연결이 완료된다.

검증: `python -m unittest discover -s tests -p test_security.py -v`, `node --test tests/*.test.js`.
