import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import type { CategoryContent } from "@/content/categories/types";
import { CATEGORY_ICONS } from "./icons";
import { DraftBadge } from "./DraftBadge";
import { SectionHead } from "./SectionHead";

/** 원칙 카드 4개. 사진이 있으면 사진, 없으면 아이콘 판 */
export function Principles({ c }: { c: CategoryContent }) {
  const p = c.principles;
  const hasPhoto = p.items.some((it) => it.image);
  return (
    <section id="principles" aria-labelledby="principles-title" className="scroll-mt-24 bg-brand-50 py-14 md:py-24">
      <Container>
        <SectionHead
          id="principles-title"
          kicker={p.kicker}
          title={p.title}
          badge={<DraftBadge draft={p.draft} />}
          lead={hasPhoto ? "사진은 실제 작업 현장입니다." : undefined}
        />
        <RevealGroup stagger={0.06} className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {p.items.map((it, i) => {
            const Icon = it.icon ? CATEGORY_ICONS[it.icon] : undefined;
            return (
              <RevealItem key={it.title} variant="up">
                <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-brand-200 bg-white">
                  <div className={`relative border-b-2 border-brand-600 bg-brand-100 sm:aspect-[4/3] ${it.image ? "aspect-[16/10]" : "h-28 sm:h-auto"}`}>
                    {it.image ? (
                      <Image
                        src={it.image.src}
                        alt={it.image.alt}
                        fill
                        sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
                        style={{ objectPosition: it.image.focus }}
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="flex size-16 items-center justify-center rounded-3xl bg-white text-brand-600 shadow-sm ring-1 ring-brand-200 sm:size-20">
                          {Icon && <Icon aria-hidden className="size-10" strokeWidth={1.75} />}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-5 sm:p-6">
                    <h3 className="text-[17px] leading-snug font-black text-brand-900 sm:text-lg">
                      {p.numbered && <span className="mr-2 text-brand-600">{String(i + 1).padStart(2, "0")}</span>}
                      {it.title}
                      <DraftBadge draft={it.draft} />
                    </h3>
                    <p className="mt-2.5 text-[15px] leading-7 text-slate-600">{it.body}</p>
                  </div>
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Container>
    </section>
  );
}
