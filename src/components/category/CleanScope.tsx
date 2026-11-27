"use client";

import Image from "next/image";
import { useState } from "react";
import { Check } from "@/components/icons";
import type { CategoryContent } from "@/content/categories/types";

type Scope = NonNullable<CategoryContent["scope"]>;

/** 청소 범위: 방 탭 → 왼쪽 사진, 오른쪽 'N개 항목' + 체크 칩 */
export function CleanScope({ scope }: { scope: Scope }) {
  const [i, setI] = useState(0);
  const room = scope.rooms[i];
  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="공간 고르기">
        {scope.rooms.map((r, k) => (
          <button
            key={r.name}
            type="button"
            role="tab"
            id={`scope-tab-${k}`}
            aria-selected={k === i}
            aria-controls="scope-panel"
            onClick={() => setI(k)}
            className={`rounded-full px-4 py-2 text-[15px] font-bold ring-1 transition sm:px-5 ${k === i ? "bg-brand-900 text-white ring-brand-900" : "bg-white text-brand-900 ring-slate-300 hover:ring-brand-400"}`}
          >
            {r.name}
          </button>
        ))}
      </div>
      <div id="scope-panel" role="tabpanel" aria-labelledby={`scope-tab-${i}`} className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-10">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-brand-100">
          <Image key={room.image.src} src={room.image.src} alt={room.image.alt} fill sizes="(min-width: 1024px) 620px, 100vw" style={{ objectPosition: room.image.focus }} className="object-cover" />
          <span className="absolute top-3 right-3 rounded-full bg-brand-950/70 px-2.5 py-1 text-[11px] font-bold text-white">실제 현장 사진</span>
        </div>
        <div>
          <p className="text-[15px] font-extrabold text-brand-600">{room.items.length}개 항목</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {room.items.map((it) => (
              <li key={it} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[15px] font-bold text-brand-900 ring-1 ring-brand-200">
                <Check aria-hidden className="size-4 text-brand-600" strokeWidth={3} />
                {it}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
