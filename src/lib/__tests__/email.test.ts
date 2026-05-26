import { describe, it, expect } from "vitest";
import { sendEmail, sendEmailAsync } from "@/lib/email";

describe("sendEmail (local stub)", () => {
  it("resolves successfully for every template", async () => {
    const r = await sendEmail({
      to: "user@example.com",
      template: { slug: "welcome", variables: { firstName: "Maria" } },
    });
    expect(r.ok).toBe(true);
  });

  it("accepts metadata without throwing", async () => {
    const r = await sendEmail({
      to: "user@example.com",
      template: {
        slug: "quiz-aprovado",
        variables: {
          firstName: "Maria",
          moduleTitle: "Módulo 1",
          score: 90,
          passingScore: 70,
          productTitle: "Mulher Espiral",
        },
      },
      metadata: { source: "test" },
    });
    expect(r.ok).toBe(true);
  });

  it("sendEmailAsync does not throw and returns void", () => {
    expect(() =>
      sendEmailAsync({
        to: "user@example.com",
        template: { slug: "reset-senha", variables: { firstName: "Maria" } },
      })
    ).not.toThrow();
  });
});
