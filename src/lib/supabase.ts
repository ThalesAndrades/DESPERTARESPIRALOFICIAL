/**
 * Cliente híbrido — usa Supabase real quando VITE_SUPABASE_URL/ANON_KEY estão
 * configuradas; caso contrário cai pro backend local em localStorage.
 *
 * O mesmo código de páginas/hooks funciona em ambos os modos porque a API
 * exposta é compatível.
 */
import {
  supabase as localClient,
  FunctionsHttpError as LocalFnError,
  resetDB,
} from "./local";
import type { User as LocalUser, Session as LocalSession } from "./local";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let realClient: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let realFnError: any = null;

if (SUPABASE_URL && SUPABASE_ANON) {
  // Import dinâmico — só puxa o supabase-js do bundle quando há configuração real
  const sup = await import("@supabase/supabase-js");
  realClient = sup.createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  realFnError = sup.FunctionsHttpError;
}

export const supabase = realClient ?? localClient;
export const isRealBackend = Boolean(realClient);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FunctionsHttpError: any = realFnError ?? LocalFnError;

export type User = LocalUser;
export type Session = LocalSession;
export { resetDB };

if (import.meta.env.DEV) {
  console.info(`[supabase] modo: ${isRealBackend ? "Supabase real" : "localStorage"}`);
}
