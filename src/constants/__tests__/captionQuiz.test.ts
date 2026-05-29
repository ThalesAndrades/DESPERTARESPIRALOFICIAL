import { describe, it, expect } from "vitest";
import {
  ARCHETYPES, CAPTION_QUESTIONS, computeArchetype, type Archetype,
} from "@/constants/captionQuiz";

describe("captionQuiz.computeArchetype", () => {
  it("retorna 'mistica' como fallback estável quando ninguém marca pontos", () => {
    expect(computeArchetype(["sem", "match", "nenhum", "x", "y", "z"])).toBe("mistica");
  });

  it("escolhe Guerreira quando respondem como guerreira nas 6 perguntas", () => {
    const respostas = CAPTION_QUESTIONS.map((q) => {
      const guerreira = q.options.find((o) => (o.scores.guerreira ?? 0) > 0);
      return (guerreira ?? q.options[0]).label;
    });
    expect(computeArchetype(respostas)).toBe("guerreira");
  });

  it("escolhe Sábia quando respondem como sabia nas 6 perguntas", () => {
    const respostas = CAPTION_QUESTIONS.map((q) => {
      const sabia = q.options.find((o) => (o.scores.sabia ?? 0) > 0);
      return (sabia ?? q.options[0]).label;
    });
    expect(computeArchetype(respostas)).toBe("sabia");
  });

  it("respeita o label exato (matching por string crua, não índice)", () => {
    expect(computeArchetype(["nao-existe-no-quiz"])).toBe("mistica");
  });

  it("cada arquétipo tem todos os campos obrigatórios preenchidos", () => {
    const keys: Archetype[] = ["mistica", "guerreira", "mae_terra", "amante", "sabia", "selvagem"];
    for (const k of keys) {
      const a = ARCHETYPES[k];
      expect(a.name).toBeTruthy();
      expect(a.tagline).toBeTruthy();
      expect(a.description.length).toBeGreaterThan(80);
      expect(a.shadow.length).toBeGreaterThan(80);
      expect(a.practice.length).toBeGreaterThan(20);
      expect(a.strengths.length).toBeGreaterThanOrEqual(3);
      expect(a.glyph).toBeTruthy();
      expect(a.hueA).toMatch(/^#[0-9a-f]{6}$/i);
      expect(a.hueB).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("CAPTION_QUESTIONS", () => {
  it("tem 6 perguntas com mínimo de 4 opções cada", () => {
    expect(CAPTION_QUESTIONS).toHaveLength(6);
    for (const q of CAPTION_QUESTIONS) {
      expect(q.options.length).toBeGreaterThanOrEqual(4);
      expect(q.prompt.length).toBeGreaterThan(10);
    }
  });

  it("cada opção contribui pontuação a pelo menos um arquétipo", () => {
    for (const q of CAPTION_QUESTIONS) {
      for (const o of q.options) {
        const total = Object.values(o.scores).reduce((s, v) => s + (v ?? 0), 0);
        expect(total).toBeGreaterThan(0);
      }
    }
  });
});
