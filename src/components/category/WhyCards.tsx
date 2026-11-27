import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import type { CategoryContent, WhyCard } from "@/content/categories/types";
import { DraftBadge } from "./DraftBadge";

function Card({ w, dark }: { w: WhyCard; dark: boolean }) {
  return (
    <div
      className={`h-full rounded-3xl p-6 sm:p-9 ${dark ? "bg-brand-900 text-white" : "border border-brand-200 bg-brand-50 text-brand-900"}`}
    >
      <p className={`text-[14px] font-extrabold ${dark ? "text-brand-300" : "text-brand-600"}`}>
        {w.kicker}
        <DraftBadge draft={w.draft} dark={dark} />
      </p>
      <h3 className="mt-3 text-[1.35rem] leading-snug font-black tracking-tight sm:text-[1.75rem]">{w.title}</h3>
      <p className={`mt-4 text-[15px] leading-7 sm:text-[17px] sm:leading-8 ${dark ? "text-brand-100" : "text-slate-700"}`}>{w.body}</p>
      {w.chips && w.chips.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {w.chips.map((chip) => (
            <li
              key={chip}
              className={`rounded-full px-3 py-1.5 text-[13px] font-bold sm:text-sm ${dark ? "bg-white/10 text-white" : "bg-white text-brand-700 ring-1 ring-brand-200"}`}
            >
              {chip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 왜 필요한가요 · 무엇이 다른가요 */
export function WhyCards({ c }: { c: CategoryContent }) {
  return (
    <section aria-labelledby="why-title" className="bg-white py-12 md:py-20">
      <h2 id="why-title" className="sr-only">
        왜 필요한가요 · 무엇이 다른가요
      </h2>
      <Container className="grid gap-4 md:grid-cols-2 md:gap-6">
        <Reveal variant="up">
          <Card w={c.why.need} dark={false} />
        </Reveal>
        <Reveal variant="up" delay={0.08}>
          <Card w={c.why.diff} dark />
        </Reveal>
      </Container>
    </section>
  );
}
