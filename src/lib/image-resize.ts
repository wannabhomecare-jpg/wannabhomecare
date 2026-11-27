/**
 * 견적 사진을 브라우저에서 줄인다(긴 변 1600px 안팎, JPEG).
 * Vercel 함수는 요청 본문이 4.5MB 를 넘으면 받지 못하므로, 한 번에 보내는 합계를 4MB 이하로 맞춘다.
 * 다시 그리면서 위치 정보(EXIF)도 빠진다.
 */

export const MAX_EDGE = 1600;
export const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
export const MAX_FILES = 3;

export async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // 일부 형식(HEIC 등)은 아래 방식으로 다시 시도
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function encode(source: ImageBitmap | HTMLImageElement, maxEdge: number, quality: number): Promise<Blob> {
  const w = "naturalWidth" in source ? source.naturalWidth : source.width;
  const h = "naturalHeight" in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("사진을 준비하지 못했어요.");
  ctx.drawImage(source, 0, 0, cw, ch);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("사진을 준비하지 못했어요.");
  return blob;
}

export async function prepareImages(files: File[]): Promise<File[]> {
  const picked = files.slice(0, MAX_FILES);
  const sources = await Promise.all(
    picked.map(async (f) => {
      try {
        return await loadBitmap(f);
      } catch {
        throw new Error("열 수 없는 사진이 있어요. JPG·PNG 사진으로 다시 골라 주세요.");
      }
    }),
  );
  // 합계가 4MB 를 넘으면 품질·크기를 낮춰 다시 만든다
  const attempts: [number, number][] = [
    [MAX_EDGE, 0.82],
    [MAX_EDGE, 0.7],
    [1280, 0.7],
    [1024, 0.65],
  ];
  for (const [edge, q] of attempts) {
    const blobs = await Promise.all(sources.map((s) => encode(s, edge, q)));
    const total = blobs.reduce((n, b) => n + b.size, 0);
    if (total <= MAX_TOTAL_BYTES) {
      return blobs.map((b, i) => new File([b], `photo-${i + 1}.jpg`, { type: "image/jpeg" }));
    }
  }
  throw new Error("사진 용량이 너무 커요. 사진 수를 줄여 다시 시도해 주세요.");
}
