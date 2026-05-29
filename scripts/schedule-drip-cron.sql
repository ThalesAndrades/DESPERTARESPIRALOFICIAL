-- =====================================================================
-- Agenda o drip-tick via pg_cron no próprio Supabase.
-- =====================================================================
-- Roda esse bloco UMA vez no SQL Editor do Supabase (Dashboard → SQL),
-- depois de:
--   1) ter deployado a Edge Function drip-tick
--   2) ter setado DRIP_TICK_TOKEN nos secrets
--
-- Substitua, antes de executar:
--   - <PROJECT_REF>     → o ref do seu projeto Supabase (ex.: dwblhkpodaabuuubloht)
--   - <DRIP_TICK_TOKEN> → o mesmo valor que você setou via
--                          npx supabase secrets set DRIP_TICK_TOKEN=...
-- =====================================================================

-- 1. Garante extensões necessárias.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Salva o token na configuração do banco (não fica no SQL log).
alter database postgres set "app.drip_token" = '<DRIP_TICK_TOKEN>';

-- 3. Remove agendamento anterior se já existir (idempotência).
select cron.unschedule('drip-tick-every-15min')
  where exists (
    select 1 from cron.job where jobname = 'drip-tick-every-15min'
  );

-- 4. Agenda chamada do drip-tick a cada 15 minutos.
select cron.schedule(
  'drip-tick-every-15min',
  '*/15 * * * *',
  $$
    select net.http_post(
      url     := 'https://<PROJECT_REF>.functions.supabase.co/drip-tick',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.drip_token', true)
      ),
      body    := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  $$
);

-- 5. Verifica o agendamento.
select jobid, jobname, schedule, command
from cron.job
where jobname = 'drip-tick-every-15min';
