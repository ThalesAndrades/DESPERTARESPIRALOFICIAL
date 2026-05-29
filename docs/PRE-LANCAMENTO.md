# Checklist do Pré-lançamento

Guia operacional para abrir tráfego pago, manter o pré-lançamento saudável e
estar pronta no dia em que as portas do Mulher Espiral abrirem.

Tudo aqui foi construído em iterações pequenas — esse documento consolida o que
está vivo na plataforma hoje e o que ainda depende de configuração externa.

---

## 1. Variáveis de ambiente

Setadas em dois lugares distintos:

| Camada | Onde | Variáveis |
|---|---|---|
| **Front (Vite)** | `.env` local e variáveis do host (Vercel/Netlify) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`, `VITE_WHATSAPP_NUMBER`, `VITE_LAUNCH_DATE`, `VITE_LAUNCH_CHECKOUT_URL`, `VITE_GA4_MEASUREMENT_ID`, `VITE_GTM_ID`, `VITE_META_PIXEL_ID`, `VITE_META_CAPI_ENDPOINT`, `VITE_TIKTOK_PIXEL_ID`, `VITE_ANALYTICS_REQUIRE_CONSENT`, `VITE_SENTRY_DSN`, `VITE_SENTRY_RELEASE` |
| **Edge Functions (Supabase secrets)** | `npx supabase secrets set NOME=valor` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `SITE_URL`, `META_CAPI_ACCESS_TOKEN`, `META_PIXEL_ID`, `META_TEST_EVENT_CODE`, `DRIP_TICK_TOKEN` |

Detalhes de cada variável em `.env.example`. Auto-injetadas pelo Supabase
(não precisa setar): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 2. Migrations aplicadas

| Migration | O que faz | Quando aplicar |
|---|---|---|
| `0001_initial.sql` | Schema base + tabela `launch_waitlist` | Já no main |
| `0002_waitlist_message.sql` | Coluna `message` na waitlist | Já no main |
| `0003_waitlist_attribution.sql` | UTMs + click ids + referrer/UA na waitlist | Já no main |
| `0004_email_drip.sql` | Tabela `email_drip_jobs` + trigger que enfileira 5 emails | Já no main |
| `0005_email_engagement.sql` | Tabela `email_events` + view de engajamento | Já no main |
| `0006_seed_content.sql` | Seed das 8 espirais + 32 aulas | Já no main |

Aplicar:

```bash
npx supabase db push
```

---

## 3. Edge Functions deployadas

| Função | Propósito | Deploy |
|---|---|---|
| `send-email` | Email transacional via Resend (10 templates) | `npx supabase functions deploy send-email` |
| `stripe-checkout` | Cria sessão Stripe Checkout | `npx supabase functions deploy stripe-checkout` |
| `stripe-portal` | Customer portal Stripe | `npx supabase functions deploy stripe-portal` |
| `stripe-webhook` | Recebe webhook Stripe (paid/refunded) | `npx supabase functions deploy stripe-webhook --no-verify-jwt` |
| `meta-capi` | Conversions API server-side da Meta | `npx supabase functions deploy meta-capi` |
| `drip-tick` | Processa fila de drips pendentes (cron) | `npx supabase functions deploy drip-tick` |
| `resend-webhook` | Recebe open/click/bounce do Resend | `npx supabase functions deploy resend-webhook --no-verify-jwt` |

---

## 4. Agendamento do drip

O `drip-tick` precisa ser chamado a cada ~15 min. Três opções (escolher uma):

### A. pg_cron (in-database — recomendado)

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'drip-tick-every-15min',
  '*/15 * * * *',
  $$
    select net.http_post(
      url     := 'https://<seu-projeto>.functions.supabase.co/drip-tick',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.drip_token', true)
      ),
      body    := '{}'::jsonb
    );
  $$
);

alter database postgres set "app.drip_token" = 'O_MESMO_VALOR_DO_DRIP_TICK_TOKEN';
```

### B. GitHub Actions

```yaml
# .github/workflows/drip-tick.yml
on: { schedule: [{ cron: "*/15 * * * *" }] }
jobs:
  tick:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS -X POST \
            -H "Authorization: Bearer ${{ secrets.DRIP_TICK_TOKEN }}" \
            "https://<projeto>.functions.supabase.co/drip-tick"
```

### C. cron-job.org / EasyCron

URL + header `Authorization: Bearer <token>`, intervalo 15 min.

---

## 5. Webhooks externos

| Provedor | Onde configurar | URL | Eventos |
|---|---|---|---|
| **Meta Pixel** | Eventos Manager → Configurações → API de Conversões | `https://<projeto>.functions.supabase.co/meta-capi` | (server-side, sem registro de eventos no painel) |
| **Resend** | Dashboard → Webhooks → Add endpoint | `https://<projeto>.functions.supabase.co/resend-webhook` | `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained` |
| **Stripe** | Dashboard → Developers → Webhooks | `https://<projeto>.functions.supabase.co/stripe-webhook` | `checkout.session.completed`, `charge.refunded` |

Cada webhook **verifica assinatura** — o secret correspondente precisa estar setado nos Supabase secrets.

---

## 6. Acesso admin

- URL: qualquer página pública.
- Footer → botão **"?"** discreto à direita do copyright.
- Código: `190900`.
- Após digitar, navegação direta para `/admin` — sem email/senha.
- Logout fecha o gate (próxima visita precisa digitar de novo).
- Em dev (`npm run dev`), o gate fica sempre aberto — todo o admin acessível sem código.

---

## 7. Fluxo da lead

```
Ad (Meta/Google/TikTok) com UTM + click id
        │
        ▼
Landing / / /caption                         pixel + GA4 + TikTok + CAPI (server-side, dedup)
        │
        ▼
WaitlistModal (ou form do /caption)          attribution persistido no banco
        │
        ▼
Insert em launch_waitlist                    trigger enfileira 5 jobs de drip
        │
        ├── Email "waitlist-welcome" instantâneo (Resend)
        ├── (caption) Email "caption-result" com arquétipo (Resend)
        ▼
Redirect /recebido?archetype=…&name=…        view_thank_you no analytics
        │
        ├── Opcional: clica em "Compartilhar meu resultado" → /share/{archetype}
        │
        ▼
Drip-tick a cada 15min envia drip-1..drip-5 (em D+1, D+3, D+6, D+10, D+14)
        │
        ▼
Resend webhook persiste open/click/bounce    /admin/conversao agrega
```

---

## 8. Painéis do admin

| URL | O quê |
|---|---|
| `/admin` | Dashboard com countdown da abertura + cards de waitlist/membros/pedidos |
| `/admin/waitlist` | Tabela de inscritas com busca, filtro por origem, **export CSV** |
| `/admin/conversao` | Análise: timeline 30 dias, breakdown por UTM/campanha/arquétipo, **open rate / click rate** dos drips |
| `/admin/orders` | Pedidos Stripe |
| `/admin/users` | Usuárias cadastradas |
| `/admin/products`, `/admin/community`, etc. | Pós-lançamento |

---

## 9. Checklist do dia da abertura

- [ ] `VITE_LAUNCH_DATE` setado pra hora exata da abertura (e `VITE_LAUNCH_CHECKOUT_URL` apontando pra `/checkout/mulher-espiral`).
- [ ] Drip-5 (D+14) tem botão "Ver contagem regressiva" — confere se as inscritas mais antigas já receberam.
- [ ] Cron do drip-tick rodando sem falhas há ≥ 24h (consultar `email_drip_jobs` no banco).
- [ ] Resend webhook chegando (consultar `email_events` ou `/admin/conversao`).
- [ ] Stripe checkout testado em modo live com cartão real (pequena cobrança que estorna).
- [ ] Página `/abrir` mostra contagem correta e botão "Adicionar ao calendário" gera `.ics` que abre no Google Calendar.
- [ ] Pixel da Meta com badge "Deduplicado" no Eventos Manager (Browser + Server).

---

## 10. Sequência de deploy de produção

Faça **uma vez** quando for ativar tudo:

```bash
# 1. Conecte o CLI ao projeto Supabase
npx supabase link --project-ref <PROJECT_REF>

# 2. Aplique todas as migrations
npx supabase db push

# 3. Sete todos os secrets das Edge Functions (interativo, oculto)
bash scripts/setup-secrets.sh         # Mac/Linux
# ou no Windows:
.\scripts\setup-secrets.ps1

# 4. Deploy de todas as Edge Functions
npx supabase functions deploy send-email
npx supabase functions deploy stripe-checkout
npx supabase functions deploy stripe-portal
npx supabase functions deploy stripe-webhook  --no-verify-jwt
npx supabase functions deploy meta-capi
npx supabase functions deploy drip-tick
npx supabase functions deploy resend-webhook  --no-verify-jwt

# 5. Agende o cron do drip
# Abra scripts/schedule-drip-cron.sql, substitua <PROJECT_REF> e <DRIP_TICK_TOKEN>,
# e cole no SQL Editor do Supabase (Dashboard → SQL).

# 6. Configure os 3 webhooks externos:
#    - Stripe Dashboard → Webhooks: https://<ref>.functions.supabase.co/stripe-webhook
#    - Resend Dashboard → Webhooks: https://<ref>.functions.supabase.co/resend-webhook
#    - Meta Eventos Manager → API de Conversões: https://<ref>.functions.supabase.co/meta-capi

# 7. Configure as envs do front no Vercel/Netlify/Hostinger (ver seção 1).

# 8. Mergeie main → branch production é publicada automaticamente pelo workflow Deploy.
```

## 11. Smoke check pós-deploy

Roda em 30 segundos e diz se tudo está respondendo:

```bash
SITE_URL=https://despertarespiral.com \
SUPABASE_FUNCTIONS_URL=https://<PROJECT_REF>.functions.supabase.co \
DRIP_TICK_TOKEN=<seu-token> \
bash scripts/smoke-check.sh
```

Saída esperada: ✓ verde em todas as páginas públicas, OG cards e Edge Functions. Qualquer ✗ vermelho indica o endpoint específico que precisa de atenção.

## 12. Comandos do dia-a-dia

```bash
# Ver secrets configurados (sem mostrar valores)
npx supabase secrets list

# Rodar E2E local
npx playwright install chromium
npm run e2e

# Rodar unit tests
npm test

# Build local
npm run build && npm run preview

# Push deploy (após qualquer merge em main, Hostinger puxa branch production)
git push origin main

# Logs de uma Edge Function em tempo real
npx supabase functions logs drip-tick --follow
```

---

## 13. Em caso de incidente

| Sintoma | Onde olhar primeiro |
|---|---|
| Lead nova não chega no admin | Console do navegador no submit; RLS de `launch_waitlist` |
| Email de boas-vindas não chega | Resend dashboard (logs) + secret `RESEND_API_KEY` |
| Drip não dispara | `email_drip_jobs` rows pendentes, `last cron run`, log do `drip-tick` |
| Pixel não está deduplificando | Eventos Manager → Test Events com `META_TEST_EVENT_CODE` |
| Site lento | Sentry Performance + `npx playwright test` (regressão visual) |
| Erro 500 | Sentry + Vercel/Netlify logs |
| Stripe fail | Stripe dashboard → logs do webhook |
