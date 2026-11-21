import { createSupabaseAnonClient } from "@/lib/supabase/anon";
import { isSupabaseConfigured } from "@/lib/env";
import type { QuoteBoardItem, RequestStatus } from "@/types/database";

/**
 * 공개 접수 목록 — 뷰(quote_request_board)만 읽는다.
 * 뷰에는 가린 이름 · 시/구 · 서비스 · 상태 · 시각만 있다.
 */
export async function getRecentBoardItems(limit = 40): Promise<QuoteBoardItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase
    .from("quote_request_board")
    .select("id, masked_name, region, service_label, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("[board] getRecentBoardItems:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({ ...r, status: r.status as RequestStatus }));
}
