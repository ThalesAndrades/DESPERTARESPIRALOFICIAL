/**
 * Analytics — tipos compartilhados pelos providers (GA4, Meta, TikTok, GTM).
 *
 * Toda a tracking layer é "consent-aware": nada dispara antes do usuário
 * aceitar (ou se VITE_ANALYTICS_REQUIRE_CONSENT=false). Os providers ficam
 * pendurados em `window` por scripts globais; daqui só interagimos com eles.
 */

export type ConsentCategory = "analytics" | "marketing" | "necessary";

export interface ConsentState {
  necessary: true;          // sempre true (LGPD: cookies estritamente necessários)
  analytics: boolean;       // GA4, GTM analytics tags
  marketing: boolean;       // Meta Pixel, TikTok, ads remarketing
  updatedAt: string;        // ISO timestamp
}

export interface AnalyticsEvent {
  /** Nome curto do evento (snake_case) — ex: "join_waitlist", "view_module" */
  name: string;
  /** Parâmetros livres — preferir números/strings simples para compatibilidade. */
  params?: Record<string, unknown>;
  /** Categoria de consent que o evento exige. Default "analytics". */
  consent?: ConsentCategory;
}

export interface PageViewPayload {
  path: string;
  title?: string;
  referrer?: string;
}

export interface EcommerceItem {
  item_id: string;
  item_name: string;
  price?: number;
  currency?: string;
  quantity?: number;
}

export interface PurchasePayload {
  value: number;
  currency: string;
  transaction_id: string;
  items?: EcommerceItem[];
}

export interface LeadPayload {
  email_hash?: string;     // sempre passar HASH, nunca email cru (CAPI/LGPD)
  source?: string;
  value?: number;
  currency?: string;
}

export interface Provider {
  id: string;
  init: () => void | Promise<void>;
  trackPageView: (p: PageViewPayload) => void;
  trackEvent: (e: AnalyticsEvent) => void;
  identify?: (userId: string, traits?: Record<string, unknown>) => void;
  setConsent?: (consent: ConsentState) => void;
}
