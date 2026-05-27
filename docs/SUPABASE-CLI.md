# Supabase CLI — Workflow Local

Este projeto já tem `supabase/config.toml` configurado pro projeto
`dwblhkpodaabuuubloht`. Falta só você instalar a CLI e fazer o link
no seu terminal local.

## 1. Instalar a CLI

```sh
# macOS (Homebrew)
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux (npm — funciona em qualquer plataforma)
npm i -g supabase
```

Verifica:
```sh
supabase --version
```

## 2. Login (uma vez por máquina)

```sh
supabase login
```

Abre o browser, autentica na sua conta Supabase, gera um token e salva
em `~/.supabase/access-token`. Esse token NUNCA vai pro Git.

## 3. Linkar o projeto

Dentro do repositório:

```sh
cd /caminho/pro/DESPERTARESPIRALOFICIAL
supabase link --project-ref dwblhkpodaabuuubloht
```

Vai pedir a **database password** (a do user `postgres`). Você acha
em: Supabase Dashboard → Project Settings → Database → Database password.

Se esqueceu, dá pra resetar lá mesmo (vai invalidar conexões diretas
existentes).

O resultado do `link` fica em `.supabase/` (já está no `.gitignore`).

## 4. Comandos do dia a dia

### Migrations

```sh
# Criar nova migration (file com timestamp em supabase/migrations/)
supabase migration new add_user_preferences

# Ver status (quais migrations já rodaram no remoto)
supabase migration list

# Aplicar todas as migrations pendentes no projeto remoto
supabase db push

# Puxar mudanças feitas pelo Dashboard de volta pra arquivo local
supabase db pull
```

### Edge Functions

As Edge Functions já estão em `supabase/functions/`:
- `send-email/` — envia email via Resend
- `stripe-checkout/` — cria sessão de checkout do Stripe
- `stripe-portal/` — abre portal do cliente
- `stripe-webhook/` — recebe eventos do Stripe
- `_shared/` — código compartilhado entre funções

```sh
# Deploy de UMA função
supabase functions deploy send-email

# Deploy de TODAS
supabase functions deploy

# Testar localmente antes de deploy
supabase functions serve send-email --env-file .env.local
```

### Secrets das Edge Functions

Variáveis de ambiente das funções (Stripe key, Resend key, etc) vivem
no Supabase, NÃO no `.env` do front:

```sh
# Setar
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set RESEND_API_KEY=re_xxx

# Listar (mostra os nomes, não os valores)
supabase secrets list

# Remover
supabase secrets unset STRIPE_SECRET_KEY
```

### Stack local completa (opcional, requer Docker)

```sh
# Sobe Postgres + Studio + Auth + Storage + Functions LOCAL
supabase start

# Studio local: http://127.0.0.1:54323
# Postgres local: postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Aplica todas as migrations no DB local
supabase db reset

# Para tudo
supabase stop
```

## 5. Connection strings

Para ferramentas que precisam conectar direto no Postgres:

| Tipo | String | Quando usar |
|---|---|---|
| Direct | `postgresql://postgres:[PASSWORD]@db.dwblhkpodaabuuubloht.supabase.co:5432/postgres` | CLI local, migrations longas (IPv6) |
| Transaction pooler | `postgresql://postgres.dwblhkpodaabuuubloht:[PASSWORD]@aws-0-<região>.pooler.supabase.com:6543/postgres` | Edge functions, serverless |
| Session pooler | `postgresql://postgres.dwblhkpodaabuuubloht:[PASSWORD]@aws-0-<região>.pooler.supabase.com:5432/postgres` | Apps com conexão persistente via IPv4 |

A região exata você confere em:
Project Settings → Database → Connection string

**Nunca commite a string com a senha.** Use `.env` (gitignored).

## 6. Troubleshooting

**`link` falha com "Cannot connect to database"**
→ Senha errada ou IPv6 bloqueado na sua rede. Tenta de uma rede 4G.

**`db push` falha com "migration X already applied"**
→ Rode `supabase migration list` e veja qual está fora de sync.
   Pra forçar marcar uma migration como aplicada sem rodar:
   `supabase migration repair --status applied <version>`

**Edge function dá 401**
→ Função precisa do header `Authorization: Bearer <SUPABASE_ANON_KEY>`
   ou tem `verify_jwt = false` no config.
