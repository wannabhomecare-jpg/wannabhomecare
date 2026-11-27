"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ChevronsLeftRight } from "@/components/icons";
import type { BeforeAfterItem } from "@/types/database";

/**
 * 전·후 비교. 탭(라벨)으로 짝을 고르고, 가운데 손잡이를 끌면(마우스·터치) 전·후가 바뀐다.
 * 키보드 ←/→ 10%씩, Home/End 끝으로.
 */
export function BeforeAfterSlider({ items, badges }: { items: BeforeAfterItem[]; badges: [string, string] }) {
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(50);
  const frame = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const item = items[active];

  const fromClientX = useCallback((x: number) => {
    const r = frame.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    setPos(Math.round(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100))));
  }, []);

  if (!item) return null;
  const ratio = `${item.after.width} / ${item.after.height}`;
  const portrait = item.after.height > item.after.width;

  return (
    <div>
      {items.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="전·후 사진 고르기">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => {
                setActive(i);
                setPos(50);
              }}
              className={`rounded-full px-4 py-2 text-[15px] font-bold ring-1 transition sm:px-5 ${i === active ? "bg-brand-900 text-white ring-brand-900" : "bg-white text-brand-900 ring-slate-300 hover:ring-brand-400"}`}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}

      <div
        ref={frame}
        data-ba-frame
        className={`relative mx-auto mt-6 touch-pan-y overflow-hidden rounded-3xl bg-brand-100 select-none ${portrait ? "max-w-[420px]" : "max-w-[560px]"}`}
        style={{ aspectRatio: ratio }}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          fromClientX(e.clientX);
        }}
        onPointerMove={(e) => dragging.current && fromClientX(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <Image
          key={`a-${item.id}`}
          src={item.after.url}
          alt={`${item.label} ${badges[1]}`}
          fill
          sizes="(min-width: 640px) 560px, 92vw"
          className="pointer-events-none object-cover"
          draggable={false}
        />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Image
            key={`b-${item.id}`}
            src={item.before.url}
            alt={`${item.label} ${badges[0]}`}
            fill
            sizes="(min-width: 640px) 560px, 92vw"
            className="pointer-events-none object-cover"
            draggable={false}
          />
        </div>
        <span className="absolute top-3 left-3 rounded-full bg-brand-950/85 px-3 py-1 text-[13px] font-bold text-white">{badges[0]}</span>
        <span className="absolute top-3 right-3 rounded-full bg-brand-600 px-3 py-1 text-[13px] font-bold text-white">{badges[1]}</span>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow" style={{ left: `${pos}%` }} />
        <div
          role="slider"
          tabIndex={0}
          aria-label={`${item.label} ${badges[0]}·${badges[1]} 비교 위치`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pos}
          aria-valuetext={`${badges[0]} ${pos}%`}
          onKeyDown={(e) => {
            const step = { ArrowLeft: -10, ArrowRight: 10, ArrowDown: -10, ArrowUp: 10 }[e.key];
            if (step) {
              e.preventDefault();
              setPos((p) => Math.min(100, Math.max(0, p + step)));
            } else if (e.key === "Home") {
              e.preventDefault();
              setPos(0);
            } else if (e.key === "End") {
              e.preventDefault();
              setPos(100);
            }
          }}
          className="absolute top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-brand-900 shadow-lg ring-1 ring-slate-200 focus-visible:outline-3 focus-visible:outline-brand-600"
          style={{ left: `${pos}%` }}
        >
          <ChevronsLeftRight aria-hidden className="size-6" strokeWidth={2.25} />
        </div>
      </div>
      <p className="mt-3 text-center text-[14px] text-slate-600">손잡이를 좌우로 움직여 보세요</p>
      {item.caption && <p className="mt-2 text-center text-[15px] font-bold text-brand-900">{item.caption}</p>}
    </div>
  );
}
