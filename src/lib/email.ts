/**
 * Email transacional — chama a Edge Function `send-email` no Supabase
 * quando configurada; cai em log local em DEV ou sem VITE_SUPABASE_URL.
 */
import { supabase } from "@/lib/supabase";

export interface WelcomeVars {
  firstName: string;
  loginUrl?: string;
}

export interface AcessoLiberadoVars {
  firstName: string;
  productTitle: string;
  loginUrl?: string;
  orderId?: string;
  amount?: string;
}

export interface QuizAprovadoVars {
  firstName: string;
  moduleTitle: string;
  score: number;
  passingScore: number;
  productTitle: string;
}

export interface ResetSenhaVars {
  firstName: string;
}

export interface CursoConcluídoVars {
  firstName: string;
  productTitle: string;
  certificateUrl?: string;
}

export interface WaitlistWelcomeVars {
  firstName: string;
}

export interface CaptionResultVars {
  firstName: string;
  archetypeName: string;
  archetypeTagline: string;
  archetypeDescription: string;
  archetypeShadow: string;
  archetypePractice: string;
}

export type EmailTemplate =
  | { slug: "welcome"; variables: WelcomeVars }
  | { slug: "acesso-liberado"; variables: AcessoLiberadoVars }
  | { slug: "quiz-aprovado"; variables: QuizAprovadoVars }
  | { slug: "reset-senha"; variables: ResetSenhaVars }
  | { slug: "curso-concluido"; variables: CursoConcluídoVars }
  | { slug: "waitlist-welcome"; variables: WaitlistWelcomeVars }
  | { slug: "caption-result"; variables: CaptionResultVars };

export interface SendEmailOptions {
  to: string;
  template: EmailTemplate;
  metadata?: Record<string, string | number | boolean>;
}

function hasRealSupabase(): boolean {
  const url = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;
  return Boolean(url && key);
}

export async function sendEmail(options: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  if (!hasRealSupabase()) {
    if (import.meta.env?.DEV) {
      console.info(
        `[local-email] template="${options.template.slug}" to=${options.to}`,
        options.template.variables,
      );
    }
    return { ok: true };
  }

  const { variables } = options.template;
  // Edge Function só aceita string em variables (interp simples) — coerce
  // tudo pra string preservando undefined como string vazia.
  const safeVars: Record<string, string> = {};
  for (const [k, v] of Object.entries(variables)) {
    safeVars[k] = v == null ? "" : String(v);
  }

  try {
    const { error } = await supabase.functions.invoke("send-email", {
      body: { to: options.to, slug: options.template.slug, variables: safeVars },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "erro desconhecido" };
  }
}

export function sendEmailAsync(options: SendEmailOptions): void {
  sendEmail(options).catch(() => { /* silencioso */ });
}
