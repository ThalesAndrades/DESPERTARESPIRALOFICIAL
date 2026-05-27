# Setup do Stripe

## 1. Criar conta

[stripe.com](https://stripe.com) → Sign up. Ative modo **Test** primeiro
(verá um toggle no canto do dashboard). Vai para `Live` só quando o fluxo
estiver completo.

## 2. Pegar as keys

`Developers → API keys`:
- **Publishable key** (`pk_test_...` / `pk_live_...`) — não usada no nosso fluxo (Checkout hospedado)
- **Secret key** (`sk_test_...` / `sk_live_...`) → vai pro Supabase como `STRIPE_SECRET_KEY`

## 3. Criar produtos e prices

Para cada produto na tabela `products` do Supabase:

`Products → Add product`:
- Name: `Mulher Espiral` (igual ao `title` na DB)
- Pricing: **One-time** R$ 497,00 (BRL) — ou Recurring se for assinatura
- Save

Copie o **Price ID** (`price_...`) que aparece em cada produto criado.

Atualize na tabela `products`:
```sql
update public.products
set stripe_price_id = 'price_xxx'
where slug = 'mulher-espiral';
```

> **Para assinaturas mensais**: crie o price como `Recurring → Monthly` e
> marque `is_subscription = true` na tabela `products`.

## 4. Configurar webhook

`Developers → Webhooks → + Add endpoint`:

- **Endpoint URL**: `https://dwblhkpodaabuuubloht.supabase.co/functions/v1/stripe-webhook`
- **Events to send**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- Adicione `→ Reveal signing secret` (começa com `whsec_...`)
- Cole no Supabase:
  ```sh
  supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
  ```

## 5. Configurar Customer Portal

`Settings → Billing → Customer portal`:

- **Business information**: nome, logo, support email
- **Features** (ative o que fizer sentido):
  - ✅ Customers can update payment methods
  - ✅ Customers can update billing address
  - ✅ Customers can view invoice history
  - ✅ Customers can cancel subscriptions (com `Cancel at end of period`)
- Salve

A página `/conta` do app já abre esse portal automaticamente.

## 6. (Opcional) Habilitar PIX

`Settings → Payment methods`:
- Active **Pix** (pode precisar de ativação manual — fale com o suporte do Stripe BR)
- Depois descomente a linha em `supabase/functions/stripe-checkout/index.ts`:
  ```ts
  payment_method_types: ["card", "boleto", "customer_balance"],
  ```
  > Pix no Stripe usa `customer_balance` com transação Pix configurada.

## 7. Configurar Tax (opcional)

Se for emitir nota:
`Tax → Settings` → configurar para Brasil + integrar com sua nota fiscal.

## 8. Habilitar promotion codes

`Products → Coupons → Create coupon`:
- 10% off, expira em 7 dias, primeira compra
- Marque `Promotion code` para ter um código humano legível (`PRIMEIRO`)

O Checkout já está configurado com `allow_promotion_codes: true`.

## 9. Verificar fluxo end-to-end

Em modo **Test**:

1. Acesse `https://despertarespiral.com/checkout/mulher-espiral`
2. Clique em "Garantir minha vaga"
3. Use cartão de teste: `4242 4242 4242 4242`, CVC qualquer, data futura
4. Stripe processa → redireciona pra `/obrigado?session_id=cs_test_...`
5. Espere ~5s — o webhook deve atualizar o status pra `paid`
6. Em `Stripe → Webhooks → seu endpoint`, veja `200 OK` em event log
7. No Supabase, na tabela `orders`, o registro deve estar `paid`
8. Na tabela `user_products`, o acesso deve estar liberado

## Quando for pra produção

- Toggle do dashboard pra **Live**
- Refaça os produtos e prices em Live (não migram do Test)
- Atualize `stripe_price_id` nos produtos do Supabase
- Atualize `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` no Supabase com as chaves live
- Crie um novo webhook endpoint apontando pro mesmo `/functions/v1/stripe-webhook` (em Live)
- Faça uma compra real teste (~R$1) e estorne pra confirmar fluxo
