/**
 * 30초 무료 견적 — 세 가지 길(집 청소 · 상가청소 · 줄눈)을 화면으로 끝까지 제출하고
 * 관리자 목록·상세·상태 변경, 공개 목록 반영을 확인한 뒤 시험 행과 사진을 지운다.
 *
 * 실행: BASE_URL=http://localhost:3000 node --env-file=.env.local tests/e2e/quote-flow.mjs [캡처폴더]
 * 시험 행 표시: 성함 '시험…' + 휴대폰 010-0000-0000
 */
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = process.argv[2];
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const TEST_PHONE = "010-0000-0000";
const results = [];
let shotNo = 0;

async function shot(page, name) {
  if (!SHOTS) return;
  shotNo += 1;
  const box = await page.locator("#quote").boundingBox();
  await page.screenshot({ path: `${SHOTS}/quote-${String(shotNo).padStart(2, "0")}-${name}.png`, clip: box ?? undefined });
}

async function pick(page, name) {
  await page.locator("#quote").getByRole("radio", { name, exact: false }).first().click();
}
async function next(page) {
  await page.locator("#quote").getByRole("button", { name: "다음" }).click();
}
async function expectQuestion(page, text) {
  await page.locator("#quote h3").filter({ hasText: text }).waitFor({ timeout: 5000 });
}

async function commonTail(page, name, capture, photos = []) {
  await expectQuestion(page, "공급 평수");
  if (capture) await shot(page, "09-area");
  await page.getByPlaceholder("예: 34평").fill("34평");
  await next(page);
  await expectQuestion(page, "작업할 주소");
  await page.locator("#quote").getByRole("button", { name: "서울", exact: true }).click();
  await page.locator("#quote").getByRole("button", { name: "중구", exact: true }).click();
  await page.getByPlaceholder("아파트 이름, 동 · 호수").fill("시험아파트 101동 101호");
  if (capture) await shot(page, "10-address");
  await next(page);
  await expectQuestion(page, "원하시는 날짜");
  await page.getByPlaceholder("예: 12월 8일").fill("날짜 미정");
  if (capture) await shot(page, "11-date");
  await next(page);
  await expectQuestion(page, "성함과 휴대폰 번호");
  await page.getByPlaceholder("성함").fill(name);
  await page.getByPlaceholder("010-0000-0000").fill(TEST_PHONE);
  await page.getByRole("checkbox", { name: /개인정보 수집/ }).check();
  if (capture) await shot(page, "12-contact");
  await next(page);
  await expectQuestion(page, "특이사항");
  await page.getByPlaceholder("예: 반려동물이 있어요").fill("시험 접수입니다");
  if (photos.length) await page.locator('#quote input[type="file"]').setInputFiles(photos);
  if (capture) await shot(page, "13-message");
  await page.locator("#quote").getByRole("button", { name: "견적 요청하기" }).click();
  await page.locator("#quote h3").filter({ hasText: "접수되었습니다" }).waitFor({ timeout: 20000 });
  if (capture) await shot(page, "14-done");
}

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const stamp = Date.now().toString().slice(-4);

  // 1) 집 청소
  await page.goto(`${BASE}/#quote`, { waitUntil: "networkidle" });
  await expectQuestion(page, "어떤 서비스가 필요하세요?");
  await shot(page, "01-service");
  await pick(page, "청소");
  await expectQuestion(page, "청소의 형태");
  await shot(page, "02-clean-type");
  await pick(page, "이사청소");
  await expectQuestion(page, "건물의 형태");
  await shot(page, "03-building");
  // [이전]으로 돌아가도 고른 내용이 남아 있다
  await page.locator("#quote").getByRole("button", { name: "이전" }).click();
  await expectQuestion(page, "청소의 형태");
  assert.equal(await page.locator("#quote").getByRole("radio", { name: /이사청소/ }).getAttribute("aria-checked"), "true");
  results.push(["[이전]으로 돌아가도 고른 내용 유지", "통과"]);
  await next(page);
  await pick(page, "아파트");
  await expectQuestion(page, "방 · 화장실 · 베란다");
  await page.getByRole("radiogroup", { name: "방" }).getByRole("radio", { name: "3" }).click();
  await page.getByRole("radiogroup", { name: "화장실" }).getByRole("radio", { name: "2" }).click();
  await page.getByRole("radiogroup", { name: "베란다" }).getByRole("radio", { name: "2" }).click();
  await shot(page, "04-rooms");
  await next(page);
  await expectQuestion(page, "구조의 형태");
  await shot(page, "07-structure");
  await pick(page, "해당 사항 없음");
  await expectQuestion(page, "함께 알아보시는 견적");
  await page.locator("#quote").getByRole("checkbox", { name: "컬비청소" }).click();
  await shot(page, "08-extras");
  await next(page);
  await commonTail(page, `시험집${stamp}`, true);
  results.push(["집 청소 길 제출", "통과"]);

  // 2) 상가청소 — 3-1번 뒤 4–7번 없이 8번
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(`${BASE}/?r=2#quote`, { waitUntil: "networkidle" });
  await pick(page, "청소");
  await pick(page, "상가청소");
  await expectQuestion(page, "업종을 선택해 주세요");
  await shot(page, "03-1-business");
  await pick(page, "사무실 / 오피스");
  await expectQuestion(page, "함께 알아보시는 견적");
  await next(page);
  await commonTail(page, `시험상가${stamp}`, false);
  results.push(["상가청소 길 제출(3-1 → 8)", "통과"]);

  // 3) 줄눈 — 2–8번 없이 9번
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(`${BASE}/?r=3#quote`, { waitUntil: "networkidle" });
  await pick(page, "줄눈");
  await expectQuestion(page, "공급 평수");
  // 큰 사진 3장(각 4000×3000, 잡음) — 브라우저에서 줄여 합계 4MB 이하로 보내야 한다
  const photos = [];
  for (let i = 0; i < 3; i++) {
    const raw = Buffer.alloc(800 * 600 * 3);
    for (let k = 0; k < raw.length; k++) raw[k] = (k * 7919 + i * 131) % 251;
    const buffer = await sharp(raw, { raw: { width: 800, height: 600, channels: 3 } }).resize(4000, 3000, { kernel: "nearest" }).jpeg({ quality: 95 }).toBuffer();
    photos.push({ name: `site-${i + 1}.jpg`, mimeType: "image/jpeg", buffer });
  }
  await commonTail(page, `시험줄눈${stamp}`, false, photos);
  results.push(["줄눈 길 제출(1 → 9)", "통과"]);

  // DB: 항목별로 저장됐는지
  const { data: rows } = await admin
    .from("quote_requests")
    .select("*")
    .eq("phone", TEST_PHONE)
    .like("customer_name", `시험%${stamp}`)
    .order("created_at");
  assert.equal(rows.length, 3, "시험 행 3건");
  const [house, shop, grout] = rows;
  assert.equal(house.clean_type, "이사청소");
  assert.equal(house.building_type, "아파트");
  assert.deepEqual([house.rooms, house.bathrooms, house.balconies, house.structure], [3, 2, 2, "해당 사항 없음"]);
  assert.deepEqual(house.extra_services, ["컬비청소"]);
  assert.equal(shop.clean_type, "상가청소");
  assert.equal(shop.business_type, "사무실 / 오피스");
  assert.equal(shop.rooms, null);
  assert.equal(grout.service, "grout");
  assert.equal(grout.clean_type, null);
  assert.equal(grout.image_paths.length, 3, "사진 3장 저장");
  results.push([`사진 3장 첨부(큰 원본 → 브라우저에서 줄여 제출, 비공개 저장)`, "통과"]);
  assert.equal(house.sido + " " + house.sigungu, "서울 중구");
  assert.equal(house.area, "34평");
  results.push(["DB 에 항목별 저장(3건)", "통과"]);

  // 관리자: 로그인 → 목록 → 상세 → 상태 변경
  const ap = await ctx.newPage();
  await ap.setViewportSize({ width: 1440, height: 900 });
  await ap.goto(`${BASE}/admin/login`);
  await ap.locator('input[type="password"]').fill(process.env.ADMIN_PASSWORD);
  await ap.getByRole("button", { name: /로그인/ }).click();
  await ap.waitForURL(/\/admin$/);
  if (SHOTS) await ap.screenshot({ path: `${SHOTS}/admin-dashboard.png` });
  await ap.goto(`${BASE}/admin/requests`);
  await ap.getByRole("link", { name: house.customer_name }).first().waitFor();
  await ap.goto(`${BASE}/admin/requests/${house.id}`);
  await ap.getByText("이사청소").first().waitFor();
  await ap.getByText("컬비청소").first().waitFor();
  if (SHOTS) await ap.screenshot({ path: `${SHOTS}/admin-request-detail.png`, fullPage: true });
  await ap.locator("select").first().selectOption("quote");
  await ap.waitForTimeout(1500);
  const { data: after } = await admin.from("quote_requests").select("status").eq("id", house.id).single();
  assert.equal(after.status, "quote");
  results.push(["관리자 로그인·목록·상세·상태 변경", "통과"]);

  // 공개 목록: 가린 이름과 시/구
  const board = await (await fetch(`${BASE}/api/board`, { cache: "no-store" })).json();
  const mine = board.find((b) => b.id === house.id);
  assert.ok(mine, "공개 목록에 보여야 한다");
  assert.equal(mine.masked_name, "시○○");
  assert.equal(mine.region, "서울 중구");
  assert.equal(mine.status, "quote");
  assert.deepEqual(Object.keys(mine).sort(), ["created_at", "id", "masked_name", "region", "service_label", "status"]);
  results.push(["공개 목록에 가린 이름·시/구로 반영", "통과"]);

  await browser.close();
}

async function cleanup() {
  const { data } = await admin.from("quote_requests").select("id, image_paths").eq("phone", TEST_PHONE).like("customer_name", "시험%");
  const paths = (data ?? []).flatMap((r) => r.image_paths);
  if (paths.length) await admin.storage.from("request-images").remove(paths);
  if (data?.length) await admin.from("quote_requests").delete().in("id", data.map((r) => r.id));
  const { count } = await admin.from("quote_requests").select("id", { count: "exact", head: true }).eq("phone", TEST_PHONE);
  results.push(["시험 행 정리", `지운 행 ${data?.length ?? 0}건, 남은 시험 행 ${count}건`]);
}

try {
  await run();
} finally {
  await cleanup();
  for (const [k, v] of results) console.log(`| ${k} | ${v} |`);
}
