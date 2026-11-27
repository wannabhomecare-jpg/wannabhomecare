import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Container } from "@/components/ui/Container";
import type { CategoryContent } from "@/content/categories/types";
import { IS_PREVIEW } from "@/lib/env";
import { CompareTable } from "./CompareTable";
import { CoatingColors } from "./CoatingColors";
import { DraftBadge } from "./DraftBadge";
import { GroutMaterials } from "./GroutMaterials";
import { SectionHead } from "./SectionHead";

/** 카테고리 전용 블록: 줄눈 자재 · 탄성코트 도료·색 · 새집증후군 비교·컬비 연계 */
export function SpecialBlocks({ c }: { c: CategoryContent }) {
  return (
    <>
      <GroutMaterials c={c} />

      {c.grades && (
        <section id="grades" aria-labelledby="grades-title" className="scroll-mt-24 bg-brand-50 py-14 md:py-24">
          <Container>
            <SectionHead id="grades-title" kicker="PAINT" title={c.grades.title} lead={c.grades.lead} badge={<DraftBadge draft={c.grades.draft} />} />
            <div className="mt-8 sm:mt-12">
              <CompareTable caption={c.grades.title} columns={c.grades.columns} rows={c.grades.rows} />
            </div>
            <p className="mt-4 text-[14px] leading-6 text-slate-600">{c.grades.footnote}</p>
          </Container>
        </section>
      )}

      {c.colors && (
        <section id="colors" aria-labelledby="colors-title" className="scroll-mt-24 bg-white py-14 md:py-24">
          <Container>
            <SectionHead id="colors-title" kicker="COLOR" title={c.colors.title} lead={c.colors.lead} badge={<DraftBadge draft={c.colors.draft} />} />
            <div className="mt-8 sm:mt-12">
              <CoatingColors colors={c.colors} preview={IS_PREVIEW} />
            </div>
          </Container>
        </section>
      )}

      {c.compare && (
        <section id="compare" aria-labelledby="compare-title" className="scroll-mt-24 bg-brand-50 py-14 md:py-24">
          <Container>
            <SectionHead id="compare-title" kicker="COMPARE" title={c.compare.title} badge={<DraftBadge draft={c.compare.draft} />} />
            <div className="mt-8 sm:mt-12">
              <CompareTable caption={c.compare.title} columns={c.compare.columns} rows={c.compare.rows} highlightLast />
            </div>
            {c.crossSell && (
              <Link
                href={c.crossSell.href}
                className="group mt-8 flex flex-col gap-2 rounded-3xl bg-brand-900 p-6 text-white transition hover:bg-brand-800 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:p-8"
              >
                <span>
                  <span className="block text-xl font-black">{c.crossSell.title}</span>
                  <span className="mt-2 block text-[15px] leading-7 text-brand-100">{c.crossSell.body}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[15px] font-extrabold text-white group-hover:underline">
                  컬비청소 자세히 보기
                  <ArrowRight aria-hidden className="size-4" strokeWidth={2.5} />
                </span>
              </Link>
            )}
          </Container>
        </section>
      )}
    </>
  );
}
