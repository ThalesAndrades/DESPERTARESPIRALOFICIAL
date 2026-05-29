import { describe, it, expect } from "vitest";
import { sha256 } from "@/lib/analytics/hash";

describe("analytics/hash.sha256", () => {
  it("retorna o hash SHA-256 hex correto de 'sunyan@espiral.com'", async () => {
    // Conferido com: printf "sunyan@espiral.com" | sha256sum
    expect(await sha256("sunyan@espiral.com")).toBe(
      "517fb785ca249e89cb1f27c6841a10f2ed7babefc0595019b94904cb3d755d1e",
    );
  });

  it("normaliza pra lowercase e trim antes do hash (Meta Advanced Matching)", async () => {
    const a = await sha256("Sunyan@Espiral.com");
    const b = await sha256("  sunyan@espiral.com   ");
    const c = await sha256("sunyan@espiral.com");
    expect(a).toBe(c);
    expect(b).toBe(c);
  });

  it("produz strings hexadecimais de 64 caracteres", async () => {
    const h = await sha256("qualquer-coisa-aleatória-aqui");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes diferentes para entradas diferentes", async () => {
    const a = await sha256("a@b.com");
    const b = await sha256("c@d.com");
    expect(a).not.toBe(b);
  });
});
