// Local stub. No real email provider — messages are logged in DEV.

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

export type EmailTemplate =
  | { slug: "welcome"; variables: WelcomeVars }
  | { slug: "acesso-liberado"; variables: AcessoLiberadoVars }
  | { slug: "quiz-aprovado"; variables: QuizAprovadoVars }
  | { slug: "reset-senha"; variables: ResetSenhaVars }
  | { slug: "curso-concluido"; variables: CursoConcluídoVars };

export interface SendEmailOptions {
  to: string;
  template: EmailTemplate;
  metadata?: Record<string, string | number | boolean>;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  if (import.meta.env?.DEV) {
    console.info(
      `[local-email] template="${options.template.slug}" to=${options.to}`,
      options.template.variables
    );
  }
  return { ok: true };
}

export function sendEmailAsync(options: SendEmailOptions): void {
  sendEmail(options).catch(() => {});
}
