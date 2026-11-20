#!/usr/bin/env node
// .env.example 에 적힌 이름마다 '있음(길이) / 비어 있음 / 없음' 을 표로 출력한다. 값은 출력하지 않는다.
// 사용: node scripts/env-check.mjs [--json]
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

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

const examplePath = join(root, '.env.example');
if (!existsSync(examplePath)) {
  console.error('.env.example 이 없습니다.');
  process.exit(1);
}
const names = [...parseEnv(examplePath).keys()];
const local = parseEnv(join(root, '.env.local'));
const hasLocalFile = existsSync(join(root, '.env.local'));

const rows = names.map((name) => {
  let source = '-';
  let value;
  if (local.has(name)) { source = '.env.local'; value = local.get(name); }
  else if (process.env[name] !== undefined) { source = '환경변수'; value = process.env[name]; }
  const status = value === undefined ? '없음' : value === '' ? '비어 있음' : `있음(${value.length})`;
  return { name, status, source };
});

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ envLocal: hasLocalFile, rows }, null, 2));
} else {
  console.log(`.env.local: ${hasLocalFile ? '있음' : '없음'}\n`);
  console.log('| 이름 | 상태 | 찾은 곳 |\n| --- | --- | --- |');
  for (const r of rows) console.log(`| ${r.name} | ${r.status} | ${r.source} |`);
}
