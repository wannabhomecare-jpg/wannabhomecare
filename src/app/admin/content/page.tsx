import { assertAdmin } from "@/lib/auth";
import { getPromiseSection, getServices } from "@/lib/site-content";
import { ContentEditor } from "./ContentEditor";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await assertAdmin();
  const [promise, services] = await Promise.all([getPromiseSection(), getServices()]);
  return (
    <>
      <header>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">약속 · 서비스</h1>
        <p className="mt-1 text-sm text-slate-600">메인의 약속 3칸과 서비스 6칸 문구를 고칩니다.</p>
      </header>
      <div className="mt-6">
        <ContentEditor promise={promise} services={services.map((s) => ({ key: s.key, name: s.name, summary: s.summary }))} />
      </div>
    </>
  );
}
