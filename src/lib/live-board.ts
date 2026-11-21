/**
 * 실시간 접수 목록 규칙(순수 함수 — 테스트로 고정한다).
 *
 * preview: 예시 행을 섞어 보여 준다('예시' 표시). 상태는 견적접수 → 상담진행까지만 넘긴다.
 * production: 실제 요청만, 실제 접수 시각·상태 그대로. 시각을 '방금'으로 다시 찍거나
 *   상태를 임의로 넘기지 않는다. 실제 요청이 5건 미만이면 목록 대신 '견적 시작 카드'.
 */
import { DEMO_POOL } from "@/data/live-board-demo";
import { cyrb53, kstDateKey } from "./live-board-rand";
import type { QuoteBoardItem, RequestStatus } from "@/types/database";

export type BoardRow = QuoteBoardItem & {
  demo: boolean;
  time_variant: "relative" | "absolute";
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const MIN_REAL_ROWS = 5;
export const NEW_WINDOW_MS = 10 * MIN;
export const LIVE_WINDOW_MS = DAY;
export const ROW_INTERVAL_MS = 2_500;
export const STATUS_INTERVAL_MS = 1_500;
export const NEW_BADGE_MS = 2_000;
export const REFRESH_MS = 60_000;

const OFFSETS = [
  { weight: 10, min: 10_000, max: 50_000 },
  { weight: 25, min: MIN, max: HOUR },
  { weight: 30, min: HOUR, max: 12 * HOUR },
  { weight: 20, min: 12 * HOUR, max: DAY },
  { weight: 15, min: DAY, max: 2 * DAY },
];

function pickOffset(h1: number, h2: number) {
  const total = OFFSETS.reduce((a, b) => a + b.weight, 0);
  let pick = h1 % total;
  let bucket = OFFSETS[OFFSETS.length - 1];
  for (const b of OFFSETS) {
    if (pick < b.weight) {
      bucket = b;
      break;
    }
    pick -= b.weight;
  }
  return bucket.min + (h2 % (bucket.max - bucket.min));
}

function demoStatus(offsetMs: number): RequestStatus {
  if (offsetMs < 40 * MIN) return "pending";
  if (offsetMs < 6 * HOUR) return "quote";
  return "done";
}

/** 예시 행(같은 날이면 같은 결과) */
export function buildDemoRows(now: Date): BoardRow[] {
  const seed = kstDateKey(now);
  return DEMO_POOL.map((row) => {
    const offset = pickOffset(cyrb53(`${seed}|${row.id}|o`), cyrb53(`${seed}|${row.id}|w`));
    const created = new Date(now.getTime() - offset).toISOString();
    return {
      id: row.id,
      masked_name: row.masked_name,
      region: row.region,
      service_label: row.service_label,
      status: demoStatus(offset),
      created_at: created,
      demo: true,
      time_variant: cyrb53(`${seed}|${row.id}|t`) % 10 < 7 ? "relative" : "absolute",
    } satisfies BoardRow;
  }).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function realRows(items: QuoteBoardItem[]): BoardRow[] {
  return items.map((it) => ({ ...it, demo: false, time_variant: "relative" as const }));
}

export type BoardPlan =
  | { mode: "list"; rows: BoardRow[]; live: boolean; demo: boolean }
  | { mode: "start" };

/** 단계·설정·실제 요청으로 무엇을 보여 줄지 정한다 */
export function planBoard(opts: {
  stage: "preview" | "production";
  enabled: boolean;
  real: QuoteBoardItem[];
  now: Date;
}): BoardPlan {
  const { stage, enabled, real, now } = opts;
  if (!enabled) return { mode: "start" };
  const reals = realRows(real);
  if (stage === "production") {
    if (reals.length < MIN_REAL_ROWS) return { mode: "start" };
    return { mode: "list", rows: reals, live: hasRecent(reals, now), demo: false };
  }
  return { mode: "list", rows: [...reals, ...buildDemoRows(now)], live: true, demo: true };
}

export function hasRecent(rows: Pick<BoardRow, "created_at">[], now: Date): boolean {
  return rows.some((r) => now.getTime() - new Date(r.created_at).getTime() <= LIVE_WINDOW_MS);
}

/** production 의 NEW: 10분 안에 실제로 들어온 요청에만 */
export function isFresh(createdAt: string, now: Date): boolean {
  const d = now.getTime() - new Date(createdAt).getTime();
  return d >= 0 && d <= NEW_WINDOW_MS;
}

/** 예시 행의 상태 넘김: 견적접수 → 상담진행까지만 */
export function advanceDemoStatus(s: RequestStatus): RequestStatus {
  return s === "pending" ? "quote" : s;
}
