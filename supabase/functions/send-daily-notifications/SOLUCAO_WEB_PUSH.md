# ⚠️ Problema com Web Push no Deno

A biblioteca `web-push` do npm não funciona no Deno/Supabase Edge Functions porque depende de módulos do Node.js.

## Soluções Possíveis:

### Opção 1: Usar Serviço Externo (Recomendado)

Use um serviço como:
- **OneSignal** (gratuito até 10k notificações/mês)
- **Firebase Cloud Messaging (FCM)**
- **Pusher Beams**

### Opção 2: Implementar Manualmente (Complexo)

Implementar o protocolo Web Push completo com criptografia ECDH em Deno.

### Opção 3: Usar Edge Function como Proxy

Criar uma Edge Function que chama uma API Node.js que faz o envio real.

## Solução Temporária: OneSignal

Vou criar uma implementação usando OneSignal que é mais simples e funciona bem.


