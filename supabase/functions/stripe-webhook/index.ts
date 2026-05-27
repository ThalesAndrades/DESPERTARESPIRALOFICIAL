// Edge Function: recebe webhooks do Stripe e atualiza estado.
//
// Eventos tratados:
//   checkout.session.completed         → marca order paid + libera produto + email
//   customer.subscription.created      → cria/atualiza subscription
//   customer.subscription.updated      → atualiza subscription
//   customer.subscription.deleted      → marca cancelada
//   invoice.payment_failed             → marca past_due
//
// Env:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY (opcional — para email de boas-vindas)
//   SITE_URL
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { json, err } from "../_shared/cors.ts";
import { getAdminClient } from "../_shared/supabase-admin.ts";

const STRIPE_KEY     = Deno.env.get("STRIPE_SECRET_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SITE_URL       = Deno.env.get("SITE_URL") ?? "https://despertarespiral.com";

const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2024-09-30.acacia" });

async function sendWelcomeEmail(to: string, firstName: string, productTitle: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return; // email opcional
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Despertar Espiral <ola@despertarespiral.com>",
        to: [to],
        subject: `${firstName}, seu acesso a ${productTitle} foi liberado ✦`,
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;background:#fdfaf3;color:#04060f">
            <h1 style="font-weight:300;color:#8a6d3b">Bem-vinda, ${firstName} ✦</h1>
            <p style="font-size:16px;line-height:1.65">
              Sua jornada com <strong>${productTitle}</strong> começa agora. Você já tem acesso completo ao conteúdo.
            </p>
            <p style="margin:24px 0">
              <a href="${SITE_URL}/dashboard"
                 style="display:inline-block;padding:14px 32px;background:#c6a870;color:#04060f;text-decoration:none;border-radius:8px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-size:12px">
                Entrar no curso
              </a>
            </p>
            <p style="color:#8a8378;font-size:13px;line-height:1.6">
              Qualquer coisa, é só responder este email.<br>
              Que essa espiral seja luz para você.<br><br>
              <em>Sunyan — Despertar Espiral</em>
            </p>
          </div>
        `,
      }),
    });
  } catch (e) {
    console.warn("[email] falhou (não-bloqueante):", e);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const admin = getAdminClient();
  const productId = session.metadata?.product_id;
  if (!productId) return;

  // Atualiza order
  await admin.from("orders").update({
    status: "paid",
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
    stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
  }).eq("stripe_session_id", session.id);

  let userId = session.client_reference_id ?? session.metadata?.user_id ?? null;
  const customerEmail = session.customer_email ?? session.customer_details?.email ?? null;

  // Se compra de guest, tenta achar user por email
  if (!userId && customerEmail) {
    const { data: profile } = await admin
      .from("user_profiles")
      .select("id")
      .eq("email", customerEmail.toLowerCase())
      .maybeSingle();
    if (profile) userId = profile.id;
  }

  // Concede acesso ao produto (se houver usuária)
  if (userId) {
    await admin.from("user_products").upsert({
      user_id: userId,
      product_id: productId,
      granted_via: session.mode === "subscription" ? "subscription" : "purchase",
    }, { onConflict: "user_id,product_id" });
  }

  // Pega título do produto pra email
  const { data: product } = await admin
    .from("products")
    .select("title")
    .eq("id", productId)
    .maybeSingle();

  if (customerEmail && product) {
    const firstName = (session.customer_details?.name ?? customerEmail.split("@")[0]).split(" ")[0];
    await sendWelcomeEmail(customerEmail, firstName, product.title);
  }

  // Log de evento
  await admin.from("events").insert({
    user_id: userId,
    email: customerEmail,
    event: "checkout.completed",
    properties: { product_id: productId, amount: session.amount_total, mode: session.mode },
  });
}

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const admin = getAdminClient();
  const productId = sub.metadata?.product_id ?? null;

  // Tenta resolver user_id via customer
  let userId: string | null = null;
  if (typeof sub.customer === "string") {
    const { data: profile } = await admin
      .from("user_profiles")
      .select("id")
      .eq("stripe_customer_id", sub.customer)
      .maybeSingle();
    userId = profile?.id ?? null;
  }
  if (!userId) return; // sem usuária associada, ignora

  await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: sub.id,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : "",
    status: sub.status,
    product_id: productId,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return err("Method not allowed", 405);

  const signature = req.headers.get("stripe-signature");
  if (!signature) return err("missing stripe-signature", 400);

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
  } catch (e) {
    console.error("[webhook] assinatura inválida:", e);
    return err("invalid signature", 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const admin = getAdminClient();
        if (typeof inv.subscription === "string") {
          await admin.from("subscriptions").update({ status: "past_due" }).eq("stripe_subscription_id", inv.subscription);
        }
        break;
      }
      default:
        console.log(`[webhook] evento ignorado: ${event.type}`);
    }
    return json({ received: true });
  } catch (e) {
    console.error("[webhook] erro:", e);
    return err("internal", 500);
  }
});
