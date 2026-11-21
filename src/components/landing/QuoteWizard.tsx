"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { ArrowRight, Camera, Check, Phone, X } from "@/components/icons";
import { KakaoBubble } from "@/components/icons/BrandLogos";
import { ContactAction } from "@/components/common/ContactAction";
import { QUOTE_PRESET_EVENT, QUOTE_PRESET_KEY } from "@/components/common/QuoteLink";
import { RegionStepPicker } from "./RegionStepPicker";
import { submitQuote, type SubmitQuoteState } from "@/app/actions/submit-quote";
import {
  BALCONY_COUNTS,
  BATH_COUNTS,
  BUILDING_TYPES,
  BUSINESS_TYPES,
  CLEAN_TYPES,
  EMPTY_ANSWERS,
  EXTRA_SERVICES,
  isStepComplete,
  OTHER_OPTION,
  pruneAnswers,
  QUOTE_SERVICE_LABEL,
  QUOTE_SERVICES,
  ROOM_COUNTS,
  STEP_LABEL,
  stepsFor,
  STRUCTURE_TYPES,
  type QuoteAnswers,
  type QuoteService,
  type StepId,
} from "@/lib/quote";
import { prepareImages } from "@/lib/image-resize";

const DRAFT_KEY = "wb-quote-draft";
/** 세션 저장소에 두지 않는 항목(개인정보) */
const PRIVATE_FIELDS = ["customerName", "phone", "addressDetail", "message", "consent"] as const;

type Props = {
  /** 서비스 1번 선택지 아래 작은 글씨 */
  hints: Partial<Record<QuoteService, string>>;
  phone: { tel: string; display: string } | null;
  kakaoUrl: string | null;
  preview: boolean;
};

const QUESTION: Record<StepId, string> = {
  service: "어떤 서비스가 필요하세요?",
  cleanType: "청소의 형태를 선택해주세요!",
  building: "건물의 형태를 알려 주세요",
  business: "업종을 선택해 주세요",
  rooms: "방 · 화장실 · 베란다 수를 골라 주세요",
  structure: "구조의 형태를 알려 주세요",
  extras: "함께 알아보시는 견적이 있나요?",
  area: "공급 평수를 적어 주세요",
  address: "작업할 주소를 적어 주세요",
  date: "원하시는 날짜가 언제인가요?",
  contact: "견적과 상담을 받으실 분의 성함과 휴대폰 번호",
  message: "참고할 특이사항이나 요청사항이 있으면 적어 주세요",
};

/** 고르면 바로 다음으로 넘어가는 질문 */
const AUTO_ADVANCE: StepId[] = ["service", "cleanType", "building", "business", "structure"];

function loadDraft(): { answers: QuoteAnswers; step: number } | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { answers: QuoteAnswers; step: number };
    if (!v || typeof v !== "object" || !v.answers) return null;
    return { answers: { ...EMPTY_ANSWERS, ...v.answers, extras: v.answers.extras ?? [] }, step: v.step ?? 0 };
  } catch {
    return null;
  }
}

function saveDraft(answers: QuoteAnswers, step: number) {
  try {
    const safe: Record<string, unknown> = { ...answers };
    for (const k of PRIVATE_FIELDS) delete safe[k];
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ answers: safe, step }));
  } catch {
    // 저장소를 못 써도 견적은 계속된다
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // 무시
  }
}

/** 서비스 카드·견적 시작 카드에서 넘어온 선택을 답에 반영한다 */
function applyPreset(a: QuoteAnswers, preset: string): QuoteAnswers {
  if (preset === "kirby") {
    const extras = a.extras.includes("컬비청소") ? a.extras : [...a.extras, "컬비청소"];
    return { ...a, service: "clean", extras };
  }
  if ((QUOTE_SERVICES as readonly string[]).includes(preset)) {
    return pruneAnswers({ ...a, service: preset as QuoteService });
  }
  return a;
}

const choiceBase =
  "flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";
const choiceOn = "border-brand-600 bg-brand-50";
const choiceOff = "border-slate-200 bg-white hover:border-brand-300";

function Radio({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-brand-600" : "border-brand-300"}`}
    >
      {on && <span className="size-2.5 rounded-full bg-brand-600" />}
    </span>
  );
}

function CheckBox({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-brand-600 bg-brand-600 text-white" : "border-brand-300 bg-white"}`}
    >
      {on && <Check className="size-3.5" strokeWidth={3} />}
    </span>
  );
}

const inputCls =
  "w-full rounded-xl border border-input-border bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-200 focus:outline-none";

export function QuoteWizard({ hints, phone, kakaoUrl, preview }: Props) {
  const [answers, setAnswers] = useState<QuoteAnswers>(EMPTY_ANSWERS);
  const [stepIdx, setStepIdx] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const [state, formAction, pending] = useActionState<SubmitQuoteState, FormData>(submitQuote, { status: "idle" });

  const steps = useMemo(() => stepsFor(answers), [answers]);
  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const done = state.status === "success";

  // 처음: 세션에 남은 답 + 서비스 카드에서 넘어온 선택
  useEffect(() => {
    let a = EMPTY_ANSWERS;
    let idx = 0;
    const draft = loadDraft();
    if (draft) {
      a = draft.answers;
      idx = draft.step;
    }
    try {
      const preset = sessionStorage.getItem(QUOTE_PRESET_KEY);
      if (preset) {
        sessionStorage.removeItem(QUOTE_PRESET_KEY);
        a = applyPreset(a, preset);
        idx = 0;
      }
    } catch {
      // 무시
    }
    const max = stepsFor(a).length - 1;
    // 개인정보는 저장하지 않으므로, 그 화면 뒤로는 복원하지 않는다
    const contactIdx = stepsFor(a).indexOf("contact");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 저장소에서 한 번 복원
    setAnswers(a);
    setStepIdx(Math.min(idx, max, contactIdx));
    setHydrated(true);
  }, []);

  // 같은 화면에서 서비스 카드를 누르면
  useEffect(() => {
    const onPreset = (e: Event) => {
      const v = (e as CustomEvent<string>).detail;
      try {
        sessionStorage.removeItem(QUOTE_PRESET_KEY);
      } catch {
        // 무시
      }
      if (state.status === "success") return;
      setAnswers((a) => applyPreset(a, v));
      setStepIdx(0);
    };
    window.addEventListener(QUOTE_PRESET_EVENT, onPreset);
    return () => window.removeEventListener(QUOTE_PRESET_EVENT, onPreset);
  }, [state.status]);

  useEffect(() => {
    if (!hydrated || done) return;
    saveDraft(answers, stepIdx);
  }, [answers, stepIdx, hydrated, done]);

  useEffect(() => {
    if (done) clearDraft();
  }, [done]);

  // 질문이 바뀌면 질문 제목으로 초점을 옮긴다(화면 읽기 프로그램이 새 질문을 읽는다)
  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus({ preventScroll: true });
  }, [step, done]);

  const update = useCallback((patch: Partial<QuoteAnswers>) => {
    setAnswers((a) => pruneAnswers({ ...a, ...patch }));
  }, []);

  const go = useCallback(
    (delta: number) => {
      moved.current = true;
      setStepIdx((i) => Math.max(0, Math.min(i + delta, stepsFor(answers).length - 1)));
    },
    [answers],
  );

  const choose = (patch: Partial<QuoteAnswers>, advance = AUTO_ADVANCE.includes(step)) => {
    const next = pruneAnswers({ ...answers, ...patch });
    setAnswers(next);
    if (advance) {
      moved.current = true;
      const path = stepsFor(next);
      setTimeout(() => setStepIdx(Math.min(path.indexOf(step) + 1, path.length - 1)), 120);
    }
  };

  const complete = isStepComplete(step, answers);
  const isLast = step === "message";

  async function onPickFiles(list: FileList | null) {
    if (!list) return;
    setFileError(null);
    const picked = [...files, ...Array.from(list)].slice(0, 3);
    if (files.length + list.length > 3) setFileError("사진은 최대 3장까지 첨부할 수 있어요.");
    setFiles(picked.filter((f) => /^image\//.test(f.type)));
  }

  async function onSubmit() {
    if (pending || preparing) return;
    setFileError(null);
    let prepared: File[] = [];
    if (files.length > 0) {
      setPreparing(true);
      try {
        prepared = await prepareImages(files);
      } catch (e) {
        setPreparing(false);
        setFileError(e instanceof Error ? e.message : "사진을 준비하지 못했어요. 사진을 빼고 다시 시도해 주세요.");
        return;
      }
      setPreparing(false);
    }
    const fd = new FormData();
    fd.set("payload", JSON.stringify(pruneAnswers(answers)));
    for (const f of prepared) fd.append("images", f);
    moved.current = true;
    startTransition(() => formAction(fd));
  }

  const progress = Math.round(((stepIdx + 1) / steps.length) * 100);

  // ---------- 완료 화면(14번) ----------
  if (done) {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="quote-step-in rounded-[1.5rem] bg-white p-6 text-center shadow-2xl shadow-black/20 sm:p-10">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-600 text-white">
            <Check aria-hidden className="size-7" strokeWidth={3} />
          </span>
          <h3 ref={headingRef} tabIndex={-1} className="mt-5 text-2xl font-black text-brand-900 outline-none sm:text-3xl">
            접수되었습니다
          </h3>
          <p className="mt-3 text-base leading-7 text-slate-700">
            접수해 주신 내용을 확인한 뒤 빠르게 상담사가 연락드리겠습니다.
          </p>
          <div className="mx-auto mt-6 max-w-xs">
            <ContactAction
              href={kakaoUrl}
              external
              preview={preview}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-kakao text-base font-extrabold text-kakao-ink"
            >
              <KakaoBubble aria-hidden className="size-5" />
              카카오톡으로 바로 상담
            </ContactAction>
          </div>
        </div>
      </div>
    );
  }

  // ---------- 질문 화면 ----------
  const serviceLabel = answers.service ? QUOTE_SERVICE_LABEL[answers.service] : null;
  const summary = summarize(answers);
  const remaining = steps.slice(stepIdx + 1).filter((s) => s !== "message").map((s) => STEP_LABEL[s]);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_20rem]">
      <div className="rounded-[1.5rem] bg-white p-5 shadow-2xl shadow-black/20 sm:p-8">
        <div className="flex items-center justify-between text-[13px] font-bold">
          <span className="text-brand-700">{stepIdx + 1}단계</span>
          <span className="text-slate-600">{STEP_LABEL[step]}</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100"
          role="progressbar"
          aria-label="진행"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={stepIdx + 1}
          aria-valuetext={`${steps.length}단계 중 ${stepIdx + 1}단계`}
        >
          <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <fieldset key={step} className="quote-step-in mt-6 min-w-0">
          <legend className="sr-only">{QUESTION[step]}</legend>
          <h3 ref={headingRef} tabIndex={-1} aria-live="polite" className="text-xl font-black text-brand-900 outline-none sm:text-2xl">
            {QUESTION[step]}
          </h3>
          <div className="mt-5">
            <StepBody
              step={step}
              answers={answers}
              hints={hints}
              update={update}
              choose={choose}
              files={files}
              onPickFiles={onPickFiles}
              removeFile={(i) => setFiles((f) => f.filter((_, k) => k !== i))}
            />
          </div>
        </fieldset>

        {(fileError || state.status === "error") && (
          <p role="alert" className="mt-4 rounded-lg bg-white text-[15px] font-semibold text-live">
            {fileError ?? (state.status === "error" ? state.message : "")}
          </p>
        )}

        <div className="mt-7 flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={stepIdx === 0}
            className="h-12 rounded-xl border border-slate-300 bg-white px-5 text-base font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
          >
            이전
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={pending || preparing}
              className="ml-auto inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-900 px-6 text-base font-extrabold text-white transition hover:bg-brand-800 disabled:opacity-60 sm:flex-none"
            >
              {preparing ? "사진 준비 중…" : pending ? "보내는 중…" : "견적 요청하기"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => complete && go(1)}
              disabled={!complete}
              className="ml-auto inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-900 px-6 text-base font-extrabold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-700 sm:flex-none"
            >
              다음
              <ArrowRight aria-hidden className="size-5" strokeWidth={2.25} />
            </button>
          )}
        </div>
      </div>

      {/* PC: 선택한 내용 + 상담 버튼 */}
      <aside aria-label="선택한 내용" className="hidden rounded-[1.5rem] border border-white/15 bg-white/[0.06] p-6 text-white lg:block">
        <p className="text-[13px] font-bold tracking-wider text-brand-200">선택한 내용</p>
        <p className="mt-2 text-2xl font-black">{serviceLabel ?? "아직 고르지 않았습니다"}</p>
        {summary.length > 0 && (
          <dl className="mt-4 space-y-2 text-[15px]">
            {summary.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="shrink-0 text-brand-200">{k}</dt>
                <dd className="font-semibold text-white">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {serviceLabel && remaining.length > 0 && (
          <p className="mt-4 text-[15px] leading-relaxed text-brand-100">
            이어서 {remaining.join(", ")}을(를) 차례로 여쭤봅니다.
          </p>
        )}
        <div className="mt-6 space-y-2.5">
          <ContactAction
            href={kakaoUrl}
            external
            preview={preview}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-kakao text-base font-extrabold text-kakao-ink"
          >
            <KakaoBubble aria-hidden className="size-5" />
            카카오톡으로 바로 상담
          </ContactAction>
          <ContactAction
            href={phone ? `tel:${phone.tel}` : null}
            preview={preview}
            ariaLabel={phone ? `전화 ${phone.display}` : "전화 상담"}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/30 text-base font-extrabold text-white hover:bg-white/10"
          >
            <Phone aria-hidden className="size-5" strokeWidth={2.25} />
            {phone ? phone.display : "전화번호 준비 중"}
          </ContactAction>
        </div>
      </aside>
    </div>
  );
}

function summarize(a: QuoteAnswers): [string, string][] {
  const out: [string, string][] = [];
  if (a.cleanType) out.push(["청소 형태", a.cleanType]);
  if (a.buildingType) out.push(["건물", a.buildingType === OTHER_OPTION ? a.buildingOther || "기타" : a.buildingType]);
  if (a.businessType) out.push(["업종", a.businessType === OTHER_OPTION ? a.businessOther || "기타" : a.businessType]);
  if (a.rooms || a.bathrooms || a.balconies)
    out.push(["방·화장실·베란다", `${a.rooms ?? "-"} · ${a.bathrooms ?? "-"} · ${a.balconies ?? "-"}`]);
  if (a.structure) out.push(["구조", a.structure]);
  if (a.extras.length > 0) out.push(["함께", a.extras.join(", ")]);
  if (a.area) out.push(["평수", a.area]);
  if (a.sido && a.sigungu) out.push(["지역", `${a.sido} ${a.sigungu}`]);
  if (a.preferredDate) out.push(["날짜", a.preferredDate]);
  return out;
}

function CountRow({
  label,
  values,
  value,
  onPick,
}: {
  label: string;
  values: readonly number[];
  value?: number;
  onPick: (n: number) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="mb-2 text-[15px] font-bold text-slate-800">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onPick(n)}
              className={`size-11 rounded-lg border-2 text-base font-bold transition-colors ${on ? "border-brand-900 bg-brand-900 text-white" : "border-slate-200 bg-white text-slate-800 hover:border-brand-300"}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepBody({
  step,
  answers: a,
  hints,
  update,
  choose,
  files,
  onPickFiles,
  removeFile,
}: {
  step: StepId;
  answers: QuoteAnswers;
  hints: Partial<Record<QuoteService, string>>;
  update: (p: Partial<QuoteAnswers>) => void;
  choose: (p: Partial<QuoteAnswers>, advance?: boolean) => void;
  files: File[];
  onPickFiles: (l: FileList | null) => void;
  removeFile: (i: number) => void;
}) {
  switch (step) {
    case "service":
      return (
        <div role="radiogroup" aria-label="서비스" className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {QUOTE_SERVICES.map((key) => {
            const on = a.service === key;
            return (
              <button key={key} type="button" role="radio" aria-checked={on} onClick={() => choose({ service: key })} className={`${choiceBase} ${on ? choiceOn : choiceOff}`}>
                <Radio on={on} />
                <span>
                  <span className="block text-lg font-black text-brand-900">{QUOTE_SERVICE_LABEL[key]}</span>
                  {hints[key] && <span className="mt-0.5 block text-[13px] leading-snug text-slate-600">{hints[key]}</span>}
                </span>
              </button>
            );
          })}
        </div>
      );
    case "cleanType":
      return (
        <div role="radiogroup" aria-label="청소 형태" className="grid gap-2">
          {CLEAN_TYPES.map((c) => {
            const on = a.cleanType === c.label;
            return (
              <button key={c.label} type="button" role="radio" aria-checked={on} onClick={() => choose({ cleanType: c.label })} className={`${choiceBase} ${on ? choiceOn : choiceOff} py-3`}>
                <Radio on={on} />
                <span className="sm:flex sm:gap-4">
                  <span className="block shrink-0 text-base font-black text-brand-900 sm:w-28">{c.label}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-slate-600 sm:mt-0 sm:text-sm">{c.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      );
    case "building":
    case "business": {
      const isB = step === "building";
      const options = isB ? BUILDING_TYPES : BUSINESS_TYPES;
      const value = isB ? a.buildingType : a.businessType;
      const other = isB ? a.buildingOther : a.businessOther;
      return (
        <div>
          <div role="radiogroup" aria-label={isB ? "건물 형태" : "업종"} className="grid gap-2 sm:grid-cols-2">
            {options.map((o) => {
              const on = value === o;
              return (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => choose(isB ? { buildingType: o } : { businessType: o }, o !== OTHER_OPTION)}
                  className={`${choiceBase} ${on ? choiceOn : choiceOff} items-center py-3`}
                >
                  <Radio on={on} />
                  <span className="text-base font-bold text-brand-900">{o}</span>
                </button>
              );
            })}
          </div>
          {value === OTHER_OPTION && (
            <label className="mt-3 block">
              <span className="sr-only">직접 입력</span>
              <input
                autoFocus
                className={inputCls}
                maxLength={50}
                placeholder="직접 적어 주세요"
                value={other ?? ""}
                onChange={(e) => (isB ? update({ buildingOther: e.target.value }) : update({ businessOther: e.target.value }))}
              />
            </label>
          )}
        </div>
      );
    }
    case "rooms":
      return (
        <div className="space-y-5">
          <CountRow label="방" values={ROOM_COUNTS} value={a.rooms} onPick={(n) => update({ rooms: n })} />
          <CountRow label="화장실" values={BATH_COUNTS} value={a.bathrooms} onPick={(n) => update({ bathrooms: n })} />
          <CountRow label="베란다" values={BALCONY_COUNTS} value={a.balconies} onPick={(n) => update({ balconies: n })} />
        </div>
      );
    case "structure":
      return (
        <div role="radiogroup" aria-label="구조" className="grid gap-2 sm:grid-cols-2">
          {STRUCTURE_TYPES.map((o) => {
            const on = a.structure === o;
            return (
              <button key={o} type="button" role="radio" aria-checked={on} onClick={() => choose({ structure: o })} className={`${choiceBase} ${on ? choiceOn : choiceOff} items-center`}>
                <Radio on={on} />
                <span className="text-base font-bold text-brand-900">{o}</span>
              </button>
            );
          })}
        </div>
      );
    case "extras":
      return (
        <div>
          <div role="group" aria-label="함께 알아보시는 견적" className="grid gap-2 sm:grid-cols-2">
            {EXTRA_SERVICES.map((o) => {
              const on = a.extras.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => update({ extras: on ? a.extras.filter((x) => x !== o) : [...a.extras, o] })}
                  className={`${choiceBase} ${on ? choiceOn : choiceOff} items-center`}
                >
                  <CheckBox on={on} />
                  <span className="text-base font-bold text-brand-900">{o}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[13px] text-slate-600">여러 개를 고를 수 있어요. 없으면 [다음]을 눌러 주세요.</p>
        </div>
      );
    case "area":
      return (
        <label className="block">
          <span className="sr-only">공급 평수</span>
          <input
            autoFocus
            className={inputCls}
            maxLength={30}
            placeholder="예: 34평"
            value={a.area ?? ""}
            onChange={(e) => update({ area: e.target.value })}
          />
        </label>
      );
    case "address":
      return (
        <div className="space-y-3">
          <RegionStepPicker sido={a.sido} sigungu={a.sigungu} onChange={(v) => update({ sido: v.sido, sigungu: v.sigungu })} />
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-slate-700">나머지 주소</span>
            <input
              className={inputCls}
              maxLength={100}
              autoComplete="address-line2"
              placeholder="아파트 이름, 동 · 호수"
              value={a.addressDetail ?? ""}
              onChange={(e) => update({ addressDetail: e.target.value })}
            />
          </label>
        </div>
      );
    case "date":
      return (
        <div>
          <label className="block">
            <span className="sr-only">원하시는 날짜</span>
            <input
              autoFocus
              className={inputCls}
              maxLength={40}
              placeholder="예: 12월 8일"
              aria-describedby="date-help"
              value={a.preferredDate ?? ""}
              onChange={(e) => update({ preferredDate: e.target.value })}
            />
          </label>
          <p id="date-help" className="mt-2 text-[13px] text-slate-600">
            아직 정해지지 않았다면 &apos;날짜 미정&apos;이라고 적어 주세요.
          </p>
        </div>
      );
    case "contact":
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-slate-700">성함</span>
            <input
              className={inputCls}
              maxLength={20}
              autoComplete="name"
              placeholder="성함"
              value={a.customerName ?? ""}
              onChange={(e) => update({ customerName: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-slate-700">휴대폰 번호</span>
            <input
              className={inputCls}
              inputMode="tel"
              autoComplete="tel"
              maxLength={13}
              placeholder="010-0000-0000"
              value={a.phone ?? ""}
              onChange={(e) => update({ phone: e.target.value })}
            />
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg py-1">
            <input
              type="checkbox"
              className="mt-0.5 size-5 accent-brand-600"
              checked={a.consent === true}
              onChange={(e) => update({ consent: e.target.checked })}
            />
            <span className="text-[15px] text-slate-800">
              개인정보 수집·이용에 동의합니다 (필수){" "}
              <a href="/privacy" target="_blank" className="font-semibold text-brand-700 underline">
                내용 보기
              </a>
            </span>
          </label>
        </div>
      );
    case "message":
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="sr-only">특이사항이나 요청사항</span>
            <textarea
              className={`${inputCls} min-h-28 resize-y`}
              maxLength={1000}
              placeholder="예: 반려동물이 있어요"
              value={a.message ?? ""}
              onChange={(e) => update({ message: e.target.value })}
            />
          </label>
          <div className="rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <Camera aria-hidden className="size-6 shrink-0 text-brand-600" strokeWidth={2} />
              <span>
                <span className="block text-[15px] font-bold text-brand-900">사진 첨부 (선택 · 최대 3장)</span>
                <span className="block text-[13px] text-slate-600">현장 사진이 있으면 함께 보내 주세요.</span>
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                className="sr-only"
                disabled={files.length >= 3}
                onChange={(e) => {
                  onPickFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {files.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-[13px]">
                    <span className="truncate text-slate-800">{f.name}</span>
                    <button type="button" onClick={() => removeFile(i)} aria-label={`${f.name} 빼기`} className="rounded p-1 text-slate-600 hover:text-slate-900">
                      <X aria-hidden className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-[13px] text-slate-600">둘 다 없으면 비워 두고 [견적 요청하기]를 눌러 주세요.</p>
        </div>
      );
  }
}
