# Setup do Resend (email transacional)

## 1. Criar conta + API key

1. [resend.com](https://resend.com) → Sign up (use email do domínio)
2. `API Keys → Create API Key` → permissões `Sending access`
3. Copie a key (`re_...`) — só aparece uma vez

## 2. Verificar o domínio

Sem isso, emails vão pro spam.

`Domains → + Add domain`:
- Domain: `despertarespiral.com`
- Region: `São Paulo`

Resend mostra registros DNS pra adicionar:

```
TXT  send.despertarespiral.com   "v=spf1 include:amazonses.com ~all"
CNAME  resend._domainkey.despertarespiral.com  → resend._domainkey.....
TXT  _dmarc.despertarespiral.com  "v=DMARC1; p=none; ..."
```

Adicione esses no painel DNS do registrador do domínio (ou no Hostinger se o DNS estiver lá).

Espere ~10 min e clique em **Verify**. Status deve ficar `Verified`.

## 3. Configurar o "from" address

O `send-email` edge function usa `ola@despertarespiral.com`. Você pode usar
qualquer prefix do domínio verificado (`contato@`, `noreply@`, etc).

Quer mudar? Edite `supabase/functions/_shared/templates.ts` e
`supabase/functions/stripe-webhook/index.ts` (ambos têm `from:` hardcoded).

## 4. Adicionar ao Supabase

```sh
supabase secrets set RESEND_API_KEY="re_..."
```

## 5. Testar o envio

No SQL Editor do Supabase:

```sql
select net.http_post(
  url := 'https://SEU-PROJETO.supabase.co/functions/v1/send-email',
  headers := '{"Content-Type":"application/json","Authorization":"Bearer SUA_ANON_KEY"}'::jsonb,
  body := '{"to":"voce@email.com","slug":"welcome","variables":{"firstName":"Sunyan"}}'::jsonb
);
```

(Funciona só se `pg_net` estiver ativada — em `Database → Extensions`.)

Alternativa: chamar pelo terminal:

```sh
curl -X POST https://SEU-PROJETO.supabase.co/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUA_ANON_KEY" \
  -d '{"to":"voce@email.com","slug":"welcome","variables":{"firstName":"Sunyan"}}'
```

Deve chegar um email bonitinho na sua caixa em ~10s.

## 6. Configurar reply-to / suporte

Configure no painel Resend → `Settings → Reply-to` para `contato@despertarespiral.com`,
assim respostas dos emails caem onde você lê.

## 7. Monitoring

`Emails → Logs` mostra todos os enviados, taxa de entrega, bounces. Útil
pra debugar quando alguém disser "não recebi".

## Templates disponíveis

Edite em `supabase/functions/_shared/templates.ts`:

| Slug | Quando dispara | Variáveis |
|---|---|---|
| `welcome` | Após signup | `firstName` |
| `acesso-liberado` | Webhook `checkout.session.completed` | `firstName`, `productTitle` |
| `checkout-abandonado` | Cron (a implementar) | `firstName`, `productTitle`, `productSlug` |
| `quiz-aprovado` | Quiz finalizado | `firstName`, `moduleTitle`, `productTitle`, `score` |
| `curso-concluido` | 100% das aulas | `firstName`, `productTitle`, `productSlug` |
| `reset-senha` | Reset de senha | `resetUrl` |

Pra adicionar template novo, edite o arquivo de templates e adicione mais
um case no `TemplateSlug` union e no `TEMPLATES` map.
