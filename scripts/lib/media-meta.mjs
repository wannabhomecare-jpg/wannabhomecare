/**
 * 사진·영상 메타데이터 검사(값을 고치지 않고 읽기만 한다).
 * - 사진(webp·jpg·png): sharp metadata() 로 exif·xmp·iptc 가 있는지
 * - 영상(mp4): ffprobe 없이 MP4 상자를 직접 읽는다.
 *   위치(©xyz·loci·location 키), 날짜(mvhd·tkhd·mdhd creation_time, ©day·creationdate), 기기(©mak·©mod·make·model)
 *   인코더 이름(©too) 같은 기술 태그는 괜찮다.
 */
import { readFileSync } from "node:fs";
import sharp from "sharp";

export async function imageMetaProblems(file) {
  const m = await sharp(file).metadata();
  const out = [];
  if (m.exif) out.push("exif");
  if (m.xmp) out.push("xmp");
  if (m.iptc) out.push("iptc");
  return out;
}

function* boxes(buf, start, end) {
  let p = start;
  while (p + 8 <= end) {
    let size = buf.readUInt32BE(p);
    const type = buf.toString("latin1", p + 4, p + 8);
    let header = 8;
    if (size === 1) {
      size = Number(buf.readBigUInt64BE(p + 8));
      header = 16;
    } else if (size === 0) size = end - p;
    if (size < header || p + size > end) return;
    yield { type, start: p, body: p + header, end: p + size };
    p += size;
  }
}

const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl", "udta", "edts", "dinf"]);

export function mp4Info(file) {
  const buf = readFileSync(file);
  const problems = [];
  const codecs = [];
  const handlers = [];
  const walk = (start, end, path) => {
    for (const b of boxes(buf, start, end)) {
      const here = [...path, b.type];
      if (b.type === "mvhd" || b.type === "tkhd" || b.type === "mdhd") {
        const v = buf[b.body];
        const t = v === 1 ? Number(buf.readBigUInt64BE(b.body + 4)) : buf.readUInt32BE(b.body + 4);
        if (t !== 0) problems.push(`${b.type}.creation_time`);
      } else if (b.type === "hdlr") {
        handlers.push(buf.toString("latin1", b.body + 8, b.body + 12));
      } else if (b.type === "stsd") {
        for (const e of boxes(buf, b.body + 8, b.end)) codecs.push(e.type);
      } else if (["©xyz", "loci"].includes(b.type)) problems.push(`location(${b.type})`);
      else if (["©mak", "©mod"].includes(b.type)) problems.push(`device(${b.type})`);
      else if (b.type === "©day") problems.push("date(©day)");
      else if (b.type === "meta") {
        // QuickTime meta(keys) 또는 ISO meta(4바이트 version/flags 뒤)
        const text = buf.toString("latin1", b.body, b.end).toLowerCase();
        for (const k of ["location", "make", "model", "creationdate"]) {
          if (text.includes(`com.apple.quicktime.${k}`)) problems.push(`meta:${k}`);
        }
        const inner = buf.toString("latin1", b.body + 4, b.body + 8) === "hdlr" ? b.body : b.body + 4;
        walk(inner, b.end, here);
      }
      if (CONTAINERS.has(b.type) || b.type === "ilst") walk(b.body, b.end, here);
    }
  };
  walk(0, buf.length, []);
  return { problems: [...new Set(problems)], codecs, handlers, hasAudio: handlers.includes("soun") };
}
