-- Notas internas da Sunyan sobre cada lead. Texto livre, só admin lê/escreve.
-- contacted_at marca quando o atendimento pessoal foi feito (útil pra filtrar
-- "ainda não contactei" na lista).

alter table public.launch_waitlist
  add column if not exists notes        text,
  add column if not exists contacted_at timestamptz;

-- Atualiza apenas admin pode escrever notes/contacted_at. Insert público
-- da waitlist continua funcionando (RLS de insert já existe na 0001).
drop policy if exists "waitlist_admin_update" on public.launch_waitlist;
create policy "waitlist_admin_update" on public.launch_waitlist
  for update using (
    exists (select 1 from public.user_profiles up
            where up.id = auth.uid() and up.role = 'admin')
  );
