"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Trash2, Undo2 } from "@/components/icons";
import type { ServiceKey } from "@/lib/services";
import type { ReviewCaptureData } from "@/types/database";
import type { MaskRect } from "@/lib/mask";
import { loadBitmap } from "@/lib/image-resize";
import { toWebp } from "@/lib/image-webp";
import { sortByOrder } from "@/lib/media-items";
import { addReview, deleteReview, moveReview, publishReview, updateReview, type MediaResult } from "../media/actions";
import { MaskTool } from "./MaskTool";

type Svc = { key: ServiceKey; name: string };
const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const lbl = "block text-xs font-bold text-slate-700";
const btn = "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-bold transition disabled:opacity-50";

function ServiceChecks({ services, value, onChange, idPrefix }: { services: Svc[]; value: ServiceKey[]; onChange: (v: ServiceKey[]) => void; idPrefix: string }) {
  return (
    <fieldset className="flex flex-wrap gap-x-3 gap-y-1">
      <legend className="sr-only">보여 줄 서비스</legend>
      {services.map((s) => (
        <label key={s.key} htmlFor={`${idPrefix}-${s.key}`} className="inline-flex items-center gap-1.5 text-sm text-slate-800">
          <input
            id={`${idPrefix}-${s.key}`}
            type="checkbox"
            checked={value.includes(s.key)}
            onChange={(e) => onChange(e.target.checked ? [...value, s.key] : value.filter((v) => v !== s.key))}
          />
          {s.name}
        </label>
      ))}
    </fieldset>
  );
}

function AddReview({ services, onDone }: { services: Svc[]; onDone: (r: MediaResult<ReviewCaptureData>, ok?: string) => void }) {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [rects, setRects] = useState<MaskRect[]>([]);
  const [label, setLabel] = useState("");
  const [svc, setSvc] = useState<ServiceKey[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [fileKey, setFileKey] = useState(0);

  async function pick(file?: File) {
    setErr(null);
    setRects([]);
    setBitmap(null);
    if (!file) return;
    try {
      const b = await loadBitmap(file);
      setBitmap(b instanceof ImageBitmap ? b : await createImageBitmap(b));
    } catch {
      setErr("열 수 없는 사진이에요. JPG·PNG·WebP 캡처로 다시 골라 주세요.");
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="rv-add">
      <h2 id="rv-add" className="text-lg font-extrabold text-slate-900">
        새 캡처
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label>
          <span className={lbl}>캡처 파일</span>
          <input key={fileKey} type="file" accept="image/jpeg,image/png,image/webp" className={input} onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        <label>
          <span className={lbl}>이름(카드 아래에 보임, 예: 이사청소 · 줄눈)</span>
          <input className={input} value={label} maxLength={30} onChange={(e) => setLabel(e.target.value)} />
        </label>
      </div>
      <div className="mt-3">
        <span className={lbl}>보여 줄 서비스 화면</span>
        <ServiceChecks services={services} value={svc} onChange={setSvc} idPrefix="new" />
      </div>

      {bitmap && (
        <div className="mt-4" aria-label="가릴 곳 표시 도구">
          <p className="text-sm font-bold text-slate-800">가릴 곳 표시 — 캡처 위에서 끌어 사각형을 그리면 그 부분이 흐려집니다. (가린 곳 {rects.length}개)</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className={`${btn} bg-slate-100 text-slate-800`} disabled={!rects.length} onClick={() => setRects(rects.slice(0, -1))}>
              <Undo2 aria-hidden className="size-4" />
              되돌리기
            </button>
            <button type="button" className={`${btn} bg-slate-100 text-slate-800`} disabled={!rects.length} onClick={() => setRects([])}>
              모두 지우기
            </button>
          </div>
          <div className="mt-2">
            <MaskTool bitmap={bitmap} rects={rects} onChange={setRects} />
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={!bitmap || !label.trim() || pending}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          onClick={() => {
            if (!bitmap) return;
            if (rects.length === 0 && !confirm("이름과 프로필 사진을 가리셨나요?\n가린 곳이 없습니다. 그대로 저장할까요?")) return;
            setErr(null);
            start(async () => {
              try {
                // 가린 결과만 만든다. 원본은 서버로 보내지 않는다
                const prepared = await toWebp(bitmap, { rects, name: "review.webp" });
                const fd = new FormData();
                fd.set("image", prepared.file);
                fd.set("label", label);
                for (const s of svc) fd.append("services", s);
                const r = await addReview(fd);
                if (r.ok) {
                  setBitmap(null);
                  setRects([]);
                  setLabel("");
                  setSvc([]);
                  setFileKey((k) => k + 1);
                }
                onDone(r, "저장했어요. 확인한 뒤 '공개'를 켜 주세요.");
              } catch (e) {
                setErr(e instanceof Error ? e.message : "저장하지 못했어요.");
              }
            });
          }}
        >
          {pending ? "저장 중…" : "가린 결과로 저장"}
        </button>
        {err && (
          <p role="alert" className="text-sm font-bold text-live">
            {err}
          </p>
        )}
      </div>
    </section>
  );
}

function Row({ item, services, first, last, onResult }: { item: ReviewCaptureData; services: Svc[]; first: boolean; last: boolean; onResult: (r: MediaResult<ReviewCaptureData>, ok?: string) => void }) {
  const [label, setLabel] = useState(item.label);
  const [svc, setSvc] = useState<ServiceKey[]>(item.services);
  const [pending, start] = useTransition();
  const dirty = label !== item.label || svc.join() !== item.services.join();
  const act = (fn: () => Promise<MediaResult<ReviewCaptureData>>, ok?: string) => start(async () => onResult(await fn(), ok));
  return (
    <li className="grid gap-3 py-4 lg:grid-cols-[280px_1fr_auto] lg:items-center" data-review-row={item.id}>
      <span className="block rounded-lg bg-brand-950 p-2">
        <Image src={item.image.url} alt={`후기 캡처 — ${item.label}`} width={item.image.width} height={item.image.height} sizes="280px" className="h-auto w-full rounded" />
      </span>
      <div className="grid gap-2">
        <input aria-label="이름" className={input} value={label} maxLength={30} onChange={(e) => setLabel(e.target.value)} />
        <ServiceChecks services={services} value={svc} onChange={setSvc} idPrefix={item.id} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {dirty && (
          <button type="button" disabled={pending} className={`${btn} bg-brand-600 text-white`} onClick={() => act(() => updateReview(item.id, { label, services: svc }), "저장했어요.")}>
            저장
          </button>
        )}
        <button type="button" disabled={pending || first} aria-label="위로" className={`${btn} bg-slate-100 text-slate-800`} onClick={() => act(() => moveReview(item.id, -1))}>
          <ArrowUp aria-hidden className="size-4" />
        </button>
        <button type="button" disabled={pending || last} aria-label="아래로" className={`${btn} bg-slate-100 text-slate-800`} onClick={() => act(() => moveReview(item.id, 1))}>
          <ArrowDown aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={item.published}
          disabled={pending}
          className={`${btn} ${item.published ? "bg-success text-white" : "bg-slate-200 text-slate-800"}`}
          onClick={() => act(() => publishReview(item.id, !item.published), item.published ? "숨겼어요." : "공개했어요.")}
        >
          {item.published ? "공개 중" : "숨김"}
        </button>
        <button
          type="button"
          disabled={pending}
          className={`${btn} bg-live text-white`}
          onClick={() => {
            if (!confirm(`'${item.label}' 후기를 지울까요? 저장소의 캡처 파일도 함께 지워지고 되돌릴 수 없어요.`)) return;
            act(() => deleteReview(item.id), "지웠어요.");
          }}
        >
          <Trash2 aria-hidden className="size-4" />
          삭제
        </button>
      </div>
    </li>
  );
}

export function ReviewManager({ initial, services }: { initial: ReviewCaptureData[]; services: Svc[] }) {
  const [items, setItems] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const onResult = (r: MediaResult<ReviewCaptureData>, ok?: string) => {
    if (r.ok) {
      setItems(r.items);
      setMsg(ok ? { ok: true, text: ok } : null);
    } else setMsg({ ok: false, text: r.error });
  };
  const list = sortByOrder(items);
  return (
    <>
      <AddReview services={services} onDone={onResult} />
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`mt-4 text-sm font-bold ${msg.ok ? "text-success" : "text-live"}`}>
          {msg.text}
        </p>
      )}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="rv-list">
        <h2 id="rv-list" className="text-base font-extrabold text-slate-900">
          후기 목록 <span className="text-sm font-semibold text-slate-500">({list.length}장 · 공개 {list.filter((x) => x.published).length})</span>
        </h2>
        <ul className="mt-2 divide-y divide-slate-100">
          {list.map((it, i) => (
            <Row key={`${it.id}-${it.order}-${it.published}`} item={it} services={services} first={i === 0} last={i === list.length - 1} onResult={onResult} />
          ))}
        </ul>
      </section>
    </>
  );
}
