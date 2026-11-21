import { assertAdmin } from "@/lib/auth";
import { DEFAULT_HERO_SLIDES, getHeroSlides } from "@/lib/site-content";
import { HeroEditor } from "./HeroEditor";

export const dynamic = "force-dynamic";

export default async function AdminHeroPage() {
  await assertAdmin();
  const slides = await getHeroSlides();
  return (
    <>
      <header>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">첫 화면(히어로)</h1>
        <p className="mt-1 text-sm text-slate-600">메인 첫 화면에서 넘어가는 6장의 문구와 사진을 고칩니다.</p>
      </header>
      <div className="mt-6">
        <HeroEditor initial={slides} defaults={DEFAULT_HERO_SLIDES} />
      </div>
    </>
  );
}
