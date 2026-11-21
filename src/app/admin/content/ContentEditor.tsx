"use client";

import { useState, useTransition } from "react";
import type { PromiseSectionData } from "@/types/database";
import { savePromise, saveServices } from "./actions";

type Svc = { key: string; name: string; summary: string };

const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const label = "block text-xs font-bold text-slate-700";

function SaveBar({ onSave, pending, msg }: { onSave: () => void; pending: boolean; msg: string | null }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={onSave}
        className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "저장 중…" : "저장"}
      </button>
      {msg && (
        <span role="status" className="text-sm font-semibold text-slate-700">
          {msg}
        </span>
      )}
    </div>
  );
}

export function ContentEditor({ promise: p0, services: s0 }: { promise: PromiseSectionData; services: Svc[] }) {
  const [promise, setPromise] = useState(p0);
  const [services, setServices] = useState(s0);
  const [pMsg, setPMsg] = useState<string | null>(null);
  const [sMsg, setSMsg] = useState<string | null>(null);
  const [pPending, pStart] = useTransition();
  const [sPending, sStart] = useTransition();

  const setCard = (i: number, patch: Partial<PromiseSectionData["cards"][number]>) =>
    setPromise((p) => ({ ...p, cards: p.cards.map((c, k) => (k === i ? { ...c, ...patch } : c)) }));

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-900">약속 3칸</h2>
        <p className="mt-1 text-sm text-slate-600">굵은 이름 세 개는 고객이 쓴 글자 그대로입니다. 줄바꿈은 Enter 로 넣습니다.</p>
        <div className="mt-4 grid gap-3">
          <label>
            <span className={label}>제목</span>
            <textarea className={input} rows={2} value={promise.title} onChange={(e) => setPromise({ ...promise, title: e.target.value })} />
          </label>
          <div className="grid gap-4 lg:grid-cols-3">
            {promise.cards.map((c, i) => (
              <div key={c.key} className="space-y-2 rounded-xl border border-slate-200 p-3">
                <label>
                  <span className={label}>굵은 이름</span>
                  <input className={input} value={c.title} onChange={(e) => setCard(i, { title: e.target.value })} />
                </label>
                <label>
                  <span className={label}>설명(PC)</span>
                  <textarea className={input} rows={3} value={c.body} onChange={(e) => setCard(i, { body: e.target.value })} />
                </label>
                <label>
                  <span className={label}>설명(휴대폰, 비우면 PC 와 같음)</span>
                  <textarea className={input} rows={2} value={c.bodyMobile ?? ""} onChange={(e) => setCard(i, { bodyMobile: e.target.value || undefined })} />
                </label>
              </div>
            ))}
          </div>
        </div>
        <SaveBar
          pending={pPending}
          msg={pMsg}
          onSave={() =>
            pStart(async () => {
              const r = await savePromise(promise);
              setPMsg(r.ok ? "저장했습니다." : r.error);
            })
          }
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-900">서비스 6칸</h2>
        <p className="mt-1 text-sm text-slate-600">이름은 헤더 메뉴·서비스 칸·견적에 함께 쓰입니다.</p>
        <div className="mt-4 grid gap-3">
          {services.map((s, i) => (
            <div key={s.key} className="grid gap-2 md:grid-cols-[12rem_1fr]">
              <label>
                <span className={label}>이름</span>
                <input
                  className={input}
                  value={s.name}
                  onChange={(e) => setServices((all) => all.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))}
                />
              </label>
              <label>
                <span className={label}>한 줄</span>
                <input
                  className={input}
                  value={s.summary}
                  onChange={(e) => setServices((all) => all.map((x, k) => (k === i ? { ...x, summary: e.target.value } : x)))}
                />
              </label>
            </div>
          ))}
        </div>
        <SaveBar
          pending={sPending}
          msg={sMsg}
          onSave={() =>
            sStart(async () => {
              const r = await saveServices(services);
              setSMsg(r.ok ? "저장했습니다." : r.error);
            })
          }
        />
      </section>
    </div>
  );
}
