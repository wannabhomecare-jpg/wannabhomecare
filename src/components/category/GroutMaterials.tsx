import { Container } from "@/components/ui/Container";
import type { CategoryContent } from "@/content/categories/types";
import { DraftBadge } from "./DraftBadge";
import { SectionHead } from "./SectionHead";

/** 줄눈 자재 종류: PC 표, 휴대폰 카드 목록 → 라인업 → 각주 */
export function GroutMaterials({ c }: { c: CategoryContent }) {
  const m = c.materials;
  if (!m) return null;
  return (
    <section id="materials" aria-labelledby="materials-title" className="scroll-mt-24 bg-brand-50 py-14 md:py-24">
      <Container>
        <SectionHead id="materials-title" kicker="MATERIALS" title={m.title} lead={m.lead} />
        <div className="mt-8 hidden overflow-hidden rounded-2xl border border-brand-200 bg-white md:block sm:mt-12">
          <table className="w-full text-left text-[15px]">
            <thead className="bg-brand-900 text-white">
              <tr>
                {m.columns.map((col) => (
                  <th key={col} scope="col" className="px-5 py-3.5 font-extrabold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {m.rows.map((r) => (
                <tr key={r.name}>
                  <td className="px-5 py-4 font-bold whitespace-nowrap text-brand-600">{r.no}</td>
                  <th scope="row" className="px-5 py-4 font-black whitespace-nowrap text-brand-900">
                    {r.name}
                  </th>
                  <td className="px-5 py-4 whitespace-nowrap text-slate-700">{r.origin}</td>
                  <td className="px-5 py-4 leading-7 text-slate-700">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-8 space-y-3 md:hidden">
          {m.rows.map((r) => (
            <li key={r.name} className="rounded-2xl border border-brand-200 bg-white p-5">
              <p className="text-[13px] font-bold text-brand-600">
                {r.no} · {r.origin}
              </p>
              <h3 className="mt-1 text-lg font-black text-brand-900">{r.name}</h3>
              <p className="mt-2 text-[15px] leading-7 text-slate-700">{r.desc}</p>
            </li>
          ))}
        </ul>

        <ul className="mt-8 grid gap-3 md:grid-cols-3 md:gap-5" aria-label="라인업">
          {m.lineup.items.map((it) => (
            <li key={it.name} className="rounded-2xl bg-brand-900 p-5 text-white sm:p-6">
              <h3 className="text-[17px] font-black">
                {it.name}
                <DraftBadge draft={m.lineup.draft} dark />
              </h3>
              <p className="mt-2 text-[15px] leading-7 text-brand-100">{it.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[14px] leading-6 text-slate-600">{m.footnote}</p>
      </Container>
    </section>
  );
}
