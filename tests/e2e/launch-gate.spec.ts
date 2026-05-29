/**
 * E2E — Launch gate: em dev o gate fica sempre aberto, então testamos
 * o que dá pra testar com a build de DEV:
 *   - o botão "?" do footer abre o modal de código admin
 *   - código errado mostra erro
 *   - código `190900` libera e navega para /admin
 *
 * Em prod (preview), com `import.meta.env.DEV=false`, este teste pode
 * rodar setando manualmente o localStorage antes da página carregar.
 */
import { test, expect } from "@playwright/test";
import { preAcceptConsent } from "./_setup";

test.beforeEach(async ({ page }) => {
  await preAcceptConsent(page);
});

test.describe.skip("Launch gate — acesso admin", () => {
  test("botão ? do footer abre modal de código", async ({ page }) => {
    await page.goto("/");
    // O footer é a última seção; rolar até lá
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole("button", { name: /Acesso administrativo/i }).click();
    await expect(page.getByRole("dialog", { name: /Acesso administrativo/i })).toBeVisible();
    await expect(page.getByText(/Código de acesso/i)).toBeVisible();
  });

  test("código errado mostra erro humanizado", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole("button", { name: /Acesso administrativo/i }).click();

    const dialog = page.getByRole("dialog", { name: /Acesso administrativo/i });
    await dialog.locator('input[type="password"]').fill("000000");
    await dialog.getByRole("button", { name: /Confirmar/i }).click();

    await expect(dialog.getByText(/Código inválido/i)).toBeVisible();
  });

  test("código correto libera e leva para área admin", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole("button", { name: /Acesso administrativo/i }).click();

    const dialog = page.getByRole("dialog", { name: /Acesso administrativo/i });
    await dialog.locator('input[type="password"]').fill("190900");
    await dialog.getByRole("button", { name: /Confirmar/i }).click();

    await page.waitForURL(/\/admin/);
    await expect(page).toHaveURL(/\/admin/);
  });
});
