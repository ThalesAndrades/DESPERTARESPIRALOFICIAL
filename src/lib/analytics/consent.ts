/**
 * Consent manager — guarda preferências de cookies/tracking em localStorage,
 * notifica providers e expõe estado reativo via subscribe.
 *
 * Conforme LGPD: o consent é granular (analytics vs marketing), pode ser
 * revogado, e o "necessary" é sempre true sem opção de desligar.
 */
import type { ConsentState } from "./types";

const KEY = "espiral.consent";

const defaultState: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  updatedAt: "1970-01-01T00:00:00.000Z",
};

let cached: ConsentState | null = null;
const listeners = new Set<(s: ConsentState) => void>();

function read(): ConsentState {
  if (cached) return cached;
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    cached = { ...defaultState, ...parsed, necessary: true };
    return cached;
  } catch {
    return defaultState;
  }
}

function write(state: ConsentState): void {
  cached = state;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(state));
}

export function getConsent(): ConsentState {
  return read();
}

export function hasDecided(): boolean {
  return read().updatedAt !== defaultState.updatedAt;
}

export function setConsent(next: Partial<Omit<ConsentState, "necessary" | "updatedAt">>): void {
  const current = read();
  write({
    ...current,
    ...next,
    necessary: true,
    updatedAt: new Date().toISOString(),
  });
}

export function acceptAll(): void {
  setConsent({ analytics: true, marketing: true });
}

export function rejectAll(): void {
  setConsent({ analytics: false, marketing: false });
}

export function onConsentChange(fn: (s: ConsentState) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Em dev ou se a flag estiver desligada, ignora o gate de consent. */
export function consentRequired(): boolean {
  const flag = import.meta.env.VITE_ANALYTICS_REQUIRE_CONSENT;
  if (flag === "false") return false;
  return true;
}
