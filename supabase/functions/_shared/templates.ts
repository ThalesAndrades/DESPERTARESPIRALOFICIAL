// Templates HTML inline para emails transacionais.
// Variáveis: substitua {{varName}} no template.

export type TemplateSlug =
  | "welcome"
  | "acesso-liberado"
  | "checkout-abandonado"
  | "quiz-aprovado"
  | "curso-concluido"
  | "reset-senha"
  | "waitlist-welcome"
  | "caption-result"
  | "drip-1-origem"
  | "drip-2-reconhecer"
  | "drip-3-corpo"
  | "drip-4-comunidade"
  | "drip-5-prelancamento";

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

  "waitlist-welcome": (v) => ({
    subject: `${v.firstName ?? "Olá"}, recebi com carinho — sua espera começa aqui ✦`,
    html: shell("Bem-vinda à lista de espera", interp(
      h1("Que bom te ter por aqui, {{firstName}} ✦") +
      p("Eu sou Sunyan e quero te dizer: você acabou de me encontrar no momento certo.") +
      p("Você está oficialmente na lista de espera de <strong>Mulher Espiral</strong> — o método que escrevi pra mulheres que estão prontas pra voltar pra dentro, sem fórmula mágica nem urgência de performance.") +
      p("Nas próximas semanas vou te mandar, com calma, algumas reflexões e práticas que preparam o caminho. Quando as portas abrirem, você é uma das primeiras a saber — e tem prioridade nas vagas.") +
      p("Se sentir vontade, responde esse email. Eu leio de verdade.") +
      sig(),
      v,
    )),
  }),

  "caption-result": (v) => ({
    subject: `${v.firstName ?? "Você"} é ${v.archetypeName ?? "uma força viva"} ✦`,
    html: shell("Seu Poder Feminino", interp(
      h1("Você é {{archetypeName}} ✦") +
      p("<em>{{archetypeTagline}}</em>") +
      p("{{archetypeDescription}}") +
      p("<strong>O que está pedindo pra ser despertado em você:</strong>") +
      p("{{archetypeShadow}}") +
      p("<strong>Uma prática pra começar hoje:</strong>") +
      p("{{archetypePractice}}") +
      p("Quando o <strong>Mulher Espiral</strong> abrir, você é uma das primeiras a saber. Esse método foi escrito pra acolher mulheres como você — e o seu arquétipo é o ponto de partida do caminho.") +
      sig(),
      v,
    )),
  }),

  "drip-1-origem": (v) => ({
    subject: `${v.firstName ?? "Olá"}, por que escrevi Mulher Espiral 🌀`,
    html: shell("Por que escrevi", interp(
      h1("{{firstName}}, posso te contar algo?") +
      p("Antes de Mulher Espiral existir como método, ele existia como ferida.") +
      p("Eu cheguei aos 30 anos com a vida funcionando por fora e completamente desconectada por dentro. Funcionei pra todo mundo, menos pra mim. E quando me dei conta, não sabia mais como voltar pra casa do meu próprio corpo.") +
      p("Foi nesse vácuo que escrevi a primeira aula. Sem saber que viraria curso. Só pra organizar o que eu mesma precisava ouvir.") +
      p("Nos próximos dias vou te enviar um pouco do que aprendi. Sem pressa, sem fórmula. Só pra você sentir se faz sentido pra você também.") +
      p("Hoje, te deixo só uma pergunta — se sentir vontade, escreve a resposta num caderno (ou me responde esse email):") +
      p("<em>Quando foi a última vez que você se sentiu inteira?</em>") +
      sig(),
      v,
    )),
  }),

  "drip-2-reconhecer": (v) => ({
    subject: `${v.firstName ?? "Olá"}, a primeira espiral é reconhecer 🌀`,
    html: shell("Reconhecer", interp(
      h1("Antes de mudar, {{firstName}}, é preciso ver.") +
      p("A primeira espiral do método é a mais subestimada. Todo mundo quer ir direto pra ação — &quot;o que eu faço?&quot; &quot;que prática eu adoto?&quot;. Mas o caminho real começa antes.") +
      p("Começa em <strong>reconhecer</strong> os padrões que te aprisionam. Sem julgamento. Sem urgência de consertar. Só ver.") +
      p("Como você sabe quando está num padrão? Algumas pistas que costumo dar:") +
      p("• Você se pega dizendo &quot;sou assim mesmo&quot;.<br>• Você sente o corpo travar antes do ato (a respiração curta, o peito apertado).<br>• Você responde antes da pergunta terminar.<br>• Você se cobra antes de ter feito.") +
      p("Esses são sinais. Não defeitos. Cada um deles é um portal pra entender o que ainda quer ser visto em você.") +
      p("Uma prática pra essa semana: por 3 dias, escreve no fim do dia <em>uma situação em que você se viu repetindo</em>. Não precisa analisar. Só nomear.") +
      sig(),
      v,
    )),
  }),

  "drip-3-corpo": (v) => ({
    subject: `${v.firstName ?? "Olá"}, o corpo guarda o que a mente esqueceu`,
    html: shell("O corpo guarda", interp(
      h1("{{firstName}}, seu corpo já sabe.") +
      p("Tem uma frase da Bessel van der Kolk que eu carrego desde os primeiros estudos: <em>&quot;O corpo guarda o que a mente esqueceu.&quot;</em>") +
      p("Isso significa que a maior parte do que precisa ser curado em você não está em palavras. Está em tensões, em respirações curtas, em ombros encolhidos, em pélvis apertada.") +
      p("O método Mulher Espiral atravessa isso na terceira espiral — <strong>O corpo como sabedoria</strong>. Não como exercício, não como terapia. Como escuta.") +
      p("Uma prática gentil pra você experimentar hoje:") +
      p("<strong>Os 3 minutos de descida.</strong> Em pé ou sentada. Feche os olhos. Respire na barriga (não no peito). Sinta seus pés no chão. Pergunte ao seu corpo: <em>&quot;O que você quer que eu saiba agora?&quot;</em> Não force resposta. Apenas escute.") +
      p("Se vier emoção, deixa vir. O corpo só fala quando confia que vai ser ouvido.") +
      sig(),
      v,
    )),
  }),

  "drip-4-comunidade": (v) => ({
    subject: `${v.firstName ?? "Olá"}, nenhuma mulher percorre essa espiral sozinha`,
    html: shell("Comunidade", interp(
      h1("{{firstName}}, sobre estar acompanhada") +
      p("Vou te contar uma coisa que demorei pra entender: o feminino se cura em círculo.") +
      p("Nenhuma das alunas que atravessou Mulher Espiral fez sozinha. E não é só porque o curso tem aulas — é porque tem espaço seguro. Uma comunidade de mulheres no mesmo movimento, que se reconhecem, que se sustentam.") +
      p("Algumas que entraram tímidas hoje conduzem círculos. Outras nunca tinham se expresso, e descobriram a voz dentro de um post. Outras chegaram céticas, e foram transformadas pelo cuidado simples de serem ouvidas.") +
      p("Quando você entrar na turma, vai entrar nesse círculo também. Sem performance. Sem julgamento. Sem precisar &quot;estar bem&quot; pra pertencer.") +
      p("Se quiser, me responde: <em>o que faz uma comunidade ser segura pra você?</em> Eu leio cada email.") +
      sig(),
      v,
    )),
  }),

  "drip-5-prelancamento": (v) => ({
    subject: `${v.firstName ?? "Olá"}, as portas estão prestes a abrir ✦`,
    html: shell("Em breve", interp(
      h1("{{firstName}}, está chegando.") +
      p("Nessas duas semanas que eu te escrevi, você foi conhecendo um pouco do que sustenta esse método. Talvez você tenha lido todos os emails. Talvez tenha guardado pra um momento mais calmo. Tudo bem.") +
      p("O que importa é que <strong>nas próximas semanas o Mulher Espiral abre</strong> — e você, como uma das primeiras inscritas na lista, vai receber o convite antes de qualquer pessoa. Com prioridade nas vagas e condição especial de pré-venda.") +
      p("Antes disso, eu queria te deixar mais uma pergunta — e te convidar a respondê-la com calma, talvez nos próximos dias:") +
      p("<em>O que você espera dessa jornada? O que você gostaria que estivesse diferente em você, daqui a alguns meses?</em>") +
      p("Não é pra me responder — é pra você. Anota num caderno, num bilhete, num post-it na geladeira. Quanto mais clara está a intenção, mais o caminho se desenha.") +
      p("Te vejo do outro lado em breve.") +
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
