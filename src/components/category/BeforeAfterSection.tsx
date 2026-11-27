import { ImageIcon } from "@/components/icons";
import { Container } from "@/components/ui/Container";
import type { CategoryContent } from "@/content/categories/types";
import { IS_PREVIEW } from "@/lib/env";
import { beforeAfterBadges } from "@/lib/media-items";
import type { BeforeAfterItem } from "@/types/database";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { SectionHead } from "./SectionHead";

/** 전·후 사진. 짝이 0개면 오픈 단계는 숨기고, 미리보기는 자리표시 */
export function BeforeAfterSection({ c, items }: { c: CategoryContent; items: BeforeAfterItem[] }) {
  if (items.length === 0 && !IS_PREVIEW) return null;
  const badges = beforeAfterBadges(c.slug);
  return (
    <section id="before-after" aria-labelledby="ba-title" className="scroll-mt-24 bg-brand-50 py-14 md:py-24">
      <Container>
        <SectionHead id="ba-title" kicker="BEFORE · AFTER" title={c.beforeAfter.title} />
        <div className="mt-8 sm:mt-10">
          {items.length > 0 ? (
            <BeforeAfterSlider items={items} badges={badges} />
          ) : (
            <div className="mx-auto flex aspect-[4/3] max-w-[560px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-brand-300 bg-white px-6 text-center">
              <ImageIcon aria-hidden className="size-9 text-brand-500" strokeWidth={1.75} />
              <p className="text-[17px] font-black text-brand-900">실제 사진을 받으면 채웁니다</p>
              <p className="text-[14px] text-slate-600">
                {badges[0]} · {badges[1]} 사진 자리(미리보기에서만 보입니다)
              </p>
            </div>
          )}
        </div>
        {items.length > 0 && <p className="mt-4 text-center text-[14px] text-slate-600">{c.beforeAfter.note}</p>}
      </Container>
    </section>
  );
}
