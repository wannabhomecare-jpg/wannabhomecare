"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** 히어로 배경 영상(소리 없음·반복). 움직임 줄이기 설정이면 포스터만 보여 준다. */
export function HeroBackgroundVideo({ src, poster }: { src: string; poster: string }) {
  // 서버에서는 포스터(움직임 없음)로 그린다
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => true);
  if (reduced) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />;
  }
  return <video src={src} poster={poster} autoPlay muted loop playsInline aria-hidden className="absolute inset-0 size-full object-cover" />;
}
