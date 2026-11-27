import { IS_PREVIEW } from "@/lib/env";

/** 고객 확인 전 초안 표시 — 미리보기 단계에서만 보인다. */
export function DraftBadge({ draft, dark = false }: { draft?: boolean; dark?: boolean }) {
  if (!draft || !IS_PREVIEW) return null;
  return (
    <span
      data-draft-badge
      title="대표님 확인 전 초안 문구입니다"
      className={`ml-2 inline-flex shrink-0 items-center rounded-full border border-dashed px-2 py-0.5 align-middle text-[11px] leading-4 font-bold tracking-normal ${
        dark ? "border-brand-300 text-brand-200" : "border-brand-500 bg-white text-brand-700"
      }`}
    >
      초안
    </span>
  );
}
