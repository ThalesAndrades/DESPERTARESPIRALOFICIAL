-- Persiste attribution e contexto técnico junto com cada lead da waitlist.
-- Permite ao admin analisar de qual ad/campanha veio cada inscrita.
alter table public.launch_waitlist
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term     text,
  add column if not exists utm_content  text,
  add column if not exists gclid        text,
  add column if not exists fbclid       text,
  add column if not exists ttclid       text,
  add column if not exists referrer     text,
  add column if not exists user_agent   text,
  add column if not exists landing_path text;

create index if not exists idx_waitlist_created_at on public.launch_waitlist(created_at desc);
create index if not exists idx_waitlist_source     on public.launch_waitlist(source);
create index if not exists idx_waitlist_utm_source on public.launch_waitlist(utm_source);
