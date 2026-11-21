import { getRecentBoardItems } from "@/lib/board";

/** 공개 접수 목록(가린 이름 · 시/구 · 서비스 · 상태 · 시각만). 60초마다 화면이 다시 읽는다. */
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getRecentBoardItems(40);
  return Response.json(items, { headers: { "Cache-Control": "no-store" } });
}
