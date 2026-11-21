"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import type { HeroSlideData } from "@/types/database";

type Props = {
  slides: HeroSlideData[];
  intervalMs?: number;
};

function frameStyle(s: HeroSlideData): CSSProperties {
  return {
    ["--pos-m" as string]: s.mobile.position,
    ["--pos-d" as string]: s.desktop.position,
    ["--org-m" as string]: s.mobile.origin ?? s.mobile.position,
    ["--org-d" as string]: s.desktop.origin ?? s.desktop.position,
    ["--sc-m" as string]: String(s.mobile.scale),
    ["--sc-d" as string]: String(s.desktop.scale),
  };
}

const IMG_FRAME =
  "object-cover [object-position:var(--pos-m)] [transform-origin:var(--org-m)] [transform:scale(var(--sc-m))] lg:[object-position:var(--pos-d)] lg:[transform-origin:var(--org-d)] lg:[transform:scale(var(--sc-d))]";

function SlidePhoto({ s, priority }: { s: HeroSlideData; priority: boolean }) {
  if (!s.image) {
    return (
      <div className="absolute inset-0 bg-brand-950">
        <span className="absolute right-4 bottom-10 rounded-full border border-dashed border-brand-300/60 px-3 py-1 text-xs font-semibold text-brand-200 sm:right-6 sm:bottom-14 sm:text-sm">
          사진 준비 중
        </span>
      </div>
    );
  }
  if (s.layout === "right") {
    return (
      <div className="absolute inset-0 bg-brand-950">
        <div className="absolute inset-y-0 right-0 w-[78%] overflow-hidden" style={frameStyle(s)}>
          <Image
            src={s.image}
            alt={s.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 52vw, 80vw"
            className={IMG_FRAME}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 overflow-hidden" style={frameStyle(s)}>
      <Image src={s.image} alt={s.alt} fill priority={priority} sizes="(min-width: 1024px) 66vw, 100vw" className={IMG_FRAME} />
    </div>
  );
}

/**
 * 첫 화면 6장 넘김. 기반의 넘김 동작(가로 이동, 점, 화살표, 마우스를 올리면 멈춤)을 그대로 쓴다.
 * 한 장 구성: 세부 항목 버튼 줄 → 제목 → 한 줄 → 슬로건 두 줄 → 해시태그.
 */
export function HeroCarouselClient({ slides, intervalMs = 4000 }: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const total = slides.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const goTo = useCallback((n: number) => setIdx(((n % total) + total) % total), [total]);

  useEffect(() => {
    if (paused || reduced || total <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % total), intervalMs);
    return () => clearInterval(t);
  }, [paused, reduced, total, intervalMs]);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-brand-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="서비스 소개"
    >
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {slides.map((s, i) => {
          const Title = i === 0 ? "h1" : "h2";
          return (
            <div
              key={`${s.service}-${i}`}
              className="relative h-full w-full shrink-0"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${total}`}
              aria-hidden={i !== idx}
              inert={i !== idx}
            >
              <SlidePhoto s={s} priority={i === 0} />
              {/* 글자가 놓이는 왼쪽을 진하게, 오른쪽은 비운다 */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-950/70 via-45% to-brand-950/0 to-75%"
              />
              {/* 넘김 점·화살표가 보이게 아래쪽 한 겹 */}
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-950/80 to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-start px-4 pt-4 pb-9 sm:justify-center sm:px-10 sm:py-10 lg:px-14">
                <div className="flex max-w-[72%] flex-col items-start">
                  <ul className="flex flex-wrap gap-1.5 sm:gap-2">
                    {s.chips.map((c) => (
                      <li
                        key={c}
                        className="rounded-full bg-brand-600 px-2.5 py-1 text-[11px] leading-none font-bold whitespace-nowrap text-white sm:px-3.5 sm:py-1.5 sm:text-sm lg:text-base"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                  <Title className="mt-2 text-[1.6rem] leading-[1.15] font-black tracking-tight text-white [text-shadow:0_2px_8px_rgb(0_0_0/0.35)] sm:mt-4 sm:text-5xl lg:text-[3.25rem] xl:text-[4rem]">
                    <span className="block">{s.title1}</span>
                    {s.title2 && <span className="block text-brand-300">{s.title2}</span>}
                  </Title>
                  {s.lead && (
                    <p className="mt-1.5 text-[13px] leading-snug font-extrabold text-white sm:mt-3 sm:text-lg lg:text-xl">
                      {s.lead}
                    </p>
                  )}
                  <p className="mt-1.5 text-[13px] leading-snug font-semibold text-white sm:mt-4 sm:text-lg lg:text-[1.375rem] lg:leading-relaxed">
                    <span className="block">{s.slogan1}</span>
                    <span className="block">{s.slogan2}</span>
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1 sm:mt-4 sm:gap-2">
                    {s.hashtags.map((h) => (
                      <li
                        key={h}
                        className="rounded-full border border-white/40 bg-brand-950/40 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-white sm:px-3.5 sm:py-1.5 sm:text-sm xl:text-[15px]"
                      >
                        #{h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="이전 장"
        onClick={() => goTo(idx - 1)}
        className="absolute bottom-3 left-3 hidden size-11 items-center justify-center rounded-full border border-white/30 bg-brand-950/50 text-white backdrop-blur-sm transition hover:bg-brand-950/80 sm:flex"
      >
        <ChevronLeft aria-hidden className="size-6" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        aria-label="다음 장"
        onClick={() => goTo(idx + 1)}
        className="absolute right-3 bottom-3 hidden size-11 items-center justify-center rounded-full border border-white/30 bg-brand-950/50 text-white backdrop-blur-sm transition hover:bg-brand-950/80 sm:flex"
      >
        <ChevronRight aria-hidden className="size-6" strokeWidth={2.25} />
      </button>

      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 sm:bottom-6">
        {slides.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`${i + 1}번째 장 보기`}
            aria-current={i === idx}
            className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </div>
  );
}
