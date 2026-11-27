import assert from "node:assert/strict";
import test from "node:test";
import {
  beforeAfterBadges,
  moveItem,
  normalizeBeforeAfter,
  normalizeReviews,
  publishedBeforeAfter,
  publishedReviews,
  ratioMismatch,
  setPublished,
} from "../src/lib/media-items";

const m = (p: string, w = 1200, h = 1600) => ({ url: `https://x.example/${p}`, path: p, width: w, height: h });

test("옛 후기 모양(service·region·month)을 새 모양으로 읽는다", () => {
  const out = normalizeReviews([{ id: "a", image: "/x.webp", service: "청소", region: "서울 중구", month: "2026-11", published: true }]);
  assert.equal(out.length, 1);
  assert.equal(out[0].label, "청소 · 서울 중구");
  assert.deepEqual(out[0].services, ["clean"]);
  assert.equal(out[0].image.url, "/x.webp");
});

test("새 후기 모양은 그대로, 모르는 서비스 키는 뺀다", () => {
  const out = normalizeReviews([{ id: "b", image: m("r.webp", 1080, 300), label: "이사청소", services: ["clean", "nope"], order: 2, published: true }]);
  assert.deepEqual(out[0].services, ["clean"]);
});

const ba = [
  { id: "c1", service: "clean", label: "창틀", before: m("1"), after: m("2"), order: 1, published: true },
  { id: "c2", service: "clean", label: "주방", before: m("3"), after: m("4"), order: 2, published: true },
  { id: "a1", service: "aircon", label: "필터", before: m("5"), after: m("6"), order: 1, published: true },
  { id: "c3", service: "clean", label: "욕실", before: m("7"), after: m("8"), order: 3, published: false },
];

test("순서 바꾸기: 같은 서비스 안에서만 움직이고 order 를 다시 매긴다", () => {
  const items = normalizeBeforeAfter(ba);
  const moved = moveItem(items, "c2", -1, (a, b) => a.service === b.service);
  const clean = moved.filter((x) => x.service === "clean").sort((a, b) => a.order - b.order).map((x) => x.id);
  assert.deepEqual(clean, ["c2", "c1", "c3"]);
  assert.equal(moved.find((x) => x.id === "a1")!.order, 1);
  // 맨 위에서 위로는 그대로
  assert.deepEqual(moveItem(items, "c1", -1, (a, b) => a.service === b.service), items);
});

test("공개 전환과 공개 목록", () => {
  const items = setPublished(normalizeBeforeAfter(ba), "c3", true);
  assert.deepEqual(publishedBeforeAfter(items, "clean").map((x) => x.id), ["c1", "c2", "c3"]);
  const hidden = setPublished(items, "c1", false);
  assert.deepEqual(publishedBeforeAfter(hidden, "clean").map((x) => x.id), ["c2", "c3"]);
});

test("후기는 services 에 그 서비스가 있는 공개 캡처만", () => {
  const r = normalizeReviews([
    { id: "1", image: m("a"), label: "", services: ["clean", "grout"], order: 1, published: true },
    { id: "2", image: m("b"), label: "", services: ["clean"], order: 2, published: false },
  ]);
  assert.equal(publishedReviews(r, "grout").length, 1);
  assert.equal(publishedReviews(r, "clean").length, 1);
  assert.equal(publishedReviews(r).length, 1);
});

test("배지와 비율 경고", () => {
  assert.deepEqual(beforeAfterBadges("clean"), ["청소 전", "청소 후"]);
  assert.deepEqual(beforeAfterBadges("aircon"), ["세척 전", "세척 후"]);
  assert.deepEqual(beforeAfterBadges("kirby"), ["케어 전", "케어 후"]);
  assert.deepEqual(beforeAfterBadges("coating"), ["시공 전", "시공 후"]);
  assert.equal(ratioMismatch({ width: 1200, height: 1600 }, { width: 600, height: 800 }), false);
  assert.equal(ratioMismatch({ width: 1600, height: 1200 }, { width: 1200, height: 1600 }), true);
});
