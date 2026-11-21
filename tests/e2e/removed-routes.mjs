/** 지운 화면이 404 인지(관리자 화면은 로그인한 상태로 확인) */
const BASE = process.env.BASE_URL || "http://localhost:3000";
const res = await fetch(`${BASE}/admin/api/login`, {
  method: "POST",
  body: new URLSearchParams({ password: process.env.ADMIN_PASSWORD }),
  redirect: "manual",
});
const cookie = (res.headers.get("set-cookie") || "").split(";")[0];
if (!cookie) throw new Error("로그인 실패");
const paths = ["/seoul", "/posts", "/faq", "/feed.xml", "/admin/auto-post", "/admin/calendar", "/admin/search-visibility", "/admin/media", "/admin/integrations/kakao", "/admin/posts", "/admin/faq", "/admin/reviews"];
let bad = 0;
for (const p of paths) {
  const r = await fetch(BASE + p, { headers: { cookie }, redirect: "manual" });
  if (r.status !== 404) bad++;
  console.log(`| ${p} | ${r.status} |`);
}
process.exit(bad ? 1 : 0);
