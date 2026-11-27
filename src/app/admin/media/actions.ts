"use server";

/**
 * 관리자: 전·후 사진, 고객 후기 캡처.
 * 확인 순서: 관리자 확인 → 형식·5MB 확인 → site-media 에 저장(경로는 서버가 정한다) → site_content 갱신.
 * 브라우저가 이미 긴 변 1600px WebP 로 줄여 보낸다(원본은 오지 않는다).
 */
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBeforeAfter, getReviewCaptures, setSiteContent } from "@/lib/site-content";
import { SERVICE_KEYS, type ServiceKey } from "@/lib/services";
import {
  BEFORE_AFTER_KEY,
  REVIEWS_KEY,
  SITE_MEDIA_BUCKET,
  moveItem,
  nextOrder,
  publicMediaUrl,
  setPublished,
} from "@/lib/media-items";
import type { BeforeAfterItem, MediaFile, ReviewCaptureData } from "@/types/database";

export type MediaResult<T = unknown> = { ok: true; items: T[] } | { ok: false; error: string };
type BaResult = MediaResult<BeforeAfterItem>;
type RvResult = MediaResult<ReviewCaptureData>;

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/webp", "image/jpeg", "image/png"]);
const serviceKey = z.enum(SERVICE_KEYS);
const label = z.string().trim().min(1, "이름을 적어 주세요.").max(30, "이름은 30자 안으로 적어 주세요.");
const caption = z.string().trim().max(60, "설명은 60자 안으로 적어 주세요.");
const id = z.string().min(1).max(80);

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function refresh(services: ServiceKey[]) {
  revalidatePath("/");
  for (const s of new Set(services)) revalidatePath(`/${s}`);
}

/** 파일 확인 후 저장. 실패하면 쉬운 말의 오류를 던진다 */
async function store(file: unknown, path: string): Promise<MediaFile> {
  if (!(file instanceof File) || file.size === 0) throw new Error("사진을 골라 주세요.");
  if (!ALLOWED.has(file.type)) throw new Error("JPG·PNG·WebP 사진만 올릴 수 있어요.");
  if (file.size > MAX_BYTES) throw new Error("사진 한 장은 5MB 이하여야 해요.");
  const buf = Buffer.from(await file.arrayBuffer());
  let meta: sharp.Metadata;
  try {
    meta = await sharp(buf).metadata();
  } catch {
    throw new Error("사진 파일을 읽지 못했어요. 다른 사진으로 해 주세요.");
  }
  if (!meta.width || !meta.height || !["webp", "jpeg", "png"].includes(meta.format ?? "")) {
    throw new Error("사진 파일을 읽지 못했어요. 다른 사진으로 해 주세요.");
  }
  const sb = createSupabaseAdminClient();
  const { error } = await sb.storage
    .from(SITE_MEDIA_BUCKET)
    .upload(path, buf, { contentType: file.type, upsert: false, cacheControl: "31536000" });
  if (error) throw new Error("저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  return { url: publicMediaUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, path), path, width: meta.width, height: meta.height };
}

async function removeFiles(paths: string[]) {
  // 이 기능이 만든 폴더의 파일만 지운다
  const safe = paths.filter((p) => /^(before-after|reviews)\/[\w./-]+$/.test(p) && !p.includes(".."));
  if (safe.length === 0) return;
  const sb = createSupabaseAdminClient();
  const { error } = await sb.storage.from(SITE_MEDIA_BUCKET).remove(safe);
  if (error) throw new Error("저장소 파일을 지우지 못했어요. 잠시 뒤 다시 시도해 주세요.");
}

async function run<T>(fn: () => Promise<T[]>): Promise<MediaResult<T>> {
  try {
    return { ok: true, items: await fn() };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    // 우리가 만든 쉬운 말 오류만 그대로 보여 주고, 그 밖은 일반 안내
    return fail(/[가-힣]/.test(msg) ? msg : "처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  }
}

// ============================================================
// 전·후 사진
// ============================================================

export async function addBeforeAfter(fd: FormData): Promise<BaResult> {
  await assertAdmin();
  const parsed = z
    .object({ service: serviceKey, label, caption })
    .safeParse({ service: fd.get("service"), label: fd.get("label"), caption: fd.get("caption") ?? "" });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
  const { service } = parsed.data;
  return run(async () => {
    const uid = randomUUID();
    const before = await store(fd.get("before"), `before-after/${service}/${uid}-before.webp`);
    let after: MediaFile;
    try {
      after = await store(fd.get("after"), `before-after/${service}/${uid}-after.webp`);
    } catch (e) {
      await removeFiles([before.path]);
      throw e;
    }
    const items = await getBeforeAfter();
    const item: BeforeAfterItem = {
      id: uid,
      service,
      label: parsed.data.label,
      ...(parsed.data.caption ? { caption: parsed.data.caption } : {}),
      before,
      after,
      order: nextOrder(items.filter((x) => x.service === service)),
      // 새 짝은 확인한 뒤 공개한다
      published: false,
    };
    const next = [...items, item];
    await setSiteContent(BEFORE_AFTER_KEY, next);
    refresh([service]);
    return next;
  });
}

export async function updateBeforeAfterText(itemId: string, input: { label: string; caption: string }): Promise<BaResult> {
  await assertAdmin();
  const p = z.object({ itemId: id, label, caption }).safeParse({ itemId, ...input });
  if (!p.success) return fail(p.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
  return run(async () => {
    const items = await getBeforeAfter();
    const target = items.find((x) => x.id === itemId);
    if (!target) throw new Error("이미 지워진 항목이에요.");
    const next = items.map((x) => {
      if (x.id !== itemId) return x;
      const { caption: _old, ...rest } = x;
      void _old;
      return { ...rest, label: p.data.label, ...(p.data.caption ? { caption: p.data.caption } : {}) };
    });
    await setSiteContent(BEFORE_AFTER_KEY, next);
    refresh([target.service]);
    return next;
  });
}

export async function moveBeforeAfter(itemId: string, dir: -1 | 1): Promise<BaResult> {
  await assertAdmin();
  if (!id.safeParse(itemId).success || (dir !== -1 && dir !== 1)) return fail("입력값을 확인해 주세요.");
  return run(async () => {
    const items = await getBeforeAfter();
    const target = items.find((x) => x.id === itemId);
    if (!target) throw new Error("이미 지워진 항목이에요.");
    const next = moveItem(items, itemId, dir, (a, b) => a.service === b.service);
    await setSiteContent(BEFORE_AFTER_KEY, next);
    refresh([target.service]);
    return next;
  });
}

export async function publishBeforeAfter(itemId: string, published: boolean): Promise<BaResult> {
  await assertAdmin();
  if (!id.safeParse(itemId).success || typeof published !== "boolean") return fail("입력값을 확인해 주세요.");
  return run(async () => {
    const items = await getBeforeAfter();
    const target = items.find((x) => x.id === itemId);
    if (!target) throw new Error("이미 지워진 항목이에요.");
    const next = setPublished(items, itemId, published);
    await setSiteContent(BEFORE_AFTER_KEY, next);
    refresh([target.service]);
    return next;
  });
}

export async function deleteBeforeAfter(itemId: string): Promise<BaResult> {
  await assertAdmin();
  if (!id.safeParse(itemId).success) return fail("입력값을 확인해 주세요.");
  return run(async () => {
    const items = await getBeforeAfter();
    const target = items.find((x) => x.id === itemId);
    if (!target) throw new Error("이미 지워진 항목이에요.");
    await removeFiles([target.before.path, target.after.path]);
    const next = items.filter((x) => x.id !== itemId);
    await setSiteContent(BEFORE_AFTER_KEY, next);
    refresh([target.service]);
    return next;
  });
}

// ============================================================
// 고객 후기 캡처 (가린 결과만 받는다)
// ============================================================

const services = z.array(serviceKey).max(6);

export async function addReview(fd: FormData): Promise<RvResult> {
  await assertAdmin();
  const p = z
    .object({ label, services })
    .safeParse({ label: fd.get("label"), services: fd.getAll("services") });
  if (!p.success) return fail(p.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
  return run(async () => {
    const uid = randomUUID();
    const image = await store(fd.get("image"), `reviews/${uid}.webp`);
    const items = await getReviewCaptures();
    const item: ReviewCaptureData = {
      id: uid,
      image,
      label: p.data.label,
      services: p.data.services,
      order: nextOrder(items),
      published: false,
    };
    const next = [...items, item];
    await setSiteContent(REVIEWS_KEY, next);
    refresh(p.data.services);
    return next;
  });
}

export async function updateReview(itemId: string, input: { label: string; services: string[] }): Promise<RvResult> {
  await assertAdmin();
  const p = z.object({ itemId: id, label, services }).safeParse({ itemId, ...input });
  if (!p.success) return fail(p.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
  return run(async () => {
    const items = await getReviewCaptures();
    const target = items.find((x) => x.id === itemId);
    if (!target) throw new Error("이미 지워진 항목이에요.");
    const next = items.map((x) => (x.id === itemId ? { ...x, label: p.data.label, services: p.data.services } : x));
    await setSiteContent(REVIEWS_KEY, next);
    refresh([...target.services, ...p.data.services]);
    return next;
  });
}

export async function moveReview(itemId: string, dir: -1 | 1): Promise<RvResult> {
  await assertAdmin();
  if (!id.safeParse(itemId).success || (dir !== -1 && dir !== 1)) return fail("입력값을 확인해 주세요.");
  return run(async () => {
    const items = await getReviewCaptures();
    const target = items.find((x) => x.id === itemId);
    if (!target) throw new Error("이미 지워진 항목이에요.");
    const next = moveItem(items, itemId, dir);
    await setSiteContent(REVIEWS_KEY, next);
    refresh(target.services);
    return next;
  });
}

export async function publishReview(itemId: string, published: boolean): Promise<RvResult> {
  await assertAdmin();
  if (!id.safeParse(itemId).success || typeof published !== "boolean") return fail("입력값을 확인해 주세요.");
  return run(async () => {
    const items = await getReviewCaptures();
    const target = items.find((x) => x.id === itemId);
    if (!target) throw new Error("이미 지워진 항목이에요.");
    const next = setPublished(items, itemId, published);
    await setSiteContent(REVIEWS_KEY, next);
    refresh(target.services);
    return next;
  });
}

export async function deleteReview(itemId: string): Promise<RvResult> {
  await assertAdmin();
  if (!id.safeParse(itemId).success) return fail("입력값을 확인해 주세요.");
  return run(async () => {
    const items = await getReviewCaptures();
    const target = items.find((x) => x.id === itemId);
    if (!target) throw new Error("이미 지워진 항목이에요.");
    if (target.image.path) await removeFiles([target.image.path]);
    const next = items.filter((x) => x.id !== itemId);
    await setSiteContent(REVIEWS_KEY, next);
    refresh(target.services);
    return next;
  });
}
