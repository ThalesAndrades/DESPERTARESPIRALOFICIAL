/**
 * Helpers do countdown — calcula o delta até a data alvo, divide em
 * dias/horas/minutos/segundos e expõe um snapshot consumível por React.
 */
export interface CountdownSnapshot {
  total: number; // milissegundos restantes (negativo se já passou)
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  finished: boolean;
}

export function snapshotCountdown(target: Date | string, now: Date = new Date()): CountdownSnapshot {
  const t = typeof target === "string" ? new Date(target) : target;
  const total = Math.max(0, t.getTime() - now.getTime());
  const finished = t.getTime() - now.getTime() <= 0;

  const days    = Math.floor(total / 86_400_000);
  const hours   = Math.floor((total % 86_400_000) / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);

  return { total, days, hours, minutes, seconds, finished };
}
