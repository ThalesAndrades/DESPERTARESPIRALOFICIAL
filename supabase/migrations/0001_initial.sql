-- ──────────────────────────────────────────────────────────────────
-- Despertar Espiral — schema inicial
-- Cole este arquivo inteiro no SQL Editor do Supabase para criar
-- toda a estrutura de tabelas, RLS, triggers e seeds.
-- ──────────────────────────────────────────────────────────────────

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────────────
-- 1. user_profiles — perfil estendido do auth.users
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.user_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  username        text unique,
  anonymous_name  text not null default 'Convidada',
  role            text not null default 'member' check (role in ('member','admin')),
  avatar_url      text,
  bio             text,
  stripe_customer_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_user_profiles_role on public.user_profiles(role);
create index if not exists idx_user_profiles_stripe on public.user_profiles(stripe_customer_id);

-- ──────────────────────────────────────────────────────────────────
-- 2. products — cursos / produtos vendidos
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,
  title           text not null,
  subtitle        text,
  description     text,
  price           numeric(10,2) not null default 0,
  thumbnail_url   text,
  is_active       boolean not null default true,
  is_subscription boolean not null default false,
  stripe_price_id text,
  certificate_config jsonb default '{}'::jsonb,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_active on public.products(is_active) where is_active;

-- ──────────────────────────────────────────────────────────────────
-- 3. modules + lessons — estrutura de conteúdo
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.modules (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.products(id) on delete cascade,
  title       text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_modules_product on public.modules(product_id, sort_order);

create table if not exists public.lessons (
  id          uuid primary key default uuid_generate_v4(),
  module_id   uuid not null references public.modules(id) on delete cascade,
  title       text not null,
  type        text not null default 'video' check (type in ('video','text','pdf','audio')),
  content     text not null default '',
  sort_order  int not null default 0,
  is_free     boolean not null default false,
  duration_seconds int,
  created_at  timestamptz not null default now()
);

create index if not exists idx_lessons_module on public.lessons(module_id, sort_order);

-- ──────────────────────────────────────────────────────────────────
-- 4. user_products — quem tem acesso a quê
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.user_products (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  granted_at  timestamptz not null default now(),
  granted_via text not null default 'purchase' check (granted_via in ('purchase','admin','retroactive','gift','subscription')),
  expires_at  timestamptz,
  unique (user_id, product_id)
);

create index if not exists idx_user_products_user on public.user_products(user_id);

-- ──────────────────────────────────────────────────────────────────
-- 5. lesson_progress — engajamento da usuária
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.lesson_progress (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  completed     boolean not null default false,
  completed_at  timestamptz,
  last_viewed_at timestamptz default now(),
  unique (user_id, lesson_id)
);

create index if not exists idx_lesson_progress_user on public.lesson_progress(user_id, completed);

-- ──────────────────────────────────────────────────────────────────
-- 6. orders — histórico de compras (one-time + subscription)
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete set null,
  email         text not null,
  product_id    uuid references public.products(id) on delete set null,
  amount        numeric(10,2) not null,
  currency      text not null default 'brl',
  payment_method text default 'card' check (payment_method in ('pix','card','boleto')),
  status        text not null default 'pending' check (status in ('pending','paid','failed','refunded','canceled')),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  metadata      jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  paid_at       timestamptz
);

create index if not exists idx_orders_user on public.orders(user_id, created_at desc);
create index if not exists idx_orders_email on public.orders(email);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_stripe_session on public.orders(stripe_session_id);

-- ──────────────────────────────────────────────────────────────────
-- 7. subscriptions — assinaturas recorrentes
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  status          text not null check (status in ('trialing','active','past_due','canceled','incomplete','incomplete_expired','unpaid')),
  product_id      uuid references public.products(id) on delete set null,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);

-- ──────────────────────────────────────────────────────────────────
-- 8. community_posts + comments + likes
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.community_posts (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  category      text not null default 'geral' check (category in ('geral','desabafo','duvidas','conquistas','dicas')),
  title         text not null,
  body          text not null,
  is_pinned     boolean not null default false,
  is_visible    boolean not null default true,
  likes_count   int not null default 0,
  comments_count int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_posts_visible on public.community_posts(is_visible, created_at desc);
create index if not exists idx_posts_category on public.community_posts(category) where is_visible;

create table if not exists public.community_comments (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.community_posts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  likes_count int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_comments_post on public.community_comments(post_id, created_at);

create table if not exists public.community_likes (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  post_id   uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((post_id is not null) != (comment_id is not null)),
  unique (user_id, post_id),
  unique (user_id, comment_id)
);

-- ──────────────────────────────────────────────────────────────────
-- 9. events — analytics próprio (engajamento, funil)
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.events (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete set null,
  email       text,
  event       text not null,
  properties  jsonb default '{}'::jsonb,
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_events_event on public.events(event, occurred_at desc);
create index if not exists idx_events_user on public.events(user_id, occurred_at desc);

-- ──────────────────────────────────────────────────────────────────
-- 10. launch_waitlist — captura simples
-- ──────────────────────────────────────────────────────────────────
create table if not exists public.launch_waitlist (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null,
  name        text,
  phone       text,
  source      text,
  created_at  timestamptz not null default now(),
  unique (email, source)
);

-- ──────────────────────────────────────────────────────────────────
-- TRIGGERS — auto-criar profile quando user é criado em auth.users
-- ──────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────────────────────────
-- TRIGGERS — manter likes_count e comments_count atualizados
-- ──────────────────────────────────────────────────────────────────
create or replace function public.update_post_counts()
returns trigger
language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    if TG_TABLE_NAME = 'community_likes' and NEW.post_id is not null then
      update public.community_posts set likes_count = likes_count + 1 where id = NEW.post_id;
    elsif TG_TABLE_NAME = 'community_comments' then
      update public.community_posts set comments_count = comments_count + 1 where id = NEW.post_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if TG_TABLE_NAME = 'community_likes' and OLD.post_id is not null then
      update public.community_posts set likes_count = greatest(likes_count - 1, 0) where id = OLD.post_id;
    elsif TG_TABLE_NAME = 'community_comments' then
      update public.community_posts set comments_count = greatest(comments_count - 1, 0) where id = OLD.post_id;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_likes_count on public.community_likes;
create trigger trg_likes_count
  after insert or delete on public.community_likes
  for each row execute function public.update_post_counts();

drop trigger if exists trg_comments_count on public.community_comments;
create trigger trg_comments_count
  after insert or delete on public.community_comments
  for each row execute function public.update_post_counts();

-- ──────────────────────────────────────────────────────────────────
-- RPC — checa se usuária tem acesso a um produto (one-time ou sub ativa)
-- ──────────────────────────────────────────────────────────────────
create or replace function public.has_product_access(p_user uuid, p_product uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    -- compra direta ativa
    select 1 from public.user_products up
    where up.user_id = p_user
      and up.product_id = p_product
      and (up.expires_at is null or up.expires_at > now())
  ) or exists (
    -- assinatura ativa cobrindo o produto
    select 1 from public.subscriptions s
    where s.user_id = p_user
      and s.product_id = p_product
      and s.status in ('trialing','active')
  );
$$;

-- ──────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────────
alter table public.user_profiles      enable row level security;
alter table public.products           enable row level security;
alter table public.modules            enable row level security;
alter table public.lessons            enable row level security;
alter table public.user_products      enable row level security;
alter table public.lesson_progress    enable row level security;
alter table public.orders             enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.community_posts    enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes    enable row level security;
alter table public.events             enable row level security;
alter table public.launch_waitlist    enable row level security;

-- user_profiles
drop policy if exists "self_select_profile" on public.user_profiles;
create policy "self_select_profile" on public.user_profiles for select using (auth.uid() = id);

drop policy if exists "self_update_profile" on public.user_profiles;
create policy "self_update_profile" on public.user_profiles for update using (auth.uid() = id);

drop policy if exists "admin_all_profiles" on public.user_profiles;
create policy "admin_all_profiles" on public.user_profiles for all
  using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- products: tudo público pra ler (catálogo); admin escreve
drop policy if exists "public_read_products" on public.products;
create policy "public_read_products" on public.products for select using (is_active);

drop policy if exists "admin_write_products" on public.products;
create policy "admin_write_products" on public.products for all
  using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- modules + lessons: leitura pública (catálogo da landing); usuárias logadas com acesso veem conteúdo
drop policy if exists "public_read_modules" on public.modules;
create policy "public_read_modules" on public.modules for select using (true);

drop policy if exists "admin_write_modules" on public.modules;
create policy "admin_write_modules" on public.modules for all
  using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "public_read_lessons" on public.lessons;
create policy "public_read_lessons" on public.lessons for select using (true);

drop policy if exists "admin_write_lessons" on public.lessons;
create policy "admin_write_lessons" on public.lessons for all
  using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- user_products: usuária vê só os seus
drop policy if exists "self_read_user_products" on public.user_products;
create policy "self_read_user_products" on public.user_products for select using (auth.uid() = user_id);

drop policy if exists "admin_all_user_products" on public.user_products;
create policy "admin_all_user_products" on public.user_products for all
  using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- lesson_progress: usuária só os seus
drop policy if exists "self_lesson_progress" on public.lesson_progress;
create policy "self_lesson_progress" on public.lesson_progress for all using (auth.uid() = user_id);

-- orders: usuária só os seus; admin tudo
drop policy if exists "self_read_orders" on public.orders;
create policy "self_read_orders" on public.orders for select using (auth.uid() = user_id);

drop policy if exists "admin_all_orders" on public.orders;
create policy "admin_all_orders" on public.orders for all
  using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- subscriptions
drop policy if exists "self_read_subs" on public.subscriptions;
create policy "self_read_subs" on public.subscriptions for select using (auth.uid() = user_id);

drop policy if exists "admin_all_subs" on public.subscriptions;
create policy "admin_all_subs" on public.subscriptions for all
  using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- community: posts visíveis lidos por qualquer usuária logada; quem cria posta como si
drop policy if exists "auth_read_posts" on public.community_posts;
create policy "auth_read_posts" on public.community_posts for select
  using (is_visible and auth.uid() is not null);

drop policy if exists "self_write_posts" on public.community_posts;
create policy "self_write_posts" on public.community_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "self_update_posts" on public.community_posts;
create policy "self_update_posts" on public.community_posts for update using (auth.uid() = user_id);

drop policy if exists "self_delete_posts" on public.community_posts;
create policy "self_delete_posts" on public.community_posts for delete using (auth.uid() = user_id);

drop policy if exists "admin_all_posts" on public.community_posts;
create policy "admin_all_posts" on public.community_posts for all
  using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- comments
drop policy if exists "auth_read_comments" on public.community_comments;
create policy "auth_read_comments" on public.community_comments for select using (auth.uid() is not null);

drop policy if exists "self_write_comments" on public.community_comments;
create policy "self_write_comments" on public.community_comments for insert with check (auth.uid() = user_id);

drop policy if exists "self_update_comments" on public.community_comments;
create policy "self_update_comments" on public.community_comments for update using (auth.uid() = user_id);

drop policy if exists "self_delete_comments" on public.community_comments;
create policy "self_delete_comments" on public.community_comments for delete using (auth.uid() = user_id);

-- likes: usuária gerencia só seus likes
drop policy if exists "auth_read_likes" on public.community_likes;
create policy "auth_read_likes" on public.community_likes for select using (auth.uid() is not null);

drop policy if exists "self_write_likes" on public.community_likes;
create policy "self_write_likes" on public.community_likes for insert with check (auth.uid() = user_id);

drop policy if exists "self_delete_likes" on public.community_likes;
create policy "self_delete_likes" on public.community_likes for delete using (auth.uid() = user_id);

-- events: insert público (logging de funil pré-login); leitura só admin
drop policy if exists "public_insert_events" on public.events;
create policy "public_insert_events" on public.events for insert with check (true);

drop policy if exists "admin_read_events" on public.events;
create policy "admin_read_events" on public.events for select
  using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- launch_waitlist: insert público; leitura só admin
drop policy if exists "public_insert_waitlist" on public.launch_waitlist;
create policy "public_insert_waitlist" on public.launch_waitlist for insert with check (true);

drop policy if exists "admin_read_waitlist" on public.launch_waitlist;
create policy "admin_read_waitlist" on public.launch_waitlist for select
  using (exists (select 1 from public.user_profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ──────────────────────────────────────────────────────────────────
-- SEED — produto inicial (atualize stripe_price_id depois de criar no Stripe)
-- ──────────────────────────────────────────────────────────────────
insert into public.products (slug, title, subtitle, description, price, is_active, sort_order)
values
  ('mulher-espiral', 'Mulher Espiral', 'Método de Reconexão e Cura',
   'Uma jornada guiada de autoconhecimento feminino com aulas práticas, reflexões e integrações simples para o dia a dia.',
   497.00, true, 1)
on conflict (slug) do nothing;
