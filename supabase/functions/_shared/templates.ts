// Templates HTML inline para emails transacionais.
// Variáveis: substitua {{varName}} no template.

export type TemplateSlug =
  | "welcome"
  | "acesso-liberado"
  | "checkout-abandonado"
  | "quiz-aprovado"
  | "curso-concluido"
  | "reset-senha";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://despertarespiral.com";

function shell(title: string, content: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#fdfaf3;font-family:Georgia,'Times New Roman',serif;color:#04060f">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(4,6,15,0.06)">
        <tr><td style="padding:28px 32px 8px;border-bottom:1px solid #f0e8d8">
          <div style="font-family:'Helvetica Neue',sans-serif;font-size:9px;letter-spacing:0.30em;color:#c6a870;text-transform:uppercase">Despertar Espiral</div>
        </td></tr>
        <tr><td style="padding:32px">${content}</td></tr>
        <tr><td style="padding:18px 32px;background:#fdfaf3;border-top:1px solid #f0e8d8;font-size:11px;color:#a89c80;line-height:1.6;font-family:'Helvetica Neue',sans-serif">
          Você está recebendo este email porque tem uma conta em <a href="${SITE_URL}" style="color:#8a6d3b;text-decoration:none">despertarespiral.com</a>.<br>
          Para parar de receber, responda com "remover".
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function h1(text: string): string {
  return `<h1 style="font-weight:300;font-size:32px;line-height:1.15;color:#8a6d3b;margin:0 0 16px;letter-spacing:-0.01em">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="font-size:16px;line-height:1.7;color:#3a3a3a;margin:0 0 16px">${text}</p>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:28px 0 8px"><a href="${href}" style="display:inline-block;padding:16px 36px;background:#c6a870;color:#04060f;text-decoration:none;border-radius:10px;font-family:'Helvetica Neue',sans-serif;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;font-size:11px">${label}</a></p>`;
}

function sig(): string {
  return `<p style="margin:32px 0 0;font-style:italic;color:#8a8378;font-size:14px">Que essa espiral seja luz pra você,<br><strong style="font-style:normal;color:#3a3a3a">Sunyan</strong></p>`;
}

function interp(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

interface Template { subject: string; html: string; }

const TEMPLATES: Record<TemplateSlug, (v: Record<string, string>) => Template> = {
  welcome: (v) => ({
    subject: `${v.firstName ?? "Olá"}, sua jornada começa agora ✦`,
    html: shell("Bem-vinda", interp(
      h1("Bem-vinda, {{firstName}} ✦") +
      p("Que bom te ver por aqui. Você acabou de dar o primeiro passo para uma jornada de reconexão profunda com a sua essência feminina.") +
      p("No seu painel você encontra os primeiros conteúdos e o convite para a comunidade.") +
      button(`${SITE_URL}/dashboard`, "Entrar no painel") +
      sig(),
      v,
    )),
  }),

  "acesso-liberado": (v) => ({
    subject: `${v.firstName ?? "Olá"}, seu acesso a ${v.productTitle ?? "Despertar Espiral"} foi liberado ✦`,
    html: shell("Acesso liberado", interp(
      h1("Tudo certo, {{firstName}} ✦") +
      p("Seu pagamento foi confirmado e você tem acesso completo a <strong>{{productTitle}}</strong>.") +
      p("Vá no seu painel e comece pela primeira aula. Se preferir, marque uma constante de 20 minutos por dia.") +
      button(`${SITE_URL}/dashboard`, "Começar agora") +
      sig(),
      v,
    )),
  }),

  "checkout-abandonado": (v) => ({
    subject: `${v.firstName ?? "Olá"}, sua jornada está esperando 🌀`,
    html: shell("Checkout abandonado", interp(
      h1("{{firstName}}, ficou alguma dúvida?") +
      p("Vi que você começou seu acesso a <strong>{{productTitle}}</strong> mas não finalizou. Se foi algo que não ficou claro, me responde — leio cada email.") +
      p("Se preferir retomar o pedido:") +
      button(`${SITE_URL}/checkout/{{productSlug}}`, "Continuar minha jornada") +
      sig(),
      v,
    )),
  }),

  "quiz-aprovado": (v) => ({
    subject: `Você concluiu o módulo "${v.moduleTitle ?? ""}" ✦`,
    html: shell("Quiz aprovado", interp(
      h1("Parabéns, {{firstName}} ✦") +
      p("Você concluiu o módulo <strong>{{moduleTitle}}</strong> de {{productTitle}} com {{score}}% de acerto. Continue na sua espiral.") +
      button(`${SITE_URL}/dashboard`, "Próximo módulo") +
      sig(),
      v,
    )),
  }),

  "curso-concluido": (v) => ({
    subject: `${v.firstName ?? ""}, você concluiu ${v.productTitle ?? ""} ✦`,
    html: shell("Curso concluído", interp(
      h1("Você completou {{productTitle}} ✦") +
      p("Que jornada, {{firstName}}. Você concluiu todas as aulas. Seu certificado está pronto para baixar.") +
      button(`${SITE_URL}/products/{{productSlug}}/certificado`, "Baixar certificado") +
      sig(),
      v,
    )),
  }),

  "reset-senha": (v) => ({
    subject: "Recuperação de senha — Despertar Espiral",
    html: shell("Recuperação de senha", interp(
      h1("Recuperação de senha") +
      p("Você (ou alguém) pediu para redefinir sua senha. Se foi você, clique no botão abaixo:") +
      button("{{resetUrl}}", "Redefinir senha") +
      p("Se não foi você, ignore este email — sua conta segue segura.") +
      sig(),
      v,
    )),
  }),
};

export function renderTemplate(slug: TemplateSlug, variables: Record<string, string>): Template {
  const fn = TEMPLATES[slug];
  if (!fn) throw new Error(`Template "${slug}" não existe`);
  return fn(variables);
}
