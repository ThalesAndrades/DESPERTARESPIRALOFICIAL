#!/usr/bin/env bash
# =====================================================================
# smoke-check.sh — valida que o deploy de produção está respondendo
# =====================================================================
# Faz GET nas URLs públicas chave e POST de teste autenticado nas
# Edge Functions. Imprime ✓/✗ por endpoint pra você ver de relance
# o que está saudável.
#
# Uso:
#   SITE_URL=https://despertarespiral.com \
#   SUPABASE_FUNCTIONS_URL=https://<ref>.functions.supabase.co \
#   DRIP_TICK_TOKEN=... \
#   bash scripts/smoke-check.sh
# =====================================================================
set -uo pipefail

VERDE="\033[0;32m"; VERM="\033[0;31m"; AMAR="\033[1;33m"; ZERO="\033[0m"
ok()    { echo -e "${VERDE}✓${ZERO} $1"; }
fail()  { echo -e "${VERM}✗${ZERO} $1"; ERROS=$((ERROS+1)); }
warn()  { echo -e "${AMAR}!${ZERO} $1"; }

SITE_URL="${SITE_URL:-https://despertarespiral.com}"
FN_URL="${SUPABASE_FUNCTIONS_URL:-}"
ERROS=0

echo "=== smoke-check — $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
echo "SITE_URL = $SITE_URL"
[[ -n "$FN_URL" ]] && echo "SUPABASE_FUNCTIONS_URL = $FN_URL"
echo ""

# --- Páginas públicas ---
check_url() {
  local url="$1"; local label="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if [[ "$code" =~ ^2 ]]; then ok  "$label ($code)"
  else                         fail "$label ($code) — $url"
  fi
}

echo "— Páginas públicas —"
check_url "$SITE_URL/"                   "/ (home)"
check_url "$SITE_URL/caption"            "/caption"
check_url "$SITE_URL/abrir"              "/abrir"
check_url "$SITE_URL/sobre"              "/sobre"
check_url "$SITE_URL/sitemap.xml"        "sitemap"
check_url "$SITE_URL/robots.txt"         "robots"
check_url "$SITE_URL/manifest.webmanifest" "manifest"
check_url "$SITE_URL/og-image.jpg"       "og default"
echo ""

echo "— OG cards dos arquétipos —"
for a in mistica guerreira mae_terra amante sabia selvagem; do
  check_url "$SITE_URL/og/$a.svg" "og/$a.svg"
done
echo ""

# --- Edge Functions (opcional, só se FN_URL setado) ---
if [[ -n "$FN_URL" ]]; then
  echo "— Edge Functions —"

  # meta-capi: GET sem token retorna 405 (Method not allowed) — válido sinal de vida
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FN_URL/meta-capi" 2>/dev/null || echo "000")
  if [[ "$code" == "405" ]]; then ok "meta-capi alive (405 em GET, esperado)"
  else                            warn "meta-capi código $code (esperado 405)"
  fi

  # resend-webhook: idem
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FN_URL/resend-webhook" 2>/dev/null || echo "000")
  if [[ "$code" == "405" ]]; then ok "resend-webhook alive (405 em GET, esperado)"
  else                            warn "resend-webhook código $code (esperado 405)"
  fi

  # drip-tick: requer auth — se DRIP_TICK_TOKEN setado, testa autenticado
  if [[ -n "${DRIP_TICK_TOKEN:-}" ]]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 \
      -X POST -H "Authorization: Bearer $DRIP_TICK_TOKEN" \
      "$FN_URL/drip-tick" 2>/dev/null || echo "000")
    if [[ "$code" == "200" ]]; then ok "drip-tick autenticado (200)"
    else                            fail "drip-tick código $code (esperado 200 com token correto)"
    fi
  else
    warn "DRIP_TICK_TOKEN não setado — pulando teste autenticado do drip-tick"
  fi

  # send-email: GET retorna 405 (idem)
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FN_URL/send-email" 2>/dev/null || echo "000")
  if [[ "$code" == "405" ]]; then ok "send-email alive (405 em GET, esperado)"
  else                            warn "send-email código $code"
  fi
else
  warn "SUPABASE_FUNCTIONS_URL não setado — pulando checagem das Edge Functions"
fi

echo ""
echo "=== Fim ==="
if [[ "$ERROS" -gt 0 ]]; then
  echo -e "${VERM}${ERROS} endpoint(s) com problema. Verifique os ✗ acima.${ZERO}"
  exit 1
fi
echo -e "${VERDE}Tudo verde.${ZERO}"
