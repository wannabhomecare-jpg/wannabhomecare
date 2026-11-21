"use client";

import { useState, useTransition } from "react";
import type { HeroSlideData } from "@/types/database";
import { saveHeroSlides } from "./actions";

const PHOTOS = [
  "/photos/hero-1-window.webp",
  "/photos/service-1-clean.webp",
  "/photos/service-2-aircon.webp",
  "/photos/service-4-grout.webp",
  "/photos/service-6-newhome.webp",
];

const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const label = "block text-xs font-bold text-slate-700";

const split = (s: string) =>
  s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export function HeroEditor({ initial, defaults }: { initial: HeroSlideData[]; defaults: HeroSlideData[] }) {
  const [slides, setSlides] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = (i: number, patch: Partial<HeroSlideData>) =>
    setSlides((all) => all.map((s, k) => (k === i ? { ...s, ...patch } : s)));

  return (
    <div className="space-y-6">
      <p className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
        첫 화면 6장의 문구는 고객이 쓴 글자 그대로입니다. 고객 요청이 있을 때만 바꿔 주세요. 사진의 기준점(예:
        &quot;center 30%&quot;)과 확대 값(1–3)은 얼굴과 일하는 손이 글자에 가려지지 않게 맞추는 값입니다.
      </p>
      {slides.map((s, i) => (
        <fieldset key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <legend className="px-2 text-base font-extrabold text-slate-900">
            {i + 1}장 · {s.title1}
          </legend>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className={label}>세부 항목 버튼(쉼표로 나눔)</span>
              <input className={input} value={s.chips.join(", ")} onChange={(e) => set(i, { chips: split(e.target.value) })} />
            </label>
            <label>
              <span className={label}>제목 첫 줄</span>
              <input className={input} value={s.title1} onChange={(e) => set(i, { title1: e.target.value })} />
            </label>
            <label>
              <span className={label}>제목 둘째 줄(없으면 비움)</span>
              <input className={input} value={s.title2 ?? ""} onChange={(e) => set(i, { title2: e.target.value || undefined })} />
            </label>
            <label className="md:col-span-2">
              <span className={label}>한 줄(없으면 비움)</span>
              <input className={input} value={s.lead ?? ""} onChange={(e) => set(i, { lead: e.target.value || undefined })} />
            </label>
            <label>
              <span className={label}>슬로건 첫 줄</span>
              <input className={input} value={s.slogan1} onChange={(e) => set(i, { slogan1: e.target.value })} />
            </label>
            <label>
              <span className={label}>슬로건 둘째 줄</span>
              <input className={input} value={s.slogan2} onChange={(e) => set(i, { slogan2: e.target.value })} />
            </label>
            <label className="md:col-span-2">
              <span className={label}>해시태그(# 없이, 쉼표로 나눔)</span>
              <input className={input} value={s.hashtags.join(", ")} onChange={(e) => set(i, { hashtags: split(e.target.value) })} />
            </label>
            <label>
              <span className={label}>사진</span>
              <select className={input} value={s.image ?? ""} onChange={(e) => set(i, { image: e.target.value || null })}>
                <option value="">사진 준비 중(자리표시)</option>
                {PHOTOS.map((p) => (
                  <option key={p} value={p}>
                    {p.replace("/photos/", "")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={label}>사진 배치</span>
              <select className={input} value={s.layout} onChange={(e) => set(i, { layout: e.target.value as HeroSlideData["layout"] })}>
                <option value="cover">칸에 꽉 채우기</option>
                <option value="right">오른쪽 78%에 채우기</option>
              </select>
            </label>
            <label className="md:col-span-2">
              <span className={label}>사진 설명(대체 문구)</span>
              <input className={input} value={s.alt} onChange={(e) => set(i, { alt: e.target.value })} />
            </label>
            {(["mobile", "desktop"] as const).map((k) => (
              <div key={k} className="grid grid-cols-2 gap-2">
                <label>
                  <span className={label}>{k === "mobile" ? "휴대폰" : "PC"} 기준점</span>
                  <input className={input} value={s[k].position} onChange={(e) => set(i, { [k]: { ...s[k], position: e.target.value } })} />
                </label>
                <label>
                  <span className={label}>{k === "mobile" ? "휴대폰" : "PC"} 확대</span>
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    max="3"
                    className={input}
                    value={s[k].scale}
                    onChange={(e) => set(i, { [k]: { ...s[k], scale: Number(e.target.value) || 1 } })}
                  />
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await saveHeroSlides(slides);
              setMsg(r.ok ? "저장했습니다." : r.error);
            })
          }
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSlides(defaults);
            setMsg("기본값을 불러왔습니다. 저장을 눌러야 반영됩니다.");
          }}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700"
        >
          기본값 불러오기
        </button>
        {msg && (
          <span role="status" className="text-sm font-semibold text-slate-700">
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}
