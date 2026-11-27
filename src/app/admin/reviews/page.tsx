import { assertAdmin } from "@/lib/auth";
import { getReviewCaptures, getServices } from "@/lib/site-content";
import { ReviewManager } from "./ReviewManager";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await assertAdmin();
  const [items, services] = await Promise.all([getReviewCaptures(), getServices()]);
  return (
    <>
      <header>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">고객 후기</h1>
        <p className="mt-1 text-sm text-slate-600">
          메인과, 체크한 서비스의 카테고리 화면에 나옵니다. 고객이 카카오톡으로 보낸 캡처만 올려 주세요. 새 후기는 &apos;숨김&apos;으로 저장됩니다.
        </p>
      </header>
      <p role="note" className="mt-4 rounded-xl border-2 border-brand-600 bg-brand-50 px-4 py-3 text-[15px] font-extrabold text-brand-900">
        고객 이름·프로필 사진·전화번호·주소가 보이면 꼭 가려 주세요.
      </p>
      <ReviewManager initial={items} services={services.map((s) => ({ key: s.key, name: s.name }))} />
    </>
  );
}
