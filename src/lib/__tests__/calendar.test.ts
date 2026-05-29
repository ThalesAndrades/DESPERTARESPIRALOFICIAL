import { describe, it, expect } from "vitest";
import { generateICS } from "@/lib/calendar";

describe("calendar.generateICS", () => {
  const start = new Date("2026-07-15T23:00:00.000Z");

  it("inclui blocos VCALENDAR/VEVENT obrigatórios", () => {
    const ics = generateICS({ start, title: "Abertura" });
    expect(ics).toMatch(/BEGIN:VCALENDAR/);
    expect(ics).toMatch(/END:VCALENDAR/);
    expect(ics).toMatch(/BEGIN:VEVENT/);
    expect(ics).toMatch(/END:VEVENT/);
    expect(ics).toMatch(/VERSION:2\.0/);
  });

  it("formata DTSTART em UTC compacto e usa CRLF entre linhas", () => {
    const ics = generateICS({ start, title: "Abertura" });
    expect(ics).toMatch(/DTSTART:20260715T230000Z/);
    expect(ics.split("\r\n").length).toBeGreaterThan(8);
  });

  it("calcula DTEND padrão como start + 1h quando end não é informado", () => {
    const ics = generateICS({ start, title: "Abertura" });
    expect(ics).toMatch(/DTEND:20260716T000000Z/);
  });

  it("respeita end explícito", () => {
    const ics = generateICS({
      start,
      end: new Date("2026-07-22T23:00:00.000Z"),
      title: "Semana",
    });
    expect(ics).toMatch(/DTEND:20260722T230000Z/);
  });

  it("escapa vírgula, ponto-e-vírgula e nova linha no summary/description", () => {
    const ics = generateICS({
      start,
      title: "Tudo, junto; agora",
      description: "linha 1\nlinha 2; com vírgula, sim",
    });
    expect(ics).toMatch(/SUMMARY:Tudo\\, junto\\; agora/);
    expect(ics).toMatch(/DESCRIPTION:linha 1\\nlinha 2\\; com vírgula\\, sim/);
  });

  it("omite campos opcionais quando ausentes", () => {
    const ics = generateICS({ start, title: "Mínimo" });
    expect(ics).not.toMatch(/^DESCRIPTION:/m);
    expect(ics).not.toMatch(/^URL:/m);
    expect(ics).not.toMatch(/^LOCATION:/m);
  });

  it("inclui URL e LOCATION quando presentes", () => {
    const ics = generateICS({
      start,
      title: "Com link",
      url: "https://despertarespiral.com/abrir",
      location: "Online",
    });
    expect(ics).toMatch(/URL:https:\/\/despertarespiral\.com\/abrir/);
    expect(ics).toMatch(/LOCATION:Online/);
  });

  it("usa UID estável baseado no timestamp do start", () => {
    const a = generateICS({ start, title: "A" });
    const b = generateICS({ start, title: "B" });
    const uidA = a.match(/UID:(\S+)/)?.[1];
    const uidB = b.match(/UID:(\S+)/)?.[1];
    expect(uidA).toBe(uidB);
    expect(uidA).toContain("@despertarespiral.com");
  });
});
