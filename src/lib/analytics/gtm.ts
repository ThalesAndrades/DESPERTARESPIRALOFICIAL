/**
 * Google Tag Manager — container "wrapper" para quando o usuário preferir
 * gerenciar pixels/tags pelo GTM ao invés de configurar cada provider aqui.
 *
 * Quando VITE_GTM_ID está setado, injetamos o snippet do GTM e empurramos
 * todos os eventos do dataLayer; tags do GTM cuidam do resto.
 */
import type { AnalyticsEvent, ConsentState, PageViewPayload, Provider } from "./types";

const id = () => import.meta.env.VITE_GTM_ID as string | undefined;
let initialized = false;

function injectSnippet(gtmId: string): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  document.head.appendChild(s);
}

export const gtmProvider: Provider = {
  id: "gtm",

  init() {
    const gtmId = id();
    if (!gtmId || initialized) return;
    injectSnippet(gtmId);
    initialized = true;
  },

  setConsent(c: ConsentState) {
    if (!initialized) return;
    window.dataLayer.push({
      event: "consent_update",
      consent_analytics: c.analytics,
      consent_marketing: c.marketing,
    });
  },

  trackPageView({ path, title, referrer }: PageViewPayload) {
    if (!initialized) return;
    window.dataLayer.push({
      event: "page_view",
      page_path: path,
      page_title: title,
      page_referrer: referrer,
    });
  },

  trackEvent({ name, params }: AnalyticsEvent) {
    if (!initialized) return;
    window.dataLayer.push({ event: name, ...(params || {}) });
  },
};
