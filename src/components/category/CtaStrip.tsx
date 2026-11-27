import { Container } from "@/components/ui/Container";
import type { CategoryContent } from "@/content/categories/types";
import { CtaButtons } from "./CtaButtons";

/** 히어로 바로 아래 견적 띠 */
export function CtaStrip({ c }: { c: CategoryContent }) {
  return (
    <section aria-label="견적 문의" className="border-b border-slate-200 bg-white">
      <Container className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between lg:py-6">
        <p className="text-lg font-black text-brand-900 sm:text-xl">{c.cta.title}</p>
        <CtaButtons service={c.cta.quoteService} tone="light" />
      </Container>
    </section>
  );
}
