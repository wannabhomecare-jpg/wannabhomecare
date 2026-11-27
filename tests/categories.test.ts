import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { CATEGORIES, getCategory, listDrafts } from "../src/content/categories";
import { SERVICE_KEYS } from "../src/lib/services";
import { COATING_SWATCHES } from "../src/lib/theme-tokens";

const RAW = "materials/raw/phase2/content";

test("카테고리 6개, getCategory", () => {
  assert.deepEqual(Object.keys(CATEGORIES), [...SERVICE_KEYS]);
  assert.equal(getCategory("clean")?.name, "청소");
  assert.equal(getCategory("abc"), null);
});

test("문구는 묶음 JSON 과 한 글자도 다르지 않다(색 값만 토큰 이름으로)", { skip: !existsSync(RAW) && "자료 묶음이 없어 건너뜀" }, () => {
  const hexByKey = Object.fromEntries(Object.entries(COATING_SWATCHES).map(([k, v]) => [k, v]));
  for (const slug of SERVICE_KEYS) {
    const raw = JSON.parse(readFileSync(`${RAW}/${slug}.json`, "utf8"));
    const ours = structuredClone(CATEGORIES[slug]) as unknown as Record<string, unknown> & {
      colors?: { swatches: { name: string; swatch: keyof typeof COATING_SWATCHES; fit: string }[] };
    };
    if (ours.colors) {
      (ours.colors as unknown as { swatches: unknown[] }).swatches = ours.colors.swatches.map((s) => ({ name: s.name, hex: hexByKey[s.swatch], fit: s.fit }));
    }
    assert.deepEqual(ours, raw, slug);
  }
});

test("콘텐츠 파일에 색 값(#…)이 없다", () => {
  for (const slug of SERVICE_KEYS) {
    const text = readFileSync(`src/content/categories/${slug}.ts`, "utf8");
    assert.doesNotMatch(text, /#[0-9a-fA-F]{6}\b/, slug);
  }
});

test("초안 목록: 카테고리·항목별로 센다", () => {
  const drafts = listDrafts();
  assert.ok(drafts.length > 0);
  assert.ok(drafts.every((d) => d.slug && d.item));
  // 에어컨은 '무엇이 다른가요' 1건
  assert.deepEqual(drafts.filter((d) => d.slug === "aircon").map((d) => d.item), ["무엇이 다른가요"]);
});

test("히어로: backgroundVideo 가 있으면 영상, '@service:' 는 서비스 사진, 없으면 남색 바탕", async () => {
  const { resolveHeroMedia } = await import("../src/lib/category-media");
  const services = [
    { key: "grout" as const, image: "/photos/service-4-grout.webp", alt: "줄눈 사진" },
    { key: "kirby" as const, image: null, alt: "" },
  ];
  const base = CATEGORIES.grout.hero;
  assert.deepEqual(resolveHeroMedia({ ...base, backgroundVideo: { src: "/real/x.mp4", poster: "/real/x.jpg" } }, services), {
    type: "video",
    src: "/real/x.mp4",
    poster: "/real/x.jpg",
    kind: "ai",
  });
  const img = resolveHeroMedia(base, services);
  assert.equal(img.type, "image");
  assert.equal(img.type === "image" && img.src, "/photos/service-4-grout.webp");
  assert.equal(img.type === "image" && img.alt, "줄눈 사진");
  assert.deepEqual(resolveHeroMedia(CATEGORIES.kirby.hero, services), { type: "none" });
  assert.equal(resolveHeroMedia(CATEGORIES.clean.hero, services).type, "image");
});
