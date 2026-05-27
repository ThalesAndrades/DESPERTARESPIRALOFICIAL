// Local DB row types. Field names match what the React pages query via
// the Supabase-compatible client — historical schema kept intact.

export interface AuthUserRow {
  id: string;
  email: string;
  password: string | null;
  full_name: string | null;
  created_at: string;
  user_metadata: Record<string, unknown>;
}

export interface UserProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  anonymous_name: string;
  role: "member" | "admin";
  created_at: string;
}

export interface ProductRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  is_active: boolean;
  is_published: boolean;
  certificate_config: Record<string, unknown> | null;
  created_at: string;
}

export interface ModuleRow {
  id: string;
  product_id: string;
  title: string;
  sort_order: number;
}

export interface LessonRow {
  id: string;
  module_id: string;
  title: string;
  type: "video" | "text" | "pdf" | "audio";
  content: string;
  sort_order: number;
  is_free: boolean;
}

export interface LessonProgressRow {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface UserProductRow {
  id: string;
  user_id: string;
  product_id: string;
  granted_at: string;
}

export interface OrderRow {
  id: string;
  user_id: string | null;
  email: string;
  product_id: string;
  payment_method: "pix" | "credit_card" | "boleto";
  status: "pending" | "paid" | "failed" | "refunded";
  amount: number;
  created_at: string;
}

export interface CommunityPostRow {
  id: string;
  user_id: string;
  category: "geral" | "desabafo" | "duvidas" | "conquistas" | "dicas";
  title: string;
  body: string;
  is_pinned: boolean;
  is_visible: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface CommunityCommentRow {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  likes_count: number;
  created_at: string;
}

export interface CommunityLikeRow {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface ModuleQuizRow {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  is_active: boolean;
}

export interface QuizQuestionRow {
  id: string;
  quiz_id: string;
  question: string;
  type: "multiple_choice" | "true_false";
  sort_order: number;
}

export interface QuizOptionRow {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface QuizAttemptRow {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  completed_at: string;
}

export interface WaitlistRow {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  created_at: string;
}

export interface SessionRow {
  access_token: string;
  refresh_token: string;
  user_id: string;
  expires_at: number;
}

export interface DBShape {
  auth_users: AuthUserRow[];
  user_profiles: UserProfileRow[];
  products: ProductRow[];
  modules: ModuleRow[];
  lessons: LessonRow[];
  lesson_progress: LessonProgressRow[];
  user_products: UserProductRow[];
  orders: OrderRow[];
  community_posts: CommunityPostRow[];
  community_comments: CommunityCommentRow[];
  community_likes: CommunityLikeRow[];
  module_quizzes: ModuleQuizRow[];
  quiz_questions: QuizQuestionRow[];
  quiz_options: QuizOptionRow[];
  quiz_attempts: QuizAttemptRow[];
  launch_waitlist: WaitlistRow[];
  current_session: SessionRow | null;
}

export type TableName = Exclude<keyof DBShape, "current_session">;
