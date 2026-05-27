/**
 * Meta Pixel (Facebook + Instagram Ads) + Conversions API.
 *
 * Mapa de eventos canônicos:
 *   page_view        → PageView
 *   view_content     → ViewContent
 *   generate_lead    → Lead
 *   join_waitlist    → Lead + custom JoinWaitlist
 *   complete_quiz    → CompleteRegistration
 *   begin_checkout   → InitiateCheckout
 *   add_payment_info → AddPaymentInfo
 *   purchase         → Purchase
 *   search           → Search
 *
 * O Pixel é carregado só depois do consent "marketing". Quando o gate vai
 * para granted, init() é chamado e o snippet padrão da Meta é injetado.
 *
 * CAPI (Conversions API): cada evento ganha um `event_id` único e é
 * disparado em paralelo via Edge Function `meta-capi` no Supabase. A Meta
 * deduplica eventos do Pixel JS e CAPI quando o event_id é o mesmo,
 * recuperando 20-30% dos eventos perdidos por bloqueadores/ITP/iOS sem
 * dupla contagem.
 *
 * Habilite o CAPI setando `VITE_META_CAPI_ENDPOINT` (URL completa da
 * Edge Function publicada) — sem isso só o Pixel JS dispara.
 */
import type { AnalyticsEvent, ConsentState, PageViewPayload, Provider } from "./types";

const id = () => import.meta.env.VITE_META_PIXEL_ID as string | undefined;
const capiEndpoint = () => import.meta.env.VITE_META_CAPI_ENDPOINT as string | undefined;
let initialized = false;

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string };
    _fbq?: unknown;
  }
}

const META_STANDARD_EVENTS = new Set([
  "PageView", "ViewContent", "Search", "AddToCart", "AddToWishlist",
  "InitiateCheckout", "AddPaymentInfo", "Purchase", "Lead",
  "CompleteRegistration", "Subscribe", "StartTrial", "Contact", "Schedule",
]);

function injectSnippet(pixelId: string): void {
  if (window.fbq) return;
  /* eslint-disable */
  (function (f: any, b: any, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq?.("init", pixelId);
}

function mapToStandard(name: string): { event: string; isStandard: boolean } {
  switch (name) {
    case "page_view":         return { event: "PageView", isStandard: true };
    case "view_content":      return { event: "ViewContent", isStandard: true };
    case "search":            return { event: "Search", isStandard: true };
    case "generate_lead":
    case "join_waitlist":     return { event: "Lead", isStandard: true };
    case "complete_quiz":     return { event: "CompleteRegistration", isStandard: true };
    case "begin_checkout":    return { event: "InitiateCheckout", isStandard: true };
    case "add_payment_info":  return { event: "AddPaymentInfo", isStandard: true };
    case "purchase":          return { event: "Purchase", isStandard: true };
    case "subscribe":         return { event: "Subscribe", isStandard: true };
    case "contact":           return { event: "Contact", isStandard: true };
    default:                  return { event: name, isStandard: META_STANDARD_EVENTS.has(name) };
  }
}

/** UUID curto pra event_id (suporta browsers sem crypto.randomUUID). */
function eventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Separa params em (custom_data) e (user_data hasheado). Convenção:
 *   em_hash / ph_hash / fn_hash / ln_hash / external_id → user_data
 *   resto → custom_data
 */
function splitParams(params: Record<string, unknown>) {
  const userData: Record<string, string[] | string> = {};
  const customData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    switch (k) {
      case "em_hash":      userData.em = [String(v)]; break;
      case "ph_hash":      userData.ph = [String(v)]; break;
      case "fn_hash":      userData.fn = [String(v)]; break;
      case "ln_hash":      userData.ln = [String(v)]; break;
      case "ct_hash":      userData.ct = [String(v)]; break;
      case "external_id":  userData.external_id = [String(v)]; break;
      default:             customData[k] = v;
    }
  }
  return { userData, customData };
}

/** Dispara para a Edge Function CAPI. Falha silenciosa — Pixel JS é a base. */
async function sendCapi(event: {
  event_name: string;
  event_id: string;
  user_data: Record<string, unknown>;
  custom_data: Record<string, unknown>;
}): Promise<void> {
  const url = capiEndpoint();
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        events: [
          {
            ...event,
            event_source_url: window.location.href,
            action_source: "website",
          },
        ],
      }),
    });
  } catch {
    /* falha silenciosa — Pixel JS já cobriu */
  }
}

export const metaProvider: Provider = {
  id: "meta",

  init() {
    const pixelId = id();
    if (!pixelId || initialized) return;
    injectSnippet(pixelId);
    initialized = true;
  },

  setConsent(c: ConsentState) {
    if (!initialized || !window.fbq) return;
    window.fbq("consent", c.marketing ? "grant" : "revoke");
  },

  trackPageView(_: PageViewPayload) {
    if (!initialized || !window.fbq) return;
    const eid = eventId();
    window.fbq("track", "PageView", {}, { eventID: eid });
    void sendCapi({ event_name: "PageView", event_id: eid, user_data: {}, custom_data: {} });
  },

  trackEvent({ name, params }: AnalyticsEvent) {
    if (!initialized || !window.fbq) return;
    const { event, isStandard } = mapToStandard(name);
    const eid = eventId();
    const { userData, customData } = splitParams(params || {});

    if (isStandard) {
      window.fbq("track", event, customData, { eventID: eid });
    } else {
      window.fbq("trackCustom", event, customData, { eventID: eid });
    }

    void sendCapi({
      event_name: event,
      event_id: eid,
      user_data: userData,
      custom_data: customData,
    });
  },
};
