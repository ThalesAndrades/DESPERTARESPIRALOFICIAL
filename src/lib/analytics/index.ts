/**
 * Analytics facade — ponto único de entrada para o resto do app.
 *
 * Carrega providers configurados via env, gerencia consent, e expõe
 * funções `pageView` / `track` / `identify` que despacham para todos os
 * providers ativos respeitando categoria de consent.
 *
 * Configuração via .env:
 *   VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
 *   VITE_META_PIXEL_ID=000000000000000
 *   VITE_TIKTOK_PIXEL_ID=XXXXXXXXXXXXXXXXXXXX
 *   VITE_GTM_ID=GTM-XXXXXXX
 *   VITE_ANALYTICS_REQUIRE_CONSENT=true | false   (default true)
 *   VITE_ANALYTICS_DEBUG=true | false             (loga no console)
 */
import type { ConsentCategory, ConsentState, PageViewPayload, Provider } from "./types";
import { gaProvider } from "./gtag";
import { metaProvider } from "./metaPixel";
import { tiktokProvider } from "./tiktokPixel";
import { gtmProvider } from "./gtm";
import { consentRequired, getConsent, hasDecided, onConsentChange } from "./consent";

export { Events } from "./events";
export type { ConsentState } from "./types";
export {
  getConsent, setConsent, acceptAll, rejectAll, hasDecided,
  onConsentChange, consentRequired,
} from "./consent";
export { sha256 } from "./hash";
export { installScrollTracker } from "./scrollTracker";
export { captureAttribution, getAttribution } from "./attribution";
export type { Attribution } from "./attribution";

const debug = () => import.meta.env.VITE_ANALYTICS_DEBUG === "true" || import.meta.env.DEV;

const allProviders: Array<{ provider: Provider; needs: ConsentCategory }> = [
  { provider: gaProvider,     needs: "analytics" },
  { provider: gtmProvider,    needs: "analytics" },
  { provider: metaProvider,   needs: "marketing" },
  { provider: tiktokProvider, needs: "marketing" },
];

let bootstrapped = false;
const pendingEvents: Array<() => void> = [];

function isAllowed(needs: ConsentCategory, current: ConsentState): boolean {
  if (needs === "necessary") return true;
  if (!consentRequired()) return true;
  return current[needs];
}

function activeProviders(category: ConsentCategory) {
  const c = getConsent();
  return allProviders
    .filter(({ needs }) => needs === category)
    .filter(({ needs }) => isAllowed(needs, c))
    .map(({ provider }) => provider);
}

function logDebug(...args: unknown[]) {
  if (debug()) console.info("[analytics]", ...args);
}

/**
 * Bootstrap — chama init() em todos os providers configurados.
 * Idempotente. Roda no boot do app (main.tsx).
 */
export function bootstrapAnalytics(): void {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;

  for (const { provider, needs } of allProviders) {
    try {
      const c = getConsent();
      // Em "consent required + ainda sem decisão", só inicializamos providers
      // estritamente analytics se já houver granted; pixels marketing aguardam.
      if (consentRequired() && !isAllowed(needs, c) && !hasDecided()) continue;
      provider.init();
    } catch (e) {
      if (debug()) console.warn("[analytics] init failed", provider.id, e);
    }
  }

  // Quando o consent muda, repassa para todos e flusha fila de eventos.
  onConsentChange((c) => {
    for (const { provider, needs } of allProviders) {
      try {
        if (isAllowed(needs, c)) {
          provider.init();
          provider.setConsent?.(c);
        } else {
          provider.setConsent?.(c);
        }
      } catch (e) {
        if (debug()) console.warn("[analytics] consent update failed", provider.id, e);
      }
    }
    if (pendingEvents.length) {
      logDebug("flushing", pendingEvents.length, "queued events");
      const queue = [...pendingEvents];
      pendingEvents.length = 0;
      queue.forEach((fn) => fn());
    }
  });

  logDebug("bootstrapped", { providers: allProviders.map((p) => p.provider.id) });
}

/** Dispara page_view em todos os providers que podem. */
export function pageView(p: PageViewPayload): void {
  logDebug("pageView", p);
  for (const provider of activeProviders("analytics")) provider.trackPageView(p);
  for (const provider of activeProviders("marketing")) provider.trackPageView(p);
}

/**
 * Dispara um evento custom. Se o usuário ainda não decidiu sobre o consent,
 * o evento é enfileirado e disparado depois do accept (caso aceito).
 */
export function track(
  name: string,
  params?: Record<string, unknown>,
  category: ConsentCategory = "analytics",
): void {
  logDebug("track", name, params);
  const c = getConsent();

  if (consentRequired() && !hasDecided()) {
    pendingEvents.push(() => track(name, params, category));
    return;
  }

  if (!isAllowed(category, c)) return;
  const targets = activeProviders(category);
  for (const provider of targets) {
    try {
      provider.trackEvent({ name, params, consent: category });
    } catch (e) {
      if (debug()) console.warn("[analytics] track failed", provider.id, e);
    }
  }

  // Eventos com categoria "analytics" também replicam em providers marketing
  // se o consent estiver concedido (PageView/Lead duplicam ambos).
  if (category === "analytics") {
    for (const provider of activeProviders("marketing")) {
      try {
        provider.trackEvent({ name, params, consent: "marketing" });
      } catch (e) {
        if (debug()) console.warn("[analytics] track-mirror failed", provider.id, e);
      }
    }
  }
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
  for (const provider of activeProviders("analytics")) provider.identify?.(userId, traits);
}
