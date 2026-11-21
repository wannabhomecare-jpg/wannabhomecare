"use client";

import { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScrollTime } from "@/components/ui/ScrollTime";
import {
  advanceDemoStatus,
  hasRecent,
  isFresh,
  NEW_BADGE_MS,
  REFRESH_MS,
  ROW_INTERVAL_MS,
  STATUS_INTERVAL_MS,
  type BoardRow,
} from "@/lib/live-board";
import type { QuoteBoardItem } from "@/types/database";

type Props = {
  initial: BoardRow[];
  /** 미리보기: 예시 행을 쓰고 '예시' 표시를 단다 */
  demo: boolean;
  live: boolean;
  rows?: number;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * 실시간 접수 목록. 움직임은 기반 그대로:
 * 2.5초마다 맨 위에 한 줄(NEW 2초), 1.5초마다 한 줄의 상태가 넘어감, 마우스를 올리면 멈춤.
 * production(demo=false)에서는 실제 시각·상태를 그대로 보여 주고 상태를 넘기지 않는다.
 */
export function LiveStatusTableClient({ initial, demo, live: initialLive, rows = 8 }: Props) {
  const pool = useRef(initial);
  const cursor = useRef(rows % Math.max(initial.length, 1));
  const [visible, setVisible] = useState<BoardRow[]>(() => initial.slice(0, rows));
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [changedRowId, setChangedRowId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [live, setLive] = useState(initialLive);
  const reduced = usePrefersReducedMotion();
  const stopped = paused || reduced;

  // 맨 위에 한 줄
  useEffect(() => {
    if (stopped || pool.current.length <= rows) return;
    const t = setInterval(() => {
      const idx = cursor.current % pool.current.length;
      const candidate = pool.current[idx];
      cursor.current = idx + 1;
      const fresh: BoardRow = demo
        ? {
            ...candidate,
            id: `${candidate.id}-${Date.now()}`,
            created_at: new Date().toISOString(),
            status: "pending",
            time_variant: "relative",
          }
        : { ...candidate, id: `${candidate.id}~${Date.now()}` };
      setJustAddedId(fresh.id);
      setVisible((prev) => [fresh, ...prev].slice(0, rows));
      setTimeout(() => setJustAddedId(null), NEW_BADGE_MS);
    }, ROW_INTERVAL_MS);
    return () => clearInterval(t);
  }, [stopped, demo, rows]);

  // 예시 행만 상태를 넘긴다(견적접수 → 상담진행)
  useEffect(() => {
    if (!demo || stopped) return;
    const t = setInterval(() => {
      let picked: string | null = null;
      setVisible((prev) => {
        const candidates = prev.filter((r) => r.demo && r.status === "pending");
        if (candidates.length === 0) return prev;
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        picked = pick.id;
        return prev.map((r) => (r.id === pick.id ? { ...r, status: advanceDemoStatus(r.status) } : r));
      });
      if (picked) {
        setChangedRowId(picked);
        setTimeout(() => setChangedRowId(null), 900);
      }
    }, STATUS_INTERVAL_MS);
    return () => clearInterval(t);
  }, [demo, stopped]);

  // production: 60초마다 새 요청을 다시 읽어 맨 위에 올린다
  useEffect(() => {
    if (demo) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/board", { cache: "no-store" });
        if (!res.ok) return;
        const items = (await res.json()) as QuoteBoardItem[];
        const known = new Set(pool.current.map((r) => r.id));
        const added: BoardRow[] = items
          .filter((it) => !known.has(it.id))
          .map((it) => ({ ...it, demo: false, time_variant: "relative" }));
        if (added.length > 0) {
          pool.current = [...added, ...pool.current];
          setVisible((prev) => [...added, ...prev].slice(0, rows));
        }
        setLive(hasRecent(pool.current, new Date()));
      } catch {
        // 다음 주기에 다시 읽는다
      }
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [demo, rows]);

  const now = new Date();

  return (
    <div
      className="flex h-full flex-col overflow-hidden bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-2.5 border-b border-slate-200 bg-brand-50 px-4 py-3 sm:px-5">
        {live ? (
          <>
            <span aria-hidden className="live-dot text-live" />
            <span className="live-blink text-sm font-black tracking-wider text-live">LIVE</span>
            <span className="text-sm font-bold text-brand-900 sm:text-[15px]">지금도 견적 신청이 들어오고 있습니다</span>
          </>
        ) : (
          <span className="text-sm font-bold text-brand-900 sm:text-[15px]">최근 견적 접수</span>
        )}
        {demo && (
          <span className="ml-auto rounded-full border border-brand-600 bg-white px-2.5 py-0.5 text-xs font-bold text-brand-700">
            예시
          </span>
        )}
      </div>

      <ul aria-label={demo ? "견적 접수 목록(예시)" : "최근 견적 접수 목록"} className="flex flex-col divide-y divide-slate-100">
        {visible.map((item) => {
          const showNew = demo ? item.id === justAddedId : isFresh(item.created_at, now);
          return (
            <li
              key={item.id}
              data-just-added={item.id === justAddedId ? "true" : "false"}
              data-status-changed={item.id === changedRowId ? "true" : "false"}
              className="flex min-h-[58px] shrink-0 items-center lg:min-h-[52px]"
            >
              <div className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-2 lg:grid-cols-[6rem_4.5rem_2.75rem_1fr_auto] lg:gap-x-2">
                <span className="inline-flex w-fit items-center gap-1.5">
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-brand-700 sm:text-[13px] lg:px-2 lg:text-xs">
                    {item.service_label}
                  </span>
                  {showNew && (
                    <span
                      className={`${demo ? "live-new-pill " : ""}inline-flex items-center rounded-full bg-live px-1.5 py-px text-[10px] font-black tracking-wider text-white lg:hidden`}
                    >
                      NEW
                    </span>
                  )}
                </span>
                <div className="row-span-2 flex justify-end lg:hidden">
                  <StatusBadge status={item.status} />
                </div>
                <span className="hidden items-center gap-1 text-xs font-medium whitespace-nowrap text-slate-600 lg:inline-flex">
                  <ScrollTime date={item.created_at} variant={item.time_variant} />
                  {showNew && (
                    <span
                      className={`${demo ? "live-new-pill " : ""}inline-flex items-center rounded-full bg-live px-1.5 py-px text-[10px] font-black tracking-wider text-white`}
                    >
                      NEW
                    </span>
                  )}
                </span>
                <span className="truncate text-[15px] font-bold text-slate-900 lg:text-sm">
                  {item.masked_name}
                  <span className="ml-2 text-[13px] font-normal text-slate-600 lg:hidden">
                    <ScrollTime date={item.created_at} variant={item.time_variant} />
                  </span>
                </span>
                <span className="hidden truncate text-xs text-slate-600 lg:block">{item.region}</span>
                <div className="hidden lg:flex lg:justify-end">
                  <StatusBadge status={item.status} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
