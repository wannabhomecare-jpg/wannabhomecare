import assert from "node:assert/strict";
import test from "node:test";
import { normalizeKakao } from "../src/lib/contact";

// 예시 ID 만 쓴다(실제 채널 ID 는 환경변수에만 있다).
const expected = {
  id: "AbC123",
  home: "https://pf.kakao.com/_AbC123",
  url: "https://pf.kakao.com/_AbC123/chat",
};

const ok: [string, string][] = [
  ["https 홈 주소", "https://pf.kakao.com/_AbC123"],
  ["http 홈 주소(관리자센터 표시 형식)", "http://pf.kakao.com/_AbC123"],
  ["/chat 붙은 주소", "https://pf.kakao.com/_AbC123/chat"],
  ["/friend 붙은 주소", "http://pf.kakao.com/_AbC123/friend"],
  ["끝 / 붙은 주소", "https://pf.kakao.com/_AbC123/"],
  ["쿼리 붙은 주소", "https://pf.kakao.com/_AbC123?utm_source=x"],
  ["# 붙은 주소", "https://pf.kakao.com/_AbC123/chat#top"],
  ["대문자 호스트", "HTTPS://PF.KAKAO.COM/_AbC123"],
  ["앞뒤 공백", "  http://pf.kakao.com/_AbC123/chat/  "],
];
for (const [name, input] of ok) {
  test(`normalizeKakao 받음: ${name}`, () => {
    assert.deepEqual(normalizeKakao(input), expected);
  });
}

const bad: [string, string | null | undefined][] = [
  ["오픈채팅 주소", `https://${"open"}.kakao.com/o/sAbC123`],
  ["_ 로 시작하지 않는 경로", "https://pf.kakao.com/abc"],
  ["javascript: 주소", "javascript:alert(1)"],
  ["빈 값", ""],
  ["#", "#"],
  ["null", null],
  ["undefined", undefined],
  ["비슷한 다른 호스트", "https://pf.kakao.com.evil.example/_AbC123"],
  ["ID 에 영문·숫자 아닌 글자", "https://pf.kakao.com/_AbC-123"],
  ["다른 하위 경로", "https://pf.kakao.com/_AbC123/posts"],
  ["ftp 주소", "ftp://pf.kakao.com/_AbC123"],
];
for (const [name, input] of bad) {
  test(`normalizeKakao 거절: ${name}`, () => {
    assert.equal(normalizeKakao(input), null);
  });
}

test("미리보기 띠 문구 4가지", async () => {
  const { previewBannerText } = await import("../src/lib/preview-banner");
  const head = "미리보기 · 접수 목록은 예시이고, ";
  assert.equal(
    previewBannerText({ kakao: false, photosPending: true }),
    `${head}카카오톡 상담과 일부 사진·후기는 준비 중입니다`,
  );
  assert.equal(
    previewBannerText({ kakao: true, photosPending: true }),
    `${head}일부 사진·후기는 준비 중입니다`,
  );
  assert.equal(
    previewBannerText({ kakao: false, photosPending: false }),
    `${head}카카오톡 상담과 후기는 준비 중입니다`,
  );
  assert.equal(
    previewBannerText({ kakao: true, photosPending: false }),
    `${head}후기는 준비 중입니다`,
  );
});

test("미리보기 띠: 초안 한 줄", async () => {
  const { DRAFT_BANNER_LINE } = await import("../src/lib/preview-banner");
  assert.equal(DRAFT_BANNER_LINE, "카테고리 화면의 '초안' 표시 문구는 대표님 확인 후 바꿉니다.");
});
