/**
 * TikTok Pixel — Events API web SDK.
 *
 * Eventos suportados (subset usado):
 *   ViewContent, Search, AddToWishlist, AddToCart, InitiateCheckout,
 *   AddPaymentInfo, PlaceAnOrder, CompletePayment, CompleteRegistration,
 *   SubmitForm, Contact, Subscribe
 */
import type { AnalyticsEvent, ConsentState, PageViewPayload, Provider } from "./types";

const id = () => import.meta.env.VITE_TIKTOK_PIXEL_ID as string | undefined;
let initialized = false;

declare global {
  interface Window {
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
      identify: (data: Record<string, unknown>) => void;
      load: (id: string) => void;
      [k: string]: unknown;
    };
    TiktokAnalyticsObject?: string;
  }
}

function injectSnippet(pixelId: string): void {
  if (window.ttq) return;
  /* eslint-disable */
  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t;
    const ttq: any = (w[t] = w[t] || []);
    ttq.methods = [
      "page", "track", "identify", "instances", "debug", "on", "off", "once",
      "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent",
      "revokeConsent", "grantConsent",
    ];
    ttq.setAndDefer = function (target: any, method: string) {
      target[method] = function (this: any) {
        target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (id: string) {
      const e = ttq._i?.[id] || [];
      for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
      return e;
    };
    ttq.load = function (e: string, n?: any) {
      const r = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[e] = [];
      ttq._i[e]._u = r;
      ttq._t = ttq._t || {};
      ttq._t[e] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[e] = n || {};
      const s = d.createElement("script") as HTMLScriptElement;
      s.type = "text/javascript";
      s.async = true;
      s.src = r + "?sdkid=" + e + "&lib=" + t;
      const a = d.getElementsByTagName("script")[0];
      a.parentNode?.insertBefore(s, a);
    };
  })(window, document, "ttq");
  /* eslint-enable */
  window.ttq?.load(pixelId);
  window.ttq?.page();
}

const STANDARD = new Set([
  "ViewContent", "Search", "AddToWishlist", "AddToCart", "InitiateCheckout",
  "AddPaymentInfo", "PlaceAnOrder", "CompletePayment", "CompleteRegistration",
  "SubmitForm", "Contact", "Subscribe",
]);

function mapToStandard(name: string): string {
  switch (name) {
    case "page_view":        return "ViewContent";
    case "view_content":     return "ViewContent";
    case "generate_lead":
    case "join_waitlist":    return "SubmitForm";
    case "complete_quiz":    return "CompleteRegistration";
    case "begin_checkout":   return "InitiateCheckout";
    case "add_payment_info": return "AddPaymentInfo";
    case "purchase":         return "CompletePayment";
    case "subscribe":        return "Subscribe";
    case "contact":          return "Contact";
    default:                 return STANDARD.has(name) ? name : name;
  }
}

export const tiktokProvider: Provider = {
  id: "tiktok",

  init() {
    const pixelId = id();
    if (!pixelId || initialized) return;
    injectSnippet(pixelId);
    initialized = true;
  },

  setConsent(c: ConsentState) {
    if (!initialized || !window.ttq) return;
    if (c.marketing) window.ttq.grantConsent?.();
    else window.ttq.revokeConsent?.();
  },

  trackPageView(_: PageViewPayload) {
    if (!initialized || !window.ttq) return;
    window.ttq.page();
  },

  trackEvent({ name, params }: AnalyticsEvent) {
    if (!initialized || !window.ttq) return;
    window.ttq.track(mapToStandard(name), params || {});
  },
};
