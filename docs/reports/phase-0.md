# Phase 0 리포트 · 작업 환경 준비

상태: **사용자 입력 대기** (1차 실행 2026-11-20)

## 사용자가 할 일

| # | 할 일 | 방법 |
| --- | --- | --- |
| 1 | Vercel 토큰 만들기 | vercel.com → 오른쪽 위 프로필 → Account Settings → Tokens → Create Token (Scope: Hobby 팀, 만료는 오픈 이후 날짜) |
| 2 | Supabase 토큰 만들기 | supabase.com/dashboard → 왼쪽 아래 프로필 → Account preferences → Access Tokens → Generate new token |
| 3 | `.env.local` 만들기 | 왼쪽 탐색기 저장소 맨 위에 새 파일 `.env.local` 을 만들고 두 줄 입력: `VERCEL_TOKEN=<1번 토큰>`, `SUPABASE_ACCESS_TOKEN=<2번 토큰>` |
| 4 | 자료 묶음 올리기 | `wannab-materials.zip` 을 왼쪽 탐색기의 저장소 맨 위로 끌어다 놓기 |
| 5 | 다시 실행 | 이 Codespace 의 Claude Code 에 Phase 0 프롬프트를 다시 붙여 넣기 |

## 검증

| 무엇을 | 결과 |
| --- | --- |
| 실행 위치 | 워너비홈케어 새 저장소(커밋 1개, `README.md` 만 있음), Codespace 안 |
| `.gitignore` 필수 줄 | 모두 있음 |
| `git check-ignore -v .env.local` | `.gitignore:2:.env*` 에 걸림 |
| 이력의 `.env*` 파일 | 없음(모든 브랜치) |
| `.env.local` | 아직 없음 → 2차 실행에서 권한 600 확인 |
| `setup-codespace.sh` 두 번 실행 | 성공, 두 번째는 모두 건너뜀 |
| 한글 글꼴 `fc-list :lang=ko` | 37개 (Noto CJK) |
| 한글 캡처 | 정상 — [phase-0/korean-font.png](phase-0/korean-font.png) |
| `env-check.mjs` | 실행 성공(모든 이름 '없음') |
| `check-access.mjs` | 실행 성공. 토큰 없음으로 Vercel·Supabase 는 건너뜀. 가짜 토큰으로 실패 처리(HTTP 403/401) 확인 |
| 토큰 노출 검사(스크립트 안) | 통과 |
| 이 저장소 push | 가능(dry-run 성공, API 권한 push) |
| 기반 커밋 408ae56 받기 | 성공(임시 폴더, 받은 뒤 지움) |
| 자료 묶음 `wannab-materials.zip` | 없음 |
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
| Vercel 범위(플랜) | 확인 전 — 토큰 없음 |
| Supabase 조직(플랜) | 확인 전 — 토큰 없음 |
| Supabase 무료 활성 프로젝트 | 확인 전 (n / 2) |
| `wannab-homecare` (Vercel / Supabase) | 확인 전 |
| `VERCEL_TEAM_ID` · `SUPABASE_ORG_ID` | 아직 없음 — 2차 실행에서 `node scripts/check-access.mjs --write-env` 로 적음 |

## Git 배포 조건

| 항목 | 결과 |
| --- | --- |
| Codespace GitHub 사용자 | `wannabhomecare-jpg` |
| 커밋 작성자 이름 | `wannabhomecare-jpg` (같음) |
| 작성자 이메일 | GitHub noreply 주소 아님 |
| Vercel 에 연결된 GitHub 사용자 | 확인 전 — 토큰 없음 |

## 가정·메모

- 저장소 이름은 `wannabhomecare`(하이픈 없음)다. Vercel·Supabase 프로젝트 이름은 계획대로 `wannab-homecare` 를 쓴다.
- 이 Codespace 에는 Node 24 가 이미 있어 nvm 설치는 건너뛰었다.
- Playwright 1.65.1 의 Chromium 을 받았다. Phase 1 에서 다른 버전을 쓰면 그 버전의 브라우저만 다시 받는다.
- Supabase 무료 한도는 소유자·관리자인 조직만 센다. API 로 역할을 확실히 알 수 없어 `check-access.mjs` 는 모든 무료 조직의 활성 프로젝트를 합쳐 센다(실제보다 많게 셀 수는 있어도 적게 세지는 않는다).
- Vercel 범위가 Hobby 팀 여럿이면 첫 번째를 쓴다. 바꾸려면 `.env.local` 의 `VERCEL_TEAM_ID` 값을 원하는 팀 ID 로 바꾼다.
- Vercel GitHub 연동 확인은 문서화되지 않은 읽기 API 를 쓴다. 실패하면 '확인 불가'로 두고 Phase 1 에서 처리한다.

## Phase 1 바로 실행

아니오 — 위 '사용자가 할 일'을 마친 뒤 Phase 0 를 다시 실행해야 한다.
