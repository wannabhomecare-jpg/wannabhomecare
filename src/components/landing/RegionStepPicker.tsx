"use client";

import { Check } from "@/components/icons";
import { DISTRICTS, PROVINCES, type Province } from "@/lib/regions-kr";

/**
 * 시·도 → 시·군·구 2단계 선택(기반 RegionStepPicker 의 모양 그대로, 값은 부모가 가진다).
 */
type Props = {
  sido?: string;
  sigungu?: string;
  onChange: (v: { sido?: Province; sigungu?: string }) => void;
  invalid?: boolean;
  errorId?: string;
};

export function RegionStepPicker({ sido, sigungu, onChange, invalid, errorId }: Props) {
  const province = (PROVINCES as readonly string[]).includes(sido ?? "") ? (sido as Province) : null;
  const district = province && sigungu ? sigungu : null;
  const composed = province && district ? `${province} ${district}` : (province ?? "");

  function pickProvince(p: Province) {
    if (province === p) {
      onChange({});
      return;
    }
    onChange({ sido: p });
  }

  return (
    <div
      aria-describedby={errorId}
      className={`rounded-xl border bg-white p-3 ${invalid ? "border-live" : "border-slate-300"}`}
    >
      {province && district ? (
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[15px] font-bold text-brand-700">
            <Check aria-hidden className="size-4" strokeWidth={2.5} />
            {composed}
          </span>
          <button
            type="button"
            onClick={() => onChange({})}
            className="rounded-md px-2 py-1 text-[13px] font-semibold text-slate-600 hover:text-slate-900"
          >
            다시 선택
          </button>
        </div>
      ) : (
        <>
          <p className="mb-2 text-[13px] font-bold text-slate-700">1) 시·도 선택</p>
          <div className="flex flex-wrap gap-2">
            {PROVINCES.map((p) => {
              const active = province === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => pickProvince(p)}
                  className={`rounded-full border px-4 py-1.5 text-[15px] font-bold transition-colors ${
                    active
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50"
                  }`}
                  aria-pressed={active}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {province && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-bold text-slate-700">
                  2) {province}의 {province === "경기" ? "시·군" : "구·군"} 선택
                </p>
                <button
                  type="button"
                  onClick={() => onChange({})}
                  className="rounded-md px-2 py-1 text-[13px] font-semibold text-slate-600 hover:text-slate-900"
                >
                  시·도 다시
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DISTRICTS[province].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onChange({ sido: province, sigungu: d })}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:border-brand-400 hover:bg-brand-50"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
