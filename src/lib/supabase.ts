// Local Supabase-compatible client. No external network calls.
// Everything is backed by localStorage with seeded sample data.
export { supabase, FunctionsHttpError, resetDB } from "./local";
export type { User, Session } from "./local";
