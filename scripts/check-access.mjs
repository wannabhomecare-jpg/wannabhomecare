#!/usr/bin/env node
// 토큰·권한·무료 한도를 읽기 요청(GET)만으로 확인한다. 외부 서비스에 쓰기 요청은 하지 않는다.
// 토큰은 fetch 요청 헤더로만 쓰고, 값·이메일은 출력하지 않는다.
//
// 사용: node scripts/check-access.mjs [--json] [--names] [--write-env]
//   --json       같은 내용을 JSON 으로 출력
//   --names      다른 프로젝트 이름도 출력(최종 답변용. 리포트에는 쓰지 않는다)
//   --write-env  고른 VERCEL_TEAM_ID·SUPABASE_ORG_ID 를 .env.local 에 적는다(로컬 파일만. 이미 값이 있으면 두고 알린다)
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, chmodSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const PROJECT = 'wannab-homecare';
// 기반 저장소 주소는 커밋하지 않는다(.env.local 의 BASE_REPO_URL). 없으면 이 확인을 건너뛴다.
const BASE_REPO = process.env.BASE_REPO_URL || '';
const BASE_COMMIT = '408ae5609406ccfda4c398e0363bbe94499dc259';

// ---------- env ----------
function parseEnv(path) {
  const out = new Map();
  if (!existsSync(path)) return out;
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    out.set(m[1], v);
  }
  return out;
}
const envLocalPath = join(root, '.env.local');
const local = parseEnv(envLocalPath);
function getEnv(name) {
  if (local.get(name)) return { value: local.get(name), source: '.env.local' };
  if (process.env[name]) return { value: process.env[name], source: '환경변수' };
  return { value: '', source: '없음' };
}
const VT = getEnv('VERCEL_TOKEN');
const ST = getEnv('SUPABASE_ACCESS_TOKEN');
const SECRETS = [VT.value, ST.value].filter((v) => v && v.length >= 8);

// ---------- http (GET only) ----------
async function get(url, token) {
  let last;
  for (let i = 0; i < 4; i++) { // 네트워크 끊김·429·5xx 는 다시 시도
    try {
      const res = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
      let body = null;
      try { body = await res.json(); } catch { /* ignore */ }
      last = { status: res.status, ok: res.ok, body };
      if (res.status !== 429 && res.status < 500) return last;
    } catch (e) {
      last = { status: 0, ok: false, body: null, error: String(e.message || e) };
    }
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  return last;
}

const r = { vercel: {}, supabase: {}, github: {}, git: {} };

// ---------- Vercel ----------
async function checkVercel() {
  const v = r.vercel;
  v.token = VT.source;
  if (!VT.value) { v.valid = false; v.note = 'VERCEL_TOKEN 없음'; return; }
  const V = 'https://api.vercel.com';
  const user = await get(`${V}/v2/user`, VT.value);
  v.userStatus = user.status;
  v.valid = user.ok;
  if (!user.ok) { v.note = `토큰 확인 실패(HTTP ${user.status})`; return; }
  v.username = user.body?.user?.username ?? null;
  const defaultTeamId = user.body?.user?.defaultTeamId ?? null;

  const teams = await get(`${V}/v2/teams?limit=100`, VT.value);
  v.teamsStatus = teams.status;
  const list = teams.ok ? (teams.body?.teams ?? []) : [];
  v.scopes = [];
  for (const t of list) {
    const plan = t.billing?.plan ?? t.plan ?? 'unknown';
    const projects = [];
    let until = null;
    for (let i = 0; i < 20; i++) {
      const q = `${V}/v10/projects?teamId=${encodeURIComponent(t.id)}&limit=100${until ? `&until=${until}` : ''}`;
      const p = await get(q, VT.value);
      if (!p.ok) break;
      projects.push(...(p.body?.projects ?? []).map((x) => ({ name: x.name, id: x.id, link: x.link ?? null })));
      until = p.body?.pagination?.next;
      if (!until) break;
    }
    const mine = projects.find((x) => x.name === PROJECT) ?? null;
    v.scopes.push({
      id: t.id, name: t.name, slug: t.slug, plan, isDefault: t.id === defaultTeamId,
      projectCount: projects.length,
      otherProjectNames: projects.filter((x) => x.name !== PROJECT).map((x) => x.name),
      existing: mine ? { id: mine.id, linkedRepo: mine.link?.type === 'github' ? `${mine.link.org}/${mine.link.repo}` : null } : null,
      // 이 저장소에 이미 연결된 프로젝트(이름이 달라도 이 저장소 것이다)
      thisRepoProjects: projects
        .filter((x) => x.link?.type === 'github' && `${x.link.org}/${x.link.repo}`.toLowerCase() === String(process.env.GITHUB_REPOSITORY ?? '').toLowerCase())
        .map((x) => ({ name: x.name, id: x.id })),
    });
  }
  const hobby = v.scopes.filter((s) => String(s.plan).toLowerCase() === 'hobby');
  v.chosen = hobby[0] ?? null;
  v.hobbyCount = hobby.length;

  // GitHub 연동으로 이 저장소를 볼 수 있는지(문서화되지 않은 엔드포인트라 실패하면 '확인 불가')
  v.gitRepoVisible = '확인 불가';
  v.gitNamespaces = null;
  const repo = process.env.GITHUB_REPOSITORY;
  if (v.chosen?.thisRepoProjects?.length) {
    v.gitRepoVisible = '예(이 저장소에 연결된 프로젝트가 있음)';
    // 그 프로젝트의 최근 Git 배포 상태와 커밋 작성자(로그인 이름만)
    const pid = v.chosen.thisRepoProjects[0].id;
    const d = await get(`${V}/v6/deployments?limit=5&projectId=${pid}&teamId=${v.chosen.id}`, VT.value);
    if (d.ok) v.recentGitDeploys = (d.body?.deployments ?? []).filter((x) => x.meta?.githubCommitAuthorLogin)
      .map((x) => ({ state: x.state, author: x.meta.githubCommitAuthorLogin }));
  } else if (v.chosen && repo) {
    const [owner, name] = repo.split('/');
    const ns = await get(`${V}/v1/integrations/git-namespaces?provider=github&teamId=${v.chosen.id}`, VT.value);
    if (ns.ok && Array.isArray(ns.body)) {
      v.gitNamespaces = ns.body.map((n) => n.slug ?? n.name).filter(Boolean);
      const hit = ns.body.find((n) => (n.slug ?? n.name ?? '').toLowerCase() === owner.toLowerCase());
      if (!hit) v.gitRepoVisible = `아니오(연동된 GitHub 계정·조직에 ${owner} 없음)`;
      else {
        const sr = await get(`${V}/v1/integrations/search-repo?provider=github&namespaceId=${encodeURIComponent(hit.id)}&query=${encodeURIComponent(name)}&teamId=${v.chosen.id}`, VT.value);
        if (sr.ok) {
          const repos = sr.body?.repos ?? sr.body ?? [];
          v.gitRepoVisible = Array.isArray(repos) && repos.some((x) => (x.name ?? x.slug ?? '').toLowerCase() === name.toLowerCase()) ? '예' : '아니오(GitHub 앱 저장소 권한 없음)';
        }
      }
    }
  }
}

// ---------- Supabase ----------
async function checkSupabase() {
  const s = r.supabase;
  s.token = ST.source;
  if (!ST.value) { s.valid = false; s.note = 'SUPABASE_ACCESS_TOKEN 없음'; return; }
  const S = 'https://api.supabase.com';
  const orgs = await get(`${S}/v1/organizations`, ST.value);
  s.orgsStatus = orgs.status;
  s.valid = orgs.ok;
  if (!orgs.ok) { s.note = `토큰 확인 실패(HTTP ${orgs.status})`; return; }
  const projects = await get(`${S}/v1/projects`, ST.value);
  s.projectsStatus = projects.status;
  const plist = projects.ok ? projects.body ?? [] : [];
  const inactive = (st) => /INACTIVE|PAUSED|REMOVED|GOING_DOWN/i.test(st ?? '');
  s.orgs = [];
  for (const o of orgs.body ?? []) {
    const detail = await get(`${S}/v1/organizations/${encodeURIComponent(o.slug ?? o.id)}`, ST.value);
    const plan = detail.ok ? (detail.body?.plan ?? 'unknown') : 'unknown';
    const keys = new Set([o.id, o.slug].filter(Boolean));
    const ps = plist.filter((p) => keys.has(p.organization_id) || keys.has(p.organization_slug));
    s.orgs.push({
      id: o.id, slug: o.slug ?? o.id, name: o.name, plan,
      active: ps.filter((p) => !inactive(p.status)).length,
      paused: ps.filter((p) => inactive(p.status)).length,
      activeProjectNames: ps.filter((p) => !inactive(p.status) && p.name !== PROJECT).map((p) => p.name),
      otherProjectNames: ps.filter((p) => p.name !== PROJECT).map((p) => p.name),
    });
  }
  const free = s.orgs.filter((o) => String(o.plan).toLowerCase() === 'free');
  // 한도는 소유자·관리자인 조직 합계다. 역할을 API 로 확실히 알 수 없어 모든 무료 조직을 합친다(보수적으로 센다).
  s.freeActive = free.reduce((n, o) => n + o.active, 0);
  s.freeLimit = 2;
  s.canCreate = free.length > 0 && s.freeActive < 2;
  s.chosen = [...free].sort((a, b) => a.active - b.active)[0] ?? null;
  const ex = plist.find((p) => p.name === PROJECT);
  s.existing = ex ? { ref: ex.id ?? ex.ref, status: ex.status } : null;
}

// ---------- GitHub ----------
function sh(cmd, argv, opts = {}) {
  try {
    return { ok: true, out: execFileSync(cmd, argv, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 120000, ...opts }) };
  } catch (e) { return { ok: false, out: String(e.stderr || e.message || '') }; }
}
function checkGithub() {
  const g = r.github;
  g.repo = process.env.GITHUB_REPOSITORY ?? null;
  g.user = process.env.GITHUB_USER ?? null;
  const dry = sh('git', ['push', '--dry-run', 'origin', 'HEAD'], { cwd: root });
  g.push = dry.ok;
  if (g.repo) {
    const perm = sh('gh', ['api', `repos/${g.repo}`, '--jq', '.permissions.push']);
    g.pushPermission = perm.ok ? perm.out.trim() === 'true' : null;
  }
  const tmp = mkdtempSync(join(tmpdir(), 'base-check-'));
  try {
    const a = sh('git', ['init', '-q'], { cwd: tmp });
    const b = a.ok && BASE_REPO && sh('git', ['fetch', '-q', '--depth', '1', BASE_REPO, BASE_COMMIT], { cwd: tmp });
    const c = b && b.ok && sh('git', ['cat-file', '-t', BASE_COMMIT], { cwd: tmp });
    g.baseCommit = BASE_REPO ? Boolean(c && c.ok && c.out.trim() === 'commit') : null;
  } finally { rmSync(tmp, { recursive: true, force: true }); }

  const name = sh('git', ['config', 'user.name'], { cwd: root });
  const email = sh('git', ['config', 'user.email'], { cwd: root });
  r.git.authorName = name.ok ? name.out.trim() : null;
  r.git.emailIsNoreply = email.ok ? /@users\.noreply\.github\.com$/i.test(email.out.trim()) : null;
  r.git.emailSet = email.ok && email.out.trim().length > 0;
}

// ---------- write env (local file only) ----------
function writeEnv() {
  const want = {};
  if (r.vercel.chosen) want.VERCEL_TEAM_ID = r.vercel.chosen.id;
  if (r.supabase.chosen) want.SUPABASE_ORG_ID = r.supabase.chosen.slug;
  const written = [];
  if (!Object.keys(want).length) return written;
  let text = existsSync(envLocalPath) ? readFileSync(envLocalPath, 'utf8') : '';
  for (const [k, v] of Object.entries(want)) {
    const re = new RegExp(`^${k}=(.*)$`, 'm');
    const m = text.match(re);
    if (m && m[1].trim()) { written.push({ name: k, action: m[1].trim() === v ? '같음' : '이미 다른 값 있음(그대로 둠)' }); continue; }
    text = m ? text.replace(re, `${k}=${v}`) : `${text}${text && !text.endsWith('\n') ? '\n' : ''}${k}=${v}\n`;
    written.push({ name: k, action: '적음' });
  }
  writeFileSync(envLocalPath, text);
  chmodSync(envLocalPath, 0o600);
  return written;
}

// ---------- run ----------
await Promise.all([checkVercel(), checkSupabase()]);
checkGithub();
if (args.has('--write-env')) r.envWritten = writeEnv();

const showNames = args.has('--names');
if (!showNames) {
  for (const sc of r.vercel.scopes ?? []) delete sc.otherProjectNames;
  for (const o of r.supabase.orgs ?? []) { delete o.otherProjectNames; delete o.activeProjectNames; }
  delete r.vercel.gitNamespaces;
}

function render() {
  if (args.has('--json')) return JSON.stringify(r, null, 2);
  const L = [];
  const v = r.vercel, s = r.supabase, g = r.github;
  L.push('## Vercel');
  L.push(`| 항목 | 결과 |\n| --- | --- |`);
  L.push(`| 토큰 | ${v.token}${v.valid ? ' · 유효(HTTP 200)' : v.note ? ` · ${v.note}` : ''} |`);
  if (v.valid) {
    L.push(`| 사용자 | ${v.username ?? '-'} |`);
    for (const sc of v.scopes) L.push(`| 범위 ${sc.name} | 플랜 ${sc.plan} · 프로젝트 ${sc.projectCount}개${sc.existing ? ` · ${PROJECT} 있음(연결 저장소 ${sc.existing.linkedRepo ?? '없음'})` : ''}${showNames && sc.otherProjectNames?.length ? ` · ${sc.otherProjectNames.join(', ')}` : ''} |`);
    L.push(`| 고른 범위 | ${v.chosen ? `${v.chosen.name} (Hobby${v.hobbyCount > 1 ? `, Hobby 팀 ${v.hobbyCount}개 중 첫 번째` : ''})` : 'Hobby 범위 없음'} |`);
    L.push(`| ${PROJECT} | ${v.scopes.some((x) => x.existing) ? '있음' : '없음'} |`);
    L.push(`| GitHub 연동으로 이 저장소 보기 | ${v.gitRepoVisible} |`);
    for (const sc of v.scopes) for (const tp of sc.thisRepoProjects ?? []) L.push(`| 이 저장소에 연결된 프로젝트 | ${tp.name} (${sc.name}) |`);
    if (v.recentGitDeploys?.length) L.push(`| 최근 Git 배포 | ${v.recentGitDeploys.map((x) => `${x.state}(${x.author})`).join(', ')} |`);
    if (showNames && v.gitNamespaces) L.push(`| 연동된 GitHub 계정·조직 | ${v.gitNamespaces.join(', ')} |`);
  }
  L.push('\n## Supabase');
  L.push(`| 항목 | 결과 |\n| --- | --- |`);
  L.push(`| 토큰 | ${s.token}${s.valid ? ' · 유효(HTTP 200)' : s.note ? ` · ${s.note}` : ''} |`);
  if (s.valid) {
    for (const o of s.orgs) L.push(`| 조직 ${o.name} | 플랜 ${o.plan} · 활성 ${o.active} · 일시정지 ${o.paused}${showNames && o.activeProjectNames?.length ? ` · 활성: ${o.activeProjectNames.join(', ')}` : ''} |`);
    L.push(`| 무료 활성 프로젝트 | ${s.freeActive} / ${s.freeLimit} |`);
    L.push(`| 새 무료 프로젝트 만들 수 있음 | ${s.canCreate ? '예' : '아니오'} |`);
    L.push(`| 고른 조직 | ${s.chosen ? `${s.chosen.name} (free)` : '무료 플랜 조직 없음'} |`);
    L.push(`| ${PROJECT} | ${s.existing ? `있음(${s.existing.status})` : '없음'} |`);
  }
  L.push('\n## GitHub');
  L.push(`| 항목 | 결과 |\n| --- | --- |`);
  L.push(`| 저장소 | ${g.repo ?? '-'} |`);
  L.push(`| push (dry-run) | ${g.push ? '성공' : '실패'}${g.pushPermission != null ? ` · API 권한 ${g.pushPermission ? 'push 가능' : 'push 불가'}` : ''} |`);
  L.push(`| 기반 커밋 ${BASE_COMMIT.slice(0, 7)} 받기 | ${g.baseCommit === null ? '건너뜀(BASE_REPO_URL 없음)' : g.baseCommit ? '성공' : '실패'} |`);
  L.push(`| Codespace GitHub 사용자 | ${g.user ?? '-'} |`);
  L.push(`| 커밋 작성자 이름 | ${r.git.authorName ?? '-'} |`);
  L.push(`| 작성자 이메일 | ${r.git.emailSet ? (r.git.emailIsNoreply ? 'GitHub noreply 주소' : 'noreply 아님') : '설정 안 됨'} |`);
  if (r.envWritten) for (const w of r.envWritten) L.push(`\n.env.local ${w.name}: ${w.action}`);
  return L.join('\n');
}

// 출력에 토큰 값이 일부라도 들어 있는지 검사(16자 조각 단위)
function hasTokenInOutput(text) {
  for (const sec of SECRETS) {
    const n = Math.min(16, sec.length);
    for (let i = 0; i + n <= sec.length; i++) if (text.includes(sec.slice(i, i + n))) return true;
  }
  return false;
}
const out = render();
if (hasTokenInOutput(out)) {
  console.error('출력에 토큰 값 일부가 들어 있어 출력하지 않습니다.');
  process.exit(2);
}
console.log(out);
if (!args.has('--json')) console.log('\n토큰 노출 검사: 통과(출력에 토큰 값 없음)');
