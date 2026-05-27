# Setup do Supabase

Configura o backend real (banco + auth + storage + edge functions).

## 1. Criar projeto

1. Acesse [supabase.com](https://supabase.com) → Sign up / Log in
2. **New project**:
   - Name: `despertar-espiral`
   - Database password: gere uma forte e guarde
   - Region: `South America (São Paulo)` — menor latência
   - Plan: Free (pra começar; upgrade depois)
3. Aguarde ~2 min provisionar

## 2. Rodar o schema

1. No projeto → `SQL Editor` → `+ New query`
2. Cole o conteúdo de [`supabase/migrations/0001_initial.sql`](../supabase/migrations/0001_initial.sql)
3. Execute (`Cmd/Ctrl + Enter`). Deve criar todas as tabelas + RLS.

Verifique em `Table Editor` que existem:
`user_profiles`, `products`, `modules`, `lessons`, `user_products`,
`lesson_progress`, `orders`, `subscriptions`, `community_posts`, `community_comments`,
`community_likes`, `events`, `launch_waitlist`.

## 3. Configurar Auth

`Authentication → Providers`:

- **Email**: já vem ativo. Em `Email Templates`, traduza os emails do Supabase pra português se quiser.
- **Google OAuth** (opcional, recomendado):
  1. [Google Cloud Console](https://console.cloud.google.com) → criar OAuth 2.0 Client
  2. Authorized redirect: `https://dwblhkpodaabuuubloht.supabase.co/auth/v1/callback`
  3. Cole Client ID + Secret no Supabase em Google provider
  4. Salvar

`Authentication → URL Configuration`:
- Site URL: `https://despertarespiral.com`
- Redirect URLs (uma por linha):
  ```
  https://despertarespiral.com
  https://despertarespiral.com/dashboard
  https://despertarespiral.com/reset-password
  http://localhost:8080
  ```

## 4. Storage

`Storage → Create bucket`:

- **`video-content`** — Public: ❌ (acesso via signed URL)
- **`course-thumbs`** — Public: ✅ (thumbnails)
- **`certificates`** — Public: ❌

Policies (cole no `SQL Editor`):

```sql
-- Qualquer logado pode ler thumbs (já public, mas reforça)
create policy "auth_read_thumbs" on storage.objects for select
  using (bucket_id = 'course-thumbs');

-- Vídeos: só quem tem user_products do produto correspondente
create policy "user_read_videos" on storage.objects for select
  using (
    bucket_id = 'video-content'
    and exists (
      select 1 from public.user_products up
      where up.user_id = auth.uid()
        and up.product_id::text = (storage.foldername(name))[1]
    )
  );

-- Admin pode tudo
create policy "admin_storage_all" on storage.objects for all
  using (
    exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin')
  );
```

Organize uploads de vídeo como `video-content/{product_id}/{lesson_id}.mp4`.

## 5. Edge Functions

Instale o Supabase CLI:
```sh
npm install -g supabase
supabase login
```

Linke o projeto:
```sh
cd projeto/
supabase link --project-ref dwblhkpodaabuuubloht  # vê em Settings → General
```

Configure secrets das functions:
```sh
supabase secrets set \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  RESEND_API_KEY="re_..." \
  SITE_URL="https://despertarespiral.com"
```

> `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são
> injetados automaticamente pelo Supabase nas suas Edge Functions.

Deploy das funções:
```sh
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy stripe-portal
supabase functions deploy send-email --no-verify-jwt
```

`--no-verify-jwt` em `stripe-webhook` e `send-email` porque a verificação
acontece via signature do Stripe e via secret do Resend.

## 6. Configurar o app

No GitHub do projeto → `Settings → Secrets and variables → Actions`:

| Secret | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://dwblhkpodaabuuubloht.supabase.co` (em Project Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | a `anon public` key (mesma página) |

Atualize `.github/workflows/deploy.yml` (já está pronto pra ler essas vars).

## 7. Criar primeira usuária admin

Após cadastrar uma conta normal em `https://despertarespiral.com/register`:

```sql
update public.user_profiles
set role = 'admin'
where email = 'seu-email@exemplo.com';
```

## 8. Adicionar produtos ao Stripe

Veja [`STRIPE-SETUP.md`](STRIPE-SETUP.md).

## Como verificar

- `supabase secrets list` mostra as chaves configuradas
- `supabase functions list` mostra as funções deployadas
- Cadastrar nova conta no site → ver entrada em `auth.users` E em `user_profiles`
  (o trigger `handle_new_user` cria a profile automaticamente)
- Comprar produto → ver `orders` populando + `user_products` recebendo o acesso
