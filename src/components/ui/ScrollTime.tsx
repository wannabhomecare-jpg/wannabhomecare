"use client";

import { useSyncExternalStore } from "react";
import { formatScrollTime } from "@/lib/time";

/**
 * 실시간 목록의 시각 표시 — 1분마다 다시 계산한다.
 * 같은 값을 돌려주도록 '지금 시각'을 1분 단위로 저장해 둔다(매번 새 값을 주면 화면이 계속 다시 그려진다).
 */
let minuteNow = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // 화면이 처음 붙을 때 지금 시각으로 한 번 맞춘다
  const fresh = Date.now();
  if (fresh - minuteNow > 1_000) {
    minuteNow = fresh;
    queueMicrotask(onChange);
  }
  if (!timer) {
    timer = setInterval(() => {
      minuteNow = Date.now();
      for (const l of listeners) l();
    }, 60_000);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => minuteNow;
const getServerSnapshot = () => Date.now();

export function ScrollTime({ date, variant }: { date: string | Date; variant: "relative" | "absolute" }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const dt = typeof date === "string" ? date : date.toISOString();
  return (
    <time dateTime={dt} suppressHydrationWarning>
      {formatScrollTime(date, new Date(now), variant)}
    </time>
  );
}
