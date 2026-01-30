# Send Daily Notifications - Edge Function

Esta função envia notificações push diárias para usuários que ativaram notificações.

## Configuração

### 1. Gerar VAPID Keys

Você precisa gerar suas próprias chaves VAPID:

1. Acesse: https://web-push-codelab.glitch.me/
2. Gere as chaves pública e privada
3. Configure no Supabase Dashboard:
   - Vá em Settings > Edge Functions > Secrets
   - Adicione:
     - `VAPID_PUBLIC_KEY` = sua chave pública
     - `VAPID_PRIVATE_KEY` = sua chave privada

### 2. Configurar Cron Job

No Supabase Dashboard:
1. Vá em Database > Cron Jobs
2. Crie um novo cron job:
   - **Name**: `send_daily_notifications`
   - **Schedule**: `*/5 * * * *` (a cada 5 minutos para testes)
   - **SQL**: 
   ```sql
   SELECT net.http_post(
     url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-daily-notifications',
     headers := jsonb_build_object(
       'Content-Type', 'application/json',
       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
     ),
     body := '{}'::jsonb
   );
   ```

### 3. Para Produção (8h da manhã)

Quando validar, mude o schedule para:
- **Schedule**: `0 8 * * *` (todos os dias às 8h)

## Variáveis de Ambiente

- `VAPID_PUBLIC_KEY`: Chave pública VAPID
- `VAPID_PRIVATE_KEY`: Chave privada VAPID
- `SUPABASE_URL`: URL do seu projeto (automático)
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço (automático)

## Deploy

```bash
supabase functions deploy send-daily-notifications
```


