import Link from "next/link";
import { notFound } from "next/navigation";
import { assertAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RequestStatusSelect } from "@/components/admin/RequestStatusSelect";
import { BoardVisibilityToggle } from "@/components/admin/BoardVisibilityToggle";
import { AdminMemoField } from "@/components/admin/AdminMemoField";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteRequest } from "@/app/admin/requests/actions";
import { formatScrollTime } from "@/lib/time";
import { OTHER_OPTION, QUOTE_SERVICE_LABEL, type QuoteService } from "@/lib/quote";
import type { QuoteRequest, RequestStatus } from "@/types/database";

export const dynamic = "force-dynamic";

/** 요청 사진은 비공개 저장소에 있다. 관리자 화면에서만 10분짜리 주소로 본다. */
const SIGNED_URL_SECONDS = 600;

export default async function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await assertAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("quote_requests").select("*").eq("id", id).maybeSingle();
  if (error) console.warn("[admin/requests/:id]", error.message);
  if (!data) notFound();
  const row = data as QuoteRequest;

  let photos: string[] = [];
  if (row.image_paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("request-images")
      .createSignedUrls(row.image_paths, SIGNED_URL_SECONDS);
    photos = (signed ?? []).map((s) => s.signedUrl).filter((u): u is string => !!u);
  }

  async function handleDelete() {
    "use server";
    return await deleteRequest(id);
  }

  const answers: [string, string][] = [
    ["1. 서비스", QUOTE_SERVICE_LABEL[row.service as QuoteService] ?? row.service],
  ];
  if (row.clean_type) answers.push(["2. 청소 형태", row.clean_type]);
  if (row.building_type)
    answers.push([
      "3. 건물 형태",
      row.building_type === OTHER_OPTION ? `기타: ${row.building_other ?? ""}` : row.building_type,
    ]);
  if (row.business_type)
    answers.push([
      "3-1. 업종",
      row.business_type === OTHER_OPTION ? `기타: ${row.business_other ?? ""}` : row.business_type,
    ]);
  if (row.rooms != null) answers.push(["4. 방", `${row.rooms}`]);
  if (row.bathrooms != null) answers.push(["5. 화장실", `${row.bathrooms}`]);
  if (row.balconies != null) answers.push(["6. 베란다", `${row.balconies}`]);
  if (row.structure) answers.push(["7. 구조", row.structure]);
  if (row.service === "clean") answers.push(["8. 함께 알아보는 견적", row.extra_services.join(", ") || "없음"]);
  answers.push(["9. 공급 평수", row.area]);
  answers.push(["10. 주소", `${row.sido} ${row.sigungu} ${row.address_detail}`]);
  answers.push(["11. 원하는 날짜", row.preferred_date]);
  answers.push(["12. 성함", row.customer_name]);
  answers.push(["12. 휴대폰", row.phone]);
  answers.push(["13. 요청사항", row.message || "없음"]);

  const created = new Date(row.created_at);
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin/requests" className="text-sm font-semibold text-brand-700 hover:underline">
            ← 견적 목록
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">{row.customer_name}님의 견적</h1>
          <p className="mt-1 text-sm text-slate-600">
            접수 {created.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} ({formatScrollTime(created)})
          </p>
        </div>
        <ConfirmButton
          label="이 신청 삭제"
          confirmMessage="정말 삭제하시겠습니까? 되돌릴 수 없습니다."
          onAction={handleDelete}
          redirectTo="/admin/requests"
        />
      </header>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-600">상태</p>
          <div className="mt-2">
            <RequestStatusSelect id={row.id} initial={row.status as RequestStatus} size="md" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-600">공개 목록 노출(가린 이름 · 시/구)</p>
          <div className="mt-2">
            <BoardVisibilityToggle id={row.id} initial={row.visible_on_board} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-600">빠른 연락</p>
          <div className="mt-2">
            <a
              href={`tel:${row.phone.replace(/\D/g, "")}`}
              className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-brand-700"
            >
              전화 걸기
            </a>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-base font-extrabold text-slate-900">답한 내용</h2>
          <dl className="mt-3 divide-y divide-slate-100 text-sm">
            {answers.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 py-2">
                <dt className="font-semibold text-slate-600">{k}</dt>
                <dd className="whitespace-pre-wrap text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900">첨부 사진</h2>
          {photos.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">없음</p>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element -- 기한이 있는 주소라 최적화하지 않는다 */}
                    <img src={url} alt={`첨부 사진 ${i + 1}`} className="aspect-square w-full rounded-md border border-slate-200 object-cover" />
                  </a>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-600">사진 주소는 10분 동안만 열립니다.</p>
            </>
          )}
        </aside>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <AdminMemoField id={row.id} initial={row.admin_memo ?? ""} />
      </section>
    </>
  );
}
