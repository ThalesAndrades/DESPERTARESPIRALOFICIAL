#!/usr/bin/env bash
# =====================================================================
# setup-secrets.sh — seta todos os secrets das Edge Functions do Supabase
# =====================================================================
# Rode UMA vez depois de `npx supabase link` ter conectado o projeto.
# Pede cada valor de forma segura (read -s — sem echo no terminal).
# Pular um secret: pressione Enter sem digitar nada.
#
# Uso:
#   bash scripts/setup-secrets.sh
# =====================================================================
set -euo pipefail

VERDE="\033[0;32m"; AMAR="\033[1;33m"; AZUL="\033[0;34m"; ZERO="\033[0m"

ask_secret() {
  local name="$1"
  local description="$2"
  local example="${3:-}"

  echo ""
  echo -e "${AZUL}━━ ${name} ━━${ZERO}"
  echo -e "  ${description}"
  [[ -n "$example" ]] && echo -e "  ${AMAR}Exemplo: ${example}${ZERO}"
  read -r -s -p "  Valor (Enter pra pular): " value
  echo ""

  if [[ -z "$value" ]]; then
    echo -e "  ${AMAR}↪ pulado${ZERO}"
    return
  fi
  if npx supabase secrets set "${name}=${value}" >/dev/null 2>&1; then
    echo -e "  ${VERDE}✓ setado${ZERO}"
  else
    echo -e "  ${AMAR}✗ falhou — verifique 'npx supabase link'${ZERO}"
  fi
}

echo "==============================="
echo " Setup de secrets — Despertar Espiral"
echo "==============================="
echo ""
echo "Pré-requisito: já rodou 'npx supabase link --project-ref <ref>'."
echo ""

# Stripe
ask_secret "STRIPE_SECRET_KEY" \
  "Chave secreta do Stripe (Dashboard → Developers → API keys)." \
  "sk_live_... ou sk_test_..."

ask_secret "STRIPE_WEBHOOK_SECRET" \
  "Secret do webhook (Dashboard → Developers → Webhooks → endpoint /stripe-webhook)." \
  "whsec_..."

# Resend
ask_secret "RESEND_API_KEY" \
  "API key do Resend (Dashboard → API Keys)." \
  "re_..."

ask_secret "RESEND_WEBHOOK_SECRET" \
  "Signing secret do webhook do Resend (Dashboard → Webhooks → /resend-webhook)." \
  "whsec_..."

# Site
ask_secret "SITE_URL" \
  "URL pública do site." \
  "https://despertarespiral.com"

# Meta CAPI
ask_secret "META_CAPI_ACCESS_TOKEN" \
  "Token de acesso da Conversions API (Eventos Manager → Configurações → API de Conversões)." \
  "EAA..."

ask_secret "META_PIXEL_ID" \
  "ID do Pixel da Meta (já é 630846701068684 por default — pode pular)." \
  "630846701068684"

ask_secret "META_TEST_EVENT_CODE" \
  "(Opcional) Código de teste — usar SÓ em QA, NÃO em produção." \
  "TEST00000"

# Drip
ask_secret "DRIP_TICK_TOKEN" \
  "Segredo aleatório para o cron caller do drip-tick. Gere com 'openssl rand -hex 32'." \
  "(64 chars hex)"

echo ""
echo -e "${VERDE}✓ Tudo pronto. Confira com:${ZERO}"
echo "   npx supabase secrets list"
