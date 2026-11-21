import assert from "node:assert/strict";
import test from "node:test";
import {
  CLEAN_TYPES,
  EXTRA_SERVICES,
  isStepComplete,
  pruneAnswers,
  QUOTE_SERVICES,
  stepsFor,
  boardServiceLabel,
  maskName,
} from "../src/lib/quote";
import { quotePayloadSchema } from "../src/lib/quote-schema";

test("1번 선택지에 컬비청소가 없고, 8번에만 있다", () => {
  assert.deepEqual([...QUOTE_SERVICES], ["clean", "aircon", "grout", "coating", "newhome"]);
  assert.ok((EXTRA_SERVICES as readonly string[]).includes("컬비청소"));
});

test("2번 설명은 고객 문구 그대로", () => {
  assert.equal(CLEAN_TYPES.length, 7);
  assert.equal(CLEAN_TYPES[2].desc, "기존 세입자 퇴거와 신규 입주 사이의 짧은 시간 동안 신속하게 진행하는 당일 맞춤 청소");
});

test("집 청소 순서: 1 → 2 → 3 → 4·5·6 → 7 → 8 → 9–13", () => {
  assert.deepEqual(stepsFor({ service: "clean", cleanType: "이사청소" }), [
    "service", "cleanType", "building", "rooms", "structure", "extras", "area", "address", "date", "contact", "message",
  ]);
});

test("상가청소(3-1번)를 고르면 4–7번이 나오지 않는다", () => {
  const s = stepsFor({ service: "clean", cleanType: "상가청소" });
  assert.deepEqual(s, ["service", "cleanType", "business", "extras", "area", "address", "date", "contact", "message"]);
  for (const id of ["building", "rooms", "structure"] as const) assert.ok(!s.includes(id));
});

test("청소가 아닌 서비스는 2–8번이 나오지 않는다", () => {
  for (const svc of ["aircon", "grout", "coating", "newhome"] as const) {
    assert.deepEqual(stepsFor({ service: svc }), ["service", "area", "address", "date", "contact", "message"]);
  }
});

test("다른 길로 바꾸면 쓰이지 않는 답을 지운다", () => {
  const a = pruneAnswers({ service: "grout", cleanType: "이사청소", rooms: 3, extras: ["줄눈"] });
  assert.equal(a.cleanType, undefined);
  assert.equal(a.rooms, undefined);
  assert.deepEqual(a.extras, []);
});

test("8번·13번 말고는 답해야 넘어간다", () => {
  const a = { extras: [] };
  assert.equal(isStepComplete("extras", a), true);
  assert.equal(isStepComplete("message", a), true);
  assert.equal(isStepComplete("area", a), false);
  assert.equal(isStepComplete("building", { extras: [], buildingType: "기타 (직접 입력)" }), false);
  assert.equal(isStepComplete("building", { extras: [], buildingType: "기타 (직접 입력)", buildingOther: "상가주택" }), true);
  assert.equal(isStepComplete("contact", { extras: [], customerName: "홍길동", phone: "010-1234-5678", consent: false }), false);
});

const base = {
  area: "34평",
  sido: "서울",
  sigungu: "중구",
  addressDetail: "OO아파트 101동",
  preferredDate: "날짜 미정",
  customerName: "시험",
  phone: "010-0000-0000",
  consent: true as const,
};

test("서버 검증: 집 청소에 방 수가 없으면 거부, 있으면 통과", () => {
  const bad = quotePayloadSchema.safeParse({ ...base, service: "clean", cleanType: "이사청소", buildingType: "아파트", extras: [] });
  assert.equal(bad.success, false);
  const ok = quotePayloadSchema.safeParse({
    ...base, service: "clean", cleanType: "이사청소", buildingType: "아파트", rooms: 3, bathrooms: 2, balconies: 2, structure: "복층", extras: ["컬비청소"],
  });
  assert.equal(ok.success, true);
});

test("서버 검증: 동의가 없으면 거부", () => {
  assert.equal(quotePayloadSchema.safeParse({ ...base, consent: false, service: "grout" }).success, false);
  assert.equal(quotePayloadSchema.safeParse({ ...base, service: "grout" }).success, true);
});

test("공개 목록 칩과 이름 가리기", () => {
  assert.equal(boardServiceLabel("clean", "입주청소"), "입주청소");
  assert.equal(boardServiceLabel("grout", null), "줄눈");
  assert.equal(maskName("김철수"), "김○○");
});
