import courseThumb2 from "@/assets/course-thumb-2.jpg";
import mulherEspiralProduct from "@/assets/mulher-espiral-hero.jpg";
import type { DBShape } from "./types";

const now = () => new Date().toISOString();

export function createSeed(): DBShape {
  return {
    auth_users: [
      {
        id: "u1",
        email: "admin@despertarespiral.local",
        password: "admin123",
        full_name: "Sunyan Nunes",
        created_at: "2026-01-01T00:00:00Z",
        user_metadata: { full_name: "Sunyan Nunes" },
      },
      {
        id: "u2",
        email: "membro@despertarespiral.local",
        password: "membro123",
        full_name: "Maria Clara",
        created_at: "2026-04-01T10:00:00Z",
        user_metadata: { full_name: "Maria Clara" },
      },
    ],
    user_profiles: [
      {
        id: "u1",
        email: "admin@despertarespiral.local",
        full_name: "Sunyan Nunes",
        username: "sunyan",
        anonymous_name: "Sunyan",
        role: "admin",
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "u2",
        email: "membro@despertarespiral.local",
        full_name: "Maria Clara",
        username: "maria.clara",
        anonymous_name: "Lua Crescente",
        role: "member",
        created_at: "2026-04-01T10:00:00Z",
      },
    ],
    products: [
      {
        id: "p1",
        slug: "mulher-espiral",
        title: "Mulher Espiral",
        subtitle: "Método de Reconexão e Cura",
        description:
          "Uma jornada guiada de autoconhecimento feminino com aulas práticas, reflexões e integrações simples para o dia a dia.",
        price: 497,
        thumbnail_url: mulherEspiralProduct,
        is_active: true,
        is_published: true,
        certificate_config: null,
        created_at: "2026-01-15T00:00:00Z",
      },
      {
        id: "p2",
        slug: "despertar-das-emocoes",
        title: "Despertar das Emoções",
        subtitle: "Inteligência Emocional Feminina",
        description:
          "Um percurso leve e objetivo para reconhecer emoções, compreender padrões e responder com mais presença no cotidiano.",
        price: 247,
        thumbnail_url: courseThumb2,
        is_active: true,
        is_published: true,
        certificate_config: null,
        created_at: "2026-02-20T00:00:00Z",
      },
    ],
    modules: [
      { id: "m1", product_id: "p1", title: "O Chamado da Espiral", sort_order: 1 },
      { id: "m2", product_id: "p1", title: "Reconhecendo Padrões", sort_order: 2 },
      { id: "m3", product_id: "p1", title: "O Corpo como Sabedoria", sort_order: 3 },
      { id: "m4", product_id: "p2", title: "Fundamentos Emocionais", sort_order: 1 },
    ],
    lessons: [
      { id: "l1", module_id: "m1", title: "Bem-vinda à sua jornada", type: "video", content: "https://player.vimeo.com/video/76979871", sort_order: 1, is_free: true },
      { id: "l2", module_id: "m1", title: "O que é a espiral de reconexão", type: "text", content: "<p>A espiral não é um retorno ao passado. É um aprofundamento da consciência que já existe em você.</p><p>Cada volta da espiral representa um nível mais profundo de autoconhecimento e integração.</p>", sort_order: 2, is_free: false },
      { id: "l3", module_id: "m1", title: "Diário da jornada (PDF)", type: "pdf", content: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf", sort_order: 3, is_free: false },
      { id: "l4", module_id: "m2", title: "Padrões que nos aprisionam", type: "video", content: "https://player.vimeo.com/video/76979871", sort_order: 1, is_free: false },
      { id: "l5", module_id: "m2", title: "Mapeando sua história", type: "text", content: "<p>Para se libertar de um padrão, primeiro é preciso enxergá-lo com olhos de compaixão, não de julgamento.</p>", sort_order: 2, is_free: false },
      { id: "l6", module_id: "m3", title: "Escutando o corpo feminino", type: "video", content: "https://player.vimeo.com/video/76979871", sort_order: 1, is_free: false },
      { id: "l7", module_id: "m3", title: "Meditação guiada — Enraizamento", type: "audio", content: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", sort_order: 2, is_free: false },
      { id: "l8", module_id: "m4", title: "Emoções como mensageiras", type: "video", content: "https://player.vimeo.com/video/76979871", sort_order: 1, is_free: true },
      { id: "l9", module_id: "m4", title: "O mapa das emoções", type: "text", content: "<p>Cada emoção carrega uma mensagem que precisa ser ouvida.</p>", sort_order: 2, is_free: false },
    ],
    lesson_progress: [
      { id: "lp1", user_id: "u2", lesson_id: "l1", completed: true, completed_at: "2026-04-02T10:00:00Z" },
      { id: "lp2", user_id: "u2", lesson_id: "l2", completed: true, completed_at: "2026-04-03T10:00:00Z" },
    ],
    user_products: [
      { id: "up1", user_id: "u1", product_id: "p1", granted_at: "2026-01-01T00:00:00Z" },
      { id: "up2", user_id: "u1", product_id: "p2", granted_at: "2026-01-01T00:00:00Z" },
      { id: "up3", user_id: "u2", product_id: "p1", granted_at: "2026-04-01T10:00:00Z" },
    ],
    orders: [
      { id: "o1", user_id: "u2", email: "membro@despertarespiral.local", product_id: "p1", payment_method: "pix", status: "paid", amount: 497, created_at: "2026-04-01T10:00:00Z" },
      { id: "o2", user_id: null, email: "ana.beatriz@provedor.com.br", product_id: "p2", payment_method: "credit_card", status: "paid", amount: 247, created_at: "2026-04-05T15:30:00Z" },
      { id: "o3", user_id: null, email: "julia.santos@provedor.com.br", product_id: "p1", payment_method: "boleto", status: "pending", amount: 497, created_at: "2026-04-13T08:00:00Z" },
    ],
    community_posts: [
      { id: "cp1", user_id: "u2", category: "conquistas", title: "Terminei o módulo 3 e percebi uma mudança real", body: "Concluí as aulas do corpo nesta semana e senti mais clareza para lidar com minhas emoções no dia a dia.", is_pinned: true, is_visible: true, likes_count: 12, comments_count: 0, created_at: "2026-04-10T14:30:00Z" },
      { id: "cp2", user_id: "u2", category: "duvidas", title: "Como lidar com a resistência ao processo?", body: "Estou no começo da jornada e notei muita resistência para manter constância. Alguém viveu isso também?", is_pinned: false, is_visible: true, likes_count: 7, comments_count: 0, created_at: "2026-04-12T09:15:00Z" },
      { id: "cp3", user_id: "u2", category: "desabafo", title: "Hoje foi difícil, mas eu apareci", body: "A semana foi intensa e mesmo assim consegui assistir uma aula e escrever duas linhas no diário.", is_pinned: false, is_visible: true, likes_count: 15, comments_count: 0, created_at: "2026-04-13T21:00:00Z" },
    ],
    community_comments: [],
    community_likes: [],
    module_quizzes: [],
    quiz_questions: [],
    quiz_options: [],
    quiz_attempts: [],
    launch_waitlist: [],
    current_session: null,
  };
}

export const SEED_VERSION = 1;
export const FIRST_RUN_AT = now();
