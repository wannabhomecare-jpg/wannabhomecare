/**
 * Phase 2 시드 — 자료 묶음의 전·후 사진 8쌍과 가린 후기 캡처 12장을 넣는다.
 * 실행: node --env-file=.env.local scripts/seed-phase2.mjs [묶음 폴더(기본 materials/raw/phase2)]
 *
 * - 파일은 seed.json 의 storagePath 로 site-media 버킷에 올린다. 이미 있으면 건너뛴다(덮지 않는다).
 * - 항목은 site_content 의 before_after · review_captures 에 id 로 넣는다. 이미 있는 id 는 건너뛴다
 *   (관리자가 고친 라벨·공개 여부·순서를 덮지 않는다).
 * - 아무것도 지우지 않는다. 두 번 실행해도 결과가 같다.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const dir = path.resolve(process.argv[2] || "materials/raw/phase2");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
  process.exit(1);
}
const seed = JSON.parse(readFileSync(path.join(dir, "seed", "seed.json"), "utf8"));
const BUCKET = seed.bucket || "site-media";
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const publicUrl = (p) => `${url.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${p.split("/").map(encodeURIComponent).join("/")}`;

const stats = { uploaded: 0, skippedFiles: 0, added: { before_after: 0, review_captures: 0 }, skippedItems: 0 };

async function upload(file, storagePath) {
  const body = readFileSync(path.join(dir, file));
  const contentType = /\.webp$/i.test(file) ? "image/webp" : /\.png$/i.test(file) ? "image/png" : "image/jpeg";
  const { error } = await sb.storage.from(BUCKET).upload(storagePath, body, { contentType, upsert: false, cacheControl: "31536000" });
  if (!error) return void stats.uploaded++;
  if (/exists|duplicate/i.test(error.message) || error.statusCode === "409") return void stats.skippedFiles++;
  throw new Error(`올리기 실패 ${storagePath}: ${error.message}`);
}

const media = (f) => ({ url: publicUrl(f.storagePath), path: f.storagePath, width: f.width, height: f.height });

async function readKey(k) {
  const { data, error } = await sb.from("site_content").select("value").eq("key", k).maybeSingle();
  if (error) throw new Error(`site_content 읽기 실패: ${error.message}`);
  return Array.isArray(data?.value) ? data.value : [];
}

async function merge(k, items) {
  const current = await readKey(k);
  const have = new Set(current.map((x) => x.id));
  const add = items.filter((x) => !have.has(x.id));
  stats.skippedItems += items.length - add.length;
  stats.added[k] = add.length;
  if (add.length === 0) return current.length;
  const next = [...current, ...add];
  const { error } = await sb.from("site_content").upsert({ key: k, value: next }, { onConflict: "key" });
  if (error) throw new Error(`site_content 저장 실패: ${error.message}`);
  return next.length;
}

for (const b of seed.before_after) {
  await upload(b.before.file, b.before.storagePath);
  await upload(b.after.file, b.after.storagePath);
}
for (const r of seed.review_captures) await upload(r.file, r.storagePath);

const baCount = await merge(
  "before_after",
  seed.before_after.map((b) => ({
    id: b.id,
    service: b.service,
    label: b.label,
    ...(b.caption ? { caption: b.caption } : {}),
    before: media(b.before),
    after: media(b.after),
    order: b.order,
    published: b.published,
  })),
);
const rvCount = await merge(
  "review_captures",
  seed.review_captures.map((r) => ({
    id: r.id,
    image: media(r),
    label: r.label,
    services: r.services,
    order: r.order,
    published: r.published,
  })),
);

console.log(
  `파일: 올림 ${stats.uploaded} · 이미 있음 ${stats.skippedFiles} | 항목: 더함 before_after ${stats.added.before_after} · review_captures ${stats.added.review_captures} · 이미 있음 ${stats.skippedItems} | 지금 개수: before_after ${baCount} · review_captures ${rvCount}`,
);
