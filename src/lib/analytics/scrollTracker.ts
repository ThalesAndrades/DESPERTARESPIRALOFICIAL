/**
 * Scroll-depth tracker — dispara `scroll_depth` em 25/50/75/90/100%,
 * uma vez por sessão. Usa rAF + passive listener pra zero impacto em FPS.
 *
 * O instalador retorna função de cleanup.
 */
import { track } from "./index";
import { Events } from "./events";

const THRESHOLDS = [25, 50, 75, 90, 100] as const;

export function installScrollTracker(): () => void {
  if (typeof window === "undefined") return () => {};
  const sent = new Set<number>();
  let ticking = false;

  const measure = () => {
    ticking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    if (max <= 0) return;
    const pct = Math.min(100, Math.round((window.scrollY / max) * 100));
    for (const t of THRESHOLDS) {
      if (pct >= t && !sent.has(t)) {
        sent.add(t);
        track(Events.ScrollDepth, { percent: t }, "analytics");
      }
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(measure);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  measure();
  return () => window.removeEventListener("scroll", onScroll);
}
