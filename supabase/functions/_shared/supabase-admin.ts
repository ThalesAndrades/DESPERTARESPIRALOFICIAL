import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Cliente do Supabase com service_role — usado dentro de Edge Functions
 * para operações que precisam contornar RLS (webhooks, etc.).
 * NUNCA exponha a service_role no client.
 */
export function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Cliente com o token JWT da usuária — respeita RLS */
export function getUserClient(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias");
  }
  return createClient(url, anonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
