"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { Play } from "@/components/icons";
import { Dialog } from "@/components/ui/Dialog";
import type { CategoryVideo } from "@/content/categories/types";

/** '작업 영상 보기' — 창을 열 때만 영상을 불러온다(세로 영상, 소리 없음). */
export function HeroVideos({ videos }: { videos: CategoryVideo[] }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  if (videos.length === 0) return null;
  const v = videos[idx];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2.5 rounded-full bg-brand-950/75 py-2 pr-5 pl-2 text-[15px] font-extrabold text-white shadow-lg ring-1 ring-white/25 backdrop-blur transition hover:bg-brand-950"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-white text-brand-900">
          <Play aria-hidden className="ml-0.5 size-4 fill-current" />
        </span>
        작업 영상 보기
      </button>

      <Dialog open={open} onClose={close} label="실제 작업 영상" className="w-[min(92vw,420px)]">
        <div className="rounded-2xl bg-brand-950 p-3 text-white">
          <p className="mb-2 text-center text-[13px] font-bold text-brand-200">실제 작업 영상 · 소리 없음</p>
          <video
            key={v.src}
            src={v.src}
            poster={v.poster}
            controls
            autoPlay
            muted
            playsInline
            preload="none"
            aria-label={`${v.label} 작업 영상`}
            className="mx-auto aspect-[9/16] max-h-[62vh] w-auto rounded-lg bg-black"
          />
          <ul className="mt-3 grid grid-cols-3 gap-2" aria-label="다른 영상">
            {videos.map((x, i) => (
              <li key={x.src}>
                <button
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-pressed={i === idx}
                  className={`block w-full overflow-hidden rounded-lg text-left ring-2 transition ${i === idx ? "ring-white" : "ring-transparent opacity-75 hover:opacity-100"}`}
                >
                  <span className="relative block aspect-[9/12]">
                    <Image src={x.poster} alt="" fill sizes="120px" className="object-cover" />
                  </span>
                  <span className="block bg-brand-900 px-2 py-1 text-center text-[12px] font-bold">{x.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Dialog>
    </>
  );
}
