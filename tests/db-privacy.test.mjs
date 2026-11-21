/**
 * 개인정보 보호 고정 — 실제 Supabase 프로젝트에 붙어 확인한다(.env.local 값이 없으면 건너뛴다).
 * 1) 공개 키로 견적 요청 표 조회·삽입 거부  2) 공개 목록 뷰의 열은 6개뿐
 * 3) 요청 사진 저장소는 비공개(로그인 없이 안 열림)  4) 요청 표는 실시간 구독 대상이 아니다
 * 시험 행과 사진은 끝나면 지운다.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const skip = !url || !anonKey || !serviceKey ? "Supabase 환경변수가 없어 건너뜀" : false;

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const anon = skip ? null : createClient(url, anonKey, opts);
const admin = skip ? null : createClient(url, serviceKey, opts);

const sample = {
  service: "grout",
  area: "1평",
  sido: "서울",
  sigungu: "중구",
  address_detail: "시험 주소",
  preferred_date: "시험",
  customer_name: "시험행",
  phone: "010-0000-0000",
  message: "시험 요청 내용",
  consent_at: new Date().toISOString(),
};

test("공개 키로 견적 요청 표를 읽을 수 없다", { skip }, async () => {
  const { data, error } = await anon.from("quote_requests").select("id, customer_name, phone").limit(1);
  assert.ok(error, `거부되어야 한다 (data=${JSON.stringify(data)})`);
});

test("공개 키로 견적 요청을 넣을 수 없다", { skip }, async () => {
  const { error } = await anon.from("quote_requests").insert({ ...sample, consent_at: new Date().toISOString() });
  assert.ok(error, "삽입이 거부되어야 한다");
});

test("공개 목록 뷰에는 가린 이름·시/구·서비스·상태·시각만 있다", { skip }, async () => {
  const { data: row, error } = await admin.from("quote_requests").insert(sample).select("id").single();
  assert.ifError(error);
  try {
    const { data, error: e2 } = await anon.from("quote_request_board").select("*").eq("id", row.id).single();
    assert.ifError(e2);
    assert.deepEqual(Object.keys(data).sort(), ["created_at", "id", "masked_name", "region", "service_label", "status"]);
    assert.equal(data.masked_name, "시○○");
    assert.equal(data.region, "서울 중구");
    assert.equal(data.service_label, "줄눈");
  } finally {
    await admin.from("quote_requests").delete().eq("id", row.id);
  }
});

test("요청 사진은 로그인 없이 열리지 않는다", { skip }, async () => {
  const path = `tests/${Date.now()}.png`;
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const up = await admin.storage.from("request-images").upload(path, png, { contentType: "image/png" });
  assert.ifError(up.error);
  try {
    const res = await fetch(`${url}/storage/v1/object/public/request-images/${path}`);
    assert.notEqual(res.status, 200, "공개 주소로 열리면 안 된다");
    const anonDl = await anon.storage.from("request-images").download(path);
    assert.ok(anonDl.error, "공개 키로 내려받을 수 없어야 한다");
    const anonUp = await anon.storage.from("request-images").upload(`tests/anon-${Date.now()}.png`, png, { contentType: "image/png" });
    assert.ok(anonUp.error, "공개 키로 올릴 수 없어야 한다");
    const signed = await admin.storage.from("request-images").createSignedUrl(path, 60);
    assert.ifError(signed.error);
    assert.equal((await fetch(signed.data.signedUrl)).status, 200, "관리자용 기한 주소는 열려야 한다");
  } finally {
    await admin.storage.from("request-images").remove([path]);
  }
});

const mgmt = process.env.SUPABASE_ACCESS_TOKEN && process.env.SUPABASE_PROJECT_REF;
test("견적 요청 표는 실시간 구독 대상이 아니다", { skip: skip || (!mgmt && "관리 토큰이 없어 건너뜀") }, async () => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${process.env.SUPABASE_PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query:
        "select count(*)::int as n from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'quote_requests'",
    }),
  });
  assert.ok(res.ok, `HTTP ${res.status}`);
  const rows = await res.json();
  assert.equal(rows[0].n, 0);
});
