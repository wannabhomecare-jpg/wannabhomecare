"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";

const AUTOPLAY_MS = 5000;

/**
 * 가로 넘김(기반 후기 넘김 동작) — 칸 단위로 맞추고 5초마다 한 칸 넘긴다.
 * PC 4칸, 휴대폰 2칸이 한 화면에 보인다. 마우스를 올리면 멈춘다.
 */
export function TestimonialsCarouselClient({ children, label }: { children: ReactNode; label: string }) {
  const items = Children.toArray(children);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const update = () => {
      const perView = window.matchMedia("(min-width: 1024px)").matches ? 4 : 2;
      setPages(Math.max(1, items.length - perView + 1));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [items.length]);

  function scrollTo(idx: number) {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll<HTMLElement>("[data-card]");
    const target = cards[idx];
    if (!target) return;
    track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: "smooth" });
    setIndex(idx);
  }

  useEffect(() => {
    if (paused || pages <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setIndex((i) => {
        const n = (i + 1) % pages;
        const track = trackRef.current;
        const target = track?.querySelectorAll<HTMLElement>("[data-card]")[n];
        if (track && target) track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: "smooth" });
        return n;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, pages]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div ref={trackRef} tabIndex={0} aria-label={`${label} 목록`} role="group" className="hide-scrollbar focus-visible:outline-2 focus-visible:outline-brand-600 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 sm:gap-5">
        {items.map((child, i) => (
          <div
            key={i}
            data-card
            className="w-[calc(50%-0.375rem)] shrink-0 snap-start sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)]"
          >
            {child}
          </div>
        ))}
      </div>

      {pages > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollTo((index - 1 + pages) % pages)}
            aria-label="이전"
            className="absolute top-1/2 -left-3 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-md ring-1 ring-slate-200 hover:bg-slate-50 lg:block"
          >
            <ChevronLeft aria-hidden className="size-5 text-slate-700" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => scrollTo((index + 1) % pages)}
            aria-label="다음"
            className="absolute top-1/2 -right-3 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-md ring-1 ring-slate-200 hover:bg-slate-50 lg:block"
          >
            <ChevronRight aria-hidden className="size-5 text-slate-700" strokeWidth={2.5} />
          </button>
        </>
      )}

      {pages > 1 && (
        <div className="mt-3 flex items-center justify-center">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`${i + 1}번째로 이동`}
              aria-current={i === index}
              className="flex h-6 items-center px-1"
            >
              <span className={`block h-2 rounded-full transition-all ${i === index ? "w-6 bg-brand-600" : "w-2 bg-brand-300"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
