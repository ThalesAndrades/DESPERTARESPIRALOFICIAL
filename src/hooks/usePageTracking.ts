import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageView } from "@/lib/analytics";

/** Dispara page_view em todos os providers a cada mudança de rota. */
export function usePageTracking() {
  const location = useLocation();
  useEffect(() => {
    pageView({
      path: location.pathname + location.search,
      title: document.title,
      referrer: document.referrer || undefined,
    });
  }, [location.pathname, location.search]);
}
