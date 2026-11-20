#!/usr/bin/env bash
# 워너비홈케어 Codespace 작업 환경 준비. 여러 번 실행해도 안전하다.
set -euo pipefail
cd "$(dirname "$0")/.."

log() { printf '\n[setup] %s\n' "$*"; }
SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"

# 1) Node.js >= 20.9
need_node=1
if command -v node >/dev/null 2>&1; then
  v="$(node -p 'process.versions.node')"
  node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>20||(a===20&&b>=9)?0:1)' && need_node=0
  [ $need_node -eq 0 ] && log "Node $v (ok)"
fi
if [ $need_node -eq 1 ]; then
  log "Node 20.9+ 없음 → nvm 으로 22 LTS 설치"
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  [ -s "$NVM_DIR/nvm.sh" ] || curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm install 22 && nvm alias default 22 && nvm use default
fi

# 2) apt 패키지: jq, unzip, 한글 글꼴
pkgs=()
command -v jq >/dev/null 2>&1 || pkgs+=(jq)
command -v unzip >/dev/null 2>&1 || pkgs+=(unzip)
dpkg -s fonts-noto-cjk >/dev/null 2>&1 || pkgs+=(fonts-noto-cjk)
if [ ${#pkgs[@]} -gt 0 ]; then
  log "apt 설치: ${pkgs[*]}"
  $SUDO apt-get update -y -qq
  DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -y -qq "${pkgs[@]}"
  fc-cache -f >/dev/null 2>&1 || true
else
  log "jq, unzip, fonts-noto-cjk (ok)"
fi

# 3) Vercel CLI (토큰은 VERCEL_TOKEN 환경변수로만 쓴다)
if command -v vercel >/dev/null 2>&1; then
  log "Vercel CLI $(vercel --version 2>/dev/null | tail -1) (ok)"
else
  log "Vercel CLI 설치"
  npm i -g vercel
fi

# 4) Supabase CLI: 전역 설치 미지원 → npx 로 버전만 확인
log "Supabase CLI $(npx -y supabase --version 2>/dev/null | tail -1)"

# 5) Playwright Chromium + 시스템 라이브러리
if ls "$HOME/.cache/ms-playwright" 2>/dev/null | grep -q '^chromium'; then
  log "Playwright Chromium (ok)"
else
  log "Playwright Chromium 설치"
  npx -y playwright install --with-deps chromium
fi

log "완료"
