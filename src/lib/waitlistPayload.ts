/**
 * Monta o payload de inserção em `public.launch_waitlist` enriquecendo
 * com attribution (UTM + click ids), referrer, user_agent e o caminho
 * de landing. Usado pelo WaitlistModal, QuizSection e CaptionPage para
 * garantir que toda inscrita carregue os mesmos sinais.
 */
import { getAttribution } from "@/lib/analytics";

export interface WaitlistInput {
  email: string;
  name?: string | null;
  phone?: string | null;
  message?: string | null;
  source: string;
}

export function buildWaitlistPayload(input: WaitlistInput) {
  const attr = getAttribution();
  return {
    email: input.email.trim().toLowerCase(),
    name: input.name?.trim() || null,
    phone: input.phone?.replace(/\s+/g, " ").trim() || null,
    message: input.message?.trim() || null,
    source: input.source,
    utm_source:   attr.utm_source   ?? null,
    utm_medium:   attr.utm_medium   ?? null,
    utm_campaign: attr.utm_campaign ?? null,
    utm_term:     attr.utm_term     ?? null,
    utm_content:  attr.utm_content  ?? null,
    gclid:        attr.gclid        ?? null,
    fbclid:       attr.fbclid       ?? null,
    ttclid:       attr.ttclid       ?? null,
    referrer:     (typeof document !== "undefined" && document.referrer) || null,
    user_agent:   (typeof navigator !== "undefined" && navigator.userAgent) || null,
    landing_path: (typeof window !== "undefined" && window.location.pathname) || null,
  };
}
