// Edge Function: envia email transacional via Resend.
//
// Body:
//   { to: string, slug: TemplateSlug, variables?: Record<string, string> }
//
// Env: RESEND_API_KEY, SITE_URL
import { preflight, json, err } from "../_shared/cors.ts";
import { renderTemplate, type TemplateSlug } from "../_shared/templates.ts";

Deno.serve(async (req) => {
  const p = preflight(req); if (p) return p;
  if (req.method !== "POST") return err("Method not allowed", 405);

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return err("RESEND_API_KEY não configurada", 500);

    const body = await req.json().catch(() => ({}));
    const { to, slug, variables = {} } = body as {
      to?: string;
      slug?: TemplateSlug;
      variables?: Record<string, string>;
    };
    if (!to || !slug) return err("to e slug são obrigatórios", 400);

    const { subject, html } = renderTemplate(slug, variables);

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Despertar Espiral <ola@despertarespiral.com>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return err(`Resend retornou ${resp.status}`, 500, { detail: text });
    }
    const data = await resp.json();
    return json({ ok: true, id: data.id });
  } catch (e) {
    console.error("[send-email]", e);
    return err(e instanceof Error ? e.message : "erro", 500);
  }
});
