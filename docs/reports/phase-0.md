# Phase 0 리포트 · 작업 환경 준비

상태: **사용자 입력 대기** (3차 확인 2026-11-21 — zip 이 아직 없음. 토큰·계정 확인은 2026-11-20 에 끝남)

## 사용자가 할 일

| # | 할 일 | 방법 |
| --- | --- | --- |
| 1 | 자료 묶음 올리기 | `wannab-materials.zip` 을 왼쪽 탐색기의 저장소 맨 위로 끌어다 놓기 |
| 2 | 다시 실행 | 이 Codespace 의 Claude Code 에 Phase 0 프롬프트를 다시 붙여 넣기(또는 "zip 올렸어") |

## 검증

| 무엇을 | 결과 |
| --- | --- |
| 실행 위치 | 워너비홈케어 새 저장소(커밋 1개, `README.md` 만 있음), Codespace 안 |
| `.gitignore` 필수 줄 | 모두 있음 |
| `git check-ignore -v .env.local` | `.gitignore:2:.env*` 에 걸림 |
| 이력의 `.env*` 파일 | 없음(모든 브랜치) |
| `.env.local` | 있음, 권한 600, git 무시 규칙에 걸림 |
| `setup-codespace.sh` 두 번 실행 | 성공, 두 번째는 모두 건너뜀 |
| 한글 글꼴 `fc-list :lang=ko` | 37개 (Noto CJK) |
| 한글 캡처 | 정상 — [phase-0/korean-font.png](phase-0/korean-font.png) |
| `env-check.mjs` | 실행 성공: 토큰 2개·`VERCEL_TEAM_ID`·`SUPABASE_ORG_ID` 있음 |
| `check-access.mjs` | 실행 성공. Vercel·Supabase 읽기 요청 HTTP 200. 가짜 토큰으로 실패 처리(HTTP 403/401) 확인 |
| 토큰 노출 검사(스크립트 안) | 통과 |
| 이 저장소 push | 가능(dry-run 성공, API 권한 push) |
| 기반 커밋 408ae56 받기 | 성공(임시 폴더, 받은 뒤 지움) |
| 자료 묶음 `wannab-materials.zip` | 없음(2026-11-21 다시 확인: 저장소·Codespace 디스크 전체·연결된 구글 드라이브에서 못 찾음) |
| `env-check.mjs` (2026-11-21) | 토큰 2개·팀/조직 ID 그대로 있음 |
| 외부 서비스에 만든 것·바꾼 것 | 0개 |

## 도구 버전

| 도구 | 버전 |
| --- | --- |
| Node.js | 24.22.2 (20.9 이상) |
| npm | 11.19.1 |
| git | 2.56.0 |
| gh | 2.103.3 |
| Vercel CLI | 66.5.0 |
| Supabase CLI (`npx supabase`) | 3.2.0 |
| Playwright | 1.65.1 (Chromium headless shell 159) |
| 한글 글꼴 | fonts-noto-cjk (37개) |

머신: CPU 2개, 메모리 7.8 GiB, `/workspaces` 남은 디스크 19 GB(32 GB 중).

## 계정 요약

| 항목 | 결과 |
| --- | --- |
| Vercel 범위(플랜) | Hobby 팀 1개(유료 팀 없음) · 프로젝트 1개 |
| Supabase 조직(플랜) | Free 조직 1개 · 활성 1 · 일시정지 0 |
| Supabase 무료 활성 프로젝트 | 1 / 2 → 새 프로젝트 만들 수 있음 |
| `wannab-homecare` (Vercel / Supabase) | 없음 / 없음 → 이름 쓸 수 있음 |
| `VERCEL_TEAM_ID` · `SUPABASE_ORG_ID` | `.env.local` 에 적음(`check-access.mjs --write-env`) |

## 이미 있는 Vercel 프로젝트

- Vercel Hobby 팀에 `wannabhomecare`(하이픈 없음) 프로젝트가 이미 있다. 2026-11-20 에 만들어졌고 **이 저장소에 연결돼 있다**. 이 저장소의 push 마다 자동 배포되며 최근 배포는 READY 다.
- 이번에는 건드리지 않았다(이름 변경·삭제·ID 기록 없음). Phase 1 에서 정한다. 권장: 이 프로젝트를 `wannab-homecare` 로 이름만 바꿔 쓰기. 같은 저장소에 프로젝트를 하나 더 연결하면 push 마다 두 번 배포된다.

## Git 배포 조건

| 항목 | 결과 |
| --- | --- |
| Codespace GitHub 사용자 | `wannabhomecare-jpg` |
| 커밋 작성자 이름 | `wannabhomecare-jpg` (같음) |
| 작성자 이메일 | GitHub noreply 주소 아님 |
| Vercel GitHub 연동으로 이 저장소 보기 | 예(이 저장소에 연결된 프로젝트가 있음) |
| 이 작성자 커밋의 Git 배포 | READY — Hobby 팀의 작성자 조건 충족 |

## 가정·메모

- 저장소 이름은 `wannabhomecare`(하이픈 없음)다. Vercel·Supabase 프로젝트 이름은 계획대로 `wannab-homecare` 를 쓴다.
- 이 Codespace 에는 Node 24 가 이미 있어 nvm 설치는 건너뛰었다.
- Playwright 1.65.1 의 Chromium 을 받았다. Phase 1 에서 다른 버전을 쓰면 그 버전의 브라우저만 다시 받는다.
- Supabase 무료 한도는 소유자·관리자인 조직만 센다. API 로 역할을 확실히 알 수 없어 `check-access.mjs` 는 모든 무료 조직의 활성 프로젝트를 합쳐 센다(실제보다 많게 셀 수는 있어도 적게 세지는 않는다).
- Vercel 범위가 Hobby 팀 여럿이면 첫 번째를 쓴다. 바꾸려면 `.env.local` 의 `VERCEL_TEAM_ID` 값을 원하는 팀 ID 로 바꾼다.
- Vercel GitHub 연동 확인: 이 저장소에 연결된 프로젝트가 있으면 '예'로 본다. 없으면 문서화되지 않은 읽기 API 를 쓴다(지금은 HTTP 400). 실패하면 '확인 불가'로 둔다.
- 1차 실행 뒤 토큰이 `.env.example`(git 추적 파일)에 들어가 있었다. 커밋·push 전에 발견해 `.env.local`(권한 600)로 옮기고 `.env.example` 은 빈 값으로 되돌렸다. git 이력·원격에는 들어가지 않았다.
- `check-access.mjs` 에 다시 시도(네트워크 끊김·429·5xx)를 넣었다. Codespace 에서 가끔 ECONNRESET 이 났다.
- Supabase 활성 프로젝트 1개는 이 조직의 기존 프로젝트다. 건드리지 않았다.
- push 하면 기존 Vercel 프로젝트가 자동 배포된다. 1차 실행 때도 같았다. 직접 배포한 것은 아니다.

## Phase 1 바로 실행

아니오 — 자료 묶음 zip 만 남았다. 올린 뒤 Phase 0 를 다시 실행하면 zip 확인만 하고 끝난다.
