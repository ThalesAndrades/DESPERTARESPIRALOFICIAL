/**
 * Gera um arquivo `.ics` mínimo (RFC 5545) que funciona em Google
 * Calendar, Apple Calendar e Outlook. Datas em UTC sem timezone
 * embutido — a maioria dos clients respeita Z corretamente.
 */
export interface ICSEvent {
  start: Date;
  end?: Date;          // default: start + 1h
  title: string;
  description?: string;
  url?: string;
  location?: string;
}

function fmt(d: Date): string {
  return d.toISOString().replace(/[-:]|\.\d{3}/g, "");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function generateICS(event: ICSEvent): string {
  const end = event.end ?? new Date(event.start.getTime() + 60 * 60_000);
  const uid = `${event.start.getTime()}@despertarespiral.com`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Despertar Espiral//pt-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(event.start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeText(event.description)}` : "",
    event.url ? `URL:${event.url}` : "",
    event.location ? `LOCATION:${escapeText(event.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function downloadICS(event: ICSEvent, filename = "evento.ics"): void {
  const content = generateICS(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
