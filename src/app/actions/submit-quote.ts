"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatPhone, quotePayloadSchema } from "@/lib/quote";
import { isValidRegion } from "@/lib/regions-kr";
import { hit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import type { QuoteRequestInsert } from "@/types/database";

/** 30초 무료 견적 문의 — 13번 화면에서 한 번에 제출한다. 저장은 서버(서버 키)에서만 한다. */

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGES = 3;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const REQUEST_BUCKET = "request-images";

export type SubmitQuoteState = { status: "idle" } | { status: "success" } | { status: "error"; message: string };

function pickImages(formData: FormData): File[] {
  return formData.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);
}

function objectPath(mime: string): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  return `requests/${yyyy}/${mm}/${now.getTime()}-${rand}.${ext}`;
}

export async function submitQuote(_prev: SubmitQuoteState, formData: FormData): Promise<SubmitQuoteState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const limited = hit(`quote:${ip}`, 8, 10 * 60_000);
  if (!limited.allowed) {
    return { status: "error", message: "잠시 후 다시 시도해 주세요." };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { status: "error", message: "입력하신 내용을 확인해 주세요." };
  }
  const parsed = quotePayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "입력하신 내용을 확인해 주세요." };
  }
  const p = parsed.data;
  if (!isValidRegion(p.sido, p.sigungu)) {
    return { status: "error", message: "주소의 시·도와 시·군·구를 다시 골라 주세요." };
  }

  const files = pickImages(formData);
  if (files.length > MAX_IMAGES) return { status: "error", message: "사진은 최대 3장까지 첨부할 수 있어요." };
  if (files.some((f) => !ALLOWED_MIME.includes(f.type as (typeof ALLOWED_MIME)[number]))) {
    return { status: "error", message: "JPG, PNG, WEBP 사진만 첨부할 수 있어요." };
  }
  if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES) {
    return { status: "error", message: "사진 용량이 너무 커요. 사진 수를 줄여 다시 시도해 주세요." };
  }

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch (err) {
    console.error("[submit-quote] supabase config:", err instanceof Error ? err.message : "unknown");
    return { status: "error", message: "지금은 접수할 수 없어요. 잠시 후 다시 시도하거나 전화로 문의해 주세요." };
  }

  const paths: string[] = [];
  for (const file of files) {
    const path = objectPath(file.type);
    const { error } = await supabase.storage
      .from(REQUEST_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      console.error("[submit-quote] upload error:", error.message);
      if (paths.length) await supabase.storage.from(REQUEST_BUCKET).remove(paths);
      return { status: "error", message: "사진을 올리지 못했어요. 사진을 빼고 다시 시도해 주세요." };
    }
    paths.push(path);
  }

  const row: QuoteRequestInsert = {
    service: p.service,
    clean_type: p.cleanType ?? null,
    building_type: p.buildingType ?? null,
    building_other: p.buildingOther || null,
    business_type: p.businessType ?? null,
    business_other: p.businessOther || null,
    rooms: p.rooms ?? null,
    bathrooms: p.bathrooms ?? null,
    balconies: p.balconies ?? null,
    structure: p.structure ?? null,
    extra_services: p.extras ?? [],
    area: p.area,
    sido: p.sido,
    sigungu: p.sigungu,
    address_detail: p.addressDetail,
    preferred_date: p.preferredDate,
    customer_name: p.customerName,
    phone: formatPhone(p.phone),
    message: p.message || null,
    image_paths: paths,
    consent_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("quote_requests").insert(row);
  if (error) {
    console.error("[submit-quote] insert error:", error.message);
    if (paths.length) await supabase.storage.from(REQUEST_BUCKET).remove(paths);
    return { status: "error", message: "접수를 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  return { status: "success" };
}
