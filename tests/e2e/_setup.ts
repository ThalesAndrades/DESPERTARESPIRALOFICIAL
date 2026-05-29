/**
 * Helper compartilhado: pré-aceita o banner LGPD via localStorage
 * antes da página carregar. Sem isso, o ConsentBanner fica fixed na
 * tela com z-index alto e pode interceptar clicks dos testes.
 */
import type { Page } from "@playwright/test";

export async function preAcceptConsent(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem(
        "espiral.consent",
        JSON.stringify({
          necessary: true,
          analytics: true,
          marketing: true,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch {
      /* ignore */
    }
  });
}
