-- Engajamento de email: persiste eventos de webhook do Resend
-- (sent / delivered / opened / clicked / bounced / complained) para
-- medir abertura e clique por slug e por destinatária no admin.

-- 1. linka cada job do drip com o id que o Resend devolve no send,
--    pra matchar eventos chegando depois.
alter table public.email_drip_jobs
  add column if not exists resend_email_id text;

create index if not exists idx_drip_jobs_resend_email_id
  on public.email_drip_jobs (resend_email_id);

-- 2. tabela de eventos brutos do webhook.
create table if not exists public.email_events (
  id              uuid primary key default uuid_generate_v4(),
  resend_email_id text,
  event_type      text not null,
  recipient       text,
  subject         text,
  click_url       text,
  metadata        jsonb,
  occurred_at     timestamptz not null default now(),
  inserted_at     timestamptz not null default now()
);

create index if not exists idx_email_events_email on public.email_events (resend_email_id);
create index if not exists idx_email_events_type  on public.email_events (event_type, occurred_at desc);
create index if not exists idx_email_events_recip on public.email_events (recipient);

alter table public.email_events enable row level security;
drop policy if exists "email_events_admin_select" on public.email_events;
create policy "email_events_admin_select" on public.email_events
  for select using (
    exists (select 1 from public.user_profiles up
            where up.id = auth.uid() and up.role = 'admin')
  );

-- 3. view de engajamento por slug do drip.
--    abertura/clique por slug + tempo médio até abrir.
create or replace view public.email_engagement_summary as
with sent as (
  select slug, count(*) as sent_count
  from public.email_drip_jobs
  where sent_at is not null
  group by slug
),
opened as (
  select j.slug,
         count(distinct e.resend_email_id) filter (where e.event_type = 'email.opened')   as opened_count,
         count(distinct e.resend_email_id) filter (where e.event_type = 'email.clicked')  as clicked_count,
         count(distinct e.resend_email_id) filter (where e.event_type = 'email.bounced')  as bounced_count,
         count(distinct e.resend_email_id) filter (where e.event_type = 'email.complained') as complained_count
  from public.email_drip_jobs j
  join public.email_events e on e.resend_email_id = j.resend_email_id
  where j.resend_email_id is not null
  group by j.slug
)
select
  s.slug,
  s.sent_count,
  coalesce(o.opened_count, 0)     as opened_count,
  coalesce(o.clicked_count, 0)    as clicked_count,
  coalesce(o.bounced_count, 0)    as bounced_count,
  coalesce(o.complained_count, 0) as complained_count,
  case when s.sent_count > 0
       then round(100.0 * coalesce(o.opened_count, 0) / s.sent_count, 1)
       else 0
  end as open_rate_pct,
  case when coalesce(o.opened_count, 0) > 0
       then round(100.0 * coalesce(o.clicked_count, 0) / o.opened_count, 1)
       else 0
  end as click_through_rate_pct
from sent s
left join opened o on o.slug = s.slug
order by s.slug;

grant select on public.email_engagement_summary to authenticated;

-- ───────────────────────────────────────────────────────────────────
-- Como configurar no Resend:
--   Dashboard → Webhooks → Add endpoint
--   URL: https://<projeto>.functions.supabase.co/resend-webhook
--   Events: email.sent, email.delivered, email.opened, email.clicked,
--           email.bounced, email.complained
--   Copie o "Signing Secret" e:
--     npx supabase secrets set RESEND_WEBHOOK_SECRET=whsec_...
-- ───────────────────────────────────────────────────────────────────
