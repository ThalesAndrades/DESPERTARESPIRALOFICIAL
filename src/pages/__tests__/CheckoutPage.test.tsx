/**
 * Integration Tests — CheckoutPage (pré-lançamento)
 *
 * A rota /checkout/:slug agora exibe um estado de pré-lançamento.
 * Não há pagamentos enquanto a primeira turma não abre.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("@/components/layout/SpiralLogo", () => ({
  default: () => <div data-testid="spiral-logo" />,
}));

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

vi.mock("@/lib/analytics", () => ({
  getAttribution: () => ({}),
}));

vi.mock("@/lib/sequenzy", () => ({
  fireEventAsync: vi.fn(),
}));

import CheckoutPage from "../CheckoutPage";

function renderRoute(slug = "mulher-espiral") {
  return render(
    <MemoryRouter initialEntries={[`/checkout/${slug}`]}>
      <Routes>
        <Route path="/checkout/:slug" element={<CheckoutPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CheckoutPage — pré-lançamento", () => {
  it("renders pre-launch headline", () => {
    renderRoute();
    expect(screen.getByText(/As vagas ainda não estão abertas/i)).toBeInTheDocument();
  });

  it("renders waitlist CTA button", () => {
    renderRoute();
    expect(screen.getByRole("button", { name: /entrar na lista do pré-lançamento/i })).toBeInTheDocument();
  });

  it("opens waitlist modal when CTA is clicked", async () => {
    const user = userEvent.setup();
    renderRoute();
    await user.click(screen.getByRole("button", { name: /entrar na lista do pré-lançamento/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("provides a link back to the home page", () => {
    renderRoute();
    const homeLink = screen.getByRole("link", { name: /voltar para a home/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
