# 워너비홈케어 홈페이지

청소 전문 업체 워너비홈케어(WANNA.B HOMECARE)의 공식 홈페이지입니다.
Next.js 16(App Router) · TypeScript · Tailwind CSS v4 · Supabase · Vercel.

## 실행

```bash
npm install
cp .env.example .env.local   # 값을 채운다(커밋하지 않는다)
npm run dev                  # http://localhost:3000
```

| 명령 | 하는 일 |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 검사 |
| `npm run build` | `next build` (환경변수 없이도 통과) |
| `npm test` | 단위·보안 테스트 |
| `npm run check:launch` | 오픈 전 점검. 미리보기 단계·빈 연락처·자리표시가 남아 있으면 실패 |

## 배포

- Vercel 프로젝트 `wannabhomecare` 가 이 저장소의 `main` 에 연결돼 있습니다. `main` 에 push 하면 배포됩니다.
- 빌드된 커밋은 `/version.json` 에서 확인합니다.
- DB 는 Supabase 프로젝트 `wannabhomecare`(서울)입니다. 스키마는 `supabase/migrations/` 의 파일로만 바꿉니다.

## 환경변수

이름과 용도는 `.env.example` 에 있습니다. 서버 전용 값 3개(`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET`)만 Vercel 에 Sensitive 로 등록합니다.

## 관리자

`/admin` 에서 `ADMIN_PASSWORD` 로 로그인합니다. 견적 요청 목록·상세·상태·메모, 첫 화면·약속·서비스 문구, 실시간 현황판 설정을 바꿀 수 있습니다.

## 사진

`public/photos/` 의 사진은 AI 로 만든 연출 이미지입니다. 자세한 내용은 `docs/asset-credits.md` 에 있습니다.
