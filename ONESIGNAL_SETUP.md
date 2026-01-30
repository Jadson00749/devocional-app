# 📱 Configuração OneSignal para Notificações Push

## 🎯 Por que OneSignal?

- ✅ **Gratuito** até 10.000 notificações/mês
- ✅ **Fácil de integrar** com PWA
- ✅ **Funciona no Deno/Supabase** Edge Functions
- ✅ **Suporte a múltiplas plataformas** (Web, iOS, Android)

## 📋 Passo 1: Criar conta no OneSignal

1. Acesse: https://onesignal.com/
2. Crie uma conta gratuita
3. Crie um novo app (Web Push)
4. Configure:
   - **Name**: Geração Life
   - **Platform**: Web Push
   - **Website URL**: https://seudominio.com (ou localhost para testes)

## 🔑 Passo 2: Obter credenciais

No dashboard do OneSignal:

1. Vá em **Settings** > **Keys & IDs**
2. Copie:
   - **App ID** (ex: `abc123-def456-ghi789`)
   - **REST API Key** (ex: `NGEwOTZmODctOD...`)

## ⚙️ Passo 3: Configurar Secrets no Supabase

No Supabase Dashboard:

1. Vá em **Settings** > **Edge Functions** > **Secrets**
2. Adicione 2 secrets:

   **Secret 1:**
   - Nome: `ONESIGNAL_APP_ID`
   - Valor: (cole o App ID do OneSignal)

   **Secret 2:**
   - Nome: `ONESIGNAL_REST_API_KEY`
   - Valor: (cole o REST API Key do OneSignal)

## 📱 Passo 4: Atualizar Frontend

O frontend precisa usar o SDK do OneSignal ao invés do Web Push nativo.

### 4.1. Instalar OneSignal SDK

```bash
npm install react-onesignal
```

### 4.2. Atualizar `pushNotificationService.ts`

Substituir a implementação atual por OneSignal SDK.

## 🚀 Passo 5: Testar

1. Faça deploy da Edge Function atualizada
2. Aguarde 1 minuto (cron job)
3. Verifique os logs
4. Teste no celular

## 📝 Estrutura da Subscription

A tabela `push_subscriptions` agora armazena o **OneSignal Player ID** no campo `subscription`:

```json
{
  "player_id": "abc123-def456-ghi789"
}
```

Ou simplesmente uma string com o Player ID.

## 🔧 Troubleshooting

- **Erro "Invalid player_id"**: O Player ID expirou ou é inválido
- **Notificações não chegam**: Verifique se o OneSignal está configurado corretamente
- **Erro de autenticação**: Verifique se as secrets estão configuradas


