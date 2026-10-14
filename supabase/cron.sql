
-- Run ONCE in the Supabase SQL editor after deploying the fetch-answers function.
-- Requires extensions pg_cron and pg_net (Dashboard > Database > Extensions).
-- Asia/Karachi is UTC+5 year-round (no DST), so:
--   00:05 Karachi = 19:05 UTC (previous day)   05:30 Karachi = 00:30 UTC
-- Store two secrets in Vault first (Dashboard > Project Settings > Vault):
--   project_url       e.g. https://YOUR_PROJECT.supabase.co
--   function_secret   the same value as the FUNCTION_SECRET edge-function secret
select cron.schedule('dailymb-fetch-0005-karachi', '5 19 * * *',
  $$ select net.http_post(
       url := (select decrypted_secret from vault.decrypted_secrets where name='project_url') || '/functions/v1/fetch-answers',
       headers := jsonb_build_object('Content-Type','application/json','x-function-secret',(select decrypted_secret from vault.decrypted_secrets where name='function_secret')),
       body := '{"trigger":"cron-0005"}'::jsonb, timeout_milliseconds := 120000); $$);
select cron.schedule('dailymb-fetch-0530-karachi', '30 0 * * *',
  $$ select net.http_post(
       url := (select decrypted_secret from vault.decrypted_secrets where name='project_url') || '/functions/v1/fetch-answers',
       headers := jsonb_build_object('Content-Type','application/json','x-function-secret',(select decrypted_secret from vault.decrypted_secrets where name='function_secret')),
       body := '{"trigger":"cron-0530"}'::jsonb, timeout_milliseconds := 120000); $$);
select cron.schedule('dailymb-purge', '15 20 * * *', $$ select public.purge_old_quiz(); $$);
