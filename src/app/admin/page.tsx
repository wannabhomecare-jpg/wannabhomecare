import Link from "next/link";
import { assertAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { boardServiceLabel } from "@/lib/quote";
import { formatScrollTime } from "@/lib/time";
import { STATUS_LABEL, STATUS_ORDER, type RequestStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const KST = 9 * 60 * 60 * 1000;

function kstTodayStartIso(now = new Date()) {
  const local = now.getTime() + KST;
  return new Date(local - (local % 86_400_000) - KST).toISOString();
}

/** 관리자 대시보드 — 견적 요약만 */
export default async function AdminDashboardPage() {
  await assertAdmin();
  const supabase = createSupabaseAdminClient();
  const [today, ...byStatus] = await Promise.all([
    supabase.from("quote_requests").select("id", { count: "exact", head: true }).gte("created_at", kstTodayStartIso()),
    ...STATUS_ORDER.map((s) => supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("status", s)),
  ]);
  const { data: recent } = await supabase
    .from("quote_requests")
    .select("id, customer_name, sido, sigungu, service, clean_type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const cards: { label: string; value: number; href: string }[] = [
    { label: "오늘 들어온 견적", value: today.count ?? 0, href: "/admin/requests" },
    ...STATUS_ORDER.map((s, i) => ({
      label: STATUS_LABEL[s],
      value: byStatus[i].count ?? 0,
      href: `/admin/requests?status=${s}`,
    })),
  ];

  return (
    <>
      <header>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">대시보드</h1>
        <p className="mt-1 text-sm text-slate-600">견적 요청을 한눈에 봅니다.</p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-300">
            <p className="text-xs font-semibold text-slate-600">{c.label}</p>
            <p className="mt-2 text-3xl font-black text-brand-900">{c.value}</p>
          </Link>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-extrabold text-slate-900">최근 견적</h2>
          <Link href="/admin/requests" className="text-sm font-semibold text-brand-700 hover:underline">
            전체 보기
          </Link>
        </div>
        {(recent ?? []).length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-600">아직 견적 요청이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(recent ?? []).map((r) => (
              <li key={r.id}>
                <Link href={`/admin/requests/${r.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm hover:bg-slate-50">
                  <span className="w-20 text-slate-600">{formatScrollTime(r.created_at)}</span>
                  <span className="w-20 font-bold text-slate-900">{r.customer_name}</span>
                  <span className="w-28 text-slate-700">
                    {r.sido} {r.sigungu}
                  </span>
                  <span className="text-slate-700">{boardServiceLabel(r.service, r.clean_type)}</span>
                  <span className="ml-auto">
                    <StatusBadge status={r.status as RequestStatus} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
