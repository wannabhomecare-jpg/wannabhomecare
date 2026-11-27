/**
 * 전·후 사진과 후기 캡처 목록을 다루는 순수 함수(서버·브라우저·테스트 공통).
 * DB(site_content)에는 배열 하나로 저장하고, 순서는 order 로 정한다.
 */
import { DEFAULT_SERVICES, SERVICE_KEYS, type ServiceKey } from "@/lib/services";
import type { BeforeAfterItem, LegacyReviewCapture, MediaFile, ReviewCaptureData } from "@/types/database";

export const SITE_MEDIA_BUCKET = "site-media";
export const BEFORE_AFTER_KEY = "before_after";
export const REVIEWS_KEY = "review_captures";

export function publicMediaUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${SITE_MEDIA_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

const isServiceKey = (v: unknown): v is ServiceKey => typeof v === "string" && (SERVICE_KEYS as readonly string[]).includes(v);

function isMediaFile(v: unknown): v is MediaFile {
  const m = v as MediaFile;
  return !!m && typeof m.url === "string" && typeof m.path === "string" && Number.isFinite(m.width) && Number.isFinite(m.height);
}

/** 서비스 이름(예: '청소', '에어컨청소')을 키로. 모르면 null */
function serviceKeyFromName(name: string): ServiceKey | null {
  if (isServiceKey(name)) return name;
  const hit = DEFAULT_SERVICES.find((s) => s.name === name.trim());
  return hit?.key ?? null;
}

/** 저장된 후기 목록을 새 모양으로 읽는다. Phase 1 의 옛 모양(service·region·month)은 label '서비스 · 지역'으로 바꾼다. */
export function normalizeReviews(raw: unknown): ReviewCaptureData[] {
  if (!Array.isArray(raw)) return [];
  const out: ReviewCaptureData[] = [];
  raw.forEach((r, i) => {
    if (!r || typeof r !== "object" || typeof (r as { id?: unknown }).id !== "string") return;
    const v = r as Partial<ReviewCaptureData> & Partial<LegacyReviewCapture>;
    if (isMediaFile(v.image)) {
      out.push({
        id: v.id!,
        image: v.image,
        label: typeof v.label === "string" ? v.label : "",
        services: Array.isArray(v.services) ? v.services.filter(isServiceKey) : [],
        order: Number.isFinite(v.order) ? (v.order as number) : i + 1,
        published: v.published === true,
      });
      return;
    }
    if (typeof v.image === "string" && v.image) {
      const legacy = v as LegacyReviewCapture;
      const key = serviceKeyFromName(legacy.service ?? "");
      out.push({
        id: legacy.id,
        // 옛 모양에는 크기가 없다. 후기 캡처의 흔한 비율(1080×400)로 둔다
        image: { url: legacy.image, path: "", width: 1080, height: 400 },
        label: [legacy.service, legacy.region].filter((s) => s && s.trim()).join(" · "),
        services: key ? [key] : [],
        order: i + 1,
        published: legacy.published === true,
      });
    }
  });
  return sortByOrder(out);
}

export function normalizeBeforeAfter(raw: unknown): BeforeAfterItem[] {
  if (!Array.isArray(raw)) return [];
  const out: BeforeAfterItem[] = [];
  raw.forEach((r, i) => {
    const v = r as Partial<BeforeAfterItem>;
    if (!v || typeof v.id !== "string" || !isServiceKey(v.service) || !isMediaFile(v.before) || !isMediaFile(v.after)) return;
    out.push({
      id: v.id,
      service: v.service,
      label: typeof v.label === "string" ? v.label : "",
      ...(typeof v.caption === "string" && v.caption ? { caption: v.caption } : {}),
      before: v.before,
      after: v.after,
      order: Number.isFinite(v.order) ? (v.order as number) : i + 1,
      published: v.published === true,
    });
  });
  return sortByOrder(out);
}

export function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function publishedBeforeAfter(items: BeforeAfterItem[], service: ServiceKey): BeforeAfterItem[] {
  return sortByOrder(items.filter((b) => b.published && b.service === service));
}

export function publishedReviews(items: ReviewCaptureData[], service?: ServiceKey): ReviewCaptureData[] {
  return sortByOrder(items.filter((r) => r.published && r.image?.url && (!service || r.services.includes(service))));
}

/**
 * 항목 하나를 위(-1)·아래(+1)로 옮긴다. sameGroup 을 주면 그 묶음(예: 같은 서비스) 안에서만 움직이고,
 * 그 묶음의 order 를 1부터 다시 매긴다. 다른 항목은 건드리지 않는다.
 */
export function moveItem<T extends { id: string; order: number }>(
  items: T[],
  id: string,
  dir: -1 | 1,
  sameGroup: (a: T, b: T) => boolean = () => true,
): T[] {
  const target = items.find((x) => x.id === id);
  if (!target) return items;
  const group = sortByOrder(items.filter((x) => sameGroup(x, target)));
  const idx = group.findIndex((x) => x.id === id);
  const to = idx + dir;
  if (to < 0 || to >= group.length) return items;
  const reordered = [...group];
  [reordered[idx], reordered[to]] = [reordered[to], reordered[idx]];
  const newOrder = new Map(reordered.map((x, i) => [x.id, i + 1]));
  return items.map((x) => (newOrder.has(x.id) ? { ...x, order: newOrder.get(x.id)! } : x));
}

export function setPublished<T extends { id: string; published: boolean }>(items: T[], id: string, published: boolean): T[] {
  return items.map((x) => (x.id === id ? { ...x, published } : x));
}

/** 새 항목의 order: 같은 묶음의 마지막 다음 */
export function nextOrder<T extends { order: number }>(items: T[]): number {
  return items.reduce((m, x) => Math.max(m, x.order), 0) + 1;
}

/** 한 짝의 두 장 비율이 다른지(경고용). 1% 넘게 다르면 true */
export function ratioMismatch(a: { width: number; height: number }, b: { width: number; height: number }): boolean {
  const ra = a.width / a.height;
  const rb = b.width / b.height;
  return Math.abs(ra - rb) / ra > 0.01;
}

/** 서비스별 전·후 배지 말 */
export function beforeAfterBadges(service: ServiceKey): [string, string] {
  switch (service) {
    case "clean":
      return ["청소 전", "청소 후"];
    case "aircon":
      return ["세척 전", "세척 후"];
    case "kirby":
      return ["케어 전", "케어 후"];
    default:
      return ["시공 전", "시공 후"];
  }
}
