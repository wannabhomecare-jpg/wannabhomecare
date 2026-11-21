import assert from "node:assert/strict";
import test from "node:test";
import { advanceDemoStatus, buildDemoRows, isFresh, planBoard } from "../src/lib/live-board";
import type { QuoteBoardItem } from "../src/types/database";

const now = new Date("2026-11-21T03:00:00.000Z");
const mk = (i: number, minutesAgo: number, status: QuoteBoardItem["status"] = "quote"): QuoteBoardItem => ({
  id: `r${i}`,
  masked_name: "김○○",
  region: "서울 중구",
  service_label: "입주청소",
  status,
  created_at: new Date(now.getTime() - minutesAgo * 60_000).toISOString(),
});

test("production: 예시 행이 나오지 않고, 실제 시각·상태 그대로다", () => {
  const real = [mk(1, 3, "pending"), mk(2, 50), mk(3, 120, "done"), mk(4, 300), mk(5, 2000)];
  const plan = planBoard({ stage: "production", enabled: true, real, now });
  assert.equal(plan.mode, "list");
  if (plan.mode !== "list") return;
  assert.equal(plan.demo, false);
  assert.ok(plan.rows.every((r) => !r.demo));
  assert.deepEqual(
    plan.rows.map((r) => [r.created_at, r.status]),
    real.map((r) => [r.created_at, r.status]),
  );
});

test("production: 실제 요청이 5건 미만이면 견적 시작 카드", () => {
  const plan = planBoard({ stage: "production", enabled: true, real: [mk(1, 1), mk(2, 2)], now });
  assert.equal(plan.mode, "start");
});

test("production: 24시간 안에 요청이 없으면 LIVE 가 아니다", () => {
  const old = [1, 2, 3, 4, 5].map((i) => mk(i, 60 * 30 + i));
  const plan = planBoard({ stage: "production", enabled: true, real: old, now });
  assert.equal(plan.mode === "list" && plan.live, false);
});

test("NEW 는 10분 안의 실제 요청에만", () => {
  assert.equal(isFresh(mk(1, 9).created_at, now), true);
  assert.equal(isFresh(mk(1, 11).created_at, now), false);
});

test("preview: 예시 행이 '예시'로 붙고, 상태는 상담진행까지만 넘어간다", () => {
  const plan = planBoard({ stage: "preview", enabled: true, real: [], now });
  assert.equal(plan.mode === "list" && plan.demo, true);
  assert.equal(advanceDemoStatus("pending"), "quote");
  assert.equal(advanceDemoStatus("quote"), "quote");
  const labels = new Set(buildDemoRows(now).map((r) => r.service_label));
  assert.ok(!labels.has("컬비청소" as never));
});

test("목록을 끄면 견적 시작 카드", () => {
  assert.equal(planBoard({ stage: "preview", enabled: false, real: [], now }).mode, "start");
});
