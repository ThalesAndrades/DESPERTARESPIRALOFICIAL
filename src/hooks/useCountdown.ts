import { useEffect, useState } from "react";
import { snapshotCountdown, type CountdownSnapshot } from "@/lib/countdown";

/**
 * Re-render a cada 1s enquanto não chegar a zero. Quando chega a zero,
 * pára o tick e devolve `finished: true` pro consumidor decidir o que
 * fazer (trocar CTA, abrir checkout, etc.).
 */
export function useCountdown(target: Date | string | null | undefined): CountdownSnapshot | null {
  const [snap, setSnap] = useState<CountdownSnapshot | null>(() =>
    target ? snapshotCountdown(target) : null,
  );

  useEffect(() => {
    if (!target) {
      setSnap(null);
      return;
    }
    setSnap(snapshotCountdown(target));
    const id = setInterval(() => {
      const s = snapshotCountdown(target);
      setSnap(s);
      if (s.finished) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  return snap;
}
