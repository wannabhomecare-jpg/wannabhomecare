"use client";

import { useEffect, useRef, useState } from "react";
import { maskRegions, normalizeRect, type MaskRect } from "@/lib/mask";

/**
 * 가릴 곳 표시: 캡처 위에서 끌어 사각형을 여러 개 그리면 그 부분이 흐림+모자이크로 보인다.
 * 좌표는 원본 픽셀 기준으로 돌려준다.
 */
export function MaskTool({ bitmap, rects, onChange }: { bitmap: ImageBitmap; rects: MaskRect[]; onChange: (r: MaskRect[]) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [draft, setDraft] = useState<MaskRect | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    c.width = bitmap.width;
    c.height = bitmap.height;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(bitmap, 0, 0);
    if (rects.length) {
      const img = ctx.getImageData(0, 0, c.width, c.height);
      maskRegions(img.data, c.width, c.height, rects);
      ctx.putImageData(img, 0, 0);
    }
    const lw = Math.max(2, Math.round(c.width / 400));
    ctx.lineWidth = lw;
    ctx.strokeStyle = getComputedStyle(c).getPropertyValue("--color-brand-600") || "currentColor";
    for (const r of rects) ctx.strokeRect(r.x, r.y, r.w, r.h);
    if (draft) {
      ctx.setLineDash([lw * 3, lw * 2]);
      ctx.strokeRect(draft.x, draft.y, draft.w, draft.h);
      ctx.setLineDash([]);
    }
  }, [bitmap, rects, draft]);

  const toImage = (e: React.PointerEvent) => {
    const c = canvas.current!;
    const b = c.getBoundingClientRect();
    return { x: ((e.clientX - b.left) / b.width) * c.width, y: ((e.clientY - b.top) / b.height) * c.height };
  };

  return (
    <canvas
      ref={canvas}
      data-mask-canvas
      aria-label="캡처 위에서 끌어 가릴 곳을 표시하세요"
      role="img"
      className="block h-auto w-full max-w-[720px] cursor-crosshair touch-none rounded-lg ring-1 ring-slate-300"
      onPointerDown={(e) => {
        (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
        start.current = toImage(e);
        setDraft({ ...start.current, w: 0, h: 0 });
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const p = toImage(e);
        setDraft({ x: start.current.x, y: start.current.y, w: p.x - start.current.x, h: p.y - start.current.y });
      }}
      onPointerUp={() => {
        const r = draft && normalizeRect(draft, bitmap.width, bitmap.height);
        start.current = null;
        setDraft(null);
        if (r) onChange([...rects, r]);
      }}
    />
  );
}
