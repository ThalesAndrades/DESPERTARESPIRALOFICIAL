/**
 * drip-tick — processa a fila `public.email_drip_jobs` e dispara os
 * emails pendentes via Resend (mesma rota da função `send-email`).
 *
 * Acionado por cron (pg_cron, GitHub Actions ou similar) em intervalo
 * curto, por exemplo a cada 15 minutos. Cada chamada processa até
 * `BATCH_SIZE` jobs com `send_at <= now()` e `sent_at IS NULL`.
 *
 * Segurança: exige header `Authorization: Bearer <DRIP_TICK_TOKEN>`.
 * Idempotência: cada job tem UNIQUE (lead_email, slug) e ganha
 * `sent_at` após sucesso, então re-execuções não duplicam envios.
 *
 * Secrets necessários:
 *   DRIP_TICK_TOKEN     → segredo compartilhado com o cron caller
 *   RESEND_API_KEY      → para o fetch a api.resend.com/emails
 *   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY são auto-injetadas)
 */
import { corsHeaders, err, json, preflight } from "../_shared/cors.ts";
import { renderTemplate, type TemplateSlug } from "../_shared/templates.ts";

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

interface DripJob {
  id: string;
  lead_email: string;
  first_name: string | null;
  slug: TemplateSlug;
  send_at: string;
  attempts: number;
}

async function fetchPending(supabaseUrl: string, serviceKey: string): Promise<DripJob[]> {
  const url = `${supabaseUrl}/rest/v1/email_drip_jobs` +
    `?select=id,lead_email,first_name,slug,send_at,attempts` +
    `&sent_at=is.null` +
    `&send_at=lte.${encodeURIComponent(new Date().toISOString())}` +
    `&attempts=lt.${MAX_ATTEMPTS}` +
    `&order=send_at.asc&limit=${BATCH_SIZE}`;
  const r = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!r.ok) throw new Error(`Falha ao ler fila: ${r.status} ${await r.text()}`);
  return (await r.json()) as DripJob[];
}

async function markSent(
  supabaseUrl: string, serviceKey: string,
  id: string, resendEmailId: string | null,
): Promise<void> {
  await fetch(`${supabaseUrl}/rest/v1/email_drip_jobs?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      sent_at: new Date().toISOString(),
      error_message: null,
      resend_email_id: resendEmailId,
    }),
  });
}

async function markError(
  supabaseUrl: string, serviceKey: string,
  id: string, attempts: number, message: string,
): Promise<void> {
  await fetch(`${supabaseUrl}/rest/v1/email_drip_jobs?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      attempts: attempts + 1,
      error_message: message.slice(0, 500),
    }),
  });
}

async function sendOne(
  resendKey: string, job: DripJob,
): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  const { subject, html } = renderTemplate(job.slug, {
    firstName: job.first_name ?? "",
  });

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Sunyan Nunes <ola@despertarespiral.com>",
      to: [job.lead_email],
      subject,
      html,
      tags: [
        { name: "slug", value: job.slug },
        { name: "campaign", value: "drip" },
      ],
    }),
  });

  if (!resp.ok) {
    return { ok: false, error: `${resp.status} ${await resp.text()}` };
  }
  try {
    const data = await resp.json() as { id?: string };
    return { ok: true, id: data.id ?? null };
  } catch {
    return { ok: true, id: null };
  }
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return err("Method not allowed", 405);

  const expected = Deno.env.get("DRIP_TICK_TOKEN");
  if (!expected) return err("DRIP_TICK_TOKEN não configurado", 500);
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) return err("Unauthorized", 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!supabaseUrl || !serviceKey) return err("Supabase env ausente", 500);
  if (!resendKey) return err("RESEND_API_KEY ausente", 500);

  const jobs = await fetchPending(supabaseUrl, serviceKey);
  if (jobs.length === 0) return json({ ok: true, processed: 0 });

  let sent = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const job of jobs) {
    try {
      const result = await sendOne(resendKey, job);
      if (result.ok) {
        await markSent(supabaseUrl, serviceKey, job.id, result.id);
        sent += 1;
      } else {
        await markError(supabaseUrl, serviceKey, job.id, job.attempts, result.error);
        failed += 1;
        errors.push({ id: job.id, error: result.error });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await markError(supabaseUrl, serviceKey, job.id, job.attempts, msg);
      failed += 1;
      errors.push({ id: job.id, error: msg });
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: jobs.length, sent, failed, errors }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
