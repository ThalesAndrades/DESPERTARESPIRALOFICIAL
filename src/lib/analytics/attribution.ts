/**
 * UTM attribution — captura uma única vez ao chegar com tráfego pago/orgânico
 * e armazena em sessionStorage. Os parâmetros viajam junto de eventos
 * (lead, purchase) para a gente saber a fonte real da conversão.
 */
const UTM_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "gclid", "fbclid", "ttclid",
] as const;

type UtmKey = (typeof UTM_KEYS)[number];
export type Attribution = Partial<Record<UtmKey, string>>;

const KEY = "ds_attribution";

export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const found: Attribution = {};
  for (const key of UTM_KEYS) {
    const val = params.get(key);
    if (val) found[key] = val;
  }
  if (Object.keys(found).length > 0) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(found));
    } catch {
      /* ignore */
    }
  }
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}
