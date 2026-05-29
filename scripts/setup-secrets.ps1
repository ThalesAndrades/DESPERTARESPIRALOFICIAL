# =====================================================================
# setup-secrets.ps1 — seta todos os secrets das Edge Functions
# =====================================================================
# Rode UMA vez depois de `npx supabase link`.
# Pede cada valor de forma segura (não fica no histórico do shell).
#
# Uso:
#   .\scripts\setup-secrets.ps1
#
# Se algum secret já estiver setado e você quiser pular, deixe vazio
# quando ele pedir (Enter direto).
# =====================================================================

$ErrorActionPreference = "Stop"

function Set-SupabaseSecret {
    param(
        [string]$Name,
        [string]$Description,
        [string]$Example = ""
    )

    Write-Host ""
    Write-Host "==> $Name" -ForegroundColor Cyan
    Write-Host "    $Description" -ForegroundColor Gray
    if ($Example) {
        Write-Host "    Exemplo: $Example" -ForegroundColor DarkGray
    }

    $secure = Read-Host "    Valor (Enter pra pular)" -AsSecureString
    $value = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    )

    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Host "    [pulado]" -ForegroundColor Yellow
        return
    }

    npx supabase secrets set "$Name=$value"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    [OK]" -ForegroundColor Green
    } else {
        Write-Host "    [FALHOU]" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Setup de secrets do Despertar Espiral" -ForegroundColor Magenta
Write-Host "======================================" -ForegroundColor Magenta
Write-Host "Project: dwblhkpodaabuuubloht"
Write-Host ""
Write-Host "Pre-requisito: voce ja rodou 'npx supabase link --project-ref dwblhkpodaabuuubloht'."
Write-Host ""

Set-SupabaseSecret -Name "STRIPE_SECRET_KEY" `
    -Description "Chave secreta da API do Stripe (Dashboard -> Developers -> API keys)" `
    -Example "sk_live_... ou sk_test_..."

Set-SupabaseSecret -Name "STRIPE_WEBHOOK_SECRET" `
    -Description "Signing secret do endpoint do webhook (Dashboard -> Developers -> Webhooks -> seu endpoint)" `
    -Example "whsec_..."

Set-SupabaseSecret -Name "RESEND_API_KEY" `
    -Description "API key do Resend (resend.com -> API Keys)" `
    -Example "re_..."

Set-SupabaseSecret -Name "RESEND_WEBHOOK_SECRET" `
    -Description "Signing secret do webhook do Resend (Dashboard -> Webhooks -> /resend-webhook)" `
    -Example "whsec_..."

Set-SupabaseSecret -Name "SITE_URL" `
    -Description "URL publica do site (usada em redirects e links de email)" `
    -Example "https://despertarespiral.com"

Set-SupabaseSecret -Name "META_CAPI_ACCESS_TOKEN" `
    -Description "Token de acesso da API de Conversoes da Meta (Eventos Manager -> Configuracoes -> API de Conversoes)" `
    -Example "EAA..."

Set-SupabaseSecret -Name "META_PIXEL_ID" `
    -Description "ID do Pixel da Meta (default 630846701068684, pode pular)" `
    -Example "630846701068684"

Set-SupabaseSecret -Name "META_TEST_EVENT_CODE" `
    -Description "(Opcional) Codigo de teste do Pixel, usar SOMENTE em QA, NAO em producao" `
    -Example "TEST00000"

Set-SupabaseSecret -Name "DRIP_TICK_TOKEN" `
    -Description "Segredo aleatorio para o cron caller do drip-tick. Gere com 'openssl rand -hex 32'" `
    -Example "(64 chars hex)"

Write-Host ""
Write-Host "Secrets atualmente setados:" -ForegroundColor Cyan
npx supabase secrets list

Write-Host ""
Write-Host "Pronto. Proximo passo:" -ForegroundColor Green
Write-Host "  npx supabase functions deploy"
Write-Host ""
