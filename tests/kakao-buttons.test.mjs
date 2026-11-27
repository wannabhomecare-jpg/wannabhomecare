import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = path.join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(path.join(root, "src")).filter((f) => f.endsWith(".tsx"));

test("카카오 버튼은 모두 같은 링크 값·새 창·읽어 주는 이름을 쓴다", () => {
  let count = 0;
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/<ContactAction\b[^>]*?>/gs)) {
      const tag = m[0];
      if (!/kakao/i.test(tag)) continue;
      count++;
      const rel = path.relative(root, f);
      assert.match(tag, /href=\{(kakaoUrl|kakao\?\.url \?\? null)\}/, `${rel}: href`);
      assert.match(tag, /\bexternal\b/, `${rel}: 새 창`);
      assert.match(tag, /ariaLabel=\{kakaoAria\(("[^"]+"|kakaoLabel)\)\}/, `${rel}: aria-label`);
    }
    // 주소를 직접 적은 곳이 없다
    assert.doesNotMatch(src, /pf\.kakao\.com/, path.relative(root, f));
  }
  // 첫 화면 · 견적 옆 · 견적 완료 · 휴대폰 하단 · PC 오른쪽 · 카테고리 화면 견적 띠(위·아래 공용)
  assert.equal(count, 6);
  // kakaoUrl 을 넘기는 곳은 모두 BUSINESS.contact.kakao.url (견적 완료 화면 버튼 포함)
  for (const f of files) {
    for (const m of readFileSync(f, "utf8").matchAll(/kakaoUrl=\{([^}]*)\}/g)) {
      assert.equal(m[1].trim(), "BUSINESS.contact.kakao?.url ?? null", path.relative(root, f));
    }
  }
});
