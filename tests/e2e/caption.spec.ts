/**
 * E2E — /caption: landing dedicada de tráfego pago.
 *
 * Cobre o fluxo intro → quiz (6 perguntas) → reveal do arquétipo.
 * Não envia o form de fato pra não poluir o banco.
 */
import { test, expect } from "@playwright/test";
import { preAcceptConsent } from "./_setup";

test.beforeEach(async ({ page }) => {
  await preAcceptConsent(page);
});

test.describe("/caption — Teste de Poder Feminino", () => {
  test("renderiza intro com CTA", async ({ page }) => {
    await page.goto("/caption");
    await expect(page).toHaveTitle(/Poder Feminino/i);
    await expect(page.getByRole("button", { name: /Quero descobrir/i })).toBeVisible();
  });

  test("atravessa o quiz e revela um arquétipo", async ({ page }) => {
    await page.goto("/caption");
    await page.getByRole("button", { name: /Quero descobrir/i }).click();

    // 6 perguntas: clicar sempre na primeira opção dentro do quiz (role=group)
    for (let step = 0; step < 6; step++) {
      const quiz = page.getByRole("group").first();
      await expect(quiz).toBeVisible({ timeout: 10_000 });
      await expect(
        page.getByText(new RegExp(`Pergunta ${step + 1} de 6`, "i")),
      ).toBeVisible({ timeout: 10_000 });
      // Primeira opção do grupo de quiz
      await quiz.locator('button[type="button"]').first().click();
      // Aguardar animação de transição
      await page.waitForTimeout(500);
    }

    // Reveal do arquétipo
    await expect(page.getByText(/Seu arquétipo dominante é/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Suas forças visíveis/i)).toBeVisible();
    await expect(page.getByText(/Sua sombra a integrar/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Quero meu aprofundamento/i })).toBeVisible();
  });

  test("permite voltar de uma pergunta no quiz", async ({ page }) => {
    await page.goto("/caption");
    await page.getByRole("button", { name: /Quero descobrir/i }).click();

    // Avança 2 perguntas
    for (let i = 0; i < 2; i++) {
      const quiz = page.getByRole("group").first();
      await expect(quiz).toBeVisible({ timeout: 10_000 });
      await quiz.locator('button[type="button"]').first().click();
      await page.waitForTimeout(500);
    }
    await expect(page.getByText(/Pergunta 3 de 6/i)).toBeVisible();

    // Voltar uma
    await page.getByRole("button", { name: /Voltar/i }).click();
    await expect(page.getByText(/Pergunta 2 de 6/i)).toBeVisible();
  });
});
