import { assertAdmin } from "@/lib/auth";
import { getBeforeAfter, getServices } from "@/lib/site-content";
import { BeforeAfterManager } from "./BeforeAfterManager";

export const dynamic = "force-dynamic";

export default async function AdminBeforeAfterPage() {
  await assertAdmin();
  const [items, services] = await Promise.all([getBeforeAfter(), getServices()]);
  return (
    <>
      <header>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">전·후 사진</h1>
        <p className="mt-1 text-sm text-slate-600">
          카테고리 화면의 &apos;전·후 사진&apos; 블록에 나옵니다. 같은 자리에서 찍은 실제 작업 사진만 올려 주세요. 새 짝은 &apos;숨김&apos;으로 저장되니 확인한 뒤
          공개를 켜 주세요.
        </p>
      </header>
      <BeforeAfterManager initial={items} services={services.map((s) => ({ key: s.key, name: s.name }))} />
    </>
  );
}
