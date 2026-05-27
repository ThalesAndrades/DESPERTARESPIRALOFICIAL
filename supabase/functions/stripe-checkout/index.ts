// Edge Function: cria uma Stripe Checkout Session para um produto.
//
// Body esperado:
//   { product_slug: string, mode?: "payment" | "subscription" }
//
// Headers:
//   Authorization: Bearer <jwt>  (opcional — guest checkout permitido)
//
// Retorna:
//   { url: string }  → redirecione o browser pra essa URL
//
// Env:
//   STRIPE_SECRET_KEY        — sk_live_... ou sk_test_...
//   SITE_URL                 — https://despertarespiral.com
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { preflight, json, err, corsHeaders } from "../_shared/cors.ts";
import { getAdminClient, getUserClient } from "../_shared/supabase-admin.ts";

Deno.serve(async (req) => {
  const p = preflight(req); if (p) return p;
  if (req.method !== "POST") return err("Method not allowed", 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const siteUrl   = Deno.env.get("SITE_URL") ?? "https://despertarespiral.com";
    if (!stripeKey) return err("STRIPE_SECRET_KEY não configurada", 500);

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-09-30.acacia" });
    const body = await req.json().catch(() => ({}));
    const { product_slug, mode = "payment" } = body as { product_slug?: string; mode?: "payment" | "subscription" };

    if (!product_slug) return err("product_slug é obrigatório", 400);

    // Busca o produto via service_role (catálogo público de qualquer forma)
    const admin = getAdminClient();
    const { data: product, error: prodErr } = await admin
      .from("products")
      .select("id, slug, title, price, is_active, stripe_price_id, is_subscription")
      .eq("slug", product_slug)
      .eq("is_active", true)
      .maybeSingle();

    if (prodErr || !product) return err("Produto não encontrado", 404);

    // Identifica usuária logada (se houver)
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const userClient = getUserClient(authHeader);
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email ?? null;
      }
    }

    // Garante customer no Stripe associado à usuária (se logada)
    let customerId: string | undefined;
    if (userId && userEmail) {
      const { data: profile } = await admin
        .from("user_profiles")
        .select("stripe_customer_id, full_name")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          name: profile?.full_name ?? undefined,
          metadata: { supabase_user_id: userId },
        });
        customerId = customer.id;
        await admin.from("user_profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
      }
    }

    // Modo subscription requer stripe_price_id no produto
    const effectiveMode = mode === "subscription" || product.is_subscription ? "subscription" : "payment";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: effectiveMode,
      success_url: `${siteUrl}/obrigado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/checkout/${product.slug}?canceled=1`,
      customer: customerId,
      customer_email: customerId ? undefined : (userEmail ?? undefined),
      client_reference_id: userId ?? undefined,
      allow_promotion_codes: true,
      payment_method_types: ["card"],
      // Pix está em beta em algumas contas Stripe BR; descomente se sua conta suportar
      // payment_method_types: ["card", "boleto", "customer_balance"],
      metadata: {
        product_id: product.id,
        product_slug: product.slug,
        user_id: userId ?? "",
      },
      ...(effectiveMode === "payment"
        ? {
            line_items: product.stripe_price_id
              ? [{ price: product.stripe_price_id, quantity: 1 }]
              : [{
                  price_data: {
                    currency: "brl",
                    unit_amount: Math.round(Number(product.price) * 100),
                    product_data: {
                      name: product.title,
                      metadata: { product_id: product.id },
                    },
                  },
                  quantity: 1,
                }],
          }
        : {
            line_items: product.stripe_price_id
              ? [{ price: product.stripe_price_id, quantity: 1 }]
              : (() => { throw new Error("Subscription requer stripe_price_id no produto"); })(),
          }),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Pre-registra um pedido como pending; o webhook marca como paid
    await admin.from("orders").insert({
      user_id: userId,
      email: userEmail ?? session.customer_email ?? "guest@unknown",
      product_id: product.id,
      amount: product.price,
      status: "pending",
      stripe_session_id: session.id,
      metadata: { mode: effectiveMode },
    });

    return json({ url: session.url }, 200);
  } catch (e) {
    console.error("[stripe-checkout]", e);
    const msg = e instanceof Error ? e.message : "erro";
    return err(msg, 500);
  }
});
