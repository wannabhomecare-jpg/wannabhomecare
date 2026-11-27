/**
 * 관리자: 전·후 사진 · 고객 후기 — 로그인 없이 거부되는지, 그리고 화면에서 실제로
 * 올리기 → 공개 켜기 → 끄기 → 삭제를 해 본다. 시험 항목 이름은 '시험'. 시드 항목은 건드리지 않는다.
 * 실행: BASE_URL=... node --env-file=.env.local tests/e2e/admin-media.mjs [캡처폴더]
 */
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import sharp from "sharp";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PW = process.env.ADMIN_PASSWORD;
const SHOTS = process.argv[2];
const RAW = "materials/raw/phase2/seed";
const supa = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const rows = [];
const steps = [];
let failed = false;
async function check(name, fn) {
  try {
    rows.push(`| ${name} | 통과 | ${(await fn()) ?? ""} |`);
  } catch (e) {
    failed = true;
    rows.push(`| ${name} | 실패 | ${String(e.message || e).replace(/\s+/g, " ").slice(0, 300)} |`);
  }
}
async function readKey(key) {
  const r = await fetch(`${supa}/rest/v1/site_content?select=value&key=eq.${key}`, { headers: { apikey: anon } });
  return (await r.json())[0]?.value ?? [];
}
const step = (s) => steps.push(s);

await check("로그인 없이 관리자 화면·서버 액션 요청은 거부", async () => {
  const out = [];
  for (const p of ["/admin/before-after", "/admin/reviews"]) {
    const g = await fetch(BASE + p, { redirect: "manual" });
    const post = await fetch(BASE + p, {
      method: "POST",
      redirect: "manual",
      headers: { "Next-Action": "0".repeat(42), "Content-Type": "text/plain;charset=UTF-8" },
      body: "[]",
    });
    assert.ok([302, 303, 307, 308].includes(g.status), `${p} GET ${g.status}`);
    assert.ok([302, 303, 307, 308].includes(post.status), `${p} POST ${post.status}`);
    assert.match(post.headers.get("location") || "", /\/admin\/login/);
    out.push(`${p} GET ${g.status} · POST ${post.status}`);
  }
  return out.join(" / ");
});

if (!PW) {
  rows.push("| 관리자 화면 조작 | 건너뜀 | ADMIN_PASSWORD 없음 |");
} else {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.accept());
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await check("관리자 로그인", async () => {
    await page.goto(`${BASE}/admin/login`);
    await page.locator("#password").fill(PW);
    await page.getByRole("button").first().click();
    await page.waitForURL((u) => !u.pathname.startsWith("/admin/login"), { timeout: 15000 });
    step("/admin/login 에서 비밀번호 입력 → [로그인]");
    return "통과";
  });

  const baBefore = (await readKey("before_after")).length;
  await check("전·후 사진: 올리기 → 공개 켜기 → 끄기 → 삭제", async () => {
    await page.goto(`${BASE}/admin/before-after`, { waitUntil: "networkidle" });
    step("왼쪽 메뉴 '사이트 설정 › 전·후 사진'");
    await page.getByLabel("서비스").selectOption("clean");
    await page.getByLabel("이름(탭에 보임, 예: 창틀)").fill("시험");
    await page.getByLabel("설명(선택, 예: 입주청소)").fill("시험");
    await page.getByLabel("전 사진").setInputFiles(`${RAW}/before-after/clean-kitchen-before.webp`);
    await page.getByLabel("후 사진").setInputFiles(`${RAW}/before-after/clean-kitchen-after.webp`);
    step("'새 짝 추가'에서 서비스 '청소', 이름 '시험', 설명 '시험', 전·후 사진(묶음의 주방 전·후) 고르기 → [저장]");
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await page.getByText("저장했어요").waitFor({ timeout: 30000 });
    const items = await readKey("before_after");
    const added = items.find((x) => x.label === "시험");
    assert.ok(added, "DB 에 추가되지 않음");
    assert.equal(added.published, false);
    assert.match(added.before.path, /^before-after\/clean\/[0-9a-f-]{36}-before\.webp$/);
    const img = await fetch(added.before.url);
    assert.equal(img.status, 200);
    if (SHOTS) await shot(page, "admin-before-after");
    const row = page.locator(`[data-ba-row="${added.id}"]`);
    await row.getByRole("switch").click();
    step("목록의 '시험' 줄에서 [숨김] → '공개 중'");
    await page.waitForFunction(async ([u, k, id]) => {
      const r = await fetch(`${u}/rest/v1/site_content?select=value&key=eq.before_after`, { headers: { apikey: k } });
      return (await r.json())[0].value.find((x) => x.id === id)?.published === true;
    }, [supa, anon, added.id], { timeout: 15000, polling: 500 });
    await page.locator(`[data-ba-row="${added.id}"]`).getByRole("switch").click();
    step("[공개 중] → '숨김'");
    await page.waitForFunction(async ([u, k, id]) => {
      const r = await fetch(`${u}/rest/v1/site_content?select=value&key=eq.before_after`, { headers: { apikey: k } });
      return (await r.json())[0].value.find((x) => x.id === id)?.published === false;
    }, [supa, anon, added.id], { timeout: 15000, polling: 500 });
    await page.locator(`[data-ba-row="${added.id}"]`).getByRole("button", { name: "삭제" }).click();
    step("[삭제] → 확인 창 [확인]");
    await page.getByText("지웠어요").waitFor({ timeout: 15000 });
    const after = await readKey("before_after");
    assert.equal(after.find((x) => x.id === added.id), undefined);
    assert.equal(after.length, baBefore);
    const gone = await fetch(`${added.before.url}?t=${Date.now()}`);
    assert.notEqual(gone.status, 200, "저장소 파일이 남아 있음");
    return `추가·공개·숨김·삭제, 파일도 지움 (개수 ${baBefore} → ${baBefore})`;
  });

  const rvBefore = (await readKey("review_captures")).length;
  await check("고객 후기: 가리기 → 올리기 → 공개 켜기 → 끄기 → 삭제", async () => {
    await page.goto(`${BASE}/admin/reviews`, { waitUntil: "networkidle" });
    step("왼쪽 메뉴 '사이트 설정 › 고객 후기'");
    await page.getByLabel("캡처 파일").setInputFiles(`${RAW}/reviews/review-02.webp`);
    await page.getByLabel("이름(카드 아래에 보임, 예: 이사청소 · 줄눈)").fill("시험");
    await page.locator("#new-clean").check();
    const canvas = page.locator("[data-mask-canvas]");
    await canvas.waitFor();
    const b = await canvas.boundingBox();
    await page.mouse.move(b.x + 5, b.y + 5);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width * 0.25, b.y + b.height * 0.45, { steps: 6 });
    await page.mouse.up();
    await page.getByText("가린 곳 1개").waitFor();
    step("'새 캡처'에서 캡처 파일(묶음의 가린 후기 1장) 고르기 → 이름 '시험', 서비스 '청소' 체크 → 캡처 위 왼쪽 위를 끌어 사각형 1개 → [가린 결과로 저장]");
    if (SHOTS) await shot(page, "admin-reviews");
    await page.getByRole("button", { name: "가린 결과로 저장" }).click();
    await page.getByText("저장했어요").waitFor({ timeout: 30000 });
    const items = await readKey("review_captures");
    const added = items.find((x) => x.label === "시험");
    assert.ok(added, "DB 에 추가되지 않음");
    assert.match(added.image.path, /^reviews\/[0-9a-f-]{36}\.webp$/);
    // 저장된 파일의 가린 영역이 원본과 다르다
    const saved = await (await fetch(added.image.url)).arrayBuffer();
    const a = await sharp(Buffer.from(saved)).resize(200, 42, { fit: "fill" }).raw().toBuffer();
    const o = await sharp(`${RAW}/reviews/review-02.webp`).resize(200, 42, { fit: "fill" }).raw().toBuffer();
    let diffTopLeft = 0;
    for (let y = 2; y < 16; y++) for (let x = 2; x < 45; x++) diffTopLeft += Math.abs(a[(y * 200 + x) * 3] - o[(y * 200 + x) * 3]);
    assert.ok(diffTopLeft > 0, "가린 곳이 바뀌지 않음");
    const row = page.locator(`[data-review-row="${added.id}"]`);
    await row.getByRole("switch").click();
    step("목록의 '시험' 줄에서 [숨김] → '공개 중'");
    await page.waitForFunction(async ([u, k, id]) => {
      const r = await fetch(`${u}/rest/v1/site_content?select=value&key=eq.review_captures`, { headers: { apikey: k } });
      return (await r.json())[0].value.find((x) => x.id === id)?.published === true;
    }, [supa, anon, added.id], { timeout: 15000, polling: 500 });
    await page.locator(`[data-review-row="${added.id}"]`).getByRole("switch").click();
    step("[공개 중] → '숨김'");
    await page.waitForFunction(async ([u, k, id]) => {
      const r = await fetch(`${u}/rest/v1/site_content?select=value&key=eq.review_captures`, { headers: { apikey: k } });
      return (await r.json())[0].value.find((x) => x.id === id)?.published === false;
    }, [supa, anon, added.id], { timeout: 15000, polling: 500 });
    await page.locator(`[data-review-row="${added.id}"]`).getByRole("button", { name: "삭제" }).click();
    step("[삭제] → 확인 창 [확인]");
    await page.getByText("지웠어요").waitFor({ timeout: 15000 });
    const after = await readKey("review_captures");
    assert.equal(after.length, rvBefore);
    assert.notEqual((await fetch(`${added.image.url}?t=${Date.now()}`)).status, 200, "저장소 파일이 남아 있음");
    return `가린 곳 픽셀 변화 ${diffTopLeft}, 추가·공개·숨김·삭제 (개수 ${rvBefore} → ${rvBefore})`;
  });

  await check("관리자 화면 오류 0", async () => {
    assert.deepEqual(errors, []);
    return "0건";
  });
  await browser.close();
}

async function shot(page, name) {
  mkdirSync(SHOTS, { recursive: true });
  const png = await page.screenshot({ fullPage: true });
  await sharp(png).webp({ quality: 70 }).toFile(`${SHOTS}/${name}-1280.webp`);
}

console.log("| 무엇을 | 결과 | 값 |\n| --- | --- | --- |\n" + rows.join("\n"));
console.log("\n클릭 순서:\n" + steps.map((s, i) => `${i + 1}. ${s}`).join("\n"));
process.exit(failed ? 1 : 0);
