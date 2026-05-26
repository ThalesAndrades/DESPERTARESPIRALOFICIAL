// Local stub. No external CRM in this build — events are logged in DEV.

interface FireEventOptions {
  email: string;
  firstName?: string;
  properties?: Record<string, string | number | boolean | null>;
  customAttributes?: Record<string, string | number | boolean | null>;
}

export async function fireEvent(event: string, options: FireEventOptions): Promise<void> {
  if (import.meta.env?.DEV) {
    console.info(`[local-crm] event "${event}":`, options);
  }
}

export function fireEventAsync(event: string, options: FireEventOptions): void {
  fireEvent(event, options).catch(() => {});
}
