-- Sequência de emails de nutrição pós-waitlist (drip campaign).
-- Cada inscrição em launch_waitlist gera 5 emails agendados ao longo
-- de ~14 dias. Uma Edge Function `drip-tick` processa pendentes via
-- cron (pg_cron ou cron externo).

create table if not exists public.email_drip_jobs (
  id              uuid primary key default uuid_generate_v4(),
  lead_email      text not null,
  first_name      text,
  slug            text not null,
  send_at         timestamptz not null,
  sent_at         timestamptz,
  error_message   text,
  attempts        int not null default 0,
  created_at      timestamptz not null default now(),
  unique (lead_email, slug)
);

create index if not exists idx_drip_jobs_pending
  on public.email_drip_jobs (send_at)
  where sent_at is null;

-- RLS: apenas admins podem ver/manipular (Edge Function usa service role)
alter table public.email_drip_jobs enable row level security;

drop policy if exists "drip_jobs_admin_select" on public.email_drip_jobs;
create policy "drip_jobs_admin_select" on public.email_drip_jobs
  for select using (
    exists (select 1 from public.user_profiles up
            where up.id = auth.uid() and up.role = 'admin')
  );

-- Trigger: ao inserir na waitlist, enfileira a sequência de 5 emails
-- com `send_at` espaçado em 1, 3, 6, 10 e 14 dias.
create or replace function public.enqueue_drips_for_waitlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fname text;
begin
  fname := coalesce(nullif(split_part(new.name, ' ', 1), ''), null);

  insert into public.email_drip_jobs (lead_email, first_name, slug, send_at)
  values
    (new.email, fname, 'drip-1-origem',         new.created_at + interval '1 day'),
    (new.email, fname, 'drip-2-reconhecer',     new.created_at + interval '3 days'),
    (new.email, fname, 'drip-3-corpo',          new.created_at + interval '6 days'),
    (new.email, fname, 'drip-4-comunidade',     new.created_at + interval '10 days'),
    (new.email, fname, 'drip-5-prelancamento',  new.created_at + interval '14 days')
  on conflict (lead_email, slug) do nothing;

  return new;
end;
$$;

drop trigger if exists on_waitlist_enqueue_drips on public.launch_waitlist;
create trigger on_waitlist_enqueue_drips
  after insert on public.launch_waitlist
  for each row execute function public.enqueue_drips_for_waitlist();

-- ───────────────────────────────────────────────────────────────────
-- Como agendar o `drip-tick` (escolha uma das opções):
--
-- OPÇÃO A — pg_cron (executa dentro do Supabase, sem infra externa):
--
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
--
--   select cron.schedule(
--     'drip-tick-every-15min',
--     '*/15 * * * *',
--     $$
--       select net.http_post(
--         url     := 'https://<seu-projeto>.functions.supabase.co/drip-tick',
--         headers := jsonb_build_object(
--           'Content-Type', 'application/json',
--           'Authorization', 'Bearer ' || current_setting('app.drip_token', true)
--         ),
--         body    := '{}'::jsonb
--       );
--     $$
--   );
--
--   -- Salve o token (mesmo valor do DRIP_TICK_TOKEN setado nos secrets):
--   alter database postgres set "app.drip_token" = 'SEU_TOKEN_AQUI';
--
-- OPÇÃO B — GitHub Actions (cron externo gratuito):
--
--   workflow .github/workflows/drip-tick.yml com schedule '*/15 * * * *'
--   curl -X POST -H "Authorization: Bearer $DRIP_TICK_TOKEN" \
--        https://<projeto>.functions.supabase.co/drip-tick
--
-- OPÇÃO C — cron-job.org / EasyCron / similar (sem infra própria).
-- ───────────────────────────────────────────────────────────────────
