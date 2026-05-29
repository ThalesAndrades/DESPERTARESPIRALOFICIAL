import { describe, it, expect, beforeEach } from "vitest";
import { captureAttribution, getAttribution } from "@/lib/analytics/attribution";

/**
 * O setup global de testes (src/test/setup.ts) substitui window.location por
 * um objeto plano — não dá pra usar history.replaceState aqui. Mexemos
 * diretamente em location.search, que é o que `captureAttribution` lê.
 */
function setSearch(qs: string) {
  (window.location as { search: string }).search = qs.startsWith("?") || qs === "" ? qs : `?${qs}`;
}

describe("analytics/attribution", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    setSearch("");
  });

  it("getAttribution devolve objeto vazio quando nada foi capturado", () => {
    expect(getAttribution()).toEqual({});
  });

  it("captureAttribution persiste UTMs presentes na URL", () => {
    setSearch("utm_source=meta&utm_medium=cpc&utm_campaign=teste");
    captureAttribution();
    const attr = getAttribution();
    expect(attr.utm_source).toBe("meta");
    expect(attr.utm_medium).toBe("cpc");
    expect(attr.utm_campaign).toBe("teste");
  });

  it("captureAttribution persiste click ids (gclid/fbclid/ttclid)", () => {
    setSearch("gclid=AAA&fbclid=BBB&ttclid=CCC");
    captureAttribution();
    const attr = getAttribution();
    expect(attr.gclid).toBe("AAA");
    expect(attr.fbclid).toBe("BBB");
    expect(attr.ttclid).toBe("CCC");
  });

  it("ignora parâmetros desconhecidos", () => {
    setSearch("foo=bar&utm_source=meta");
    captureAttribution();
    const attr = getAttribution() as Record<string, string | undefined>;
    expect(attr.foo).toBeUndefined();
    expect(attr.utm_source).toBe("meta");
  });

  it("não grava sessionStorage quando nada foi encontrado", () => {
    setSearch("");
    captureAttribution();
    expect(window.sessionStorage.getItem("ds_attribution")).toBeNull();
  });

  it("preserva o snapshot anterior se a próxima visita não trouxer UTM novo", () => {
    setSearch("utm_source=meta&utm_campaign=primeira");
    captureAttribution();
    setSearch("");
    captureAttribution(); // não sobrescreve com vazio
    expect(getAttribution().utm_source).toBe("meta");
    expect(getAttribution().utm_campaign).toBe("primeira");
  });
});
