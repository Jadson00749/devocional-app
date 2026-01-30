-- ============================================
-- CONFIGURAÇÃO DE CRON JOB PARA NOTIFICAÇÕES DIÁRIAS
-- Executa a Edge Function a cada 5 minutos (para testes)
-- ============================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove job anterior se existir
DO $$
BEGIN
  PERFORM cron.unschedule('send-daily-notifications');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ============================================
-- IMPORTANTE: ANTES DE EXECUTAR, SUBSTITUA:
-- ============================================
-- 1. [SEU-PROJETO-ID] pela URL do seu projeto Supabase
--    Exemplo: se sua URL é https://buwsdtkrlgbfxwexnocw.supabase.co
--    Use: buwsdtkrlgbfxwexnocw
--
-- 2. [SERVICE-ROLE-KEY] pela sua SERVICE_ROLE_KEY
--    Vá em Settings > API > service_role (secret)
-- ============================================

-- Configura o cron job (SUBSTITUA OS VALORES ABAIXO!)
SELECT cron.schedule(
  'send-daily-notifications',                    -- Nome do job
  '* * * * *',                                  -- A cada 1 minuto (TESTE - mudar para */5 depois)
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
-- VERIFICAR SE ESTÁ CONFIGURADO:
-- ============================================
-- SELECT * FROM cron.job WHERE jobname = 'send-daily-notifications';

-- ============================================
-- VER HISTÓRICO DE EXECUÇÕES:
-- ============================================
-- SELECT 
--   runid,
--   status,
--   return_message,
--   start_time,
--   end_time
-- FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-daily-notifications')
-- ORDER BY start_time DESC
-- LIMIT 10;

-- ============================================
-- PARA PARAR O CRON JOB (se necessário):
-- ============================================
-- SELECT cron.unschedule('send-daily-notifications');

-- ============================================
-- PARA MUDAR PARA PRODUÇÃO (8h da manhã):
-- ============================================
-- SELECT cron.unschedule('send-daily-notifications');
-- SELECT cron.schedule(
--   'send-daily-notifications',
--   '0 8 * * *',  -- Todos os dias às 8h
--   $$ ... (mesmo SQL acima) ... $$
-- );

