"use client";

import { useState, useTransition } from "react";
import { saveLiveBoardEnabled } from "./actions";

export function LiveBoardToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={pending}
        onClick={() => {
          const next = !on;
          setOn(next);
          setError(null);
          start(async () => {
            const r = await saveLiveBoardEnabled(next);
            if (!r.ok) {
              setOn(!next);
              setError("저장하지 못했습니다.");
            }
          });
        }}
        className={`relative h-8 w-14 rounded-full transition ${on ? "bg-brand-600" : "bg-slate-300"}`}
      >
        <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`} />
        <span className="sr-only">실시간 목록 보이기</span>
      </button>
      <span className="text-sm font-semibold text-slate-800">{on ? "메인에 목록을 보여 줍니다" : "목록 대신 '견적 시작 카드'를 보여 줍니다"}</span>
      {error && <span className="text-sm font-semibold text-live">{error}</span>}
    </div>
  );
}
