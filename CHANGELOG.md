# Changelog

축구공(절단 정이십면체) 구조물 자동 생성 데모의 변경 이력입니다.

버전 형식은 시맨틱 버전 `vMAJOR.MINOR.PATCH`. 헤더에 표시되는 버전·날짜는
[js/app.js](js/app.js)의 `APP_VERSION` / `APP_UPDATED` 상수 **한 곳**에서 관리합니다.
버전을 올릴 때는 그 두 상수를 수정하고, 아래에 항목을 추가하세요.

## v2.1.0 (2026-06-27)
- 모델 생성 완료 후 자동으로 ISO 뷰 설정 — `POST /view/ANGLE` (H=30, V=15), Gen/Civil NX 공통 적용
- `index.html` 리팩터링: CSS → `css/style.css`, 다국어 → `js/strings.js`, 로직 → `js/app.js` 분리 (2269줄 → 464줄)

## v2.0.0 (2026-06-27)
- 버전 표기를 시맨틱 버전(`vX.X.X`) 형식으로 전환 (v2.0.0부터 시작)
- 모델 초기화를 항목별 DELETE(8회) → `POST /doc/new`(1회)로 교체 — Gen NX 알림음·삭제 경고 제거, 단위(N,MM) 재설정 추가
- 다국어 6개 언어 지원: 日本語·简体中文·ไทย 추가 (기존 한/영/번체) — 전 언어 249키 완전 일치
- 기본 언어를 영어로 변경, 언어 전환을 버튼 → 드롭다운(select)으로 교체
- 언어 설정을 `LANGS` 배열로 일원화 (새 언어 = `LANGS` 1줄 + `STRINGS` 1블록)
- 버전·업데이트 날짜를 헤더에 함께 표시, 단일 상수(`APP_VERSION`/`APP_UPDATED`)로 일원화
- API 연결 단계에 **Base URL 입력칸** 추가 — 제품(Gen/Civil) 기본값 자동 채움 + 수정 가능
- 연결 테스트를 `/mapikey/verify` 방식으로 교체 (`keyVerified:true` 기준)
- 연결 실패 원인을 코드(`disconnected`/`mismatch`/`http`)로 구분해 언어별 안내 메시지 표시
  (제품 미실행, 제품 불일치 등) — "HTTP HTTP" 중복 표기 제거
- 백엔드 호출을 상대경로로 전환 (Vercel 프로젝트명 변경에 영향 없음, CORS 불필요)

## V260509 (2026-05-09)
- 초기 릴리스: 제품 선택 → API 연결 → 파라미터 → 경계/하중 → 3D 미리보기 → 모델 생성 → 해석 워크플로우
