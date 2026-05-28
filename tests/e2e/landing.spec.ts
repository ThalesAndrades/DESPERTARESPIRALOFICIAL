/**
 * E2E — Landing principal: ressonância do conteúdo + waitlist
 * cobrindo header, hero, modal e estado de sucesso humanizado.
 */
import { test, expect } from "@playwright/test";

test.describe("Landing principal", () => {
  test("renderiza hero e CTA principal", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Despertar Espiral/i);
    // CTA do hero abre a waitlist
    await expect(page.getByRole("button", { name: /Quero entrar na lista/i }).first()).toBeVisible();
  });

  test("abre modal de waitlist e exibe campos corretos", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Quero entrar na lista/i }).first().click();

    const dialog = page.getByRole("dialog", { name: /Quero ser uma das primeiras/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Seu nome/i)).toBeVisible();
    await expect(dialog.getByText(/Seu melhor e-mail/i)).toBeVisible();
    await expect(dialog.getByText(/WhatsApp/i)).toBeVisible();
    await expect(dialog.getByText(/O que te trouxe até aqui/i)).toBeVisible();
  });

  test("valida campo de e-mail antes de enviar", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Quero entrar na lista/i }).first().click();

    const dialog = page.getByRole("dialog");
    await dialog.locator('input[type="text"]').first().fill("Maria");
    await dialog.locator('input[type="email"]').fill("nao-eh-email");
    await dialog.getByRole("button", { name: /Quero entrar na lista/i }).click();

    await expect(dialog.getByText(/Confere o e-mail/i)).toBeVisible();
  });
});
