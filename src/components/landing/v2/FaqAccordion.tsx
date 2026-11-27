"use client";

import { useState } from "react";
import { ChevronDown } from "@/components/icons";
import { RichText } from "@/components/category/RichText";

type FaqItem = { question: string; answer: string; draft?: boolean };

type Props = { items: FaqItem[]; preview?: boolean };

/**
 * 자주 묻는 질문 아코디언 — 한 항목만 열림(single open). 답의 \n 은 줄바꿈, '· ' 줄은 목록.
 *
 * 별도 라이브러리 없이 button + aria-expanded + 조건부 패널.
 */
export function FaqAccordion({ items, preview = false }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <ul className="space-y-3">
      {items.map((it, i) => {
        const open = openIdx === i;
        return (
          <li
            key={it.question}
            className={`overflow-hidden rounded-2xl border bg-white transition-shadow ${
              open
                ? "border-brand-200 shadow-md shadow-brand-950/5"
                : "border-slate-200 shadow-sm hover:border-slate-300"
            }`}
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenIdx(open ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-slate-50 sm:px-6 sm:py-5"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-black text-brand-700 sm:size-8">
                  Q
                </span>
                <span className="text-sm font-extrabold leading-snug text-slate-900 sm:text-base">
                  {it.question}
                  {preview && it.draft && (
                    <span
                      data-draft-badge
                      className="ml-2 inline-flex items-center rounded-full border border-dashed border-brand-500 px-2 py-0.5 align-middle text-[11px] leading-4 font-bold text-brand-700"
                    >
                      초안
                    </span>
                  )}
                </span>
              </span>
              <ChevronDown
                aria-hidden
                className={`size-5 shrink-0 text-slate-500 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
                strokeWidth={2.25}
              />
            </button>
            {open && (
              <div className="border-t border-brand-100 bg-brand-50/40 px-4 py-4 text-sm leading-relaxed text-slate-700 sm:px-6 sm:py-5 sm:text-base">
                <p className="flex items-start gap-2">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-brand-600 shadow-sm">
                    A
                  </span>
                  <RichText text={it.answer} className="min-w-0 flex-1" />
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
