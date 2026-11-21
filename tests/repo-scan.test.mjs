/**
 * 저장소 검사 — 커밋되는 파일을 훑는다(이 파일 자신은 검사 문자열을 담고 있어 뺀다).
 * 1) 기반 사이트 흔적 0건  2) 업종 문구 0건  3) 색 토큰 밖 색 0건
 * 4) 약속·방문 견적 문구 0건  5) 토큰 모양 문자열·이메일 주소 0건
 */
import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const SELF = "tests/repo-scan.test.mjs";
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && f !== SELF && existsSync(f))
  .filter((f) => !/\.(png|jpe?g|webp|gif|ico|woff2?|pdf|zip)$/i.test(f));

const read = (f) => readFileSync(f, "utf8");
const under = (prefixes) => files.filter((f) => prefixes.some((p) => f === p || f.startsWith(p)));
function hits(list, re) {
  const out = [];
  for (const f of list) {
    const lines = read(f).split("\n");
    lines.forEach((line, i) => {
      if (re.test(line)) out.push(`${f}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  return out;
}

// 단어는 조각으로 적어 이 파일이 다른 검사에 걸리지 않게 한다
const j = (...p) => p.join("");

const PRODUCT = [
  "src/", "public/", "supabase/", "scripts/", "tests/", "README.md", ".env.example", "package.json", "package-lock.json",
  "next.config.ts", "eslint.config.mjs", "postcss.config.mjs", "tsconfig.json", "vercel.json", ".prettierrc.json", ".prettierignore",
];

test("기반 사이트 흔적 0건", () => {
  const words = [
    j("노모어", "누수"), j("nomore", "nusu"), j("leak", "-site"), j("leak", "zero"), j("0105700", "4026"), j("010-5700", "-4026"),
    j("440-21-", "02138"), j("도봉", "로"), j("open.", "kakao.com"), j("ed2d1988", "62385a03"), j("c6c86a13", "77104ab3"),
    j("3c7a9a68", "77ce"), j("유레", "카"), j("최태", "환"),
  ];
  const re = new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");
  assert.deepEqual(hits(under(PRODUCT), re), []);
});

test("업종 문구 0건", () => {
  const words = [j("누", "수"), j("동", "파"), j("해", "빙"), j("난방", "배관"), j("하수", "구"), j("청", "음"), j("열화", "상"), j("긴급", "출동"), j("le", "ak")];
  const re = new RegExp(words.join("|"), "i");
  assert.deepEqual(hits(under(["src/", "public/", "supabase/", "scripts/", "tests/"]), re), []);
});

test("색: 토큰 밖 색 클래스·16진수 0건", () => {
  const ui = under(["src/"]).filter((f) => /\.(tsx?|css)$/.test(f));
  const cls = /\b(cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|orange|amber|yellow|lime|green|emerald|teal|highlight|accent|red)-\d{2,3}\b/;
  assert.deepEqual(hits(ui, cls), []);
  const tokenFiles = new Set(["src/app/globals.css", "src/lib/theme-tokens.ts"]);
  const hex = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/;
  assert.deepEqual(hits(ui.filter((f) => !tokenFiles.has(f)), hex), []);
});

test("추가 비용 약속·방문 견적 문구 0건(화면·검색 설명·DB 초기 데이터)", () => {
  const phrases = [
    j("추가금", " 0"), j("추가금", " 없"), j("추가 비용", " 0"), j("추가 비용", " 없"), j("금액", " 그대로"),
    j("금액이", " 달라지지"), j("견적", " 그대로"), j("방문", " 견적"), j("출장", " 견적"),
  ];
  const re = new RegExp(phrases.join("|"));
  assert.deepEqual(hits(under(["src/", "public/", "supabase/"]), re), []);
});

test("토큰 모양 문자열·이메일 주소 0건", () => {
  const token = /\b(sbp_[0-9a-f]{20,}|sb_secret_[\w-]{10,}|sb_publishable_[\w-]{10,}|ghp_[A-Za-z0-9]{20,}|github_pat_\w{20,}|eyJ[\w-]{10,}\.eyJ[\w-]{10,}\.[\w-]{10,}|vercel_[A-Za-z0-9]{20,})/;
  assert.deepEqual(hits(files, token), []);
  const email = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/;
  const emailHits = hits(files.filter((f) => f !== "package-lock.json"), email).filter(
    (h) => !/@(next|types|supabase|tailwindcss|axe-core|eslint|vitejs|romanize|electric-sql)\//.test(h),
  );
  assert.deepEqual(emailHits, []);
});
