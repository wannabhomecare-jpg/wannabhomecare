import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { mp4Info, imageMetaProblems } from "../scripts/lib/media-meta.mjs";

function box(type, ...parts) {
  const body = Buffer.concat(parts);
  const h = Buffer.alloc(8);
  h.writeUInt32BE(8 + body.length, 0);
  h.write(type, 4, "latin1");
  return Buffer.concat([h, body]);
}
function mvhd(creation) {
  const b = Buffer.alloc(100);
  b.writeUInt32BE(creation, 4);
  return box("mvhd", b);
}

test("MP4 검사: 날짜·위치·기기 태그를 찾고, 깨끗한 파일은 통과", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mm-"));
  const dirty = path.join(dir, "dirty.mp4");
  writeFileSync(dirty, Buffer.concat([box("ftyp", Buffer.from("isom")), box("moov", mvhd(3900000000), box("udta", box("©xyz", Buffer.from("+37.5+127.0/")), box("©mak", Buffer.from("x"))))]));
  const d = mp4Info(dirty);
  assert.ok(d.problems.includes("mvhd.creation_time"));
  assert.ok(d.problems.some((p) => p.startsWith("location")));
  assert.ok(d.problems.some((p) => p.startsWith("device")));
  const clean = path.join(dir, "clean.mp4");
  writeFileSync(clean, Buffer.concat([box("ftyp", Buffer.from("isom")), box("moov", mvhd(0), box("udta", box("©too", Buffer.from("Lavf"))))]));
  assert.deepEqual(mp4Info(clean).problems, []);
});

test("public/real/ 의 사진·영상에 메타데이터가 없다", async () => {
  const walk = (d) => readdirSync(d).flatMap((n) => (statSync(path.join(d, n)).isDirectory() ? walk(path.join(d, n)) : [path.join(d, n)]));
  const files = walk("public/real");
  assert.ok(files.length >= 24);
  for (const f of files) {
    if (/\.(webp|jpe?g|png)$/i.test(f)) assert.deepEqual(await imageMetaProblems(f), [], f);
    if (/\.mp4$/i.test(f)) {
      const i = mp4Info(f);
      assert.deepEqual(i.problems, [], f);
      assert.ok(i.codecs.includes("avc1"), `${f} h264`);
      assert.equal(i.hasAudio, false, `${f} 소리 트랙`);
    }
  }
});
