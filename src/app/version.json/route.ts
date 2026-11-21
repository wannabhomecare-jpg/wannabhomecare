import { SITE_STAGE } from "@/lib/env";

/** 배포된 커밋 확인용: { repo, commit, stage } (빌드 때 정해진다) */
export const dynamic = "force-static";

export function GET() {
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const slug = process.env.VERCEL_GIT_REPO_SLUG;
  return Response.json({
    repo: owner && slug ? `${owner}/${slug}` : null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    stage: SITE_STAGE,
  });
}
