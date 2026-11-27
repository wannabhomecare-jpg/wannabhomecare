/**
 * 후기 캡처 가리기 — 고른 사각형 안을 흐림 + 모자이크로 덮는다(순수 함수, 픽셀 배열을 직접 바꾼다).
 * 1) 사각형을 block 크기 칸으로 나눠 칸마다 평균 색을 구하고(모자이크)
 * 2) 각 칸을 주변 3×3 칸의 평균으로 한 번 더 섞는다(흐림)
 * 글자 모양이 남지 않게 칸은 크게(기본 14px) 둔다.
 */
export type MaskRect = { x: number; y: number; w: number; h: number };

export function normalizeRect(r: MaskRect, width: number, height: number): MaskRect | null {
  const x0 = Math.max(0, Math.floor(Math.min(r.x, r.x + r.w)));
  const y0 = Math.max(0, Math.floor(Math.min(r.y, r.y + r.h)));
  const x1 = Math.min(width, Math.ceil(Math.max(r.x, r.x + r.w)));
  const y1 = Math.min(height, Math.ceil(Math.max(r.y, r.y + r.h)));
  if (x1 - x0 < 2 || y1 - y0 < 2) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function maskRegions(data: Uint8ClampedArray, width: number, height: number, rects: MaskRect[], block = 14): void {
  for (const raw of rects) {
    const r = normalizeRect(raw, width, height);
    if (!r) continue;
    const cols = Math.ceil(r.w / block);
    const rows = Math.ceil(r.h / block);
    const avg = new Float64Array(cols * rows * 3);
    for (let by = 0; by < rows; by++) {
      for (let bx = 0; bx < cols; bx++) {
        let s0 = 0, s1 = 0, s2 = 0, n = 0;
        const yEnd = Math.min(r.y + (by + 1) * block, r.y + r.h);
        const xEnd = Math.min(r.x + (bx + 1) * block, r.x + r.w);
        for (let y = r.y + by * block; y < yEnd; y++) {
          for (let x = r.x + bx * block; x < xEnd; x++) {
            const i = (y * width + x) * 4;
            s0 += data[i];
            s1 += data[i + 1];
            s2 += data[i + 2];
            n++;
          }
        }
        const k = (by * cols + bx) * 3;
        avg[k] = s0 / n;
        avg[k + 1] = s1 / n;
        avg[k + 2] = s2 / n;
      }
    }
    for (let by = 0; by < rows; by++) {
      for (let bx = 0; bx < cols; bx++) {
        let s0 = 0, s1 = 0, s2 = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const yy = by + dy, xx = bx + dx;
            if (yy < 0 || yy >= rows || xx < 0 || xx >= cols) continue;
            const k = (yy * cols + xx) * 3;
            s0 += avg[k];
            s1 += avg[k + 1];
            s2 += avg[k + 2];
            n++;
          }
        }
        const c0 = s0 / n, c1 = s1 / n, c2 = s2 / n;
        const yEnd = Math.min(r.y + (by + 1) * block, r.y + r.h);
        const xEnd = Math.min(r.x + (bx + 1) * block, r.x + r.w);
        for (let y = r.y + by * block; y < yEnd; y++) {
          for (let x = r.x + bx * block; x < xEnd; x++) {
            const i = (y * width + x) * 4;
            data[i] = c0;
            data[i + 1] = c1;
            data[i + 2] = c2;
          }
        }
      }
    }
  }
}
