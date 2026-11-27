#!/usr/bin/env bash
# 최신 배포가 지정 커밋(앞 7자리)으로 READY 가 될 때까지 기다린다. 토큰은 .env.local 에서 환경변수로 읽는다.
set -euo pipefail
H="${1:?commit}"
set -a; . ./.env.local >/dev/null 2>&1; set +a
for i in $(seq 1 60); do
  r=$( (curl -s --retry 3 -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v6/deployments?projectId=$VERCEL_PROJECT_ID&teamId=$VERCEL_TEAM_ID&limit=3" || true) \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const h=process.argv[1];const d=JSON.parse(s).deployments.find(x=>x.meta?.githubCommitSha?.startsWith(h));console.log(d?d.state:"WAIT")}catch{console.log("WAIT")}})' "$H")
  case "$r" in READY|ERROR|CANCELED) echo "$H $r"; [ "$r" = READY ]; exit;; esac
  sleep 15
done
echo "$H TIMEOUT"; exit 1
