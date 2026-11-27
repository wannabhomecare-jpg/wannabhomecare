/**
 * 오픈 전 점검. 하나라도 걸리면 목록을 출력하고 실패한다(종료 코드 1).
 * 실행: npm run check:launch  (.env.local 이 있으면 그 값을 읽는다. 배포 값으로 볼 때는 환경변수를 넘긴다)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { DEFAULT_SERVICES } from "../src/lib/services";
import { DEFAULT_HERO_SLIDES } from "../src/lib/site-content";
import { normalizeKakao, normalizePhone } from "../src/lib/contact";
import { INSTAGRAM_CONNECTED } from "../src/lib/visibility";
import { CATEGORIES, listDrafts } from "../src/content/categories";
import { normalizeBeforeAfter, publishedBeforeAfter } from "../src/lib/media-items";
import { imageMetaProblems, mp4Info } from "./lib/media-meta.mjs";

const root = path.resolve(import.meta.dirname, "..");
const fails: string[] = [];
const notes: string[] = [];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// 1) 단계
if (process.env.NEXT_PUBLIC_SITE_STAGE !== "production") {
  fails.push(`단계가 production 이 아닙니다(지금: ${process.env.NEXT_PUBLIC_SITE_STAGE || "비어 있음 → preview"}).`);
}
// 2) 연락처
if (!normalizePhone(process.env.NEXT_PUBLIC_PHONE)) fails.push("전화번호(NEXT_PUBLIC_PHONE)가 비어 있거나 형식이 틀립니다.");
if (!normalizeKakao(process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL)) fails.push("카카오 채널(NEXT_PUBLIC_KAKAO_CHANNEL_URL)이 비어 있거나 pf.kakao.com/_<ID> 형식이 아닙니다.");
// 3) 사진 준비 중 자리표시
for (const s of DEFAULT_SERVICES) if (!s.image) fails.push(`서비스 카드 '${s.name}' 사진이 '사진 준비 중'입니다.`);
DEFAULT_HERO_SLIDES.forEach((s, i) => {
  if (!s.image) fails.push(`첫 화면 ${i + 1}장(${s.title1}) 사진이 '사진 준비 중'입니다.`);
});
// 4) 푸터 AI 이미지 안내
const footer = readFileSync(path.join(root, "src/components/landing/Footer.tsx"), "utf8");
if (!footer.includes("일부 이미지는 AI로 제작한 연출 이미지입니다.")) fails.push("푸터의 AI 이미지 안내 문구가 없습니다.");
// 5) 쓰면 안 되는 문구(화면·검색 설명)
const banned = ["추가금 0", "추가금 없", "추가 비용 0", "추가 비용 없", "금액 그대로", "금액이 달라지지", "견적 그대로", "방문 견적", "출장 견적"];
for (const f of [...walk(path.join(root, "src")), ...walk(path.join(root, "public"))]) {
  if (!/\.(tsx?|css|txt|json|svg|md)$/.test(f)) continue;
  const text = readFileSync(f, "utf8");
  for (const b of banned) if (text.includes(b)) fails.push(`쓰면 안 되는 문구 '${b}': ${path.relative(root, f)}`);
}

// 6) 카테고리 초안 — 카테고리·항목별로 센다
const drafts = listDrafts();
if (drafts.length) {
  const by = new Map<string, number>();
  for (const d of drafts) by.set(d.name, (by.get(d.name) ?? 0) + 1);
  fails.push(`카테고리 초안 ${drafts.length}건이 남아 있습니다(${[...by].map(([n, c]) => `${n} ${c}`).join(" · ")}).`);
  for (const d of drafts) fails.push(`  초안: ${d.name} · ${d.item}`);
}
// 7) public/real/ 메타데이터 — 사진 exif·xmp, 영상 위치·날짜·기기 태그가 없어야 한다
const realDir = path.join(root, "public/real");
for (const f of walk(realDir)) {
  const rel = path.relative(root, f);
  if (/\.(webp|jpe?g|png)$/i.test(f)) {
    const p = await imageMetaProblems(f);
    if (p.length) fails.push(`메타데이터가 남은 사진: ${rel} (${p.join(", ")})`);
  } else if (/\.mp4$/i.test(f)) {
    const info = mp4Info(f);
    if (info.problems.length) fails.push(`메타데이터가 남은 영상: ${rel} (${info.problems.join(", ")})`);
  }
}

// 알림(실패시키지 않는다)
// 전·후 짝이 없는 카테고리
try {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const r = await fetch(`${url}/rest/v1/site_content?select=value&key=eq.before_after`, { headers: { apikey: key } });
    const items = normalizeBeforeAfter((await r.json())[0]?.value ?? []);
    const empty = Object.values(CATEGORIES).filter((c) => publishedBeforeAfter(items, c.slug).length === 0);
    if (empty.length) notes.push(`공개된 전·후 사진이 없는 카테고리: ${empty.map((c) => c.name).join(" · ")} (오픈 단계에서 그 블록은 숨겨집니다)`);
  }
} catch {
  notes.push("전·후 사진 개수를 DB 에서 읽지 못했습니다.");
}
notes.push("공개된 후기 캡처 수는 DB 에서 확인합니다. 0건이면 오픈 단계에서 후기 블록이 숨겨집니다.");
if (!INSTAGRAM_CONNECTED) notes.push("인스타그램 연동 전입니다. 오픈 단계에서 인스타그램 블록이 숨겨집니다.");
notes.push("사람이 확인할 항목은 docs/launch-checklist.md 에 있습니다.");

console.log("## check:launch");
for (const n of notes) console.log(`알림: ${n}`);
if (fails.length) {
  console.log(`\n실패 ${fails.length}건`);
  for (const f of fails) console.log(`- ${f}`);
  process.exit(1);
}
console.log("\n통과");
