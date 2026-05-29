/**
 * Smoke test mínimo — só valida que o webServer subiu e a página
 * responde. Se este passa e os outros falham, o problema está nos
 * seletores; se este falha, infra (webServer/build/Playwright).
 */
import { test, expect } from "@playwright/test";

test("home responde e tem title", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/.+/);
});
