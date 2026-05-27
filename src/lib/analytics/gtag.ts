/**
 * Google Analytics 4 (GA4) — provider via gtag.js.
 *
 * Carrega o snippet sob demanda (depois do consent) e mapeia nossos
 * eventos canônicos para eventos GA4 quando relevante (sign_up, generate_lead,
 * view_item, etc.). Sempre respeita Consent Mode v2.
 */
import type { AnalyticsEvent, ConsentState, PageViewPayload, Provider } from "./types";

const id = () => import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;
let initialized = false;
let scriptInjected = false;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function ensureDataLayer(): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
  }
}

function injectScript(measurementId: string): void {
  if (scriptInjected) return;
  scriptInjected = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(s);
}

export const gaProvider: Provider = {
  id: "ga4",

  init() {
    const measurementId = id();
    if (!measurementId || initialized) return;
    ensureDataLayer();

    // Consent Mode v2 — default DENIED até o usuário decidir
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500,
    });

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false, // controlamos manualmente
      anonymize_ip: true,
      cookie_flags: "SameSite=Lax;Secure",
    });

    injectScript(measurementId);
    initialized = true;
  },

  setConsent(c: ConsentState) {
    if (!initialized || !window.gtag) return;
    window.gtag("consent", "update", {
      analytics_storage: c.analytics ? "granted" : "denied",
      ad_storage: c.marketing ? "granted" : "denied",
      ad_user_data: c.marketing ? "granted" : "denied",
      ad_personalization: c.marketing ? "granted" : "denied",
    });
  },

  trackPageView({ path, title }: PageViewPayload) {
    if (!initialized) return;
    window.gtag("event", "page_view", {
      page_path: path,
      page_title: title,
      page_location: typeof window !== "undefined" ? window.location.href : undefined,
    });
  },

  trackEvent({ name, params }: AnalyticsEvent) {
    if (!initialized) return;
    window.gtag("event", name, params || {});
  },

  identify(userId: string) {
    if (!initialized) return;
    window.gtag("config", id() as string, { user_id: userId });
  },
};
