"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "@/components/icons";
import type { ServiceKey } from "@/lib/services";
import type { BeforeAfterItem } from "@/types/database";
import { ratioMismatch, sortByOrder } from "@/lib/media-items";
import { toWebp, type PreparedImage } from "@/lib/image-webp";
import { addBeforeAfter, deleteBeforeAfter, moveBeforeAfter, publishBeforeAfter, updateBeforeAfterText, type MediaResult } from "../media/actions";

type Svc = { key: ServiceKey; name: string };
const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const lbl = "block text-xs font-bold text-slate-700";
const btn = "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-bold transition disabled:opacity-50";

function Thumb({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="relative block size-20 overflow-hidden rounded-lg bg-slate-100 sm:size-24">
      <Image src={src} alt={alt} fill sizes="96px" className="object-cover" />
    </span>
  );
}

function AddForm({ services, onDone }: { services: Svc[]; onDone: (r: MediaResult<BeforeAfterItem>, msg: string) => void }) {
  const [service, setService] = useState<ServiceKey>(services[0].key);
  const [label, setLabel] = useState("");
  const [caption, setCaption] = useState("");
  const [before, setBefore] = useState<PreparedImage | null>(null);
  const [after, setAfter] = useState<PreparedImage | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();
  const mismatch = before && after && ratioMismatch(before, after);

  async function pick(file: File | undefined, set: (p: PreparedImage | null) => void, name: string) {
    setErr(null);
    if (!file) return set(null);
    setBusy(true);
    try {
      // 두 장을 한 번에 보내므로 한 장 2MB 이하로 줄인다(서버 한도 4.4MB)
      set(await toWebp(file, { name, maxBytes: 2 * 1024 * 1024 }));
    } catch (e) {
      set(null);
      setErr(e instanceof Error ? e.message : "사진을 준비하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="ba-add">
      <h2 id="ba-add" className="text-lg font-extrabold text-slate-900">
        새 짝 추가
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label>
          <span className={lbl}>서비스</span>
          <select className={input} value={service} onChange={(e) => setService(e.target.value as ServiceKey)}>
            {services.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={lbl}>이름(탭에 보임, 예: 창틀)</span>
          <input className={input} value={label} maxLength={30} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label>
          <span className={lbl}>설명(선택, 예: 입주청소)</span>
          <input className={input} value={caption} maxLength={60} onChange={(e) => setCaption(e.target.value)} />
        </label>
        <label>
          <span className={lbl}>전 사진</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className={input} onChange={(e) => pick(e.target.files?.[0], setBefore, "before.webp")} />
        </label>
        <label>
          <span className={lbl}>후 사진</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className={input} onChange={(e) => pick(e.target.files?.[0], setAfter, "after.webp")} />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            disabled={!before || !after || !label.trim() || busy || pending}
            onClick={() => {
              setErr(null);
              const fd = new FormData();
              fd.set("service", service);
              fd.set("label", label);
              fd.set("caption", caption);
              fd.set("before", before!.file);
              fd.set("after", after!.file);
              start(async () => {
                const r = await addBeforeAfter(fd);
                if (r.ok) {
                  setLabel("");
                  setCaption("");
                  onDone(r, "저장했어요. 확인한 뒤 '공개'를 켜 주세요.");
                } else setErr(r.error);
              });
            }}
            className="w-full rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? "사진 준비 중…" : pending ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
      {mismatch && (
        <p role="status" className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800">
          두 사진의 가로세로 비율이 달라요({before.width}×{before.height} / {after.width}×{after.height}). 저장은 되지만, 같은 범위로 맞춘 사진이 더
          자연스럽습니다.
        </p>
      )}
      {err && (
        <p role="alert" className="mt-3 text-sm font-bold text-live">
          {err}
        </p>
      )}
    </section>
  );
}

function Row({ item, first, last, onResult }: { item: BeforeAfterItem; first: boolean; last: boolean; onResult: (r: MediaResult<BeforeAfterItem>, ok?: string) => void }) {
  const [label, setLabel] = useState(item.label);
  const [caption, setCaption] = useState(item.caption ?? "");
  const [pending, start] = useTransition();
  const dirty = label !== item.label || caption !== (item.caption ?? "");
  const act = (fn: () => Promise<MediaResult<BeforeAfterItem>>, ok?: string) => start(async () => onResult(await fn(), ok));
  return (
    <li className="flex flex-wrap items-center gap-3 py-3" data-ba-row={item.id}>
      <Thumb src={item.before.url} alt={`${item.label} 전`} />
      <Thumb src={item.after.url} alt={`${item.label} 후`} />
      <div className="grid min-w-[200px] flex-1 gap-1.5">
        <input aria-label="이름" className={input} value={label} maxLength={30} onChange={(e) => setLabel(e.target.value)} />
        <input aria-label="설명" className={input} value={caption} maxLength={60} placeholder="설명(선택)" onChange={(e) => setCaption(e.target.value)} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {dirty && (
          <button type="button" disabled={pending} className={`${btn} bg-brand-600 text-white`} onClick={() => act(() => updateBeforeAfterText(item.id, { label, caption }), "글을 저장했어요.")}>
            글 저장
          </button>
        )}
        <button type="button" disabled={pending || first} aria-label="위로" className={`${btn} bg-slate-100 text-slate-800`} onClick={() => act(() => moveBeforeAfter(item.id, -1))}>
          <ArrowUp aria-hidden className="size-4" />
        </button>
        <button type="button" disabled={pending || last} aria-label="아래로" className={`${btn} bg-slate-100 text-slate-800`} onClick={() => act(() => moveBeforeAfter(item.id, 1))}>
          <ArrowDown aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={item.published}
          disabled={pending}
          className={`${btn} ${item.published ? "bg-success text-white" : "bg-slate-200 text-slate-800"}`}
          onClick={() => act(() => publishBeforeAfter(item.id, !item.published), item.published ? "숨겼어요." : "공개했어요.")}
        >
          {item.published ? "공개 중" : "숨김"}
        </button>
        <button
          type="button"
          disabled={pending}
          className={`${btn} bg-live text-white`}
          onClick={() => {
            if (!confirm(`'${item.label}' 전·후 사진을 지울까요? 저장소의 사진 파일도 함께 지워지고 되돌릴 수 없어요.`)) return;
            act(() => deleteBeforeAfter(item.id), "지웠어요.");
          }}
        >
          <Trash2 aria-hidden className="size-4" />
          삭제
        </button>
      </div>
    </li>
  );
}

export function BeforeAfterManager({ initial, services }: { initial: BeforeAfterItem[]; services: Svc[] }) {
  const [items, setItems] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const onResult = (r: MediaResult<BeforeAfterItem>, ok?: string) => {
    if (r.ok) {
      setItems(r.items);
      setMsg(ok ? { ok: true, text: ok } : null);
    } else setMsg({ ok: false, text: r.error });
  };

  return (
    <>
      <AddForm services={services} onDone={onResult} />
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`mt-4 text-sm font-bold ${msg.ok ? "text-success" : "text-live"}`}>
          {msg.text}
        </p>
      )}
      {services.map((s) => {
        const list = sortByOrder(items.filter((x) => x.service === s.key));
        return (
          <section key={s.key} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby={`ba-${s.key}`}>
            <h2 id={`ba-${s.key}`} className="text-base font-extrabold text-slate-900">
              {s.name} <span className="text-sm font-semibold text-slate-500">({list.length}짝 · 공개 {list.filter((x) => x.published).length})</span>
            </h2>
            {list.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">아직 없습니다.</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100">
                {list.map((it, i) => (
                  <Row key={`${it.id}-${it.order}-${it.published}`} item={it} first={i === 0} last={i === list.length - 1} onResult={onResult} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
