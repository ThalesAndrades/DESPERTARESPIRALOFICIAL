import { describe, it, expect } from "vitest";
import { snapshotCountdown } from "@/lib/countdown";

describe("countdown.snapshotCountdown", () => {
  it("decompõe um delta positivo em dias/horas/minutos/segundos", () => {
    const now = new Date("2026-05-29T00:00:00.000Z");
    const target = new Date("2026-05-31T03:04:05.000Z");
    const snap = snapshotCountdown(target, now);
    expect(snap.days).toBe(2);
    expect(snap.hours).toBe(3);
    expect(snap.minutes).toBe(4);
    expect(snap.seconds).toBe(5);
    expect(snap.finished).toBe(false);
    expect(snap.total).toBe(target.getTime() - now.getTime());
  });

  it("retorna zerado e finished=true quando o alvo já passou", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    const target = new Date("2026-05-31T00:00:00.000Z");
    const snap = snapshotCountdown(target, now);
    expect(snap.days).toBe(0);
    expect(snap.hours).toBe(0);
    expect(snap.minutes).toBe(0);
    expect(snap.seconds).toBe(0);
    expect(snap.finished).toBe(true);
    expect(snap.total).toBe(0);
  });

  it("aceita string ISO 8601 como alvo", () => {
    const now = new Date("2026-05-29T00:00:00.000Z");
    const snap = snapshotCountdown("2026-05-30T00:00:00.000Z", now);
    expect(snap.days).toBe(1);
    expect(snap.hours).toBe(0);
  });

  it("é finished true exatamente no instante zero", () => {
    const now = new Date("2026-05-29T12:00:00.000Z");
    const snap = snapshotCountdown(now, now);
    expect(snap.finished).toBe(true);
    expect(snap.total).toBe(0);
  });
});
