import Link from "next/link";
import { assertAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getLiveBoardSettings } from "@/lib/site-content";
import { BoardVisibilityToggle } from "@/components/admin/BoardVisibilityToggle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { boardServiceLabel } from "@/lib/quote";
import { formatDateYMD } from "@/lib/time";
import { SITE_STAGE } from "@/lib/env";
import { MIN_REAL_ROWS } from "@/lib/live-board";
import { LiveBoardToggle } from "./LiveBoardToggle";
import type { RequestStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminLiveBoardPage() {
  await assertAdmin();
  const settings = await getLiveBoardSettings();
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("quote_requests")
    .select("id, masked_name, sido, sigungu, service, clean_type, status, visible_on_board, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = data ?? [];
  const visibleCount = rows.filter((r) => r.visible_on_board).length;

  return (
    <>
      <header>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">실시간 현황판</h1>
        <p className="mt-1 text-sm text-slate-600">메인 첫 화면 오른쪽의 견적 접수 목록을 켜고 끕니다.</p>
      </header>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <LiveBoardToggle initial={settings.enabled} />
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>지금 단계: {SITE_STAGE === "preview" ? "미리보기 — 예시 행을 '예시' 표시와 함께 보여 줍니다." : "오픈 — 실제 요청만 보여 줍니다."}</li>
          <li>오픈 단계에서 노출할 실제 요청이 {MIN_REAL_ROWS}건 미만이면 목록 대신 &apos;견적 시작 카드&apos;가 보입니다. (지금 노출 {visibleCount}건)</li>
          <li>목록에는 가린 이름과 시/구, 서비스, 상태, 접수 시각만 보입니다.</li>
        </ul>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-5 py-3 text-base font-extrabold text-slate-900">요청별 노출</h2>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-600">아직 견적 요청이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <span className="w-24 text-slate-600">{formatDateYMD(r.created_at)}</span>
                <Link href={`/admin/requests/${r.id}`} className="w-16 font-bold text-slate-900 hover:underline">
                  {r.masked_name}
                </Link>
                <span className="w-28 text-slate-700">
                  {r.sido} {r.sigungu}
                </span>
                <span className="w-28 text-slate-700">{boardServiceLabel(r.service, r.clean_type)}</span>
                <StatusBadge status={r.status as RequestStatus} />
                <span className="ml-auto">
                  <BoardVisibilityToggle id={r.id} initial={r.visible_on_board} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
