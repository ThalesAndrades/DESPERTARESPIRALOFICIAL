/**
 * Teste de Poder Feminino — quiz arquetípico para a landing /caption.
 *
 * Cada resposta soma pontos em até 2 arquétipos. No final, o arquétipo
 * com maior pontuação vira o resultado. Estrutura calibrada pra ter
 * variedade — toda combinação aterrissa em algum lugar coerente.
 */

export type Archetype =
  | "mistica"
  | "guerreira"
  | "mae_terra"
  | "amante"
  | "sabia"
  | "selvagem";

export interface Question {
  id: string;
  prompt: string;
  subtitle?: string;
  options: Array<{
    label: string;
    description?: string;
    scores: Partial<Record<Archetype, number>>;
  }>;
}

export const CAPTION_QUESTIONS: Question[] = [
  {
    id: "manha",
    prompt: "Quando você acorda em um dia que pode ser inteiramente seu, o que mais te chama?",
    subtitle: "Não tem resposta certa — escolha pelo que pulsa, não pelo que parece bonito.",
    options: [
      { label: "Silêncio, vela, uma página em branco.", scores: { mistica: 2, sabia: 1 } },
      { label: "Mexer o corpo, suar, sair pra rua.", scores: { guerreira: 2, selvagem: 1 } },
      { label: "Cozinhar, regar plantas, arrumar a casa.", scores: { mae_terra: 2 } },
      { label: "Tomar banho longo, passar perfume, me arrumar pra mim.", scores: { amante: 2 } },
      { label: "Ler, estudar, organizar ideias num caderno.", scores: { sabia: 2, mistica: 1 } },
      { label: "Sair sem destino, ouvir música alto, dançar.", scores: { selvagem: 2, amante: 1 } },
    ],
  },
  {
    id: "presenca",
    prompt: "Como as pessoas costumam descrever a sua presença?",
    options: [
      { label: "\"Você tem algo de misterioso.\"", scores: { mistica: 2 } },
      { label: "\"Você é forte, decidida.\"", scores: { guerreira: 2 } },
      { label: "\"Perto de você eu me sinto em casa.\"", scores: { mae_terra: 2 } },
      { label: "\"Você é magnética, sensual.\"", scores: { amante: 2 } },
      { label: "\"Você é sábia, sempre sabe o que dizer.\"", scores: { sabia: 2 } },
      { label: "\"Você é livre, intensa, indomável.\"", scores: { selvagem: 2 } },
    ],
  },
  {
    id: "ferida",
    prompt: "Qual ferida você sente que ainda carrega da sua história de mulher?",
    subtitle: "Respira. Essa é a parte que ninguém pergunta.",
    options: [
      {
        label: "Me desconectei da minha intuição. Acho que não confio mais nela.",
        scores: { mistica: 2, sabia: 1 },
      },
      {
        label: "Aprendi a ser forte demais. Tenho dificuldade de pedir colo.",
        scores: { guerreira: 2 },
      },
      {
        label: "Cuido de todo mundo, menos de mim.",
        scores: { mae_terra: 2 },
      },
      {
        label: "Me desconectei do meu corpo, do meu prazer.",
        scores: { amante: 2, selvagem: 1 },
      },
      {
        label: "Penso demais. Vivo na cabeça, longe do peito.",
        scores: { sabia: 2 },
      },
      {
        label: "Me amansaram. Esqueci como rugir.",
        scores: { selvagem: 2, guerreira: 1 },
      },
    ],
  },
  {
    id: "noite",
    prompt: "Antes de dormir, qual pensamento mais aparece?",
    options: [
      { label: "Sonhos vívidos, símbolos, sincronicidades.", scores: { mistica: 2 } },
      { label: "Listas, planos, próximas conquistas.", scores: { guerreira: 1, sabia: 1 } },
      { label: "Como cuidar de quem amo amanhã.", scores: { mae_terra: 2 } },
      { label: "Saudade de ser tocada, desejada, vista.", scores: { amante: 2 } },
      { label: "Reflexões sobre o sentido das coisas.", scores: { sabia: 2 } },
      { label: "Uma inquietação que não tem nome.", scores: { selvagem: 2, mistica: 1 } },
    ],
  },
  {
    id: "elemento",
    prompt: "Se você pudesse escolher um elemento da natureza pra te representar agora, qual seria?",
    options: [
      { label: "Lua — ciclos, mistério, espelho.", scores: { mistica: 2 } },
      { label: "Fogo — coragem, luta, criação.", scores: { guerreira: 2, selvagem: 1 } },
      { label: "Terra — raiz, sustento, gestação.", scores: { mae_terra: 2 } },
      { label: "Água — fluidez, prazer, sedução.", scores: { amante: 2 } },
      { label: "Ar — clareza, voz, pensamento.", scores: { sabia: 2 } },
      { label: "Floresta — instinto, mistério selvagem.", scores: { selvagem: 2, mistica: 1 } },
    ],
  },
  {
    id: "vontade",
    prompt: "O que você mais quer recuperar dentro de você?",
    options: [
      { label: "Minha intuição e conexão com o invisível.", scores: { mistica: 2 } },
      { label: "Minha força, minha potência de ação.", scores: { guerreira: 2 } },
      { label: "Meu acolhimento, meu colo pra mim mesma.", scores: { mae_terra: 2 } },
      { label: "Meu prazer, meu desejo, minha sensualidade.", scores: { amante: 2 } },
      { label: "Minha clareza, minha sabedoria interior.", scores: { sabia: 2 } },
      { label: "Minha liberdade, meu instinto selvagem.", scores: { selvagem: 2 } },
    ],
  },
];

export interface ArchetypeProfile {
  key: Archetype;
  name: string;
  tagline: string;
  symbol: string;
  hueA: string;     // gradient start
  hueB: string;     // gradient end
  glyph: string;    // unicode/symbol
  description: string;
  strengths: string[];
  shadow: string;
  practice: string;
}

export const ARCHETYPES: Record<Archetype, ArchetypeProfile> = {
  mistica: {
    key: "mistica",
    name: "A Mística",
    tagline: "A guardiã do invisível",
    symbol: "Lua",
    hueA: "#2d2a52",
    hueB: "#7c4d92",
    glyph: "☾",
    description:
      "Você é uma mulher que sente o que ainda não foi dito. Sua percepção atravessa a superfície — você lê silêncios, sente energias, decifra sonhos. Sua força não está no que você faz, mas no que você sabe sem precisar provar. O seu poder mora na escuta sutil, na intuição, na conexão com o sagrado.",
    strengths: [
      "Intuição apurada — você sente as coisas antes de entender.",
      "Conexão com o invisível, com símbolos e sincronicidades.",
      "Profundidade emocional — pessoas se abrem perto de você.",
      "Capacidade de transmutação — você transforma dor em sabedoria.",
    ],
    shadow:
      "Sua sombra é a desconexão do mundo concreto. Quando você se afasta demais da terra, vira fantasma de si mesma — sonhando muito, vivendo pouco. Resgatar a Mística pede também resgatar o corpo, a ação, a presença encarnada.",
    practice:
      "Mantenha um caderno só de sonhos por 21 dias. Acorde, anote uma palavra. Você vai começar a ouvir o seu próprio oráculo interno.",
  },
  guerreira: {
    key: "guerreira",
    name: "A Guerreira",
    tagline: "A que ergue espada por si mesma",
    symbol: "Fogo",
    hueA: "#5a1a2e",
    hueB: "#c0455e",
    glyph: "✦",
    description:
      "Você é uma mulher feita pra ação. Tem coragem, foco, capacidade de decidir sob pressão. Quando você quer algo, vai. O mundo te ensinou a sustentar, lutar, conquistar. Sua força é visível — está nos seus ombros, na sua mandíbula, na firmeza com que você atravessa.",
    strengths: [
      "Coragem para tomar decisões difíceis.",
      "Capacidade de proteger o que ama — sem hesitação.",
      "Disciplina, foco, resultados.",
      "Inspira respeito apenas por existir.",
    ],
    shadow:
      "Sua sombra é a armadura que vira segunda pele. Você pode esquecer de baixar a guarda, de pedir colo, de ser cuidada. O resgate da Guerreira passa por permitir suavidade — sem perder a espada.",
    practice:
      "Uma vez por semana, faça algo só por prazer, sem produtividade nenhuma. Banho longo, dormir tarde sem culpa, comer com as mãos. Reaprenda a desarmar.",
  },
  mae_terra: {
    key: "mae_terra",
    name: "A Mãe-Terra",
    tagline: "A que sustenta com raiz e colo",
    symbol: "Terra",
    hueA: "#3a3018",
    hueB: "#8f7440",
    glyph: "✿",
    description:
      "Você é o solo onde a vida cresce. Tem raízes profundas, é o porto seguro de quem te cerca. Sua presença acalma, cura, organiza o caos. Você sabe cuidar, alimentar, sustentar — e faz isso com uma generosidade que parece infinita.",
    strengths: [
      "Capacidade de criar lares, vínculos, comunidades.",
      "Generosidade prática — você cuida com ações concretas.",
      "Estabilidade emocional — você é refúgio.",
      "Fertilidade criativa — você dá vida a projetos, ideias, pessoas.",
    ],
    shadow:
      "Sua sombra é a entrega sem volta. Você cuida de todos, mas esquece quem cuida de você. Pode adoecer de doação. O resgate da Mãe-Terra é aprender a se incluir no círculo do cuidado — colocar seu nome primeiro na lista.",
    practice:
      "Crie um ritual diário de 15 minutos só pra você — chá, leitura, alongamento. Não negocia. Esses minutos são o solo de toda a sua doação.",
  },
  amante: {
    key: "amante",
    name: "A Amante",
    tagline: "A que vive no fio do desejo",
    symbol: "Água",
    hueA: "#5a1f3d",
    hueB: "#d4729e",
    glyph: "❀",
    description:
      "Você é uma mulher feita de água e fogo, prazer e profundidade. Sua sensualidade não é performática — é uma forma de estar no mundo. Você sente intensamente, ama profundamente, deseja sem pedir desculpa. O seu poder está em habitar o corpo, viver com beleza, transformar o cotidiano em ritual.",
    strengths: [
      "Sensorialidade — você toca o mundo com todos os sentidos.",
      "Magnetismo natural — você atrai sem esforço.",
      "Capacidade de viver intensamente o presente.",
      "Talento pra beleza, estética, prazer.",
    ],
    shadow:
      "Sua sombra é a entrega ao outro como única fonte de prazer. Quando você espera que o desejo venha de fora, vira refém. O resgate da Amante é redescobrir o prazer de existir — sem precisar de plateia.",
    practice:
      "Por 7 dias, escolha uma sensação por dia (cheiro, textura, gosto) e dedique 5 minutos a ela. Reconecte-se com o seu corpo como território de prazer.",
  },
  sabia: {
    key: "sabia",
    name: "A Sábia",
    tagline: "A que conhece a si mesma",
    symbol: "Ar",
    hueA: "#26354a",
    hueB: "#6b8eaa",
    glyph: "✧",
    description:
      "Você é uma mulher que pensa, observa, decifra. Tem uma mente clara, capaz de organizar o que parece caótico. Sua força é a sabedoria — não a teórica, mas a vivida. Você aprendeu nas dobras da própria vida e isso te tornou conselheira de muitas mulheres.",
    strengths: [
      "Clareza mental — você vê o que outros não veem.",
      "Capacidade de articulação e comunicação.",
      "Visão de longo prazo, estratégica.",
      "Conselhos profundos — sem floreios.",
    ],
    shadow:
      "Sua sombra é viver da cabeça pra cima. Você pode usar a sabedoria pra controlar, pra evitar sentir. O resgate da Sábia passa por descer da mente pro peito, e do peito pro ventre.",
    practice:
      "Por 14 dias, antes de tomar qualquer decisão, pergunte: 'O que meu corpo sente sobre isso?' Espere a resposta vir antes de raciocinar.",
  },
  selvagem: {
    key: "selvagem",
    name: "A Selvagem",
    tagline: "A que ainda lembra do rugido",
    symbol: "Floresta",
    hueA: "#1f3327",
    hueB: "#5a8569",
    glyph: "❋",
    description:
      "Você é a mulher que a civilização não conseguiu domesticar inteira. Tem instinto, ferocidade, um saber que vem da carne. Sua intuição animal te protege, te guia. Você sabe quando algo está errado antes de qualquer prova — e quando confia no seu instinto, raramente erra.",
    strengths: [
      "Instinto agudo — você sente perigo e prazer com clareza.",
      "Liberdade interna — você se recusa a viver de cobranças.",
      "Vitalidade, energia, presença encarnada.",
      "Capacidade de romper padrões, dizer não, virar a mesa.",
    ],
    shadow:
      "Sua sombra é o isolamento. A selvagem pode confundir liberdade com solidão e fugir do vínculo. O resgate é aprender que pertencer não é se domesticar — é escolher o seu bando.",
    practice:
      "Uma vez por semana, faça algo que sua versão domesticada nunca faria. Pode ser dançar sozinha na sala, gritar no carro, pular na chuva. Lembre que o rugido ainda mora dentro de você.",
  },
};

export function computeArchetype(answers: string[]): Archetype {
  const totals: Record<Archetype, number> = {
    mistica: 0, guerreira: 0, mae_terra: 0, amante: 0, sabia: 0, selvagem: 0,
  };
  CAPTION_QUESTIONS.forEach((q, i) => {
    const chosen = q.options.find((o) => o.label === answers[i]);
    if (!chosen) return;
    for (const [key, val] of Object.entries(chosen.scores)) {
      totals[key as Archetype] += val ?? 0;
    }
  });
  let best: Archetype = "mistica";
  let bestScore = -1;
  for (const [key, score] of Object.entries(totals) as [Archetype, number][]) {
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }
  return best;
}
