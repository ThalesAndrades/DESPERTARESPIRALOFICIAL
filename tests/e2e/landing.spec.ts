/**
 * E2E — Landing principal: ressonância do conteúdo + waitlist
 * cobrindo header, hero, modal e estado de sucesso humanizado.
 */
import { test, expect } from "@playwright/test";
import { preAcceptConsent } from "./_setup";

test.beforeEach(async ({ page }) => {
  await preAcceptConsent(page);
});

test.describe("Landing principal", () => {
  test("renderiza hero e CTA principal", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Despertar Espiral/i);
    // CTA do hero abre a waitlist
    await expect(
      page.getByRole("button", { name: /Quero entrar na lista/i }).first(),
    ).toBeVisible();
  });

  test("abre modal de waitlist e exibe campos corretos", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Quero entrar na lista/i }).first().click();

    const dialog = page.getByRole("dialog", { name: /Quero ser uma das primeiras/i });
    await expect(dialog).toBeVisible();

    // Campos por placeholder (mais robusto que getByText)
    await expect(dialog.getByPlaceholder(/Como você gosta de ser chamada/i)).toBeVisible();
    await expect(dialog.getByPlaceholder(/o que você abre todo dia/i)).toBeVisible();
    await expect(dialog.getByPlaceholder("(00) 00000-0000")).toBeVisible();
    await expect(dialog.getByPlaceholder(/Pode ser uma palavra/i)).toBeVisible();
  });

  test("valida campo de e-mail antes de enviar", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Quero entrar na lista/i }).first().click();

    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder(/Como você gosta de ser chamada/i).fill("Maria");
    await dialog.getByPlaceholder(/o que você abre todo dia/i).fill("nao-eh-email");
    await dialog.getByRole("button", { name: /Quero entrar na lista/i }).click();

    await expect(dialog.getByText(/Confere o e-mail/i)).toBeVisible();
  });
});
