# 🔔 Configuração de Notificações Push

## 📋 O que foi implementado

1. ✅ Tabela `push_subscriptions` no Supabase
2. ✅ Service Worker (`sw.js`) para receber notificações
3. ✅ Serviço de notificações push (`pushNotificationService.ts`)
4. ✅ Componente `NotificationPrompt` atualizado
5. ✅ Edge Function para enviar notificações

## 🚀 Passos para Configurar

### 1. Executar Migration

Execute a migration no Supabase SQL Editor:

```sql
-- Execute o arquivo:
supabase/migrations/008_create_push_subscriptions_table.sql
```

### 2. ✅ VAPID Keys Geradas!

As chaves já foram geradas automaticamente! 

**Chaves geradas:**
- **PUBLIC KEY**: `BIxI6I1R-DMIFzGJ0iAEKUht17gmr_vNKEMDAscmDArAmSCChTfxvlbYvXmeSyNmOuI-EH41Yb4l6jdtKuXc3WY`
- **PRIVATE KEY**: `GqI9299dGe2ZIbi1Cn94KGKnX7yEdRb1Pk9EFCQnnU8`

**Se precisar gerar novas chaves:**
```bash
node scripts/generate-vapid-keys.mjs
```

### 3. Configurar Secrets no Supabase

No Supabase Dashboard:
1. Vá em **Settings** > **Edge Functions** > **Secrets**
2. Adicione apenas a **PRIVATE KEY**:
   - Nome: `VAPID_PRIVATE_KEY`
   - Valor: `GqI9299dGe2ZIbi1Cn94KGKnX7yEdRb1Pk9EFCQnnU8`

⚠️ **Nota**: A PUBLIC KEY já está configurada no código (`pushNotificationService.ts`)

### 4. VAPID Public Key no Frontend

✅ **Já está configurada!** A chave pública já foi adicionada ao `pushNotificationService.ts`.

Se precisar trocar, edite `src/services/pushNotificationService.ts` e substitua a constante `VAPID_PUBLIC_KEY`.

### 5. Deploy da Edge Function

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Deploy da função
supabase functions deploy send-daily-notifications
```

### 6. Configurar Cron Job (Teste - 5 minutos)

**Opção 1: Via SQL Editor (Recomendado)**

1. Abra o arquivo: `supabase/migrations/009_setup_notifications_cron.sql`
2. Substitua `[SEU-PROJETO-ID]` pela URL do seu projeto (ex: `buwsdtkrlgbfxwexnocw`)
3. Substitua `[SERVICE-ROLE-KEY]` pela sua SERVICE_ROLE_KEY (Settings > API > service_role)
4. Execute o SQL no Supabase SQL Editor

**Opção 2: Via Dashboard**

No Supabase Dashboard:
1. Vá em **Database** > **Cron Jobs** (ou use SQL Editor)
2. Execute o SQL do arquivo `009_setup_notifications_cron.sql` substituindo os valores

**Exemplo de SQL (substitua os valores):**
```sql
-- Habilita extensões
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Cria o cron job
SELECT cron.schedule(
  'send-daily-notifications',
  '*/5 * * * *',  -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://SEU-PROJETO-ID.supabase.co/functions/v1/send-daily-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer SUA-SERVICE-ROLE-KEY'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### 7. Para Produção (8h da manhã)

Quando validar que está funcionando, crie outro cron job:

**Name**: `send_daily_notifications_prod`

**Schedule**: `0 8 * * *` (todos os dias às 8h)

**SQL**: (mesmo do passo 6)

E desative o cron job de teste.

## 🧪 Como Testar

1. Abra o app no navegador
2. Clique em "Ativar" no banner de notificações
3. Permita as notificações quando solicitado
4. Aguarde até 5 minutos
5. Você deve receber uma notificação!

## 📝 Notas Importantes

- ⚠️ **VAPID Keys são obrigatórias** - sem elas, as notificações não funcionam
- ⚠️ **HTTPS obrigatório** - notificações push só funcionam em HTTPS (ou localhost)
- ⚠️ **Service Worker** - precisa estar registrado (já está no `main.tsx`)
- ⚠️ **Permissão do usuário** - o usuário precisa permitir notificações

## 🔧 Troubleshooting

### Notificações não aparecem

1. Verifique se o Service Worker está registrado (DevTools > Application > Service Workers)
2. Verifique se as VAPID keys estão configuradas corretamente
3. Verifique se o cron job está rodando (Database > Cron Jobs > Logs)
4. Verifique os logs da Edge Function (Edge Functions > send-daily-notifications > Logs)

### Erro ao ativar notificações

1. Verifique se está em HTTPS ou localhost
2. Verifique se o navegador suporta notificações push
3. Verifique os logs do console do navegador

## 📚 Recursos

- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Gerar VAPID Keys localmente](scripts/generate-vapid-keys.mjs) - Execute: `node scripts/generate-vapid-keys.mjs`
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

