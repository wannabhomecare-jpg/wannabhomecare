/**
 * 관리자 사진 올리기: 브라우저에서 긴 변 1600px WebP 로 다시 그린다.
 * 캔버스로 다시 그리면 위치 정보(EXIF)가 빠진다. 원본 파일은 서버로 보내지 않는다.
 * rects 를 주면 그 영역을 흐림 + 모자이크로 가린 뒤 저장한다(후기 캡처).
 */
import { loadBitmap } from "@/lib/image-resize";
import { maskRegions, type MaskRect } from "@/lib/mask";

export const ADMIN_MAX_EDGE = 1600;
export const ADMIN_MAX_BYTES = 5 * 1024 * 1024;

export type PreparedImage = { file: File; width: number; height: number };

export async function toWebp(source: File | ImageBitmap | HTMLImageElement, opts: { rects?: MaskRect[]; name?: string; maxBytes?: number } = {}): Promise<PreparedImage> {
  let src: ImageBitmap | HTMLImageElement;
  try {
    src = source instanceof File ? await loadBitmap(source) : source;
  } catch {
    throw new Error("열 수 없는 사진이에요. JPG·PNG·WebP 사진으로 다시 골라 주세요.");
  }
  const w0 = "naturalWidth" in src ? src.naturalWidth : src.width;
  const h0 = "naturalHeight" in src ? src.naturalHeight : src.height;
  const scale = Math.min(1, ADMIN_MAX_EDGE / Math.max(w0, h0));
  const width = Math.max(1, Math.round(w0 * scale));
  const height = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("사진을 준비하지 못했어요.");
  ctx.drawImage(src, 0, 0, width, height);
  if (opts.rects?.length) {
    const img = ctx.getImageData(0, 0, width, height);
    // 가린 영역 좌표는 원본 기준 → 줄인 크기에 맞춘다
    maskRegions(img.data, width, height, opts.rects.map((r) => ({ x: r.x * scale, y: r.y * scale, w: r.w * scale, h: r.h * scale })));
    ctx.putImageData(img, 0, 0);
  }
  for (const q of [0.85, 0.75, 0.6]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", q));
    if (!blob) break;
    if (blob.type !== "image/webp") throw new Error("이 브라우저는 WebP 저장을 지원하지 않아요. 크롬이나 사파리 최신 버전으로 해 주세요.");
    if (blob.size <= (opts.maxBytes ?? ADMIN_MAX_BYTES)) return { file: new File([blob], opts.name ?? "photo.webp", { type: "image/webp" }), width, height };
  }
  throw new Error("사진 용량이 너무 커요. 다른 사진으로 해 주세요.");
}
