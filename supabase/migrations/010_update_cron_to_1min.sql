-- ============================================
-- ATUALIZAR CRON JOB PARA 1 MINUTO (TESTE)
-- ============================================

-- Remove o job atual
SELECT cron.unschedule('send-daily-notifications');

-- Recria com schedule de 1 minuto
SELECT cron.schedule(
  'send-daily-notifications',
  '* * * * *',  -- A cada 1 minuto (TESTE)
  $$
  SELECT net.http_post(
    url := 'https://buwsdtkrlgbfxwexnocw.supabase.co/functions/v1/send-daily-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1d3NkdGtybGdiZnh3ZXhub2N3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg1MjYzMCwiZXhwIjoyMDg0NDI4NjMwfQ.zjieua2YRPqx6CkkH_mUiOVFF59g9OsEGL5tuUL7gc8'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================
-- IMPORTANTE: Depois dos testes, volte para 5 minutos:
-- ============================================
-- SELECT cron.unschedule('send-daily-notifications');
-- SELECT cron.schedule(
--   'send-daily-notifications',
--   '*/5 * * * *',  -- A cada 5 minutos
--   $$ ... (mesmo SQL acima) ... $$
-- );


