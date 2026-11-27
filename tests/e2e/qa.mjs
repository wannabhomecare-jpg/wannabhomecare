/**
 * 화면 점검: 6개 폭 × (메인·카테고리 6개·약관 2개·404)의 가로 스크롤·콘솔 에러, 내부 링크, 1280px 메뉴 한 줄, 390px 하단 버튼 3개,
 * 메인에서 뺀 블록이 없는지, 공개 화면 접근성 자동 검사(axe).
 * 실행: BASE_URL=http://localhost:3000 node tests/e2e/qa.mjs
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const WIDTHS = [360, 390, 768, 1024, 1280, 1440];
const CATEGORY_PAGES = ["/clean", "/aircon", "/kirby", "/grout", "/coating", "/newhome"];
const PAGES = ["/", ...CATEGORY_PAGES, "/privacy", "/terms", "/없는-주소"];
const rows = [];
let failed = false;
const report = (k, ok, v) => {
  rows.push(`| ${k} | ${ok ? "통과" : "실패"} | ${v} |`);
  if (!ok) failed = true;
};

const browser = await chromium.launch();

// 1) 폭별 가로 스크롤 · 콘솔 에러
let overflow = [];
let consoleErrors = [];
for (const w of WIDTHS) {
  for (const path of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    p.on("console", (m) => m.type() === "error" && !(path === "/없는-주소" && /404/.test(m.text())) && consoleErrors.push(`${w}${path}: ${m.text()}`));
    p.on("pageerror", (e) => consoleErrors.push(`${w}${path}: ${e}`));
    await p.goto(BASE + encodeURI(path), { waitUntil: "networkidle" });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (sw > 0) overflow.push(`${w}${path}:${sw}px`);
    await ctx.close();
  }
}
report(`6개 폭 × ${PAGES.length}화면 가로 스크롤`, overflow.length === 0, overflow.length ? overflow.join(", ") : "0건");
report("콘솔 에러", consoleErrors.length === 0, consoleErrors.length ? consoleErrors.slice(0, 3).join(" / ") : "0건");

// 2) 메인 구성·메뉴·하단 버튼
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  const menu = p.locator('nav[aria-label="주요 메뉴"] ul li');
  const names = await menu.allInnerTexts();
  const tops = await menu.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  report("메뉴 6개 순서", names.join(" · ") === "청소 · 에어컨청소 · 컬비청소 · 줄눈 · 탄성코트 · 새집증후군", names.join(" · "));
  report("1280px 메뉴 한 줄", new Set(tops).size === 1, `줄 위치 ${[...new Set(tops)].join(",")}`);
  // 임시로 7개(되돌릴 필요 없는 화면 안 복제)
  await p.evaluate(() => {
    const ul = document.querySelector('nav[aria-label="주요 메뉴"] ul');
    const li = ul.lastElementChild.cloneNode(true);
    li.querySelector("a").textContent = "입주청소";
    ul.appendChild(li);
  });
  const tops7 = await menu.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  await p.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/menu-7-1280.png` : "/dev/null", clip: { x: 0, y: 0, width: 1280, height: 120 } }).catch(() => {});
  report("1280px 메뉴 7개(임시)도 한 줄", new Set(tops7).size === 1, `${tops7.length}개, 줄 위치 ${[...new Set(tops7)].join(",")}`);
  const removed = await p.evaluate(() =>
    ["네 가지 원칙", "청소범위", "작업사례", "자주 묻는 질문"].filter((t) => document.querySelector("main")?.innerText.includes(t)),
  );
  report("메인에서 뺀 블록 없음", removed.length === 0, removed.length ? removed.join(",") : "네 가지 원칙·청소범위·작업사례·자주 묻는 질문 0건");
  const order = await p.evaluate(() => [...document.querySelectorAll("main > section")].map((s) => s.id || s.getAttribute("aria-label")));
  report("메인 블록 순서", order.join(">") === "첫 화면>promise>services>reviews>instagram>quote", order.join(" > "));
  const phoneTexts = await p.evaluate(() => document.body.innerText.split("010-8368-2552").length - 1);
  const tels = await p.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute("href")))]);
  report("대표번호 표시·전화 링크", phoneTexts >= 3 && tels.length === 1 && tels[0] === "tel:01083682552", `표시 ${phoneTexts}곳, 링크 ${tels.join(",")}`);
  const ai = await p.evaluate(() => document.querySelector("footer")?.innerText.includes("일부 이미지는 AI로 제작한 연출 이미지입니다."));
  report("푸터 AI 이미지 안내", !!ai, ai ? "있음" : "없음");
  // 내부 링크
  const hrefs = await p.evaluate(() => [...new Set([...document.querySelectorAll("a[href^='/']")].map((a) => a.getAttribute("href")))]);
  const broken = [];
  for (const h of hrefs) {
    const path = h.split("#")[0] || "/";
    const r = await fetch(BASE + path, { redirect: "manual" });
    if (r.status >= 400) broken.push(`${h}:${r.status}`);
    const id = h.split("#")[1];
    if (id && path === "/" && !(await p.locator(`#${id}`).count())) broken.push(`${h}:앵커 없음`);
  }
  report("내부 링크", broken.length === 0, broken.length ? broken.join(", ") : `${hrefs.length}개 모두 정상`);
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  const bar = p.locator('[role="region"][aria-label="빠른 상담"]').locator("a, button");
  const labels = await bar.allInnerTexts();
  const tops = await bar.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  report("390px 하단 버튼 3개 한 줄", labels.map((s) => s.trim()).join(" · ") === "견적문의 · 바로연결 · 카톡상담" && new Set(tops).size === 1, labels.map((s) => s.trim()).join(" · "));
  await ctx.close();
}

// 3) 접근성(axe)
let contrast = 0;
let serious = [];
for (const path of PAGES.filter((p) => p !== "/없는-주소")) {
  for (const w of [390, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    await p.goto(BASE + path, { waitUntil: "networkidle" });
    const r = await new AxeBuilder({ page: p }).analyze();
    for (const v of r.violations) {
      if (v.id === "color-contrast") contrast += v.nodes.length;
      if (v.impact === "serious" || v.impact === "critical") serious.push(`${w}${path} ${v.id}(${v.nodes.length}) ${v.nodes[0]?.target?.join(" ")}`);
    }
    await ctx.close();
  }
}
report("axe 색 대비 위반", contrast === 0, `${contrast}건`);
report("axe serious·critical", serious.length === 0, serious.length ? serious.slice(0, 5).join(" / ") : "0건");

await browser.close();
console.log("| 무엇을 | 결과 | 값 |\n| --- | --- | --- |\n" + rows.join("\n"));
process.exit(failed ? 1 : 0);
