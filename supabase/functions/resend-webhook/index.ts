/**
 * resend-webhook — recebe eventos de email do Resend (via Svix) e
 * persiste em `public.email_events`. Permite medir open/click/bounce
 * por slug do drip no admin.
 *
 * Resend usa o formato Svix de assinatura HMAC-SHA256:
 *   payload assinado = `${svix-id}.${svix-timestamp}.${rawBody}`
 *   header  svix-signature = "v1,<base64-encoded-sig> v1,<outra>"
 *
 * Secrets:
 *   RESEND_WEBHOOK_SECRET  → "whsec_..." (copiado do Resend dashboard)
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (auto-injetados)
 */
import { corsHeaders, err, json, preflight } from "../_shared/cors.ts";

interface ResendEvent {
  type: string;                  // ex: "email.opened"
  created_at: string;
  data: {
    email_id?: string;
    to?: string[];
    subject?: string;
    click?: { link?: string };
    [k: string]: unknown;
  };
}

async function verifySvix(
  raw: string, svixId: string, svixTimestamp: string,
  svixSignatureHeader: string, secret: string,
): Promise<boolean> {
  if (!svixId || !svixTimestamp || !svixSignatureHeader) return false;
  // Secret no formato whsec_<base64>
  const base64 = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const keyBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw", keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"],
  );
  const signedPayload = `${svixId}.${svixTimestamp}.${raw}`;
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));

  // Header pode ter múltiplas assinaturas separadas por espaço
  for (const candidate of svixSignatureHeader.split(" ")) {
    const [version, signature] = candidate.split(",");
    if (version === "v1" && signature === expected) return true;
  }
  return false;
}

async function persistEvent(
  supabaseUrl: string, serviceKey: string, evt: ResendEvent,
): Promise<void> {
  const row = {
    resend_email_id: evt.data.email_id ?? null,
    event_type: evt.type,
    recipient: evt.data.to?.[0] ?? null,
    subject: evt.data.subject ?? null,
    click_url: evt.data.click?.link ?? null,
    metadata: evt.data ?? {},
    occurred_at: evt.created_at ?? new Date().toISOString(),
  };
  const r = await fetch(`${supabaseUrl}/rest/v1/email_events`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!r.ok) {
    console.error("[resend-webhook] insert failed", r.status, await r.text());
  }
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return err("Method not allowed", 405);

  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  if (!secret) return err("RESEND_WEBHOOK_SECRET ausente", 500);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return err("Supabase env ausente", 500);

  const raw = await req.text();
  const svixId = req.headers.get("svix-id") ?? "";
  const svixTs = req.headers.get("svix-timestamp") ?? "";
  const svixSig = req.headers.get("svix-signature") ?? "";

  const ok = await verifySvix(raw, svixId, svixTs, svixSig, secret);
  if (!ok) return err("Assinatura inválida", 401);

  let evt: ResendEvent;
  try {
    evt = JSON.parse(raw) as ResendEvent;
  } catch {
    return err("Body inválido", 400);
  }

  await persistEvent(supabaseUrl, serviceKey, evt);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
