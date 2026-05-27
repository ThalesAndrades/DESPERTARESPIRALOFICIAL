/**
 * Meta Pixel (Facebook + Instagram Ads).
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
 */
import type { AnalyticsEvent, ConsentState, PageViewPayload, Provider } from "./types";

const id = () => import.meta.env.VITE_META_PIXEL_ID as string | undefined;
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
    window.fbq("track", "PageView");
  },

  trackEvent({ name, params }: AnalyticsEvent) {
    if (!initialized || !window.fbq) return;
    const { event, isStandard } = mapToStandard(name);
    window.fbq(isStandard ? "track" : "trackCustom", event, params || {});
  },
};
