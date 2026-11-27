"use client";

import { useState } from "react";
import { COATING_SWATCHES } from "@/lib/theme-tokens";
import type { CategoryContent } from "@/content/categories/types";

type Colors = NonNullable<CategoryContent["colors"]>;

/** 컬러 미리보기: 견본을 누르면 큰 벽면 판 색이 바뀐다. 조명 2가지(자연광 · 전구색), 펄은 은은한 점 무늬 */
export function CoatingColors({ colors, preview }: { colors: Colors; preview: boolean }) {
  const [sel, setSel] = useState(0);
  const [light, setLight] = useState(0);
  const s = colors.swatches[sel];
  const pearl = /펄|진주/.test(s.name + s.fit);
  const warm = light === 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:gap-10">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-[inset_0_-40px_80px_rgb(0_0_0/0.08)] ring-1 ring-slate-200 transition-colors duration-500"
        style={{ backgroundColor: COATING_SWATCHES[s.swatch] }}
        role="img"
        aria-label={`${s.name} 벽면 미리보기, ${colors.lights[light]}`}
        data-swatch={s.swatch}
        data-light={warm ? "warm" : "day"}
      >
        {pearl && <div aria-hidden className="pearl-texture absolute inset-0" />}
        {/* 바닥 걸레받이 느낌의 아래 띠 */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[14%] bg-slate-300/60" />
        {warm && <div aria-hidden data-warm-overlay className="absolute inset-0 bg-warm-light/25 mix-blend-multiply" />}
      </div>

      <div>
        <p className="text-[13px] font-bold text-brand-600">조명</p>
        <div className="mt-2 flex gap-2" role="group" aria-label="조명">
          {colors.lights.map((l, i) => (
            <button
              key={l}
              type="button"
              aria-pressed={light === i}
              onClick={() => setLight(i)}
              className={`rounded-full px-4 py-2 text-[14px] font-bold ring-1 transition ${light === i ? "bg-brand-900 text-white ring-brand-900" : "bg-white text-brand-900 ring-slate-300 hover:ring-brand-400"}`}
            >
              {l}
            </button>
          ))}
        </div>

        <p className="mt-6 text-[13px] font-bold text-brand-600">견본</p>
        <div className="mt-2 flex flex-wrap gap-3" role="group" aria-label="견본 색">
          {colors.swatches.map((sw, i) => (
            <button
              key={sw.swatch}
              type="button"
              aria-pressed={sel === i}
              aria-label={sw.name}
              onClick={() => setSel(i)}
              className={`size-12 rounded-full ring-offset-2 transition sm:size-14 ${sel === i ? "ring-3 ring-brand-600" : "ring-1 ring-slate-300 hover:ring-brand-400"}`}
              style={{ backgroundColor: COATING_SWATCHES[sw.swatch] }}
            />
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-brand-50 p-5" aria-live="polite">
          <p className="text-lg font-black text-brand-900">
            {s.name}
            {preview && colors.draft && (
              <span data-draft-badge className="ml-2 inline-flex rounded-full border border-dashed border-brand-500 bg-white px-2 py-0.5 align-middle text-[11px] font-bold text-brand-700">
                초안
              </span>
            )}
          </p>
          <p className="mt-1.5 text-[15px] leading-7 text-slate-700">{s.fit}</p>
        </div>
        <p className="mt-4 text-[14px] leading-6 text-slate-600">{colors.footnote}</p>
      </div>
    </div>
  );
}
