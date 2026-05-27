/**
 * Meta CAPI (Conversions API) — recebe eventos do front e replica para o
 * Pixel ID 630846701068684 server-side, com o mesmo `event_id` que o
 * Pixel client-side, permitindo deduplicação na Meta.
 *
 * Sinais coletados aqui automaticamente:
 *   - client_ip_address  (x-forwarded-for / x-real-ip)
 *   - client_user_agent  (User-Agent)
 *   - event_source_url   (referer)
 *   - fbp / fbc cookies  (passados pelo front)
 *
 * O front (metaPixel.ts) é responsável por:
 *   - hashear PII (email, phone, first name, last name, city, state, zip)
 *     com SHA-256 minúsculo trim antes de enviar — NUNCA mandar PII bruto.
 *   - gerar um event_id único por evento e usar o MESMO no Pixel JS.
 *
 * Secrets necessários (npx supabase secrets set NOME=valor):
 *   META_CAPI_ACCESS_TOKEN  → gerado em Eventos Manager → Configurações
 *                             → API de Conversões → Gerar token
 *   META_PIXEL_ID           → 630846701068684 (opcional; default abaixo)
 *   META_TEST_EVENT_CODE    → TEST00000 (opcional, só em QA)
 */
import { corsHeaders, err, json, preflight } from "../_shared/cors.ts";

const GRAPH_VERSION = "v19.0";
const DEFAULT_PIXEL_ID = "630846701068684";

interface UserData {
  em?: string[];   // emails sha256
  ph?: string[];   // phones sha256
  fn?: string[];   // first names sha256
  ln?: string[];   // last names sha256
  ct?: string[];   // city sha256
  st?: string[];   // state sha256
  zp?: string[];   // zip sha256
  country?: string[];
  external_id?: string[];
  fbp?: string;    // _fbp cookie
  fbc?: string;    // _fbc cookie (click id)
}

interface IncomingEvent {
  event_name: string;
  event_id: string;
  event_source_url?: string;
  action_source?: "website" | "email" | "app" | "phone_call" | "chat" | "physical_store" | "system_generated" | "other";
  user_data?: UserData;
  custom_data?: Record<string, unknown>;
  event_time?: number; // unix seconds
}

interface IncomingBody {
  events: IncomingEvent[];
}

function extractIp(req: Request): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? undefined;
}

function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.get("cookie");
  if (!raw) return undefined;
  const match = raw.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export default async function handler(req: Request): Promise<Response> {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return err("Method not allowed", 405);

  const token = Deno.env.get("META_CAPI_ACCESS_TOKEN");
  if (!token) {
    return err("META_CAPI_ACCESS_TOKEN não configurado no Supabase secrets", 500);
  }
  const pixelId = Deno.env.get("META_PIXEL_ID") ?? DEFAULT_PIXEL_ID;
  const testEventCode = Deno.env.get("META_TEST_EVENT_CODE") ?? undefined;

  let body: IncomingBody;
  try {
    body = await req.json();
  } catch {
    return err("Body inválido (esperado JSON)", 400);
  }
  if (!body?.events?.length) return err("events vazio", 400);

  const ip = extractIp(req);
  const ua = req.headers.get("user-agent") ?? undefined;
  const referer = req.headers.get("referer") ?? undefined;
  const fbp = readCookie(req, "_fbp");
  const fbc = readCookie(req, "_fbc");

  const now = Math.floor(Date.now() / 1000);

  const data = body.events.map((evt) => {
    const userData = { ...(evt.user_data ?? {}) };
    if (ip && !userData.fbp) userData.fbp = userData.fbp ?? fbp;
    if (!userData.fbc && fbc) userData.fbc = fbc;
    return {
      event_name: evt.event_name,
      event_time: evt.event_time ?? now,
      event_id: evt.event_id,
      event_source_url: evt.event_source_url ?? referer,
      action_source: evt.action_source ?? "website",
      user_data: {
        ...userData,
        client_ip_address: ip,
        client_user_agent: ua,
        fbp: userData.fbp ?? fbp,
        fbc: userData.fbc ?? fbc,
      },
      custom_data: evt.custom_data ?? {},
    };
  });

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`;
  const payload: Record<string, unknown> = {
    data,
    access_token: token,
  };
  if (testEventCode) payload.test_event_code = testEventCode;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const respBody = await resp.text();
  if (!resp.ok) {
    return new Response(respBody, {
      status: resp.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return json({ ok: true, meta: JSON.parse(respBody) });
}

Deno.serve(handler);
