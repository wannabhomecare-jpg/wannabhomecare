/**
 * 카테고리 흐름 — 메뉴 → 카테고리 화면 → 전·후 슬라이더(키보드·끌기) → 견적 프리셋.
 * 견적은 접수하지 않는다(DB 에 행을 만들지 않는다).
 * 실행: BASE_URL=http://localhost:3000 node tests/e2e/category-flow.mjs
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const rows = [];
let failed = false;
async function check(name, fn) {
  try {
    const v = await fn();
    rows.push(`| ${name} | 통과 | ${v ?? ""} |`);
  } catch (e) {
    failed = true;
    rows.push(`| ${name} | 실패 | ${String(e.message || e).replace(/\s+/g, " ").slice(0, 400)} |`);
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

async function presetAfterQuote(slugPath) {
  await page.goto(`${BASE}${slugPath}`, { waitUntil: "networkidle" });
  await page.evaluate(() => sessionStorage.clear());
  await page.locator("section[aria-label='견적 문의']").getByRole("link", { name: /30초 무료 견적 문의/ }).click();
  await page.waitForURL(/\/#quote$/);
  const radio = page.locator("#quote [role=radiogroup][aria-label='서비스'] [role=radio][aria-checked=true]");
  await radio.first().waitFor({ timeout: 10000 });
  const label = (await radio.first().innerText()).split("\n")[0].trim();
  await page.waitForFunction(() => !!sessionStorage.getItem("wb-quote-draft"), null, { timeout: 5000 }).catch(() => {});
  const draft = await page.evaluate(() => JSON.parse(sessionStorage.getItem("wb-quote-draft") || "null"));
  return { label, service: draft?.answers?.service, extras: draft?.answers?.extras ?? [] };
}

await check("메뉴 → /clean (aria-current)", async () => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.getByRole("navigation", { name: "주요 메뉴" }).getByRole("link", { name: "청소", exact: true }).click();
  await page.waitForURL(/\/clean$/);
  const cur = await page.getByRole("navigation", { name: "주요 메뉴" }).locator("[aria-current=page]").innerText();
  assert.equal(cur.trim(), "청소");
  assert.match(await page.locator("h1").innerText(), /깨끗한 집, 쾌적한 집!/);
  return "h1·현재 메뉴 확인";
});

await check("메인 서비스 카드 6개 → 각 화면", async () => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const hrefs = await page.locator("#services a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  assert.deepEqual(hrefs, ["/clean", "/aircon", "/kirby", "/grout", "/coating", "/newhome"]);
  return hrefs.join(" ");
});

await check("전·후 슬라이더: 키보드 ←/→ 10%", async () => {
  await page.goto(`${BASE}/clean`, { waitUntil: "networkidle" });
  const slider = page.locator("#before-after [role=slider]");
  await slider.scrollIntoViewIfNeeded();
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await slider.getAttribute("aria-valuenow"), "60");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  assert.equal(await slider.getAttribute("aria-valuenow"), "40");
  return "50 → 60 → 40";
});

await check("전·후 슬라이더: 끌기", async () => {
  const frame = page.locator("#before-after [data-ba-frame]");
  const box = await frame.boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, { steps: 5 });
  await page.mouse.up();
  const v = Number(await page.locator("#before-after [role=slider]").getAttribute("aria-valuenow"));
  assert.ok(v >= 15 && v <= 25, `값 ${v}`);
  return `→ ${v}`;
});

await check("견적 프리셋: 청소 → 청소", async () => {
  const r = await presetAfterQuote("/clean");
  assert.equal(r.service, "clean");
  return `${r.label}`;
});
await check("견적 프리셋: 에어컨 → 에어컨청소", async () => {
  const r = await presetAfterQuote("/aircon");
  assert.equal(r.service, "aircon");
  return `${r.label}`;
});
await check("견적 프리셋: 컬비 → 청소 + 컬비청소 체크", async () => {
  const r = await presetAfterQuote("/kirby");
  assert.equal(r.service, "clean");
  assert.ok(r.extras.includes("컬비청소"), JSON.stringify(r.extras));
  return `${r.label} + ${r.extras.join(",")}`;
});

await check("콘솔 에러 0", async () => {
  assert.deepEqual(errors, [], errors.join(" / "));
  return "0건";
});

await browser.close();
console.log("| 무엇을 | 결과 | 값 |\n| --- | --- | --- |\n" + rows.join("\n"));
process.exit(failed ? 1 : 0);
