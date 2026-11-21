/** 실시간 목록 30초 관찰: 2.5초마다 맨 위 줄이 바뀌는지, 마우스를 올리면 멈추는지 */
import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(BASE + "/", { waitUntil: "networkidle" });
const list = p.locator('ul[aria-label*="접수 목록"]');
const top = () => list.locator("li").first().getAttribute("data-row-id");
const topText = () => list.locator("li").first().innerText();
const log = [];
let prev = await top();
let changes = 0;
const t0 = Date.now();
while (Date.now() - t0 < 30_000) {
  await p.waitForTimeout(500);
  const cur = await top();
  if (cur !== prev) {
    changes++;
    log.push(`${((Date.now() - t0) / 1000).toFixed(1)}s ${(await topText()).replace(/\s+/g, " ")}`);
    prev = cur;
  }
}
const newBadges = log.filter((l) => l.includes("NEW")).length;
await list.hover();
await p.waitForTimeout(600);
const hoverStart = await top();
await p.waitForTimeout(7_500);
const hoverEnd = await top();
await b.close();
console.log(`30초 동안 맨 위 줄 바뀐 횟수: ${changes} (기대 약 12)`);
console.log(`그중 NEW 표시가 함께 보인 줄: ${newBadges}`);
console.log(`마우스를 올린 7.5초 동안 멈춤: ${hoverStart === hoverEnd ? "예" : "아니오"}`);
console.log(log.slice(0, 6).join("\n"));
process.exit(changes >= 10 && hoverStart === hoverEnd ? 0 : 1);
