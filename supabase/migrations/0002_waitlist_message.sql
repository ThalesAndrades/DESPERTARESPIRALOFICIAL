-- Adiciona campo de mensagem livre à waitlist (resposta a "o que te trouxe até aqui?")
alter table public.launch_waitlist
  add column if not exists message text;
