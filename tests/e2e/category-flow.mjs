/**
 * 카테고리 흐름 — 메뉴 → 카테고리 화면 → 전·후 슬라이더(키보드·끌기) → 견적 프리셋.
 * 견적은 접수하지 않는다(DB 에 행을 만들지 않는다).
 * 실행: BASE_URL=http://localhost:3000 node tests/e2e/category-flow.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
    rows.push(`| ${name} | 실패 | ${String(e.message || e).replace(/\s+/g, " ").slice(0, 1200)} |`);
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


await check("전·후 슬라이더: 터치 끌기", async () => {
  const tctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const tp = await tctx.newPage();
  await tp.goto(`${BASE}/aircon`, { waitUntil: "networkidle" });
  const frame = tp.locator("#before-after [data-ba-frame]");
  await frame.scrollIntoViewIfNeeded();
  const box = await frame.boundingBox();
  const y = box.y + box.height / 2;
  const ev = (type, x) => frame.dispatchEvent(type, { pointerType: "touch", pointerId: 7, isPrimary: true, clientX: x, clientY: y, bubbles: true });
  await ev("pointerdown", box.x + box.width * 0.5);
  await ev("pointermove", box.x + box.width * 0.7);
  await ev("pointermove", box.x + box.width * 0.85);
  await ev("pointerup", box.x + box.width * 0.85);
  const v = Number(await tp.locator("#before-after [role=slider]").getAttribute("aria-valuenow"));
  await tctx.close();
  assert.ok(v >= 80 && v <= 90, `값 ${v}`);
  return `터치 → ${v}`;
});

await check("청소 작업 영상 창: 열기 → 재생 → Esc 로 닫기", async () => {
  await page.goto(`${BASE}/clean`, { waitUntil: "networkidle" });
  const before = await page.locator("video").count();
  assert.equal(before, 0, "창을 열기 전에는 영상을 불러오지 않는다");
  const open = page.getByRole("button", { name: "작업 영상 보기" });
  await open.click();
  const dlg = page.getByRole("dialog", { name: "실제 작업 영상" });
  await dlg.waitFor();
  await dlg.getByText("실제 작업 영상 · 소리 없음").waitFor();
  const video = dlg.locator("video");
  const info = await video.evaluate(async (v) => {
    const can = v.canPlayType('video/mp4; codecs="avc1.64001F"');
    await new Promise((r) => setTimeout(r, 2500));
    return { can, src: v.currentSrc, t: v.currentTime, muted: v.muted, inline: v.playsInline, err: v.error?.code ?? null };
  });
  assert.match(info.src, /\/real\/clean\/video-entry\.mp4$/);
  assert.ok(info.muted && info.inline);
  let played = "브라우저에 H.264 코덱 없음 — 재생 확인 생략";
  if (info.can) {
    assert.ok(info.t > 0, `재생 시간 ${info.t}`);
    played = `재생 ${info.t.toFixed(1)}초`;
  }
  await dlg.getByRole("button", { name: /욕실/ }).click();
  assert.match(await video.getAttribute("src"), /video-bath\.mp4$/);
  await page.keyboard.press("Escape");
  await dlg.waitFor({ state: "hidden" });
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  assert.equal(focused, "작업 영상 보기");
  return `${played} · 목록에서 욕실로 바꿈 · Esc 후 버튼으로 포커스`;
});

await check("카테고리별 후기 개수", async () => {
  const want = { clean: 12, aircon: 1, kirby: 0, grout: 1, coating: 0, newhome: 2 };
  const got = {};
  for (const slug of Object.keys(want)) {
    await page.goto(`${BASE}/${slug}`, { waitUntil: "domcontentloaded" });
    got[slug] = await page.locator("#reviews figure").count();
  }
  assert.deepEqual(got, want);
  return Object.entries(got).map(([k, v]) => `${k} ${v}`).join(" · ");
});

const RAW = "materials/raw/phase2/content";
if (existsSync(RAW)) {
  await check("묶음 문구 10개 무작위 대조", async () => {
    const pool = [];
    for (const slug of ["clean", "aircon", "kirby", "grout", "coating", "newhome"]) {
      const c = JSON.parse(readFileSync(`${RAW}/${slug}.json`, "utf8"));
      const add = (t) => typeof t === "string" && t.length >= 6 && pool.push([slug, t]);
      [...c.hero.chips, ...c.hero.slogan, c.hero.lead, ...c.hero.hashtags, c.notice, c.cta.title, c.beforeAfter.title].forEach(add);
      for (const w of [c.why.need, c.why.diff]) [w.kicker, w.title, w.body].forEach(add);
      [c.principles.title, ...c.principles.items.flatMap((x) => [x.title, x.body])].forEach(add);
      c.process?.steps.forEach((x) => [x.title, x.body].forEach(add));
      c.faq.forEach((x) => add(x.q));
      c.faq.filter((x) => !x.a.includes("\n")).forEach((x) => add(x.a));
      c.materials?.rows.forEach((r) => [r.name, r.desc].forEach(add));
      c.grades?.rows.forEach((r) => r.values.forEach(add));
      c.compare?.rows.forEach((r) => r.values.forEach(add));
      if (c.crossSell) [c.crossSell.title, c.crossSell.body].forEach(add);
    }
    const picked = [];
    while (picked.length < 10) {
      const x = pool[Math.floor(Math.random() * pool.length)];
      if (!picked.includes(x)) picked.push(x);
    }
    const texts = {};
    for (const [slug, t] of picked) {
      if (!texts[slug]) {
        await page.goto(`${BASE}/${slug}`, { waitUntil: "domcontentloaded" });
        texts[slug] = (await page.evaluate(() => document.body.textContent)).replace(/\s+/g, " ");
      }
      assert.ok(texts[slug].includes(t.replace(/\s+/g, " ")), `${slug}: ${t}`);
    }
    return picked.map(([s, t]) => `${s}: ${t.slice(0, 18)}…`).join(" / ");
  });
}

await check("초안 배지: 미리보기에서만", async () => {
  await page.goto(`${BASE}/newhome`, { waitUntil: "domcontentloaded" });
  const n = await page.locator("[data-draft-badge]").count();
  const stage = await (await fetch(`${BASE}/version.json?t=${Date.now()}`)).json();
  if (stage.stage === "preview") assert.ok(n > 0, "미리보기인데 배지 없음");
  else assert.equal(n, 0, "오픈 단계인데 배지가 보임");
  return `${stage.stage} · 배지 ${n}개(새집증후군)`;
});

await check("콘솔 에러 0", async () => {
  assert.deepEqual(errors, [], errors.join(" / "));
  return "0건";
});

await browser.close();
console.log("| 무엇을 | 결과 | 값 |\n| --- | --- | --- |\n" + rows.join("\n"));
process.exit(failed ? 1 : 0);
