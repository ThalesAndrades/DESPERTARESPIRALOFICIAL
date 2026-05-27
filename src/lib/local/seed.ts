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
    ],
    modules: [],
    lessons: [],
    lesson_progress: [],
    user_products: [
      { id: "up1", user_id: "u1", product_id: "p1", granted_at: "2026-01-01T00:00:00Z" },
    ],
    orders: [],
    community_posts: [],
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

export const SEED_VERSION = 2;
export const FIRST_RUN_AT = now();
