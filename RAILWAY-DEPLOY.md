# Railway 배포 기준

현재 상태는 **설정 준비 완료 / 실제 배포 보류**입니다. `git push`와 Railway 서비스 연결은 사용자가 명확히 `배포해줘`라고 말한 뒤에만 진행합니다.

## 확정된 구성

- 배포처: Railway
- GitHub 저장소: `Oneengineer87/doanhosu-runcrew`
- 운영 브랜치: `main`
- 공개 대상: `public/` 폴더만
- 서버: Docker 안의 Caddy 정적 서버
- 상태 확인: `/healthz`
- 사용자가 등록할 환경변수: 없음
- `PORT`: Railway가 자동으로 제공하므로 직접 등록하지 않음
- Procfile: 사용하지 않음
- `railway.toml`: 사용하지 않음 (`railway.json` 한 곳에서만 관리)

## Railway 대시보드에서 나중에 할 일

1. New Project에서 GitHub 저장소 `Oneengineer87/doanhosu-runcrew` 연결
2. 서비스 브랜치를 `main`으로 지정
3. 처음에는 Autodeploy를 끈 상태로 유지
4. GitHub Actions의 `Site safety checks`가 정상 통과하는지 확인
5. Railway의 `Wait for CI`를 켬
6. 최종 사이트 승인 후 `public/site-status.json`의 `deployReady`를 `true`로 변경
7. 사용자가 `배포해줘`라고 말하면 커밋·push 후 Autodeploy 활성화
8. Networking에서 Railway 도메인을 생성하고 카카오톡·모바일에서 확인

## 앞으로 사이트를 업데이트할 때

1. `public/` 안의 파일만 수정
2. `npm run check`로 링크·파일·공개 범위 검사
3. 최종 공개 전에는 `npm run check:release`도 통과 확인
4. 사용자 확인 후에만 `main`으로 push
5. GitHub 검사가 성공하면 Railway가 자동 배포
6. `/healthz`가 200을 반환한 뒤 새 버전으로 트래픽 전환

## 배포는 항상 GitHub `main` 기준으로만 (2026-07-21 사고 재발 방지)

2026-07-21에 Codex 쪽에서 배포했더니 방금 반영한 최신 내용이 사라지고 구버전이 뜨는 사고가 있었다.
원인은 `railway up`처럼 **로컬 폴더를 그대로 올리는 수동 배포**를 썼는데, 그 로컬 사본이 GitHub의 최신 커밋보다 오래된 상태였기 때문이다. git 커밋 자체는 최신이었지만, 배포는 git과 무관하게 로컬 스냅샷을 그대로 올려버려서 최신 커밋을 덮어썼다.

그래서 이제부터는:

- **`railway up` 등 로컬 스냅샷을 직접 올리는 배포 명령을 쓰지 않는다.** 배포는 오직 GitHub `main` push → Railway Autodeploy 경로로만 한다.
- 배포(또는 배포 상태 확인) 전에는 항상 `git fetch origin main && git status -sb`로 로컬이 origin/main과 동일한지 먼저 확인한다. 뒤처져 있으면 절대 그 상태로 배포하지 않는다.
- Claude Code에서 작업하든 Codex에서 작업하든 이 규칙은 동일하게 적용된다 — 누가 배포하든 결과는 항상 GitHub `main`의 최신 커밋이어야 한다.
- 배포 후에는 실제 라이브 주소에 접속해서 방금 반영한 내용이 보이는지 확인하고 나서 "배포 완료"라고 보고한다.

## 공개 폴더에 넣으면 안 되는 것

- 운영진 내부 문서와 개인정보
- `brief.html` 같은 주소만 숨긴 비공개 페이지
- R5~R13 비교 시안
- 회의자료·조사자료·원본 사진
- `.env`, API 키, 비밀번호

정적 사이트에서 메뉴에 숨긴 페이지는 실제 비공개가 아닙니다. 운영진 자료는 Railway 공개 폴더 밖에 유지합니다.
