// Edge Function: cria uma Billing Portal Session do Stripe para a usuária
// gerenciar assinatura (trocar cartão, cancelar, ver invoices).
//
// Headers: Authorization: Bearer <jwt> (obrigatório)
// Retorna: { url: string }
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { preflight, json, err } from "../_shared/cors.ts";
import { getAdminClient, getUserClient } from "../_shared/supabase-admin.ts";

Deno.serve(async (req) => {
  const p = preflight(req); if (p) return p;
  if (req.method !== "POST") return err("Method not allowed", 405);

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const siteUrl   = Deno.env.get("SITE_URL") ?? "https://despertarespiral.com";
    if (!stripeKey) return err("STRIPE_SECRET_KEY não configurada", 500);

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return err("Login necessário", 401);

    const userClient = getUserClient(authHeader);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return err("Login necessário", 401);

    const admin = getAdminClient();
    const { data: profile } = await admin
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return err("Você ainda não tem nenhuma cobrança ativa", 404);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-09-30.acacia" });
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/conta`,
    });

    return json({ url: portal.url });
  } catch (e) {
    console.error("[stripe-portal]", e);
    return err(e instanceof Error ? e.message : "erro", 500);
  }
});
