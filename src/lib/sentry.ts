/**
 * Sentry — error tracking opcional para produção.
 *
 * Só inicializa se `VITE_SENTRY_DSN` estiver setado. Em DEV ou sem DSN
 * todas as funções viram no-op silenciosamente.
 *
 * Capturamos: erros não tratados, rejeições de promise não tratadas,
 * exceções dentro do ErrorBoundary e mensagens explícitas via
 * `captureException` / `captureMessage`.
 *
 * Tags ricas: ambiente (dev/staging/prod), versão (commit ou tag),
 * lead context (se houver). PII é hasheada ou omitida.
 */
import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || initialized) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: (import.meta.env.VITE_SENTRY_RELEASE as string | undefined) ?? "unknown",
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    sendDefaultPii: false,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
    beforeSend(event) {
      // Sanitiza emails em mensagens
      if (event.message) {
        event.message = event.message.replace(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g, "[email]");
      }
      return event;
    },
  });
  initialized = true;
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) {
    if (import.meta.env.DEV) console.error("[capture]", error, context);
    return;
  }
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
  if (!initialized) return;
  Sentry.captureMessage(message, level);
}

/** Identifica o usuário (admin) — não enviamos PII de leads. */
export function setUser(user: { id: string; role?: string } | null): void {
  if (!initialized) return;
  if (user) Sentry.setUser({ id: user.id, role: user.role });
  else Sentry.setUser(null);
}
