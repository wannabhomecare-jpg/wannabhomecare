import Image from "next/image";
import { Container } from "@/components/ui/Container";
import type { CategoryContent } from "@/content/categories/types";
import { DraftBadge } from "./DraftBadge";
import { SectionHead } from "./SectionHead";

/** 작업 프로세스(번호 단계). PC 한 줄 4칸, 넘치면 다음 줄 / 휴대폰 세로 목록 */
export function ProcessSteps({ c }: { c: CategoryContent }) {
  const p = c.process;
  if (!p) return null;
  return (
    <section id="process" aria-labelledby="process-title" className="scroll-mt-24 bg-white py-14 md:py-24">
      <Container>
        <SectionHead id="process-title" kicker="PROCESS" title={p.title} badge={<DraftBadge draft={p.draft} />} />
        <ol className="mt-8 grid gap-3 sm:mt-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {p.steps.map((s, i) => (
            <li
              key={s.title}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgb(15_23_42/0.05)] lg:flex-col lg:items-center lg:p-6 lg:text-center"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-900 text-base font-black text-white lg:size-12">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-extrabold tracking-[0.14em] text-brand-600">STEP {String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 text-[17px] leading-snug font-black text-brand-900">
                  {s.title}
                  <DraftBadge draft={s.draft} />
                </h3>
                <p className="mt-2 text-[15px] leading-7 text-slate-600">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {p.gallery && (
          <div className="mt-12 sm:mt-16">
            <h3 className="text-center text-xl font-black text-brand-900 sm:text-2xl">{p.gallery.title}</h3>
            <ul
              className="hide-scrollbar -mx-3 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:overflow-visible"
              aria-label={p.gallery.title}
              tabIndex={0}
            >
              {p.gallery.items.map((g, i) => (
                <li key={g.label} className="w-[62vw] max-w-[260px] shrink-0 snap-start lg:w-auto lg:max-w-none">
                  <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="relative aspect-[3/4]">
                      <Image src={g.image.src} alt={g.image.alt} fill sizes="(min-width: 1024px) 230px, 62vw" style={{ objectPosition: g.image.focus }} className="object-cover" />
                    </div>
                    <figcaption className="px-3 py-2.5 text-center text-[15px] font-bold text-brand-900">
                      <span className="mr-1.5 text-brand-600">{i + 1}</span>
                      {g.label}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-center text-[14px] text-slate-600">{p.gallery.note}</p>
          </div>
        )}
      </Container>
    </section>
  );
}
