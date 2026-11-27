import assert from "node:assert/strict";
import test from "node:test";
import { maskRegions, normalizeRect } from "../src/lib/mask";

function checker(w: number, h: number) {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = (x + y) % 2 ? 255 : 0;
      d.set([v, v, v, 255], (y * w + x) * 4);
    }
  return d;
}

test("가린 영역의 픽셀은 바뀌고, 밖은 그대로다", () => {
  const w = 60, h = 40;
  const d = checker(w, h);
  const before = d.slice();
  maskRegions(d, w, h, [{ x: 10, y: 5, w: 28, h: 28 }], 14);
  let changedInside = 0, changedOutside = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const diff = d[i] !== before[i];
      const inside = x >= 10 && x < 38 && y >= 5 && y < 33;
      if (diff && inside) changedInside++;
      if (diff && !inside) changedOutside++;
    }
  assert.ok(changedInside > 28 * 28 * 0.9, `안쪽 ${changedInside}`);
  assert.equal(changedOutside, 0);
  // 안쪽은 체크무늬가 사라져 가운데 회색 근처가 된다
  const i = (15 * w + 20) * 4;
  assert.ok(d[i] > 90 && d[i] < 165, `값 ${d[i]}`);
});

test("거꾸로 그린 사각형·화면 밖 사각형도 정리한다", () => {
  assert.deepEqual(normalizeRect({ x: 30, y: 20, w: -10, h: -10 }, 100, 100), { x: 20, y: 10, w: 10, h: 10 });
  assert.deepEqual(normalizeRect({ x: 90, y: 90, w: 50, h: 50 }, 100, 100), { x: 90, y: 90, w: 10, h: 10 });
  assert.equal(normalizeRect({ x: 5, y: 5, w: 1, h: 1 }, 100, 100), null);
});
