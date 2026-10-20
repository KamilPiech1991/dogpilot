#!/usr/bin/env bash
# Buduje stronę (web/) i panel (app/) do web/dist – ten sam skrypt dla Cloudflare Pages i GitHub Pages.
#   BASE_PATH   – prefiks ścieżki ('' dla domeny własnej, '/dogpilot' na podglądzie github.io)
#   PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY – klucze Supabase (panel dostaje je jako VITE_*)
set -euo pipefail
cd "$(dirname "$0")/.."
BASE_PATH="${BASE_PATH:-}"
BASE_PATH="${BASE_PATH%/}"
export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-${PUBLIC_SUPABASE_URL:-}}"
export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-${PUBLIC_SUPABASE_ANON_KEY:-}}"
echo "== Dogpilot build: base='${BASE_PATH:-/}' supabase=$([ -n "$VITE_SUPABASE_URL" ] && echo tak || echo nie)"

echo "== strona (web)"
( cd web && npm ci --no-audit --no-fund && npm run build && BASE_PATH="$BASE_PATH" node scripts/prefix-base.mjs )

echo "== panel (app) pod ${BASE_PATH}/app/"
( cd app && npm ci --no-audit --no-fund && APP_BASE="${BASE_PATH}/app/" npm run build )
mkdir -p web/dist/app && cp -r app/dist/. web/dist/app/

# pliki Cloudflare Pages (na GitHub Pages ignorowane); na podglądzie z prefiksem nie mają sensu
if [ -n "$BASE_PATH" ]; then rm -f web/dist/_redirects web/dist/_headers; fi
echo "== gotowe: web/dist ($(find web/dist -type f | wc -l) plików)"
