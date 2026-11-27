/**
 * 화면 캡처(WebP). 실행: BASE_URL=... OUT=docs/reports/phase-2 node tests/e2e/capture.mjs /clean:1440 /clean:390 ...
 * 전체 길이를 찍는다. 애니메이션(Reveal)이 끝나도록 끝까지 한 번 내려갔다 올라온다.
 */
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.OUT || "docs/reports/phase-2";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
for (const arg of process.argv.slice(2)) {
  const [p, w, name] = arg.split(":");
  const width = Number(w);
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(BASE + p, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  const png = await page.screenshot({ fullPage: true });
  const file = path.join(OUT, `${name || `${p.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home"}-${width}`}.webp`);
  await sharp(png).webp({ quality: 70 }).toFile(file);
  console.log(file);
  await ctx.close();
}
await browser.close();
