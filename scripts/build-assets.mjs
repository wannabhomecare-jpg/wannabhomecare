#!/usr/bin/env node
/**
 * 로고·사진 파일을 사이트용으로 만든다. 같은 입력이면 같은 결과(여러 번 실행해도 안전).
 *
 * - materials/logo/logo-mark.svg → public/favicon-32.png, favicon-192.png, apple-touch-icon.png, og-image.png
 * - materials/photos/*.png (README 표에서 Phase 1 에 쓰는 5장) → public/photos/*.webp (같은 크기, 품질 85)
 *   자르기·덧칠·합성 없이 형식만 바꾼다. sharp 는 기본으로 메타데이터(EXIF·위치)를 남기지 않는다.
 * - public/photos/ 에 표에 없는 파일이 남아 있으면 지운다.
 *
 * 실행: node scripts/build-assets.mjs
 */
import { readdir, readFile, rm, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const logoDir = path.join(root, "materials/logo");
const photoDir = path.join(root, "materials/photos");
const pub = path.join(root, "public");

// 로고 색(로고에서 잰 값). 토큰 파일(globals.css)과 같은 값이다.
const BRAND_50 = { r: 0xf3, g: 0xf8, b: 0xfd, alpha: 1 };
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

const PHOTOS = [
  "hero-1-window.png",
  "service-1-clean.png",
  "service-2-aircon.png",
  "service-4-grout.png",
  "service-6-newhome.png",
];

async function markOnSquare(size, padRatio, background) {
  const svg = await readFile(path.join(logoDir, "logo-mark.svg"));
  const inner = Math.round(size * (1 - padRatio * 2));
  const mark = await sharp(svg, { density: 600 }).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(path.join(pub, "photos"), { recursive: true });

  await sharp(await markOnSquare(32, 0.04, WHITE)).toFile(path.join(pub, "favicon-32.png"));
  await sharp(await markOnSquare(192, 0.1, WHITE)).toFile(path.join(pub, "favicon-192.png"));
  await sharp(await markOnSquare(180, 0.12, WHITE)).toFile(path.join(pub, "apple-touch-icon.png"));

  // OG 1200×630: 옅은 바탕 가운데 세로 로고
  const vertical = await sharp(await readFile(path.join(logoDir, "logo-vertical.svg")), { density: 300 })
    .resize(560, 400, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: BRAND_50 } })
    .composite([{ input: vertical, gravity: "center" }])
    .png()
    .toFile(path.join(pub, "og-image.png"));

  for (const file of PHOTOS) {
    const src = path.join(photoDir, file);
    const out = path.join(pub, "photos", file.replace(/\.png$/, ".webp"));
    await sharp(src).webp({ quality: 85 }).toFile(out);
  }

  const keep = new Set(PHOTOS.map((f) => f.replace(/\.png$/, ".webp")));
  for (const f of await readdir(path.join(pub, "photos"))) {
    if (!keep.has(f)) await rm(path.join(pub, "photos", f));
  }
  console.log("assets: ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
