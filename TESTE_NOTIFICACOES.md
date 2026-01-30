# 🧪 Script de Teste de Notificações Push

## Como usar:

1. Abra o app no navegador (http://localhost:3000)
2. Abra o DevTools (F12)
3. Vá na aba **Console**
4. Cole o script abaixo e pressione Enter

## Script de Teste Completo:

```javascript
// Script de teste de notificações push
(async function testarNotificacoes() {
  console.log('🧪 Iniciando teste de notificações...\n');

  // 1. Verificar Service Worker
  console.log('1️⃣ Verificando Service Worker...');
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker ativo:', registration.scope);
  } else {
    console.error('❌ Service Worker não suportado');
    return;
  }

  // 2. Verificar permissão
  console.log('\n2️⃣ Verificando permissão de notificações...');
  if ('Notification' in window) {
    const permission = Notification.permission;
    console.log('📋 Permissão atual:', permission);
    
    if (permission !== 'granted') {
      console.log('⚠️ Solicitando permissão...');
      const newPermission = await Notification.requestPermission();
      console.log('📋 Nova permissão:', newPermission);
      
      if (newPermission !== 'granted') {
        console.error('❌ Permissão negada. Não é possível testar.');
        return;
      }
    }
  } else {
    console.error('❌ Notificações não suportadas');
    return;
  }

  // 3. Verificar subscription
  console.log('\n3️⃣ Verificando subscription push...');
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  
  if (!subscription) {
    console.log('⚠️ Nenhuma subscription encontrada. Criando...');
    
    // VAPID public key (do pushNotificationService.ts)
    const VAPID_PUBLIC_KEY = 'BIxI6I1R-DMIFzGJ0iAEKUht17gmr_vNKEMDAscmDArAmSCChTfxvlbYvXmeSyNmOuI-EH41Yb4l6jdtKuXc3WY';
    
    // Converter para Uint8Array
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
    
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('✅ Subscription criada:', subscription.endpoint.substring(0, 50) + '...');
    } catch (error) {
      console.error('❌ Erro ao criar subscription:', error);
      return;
    }
  } else {
    console.log('✅ Subscription encontrada:', subscription.endpoint.substring(0, 50) + '...');
  }

  // 4. Enviar notificação de teste
  console.log('\n4️⃣ Enviando notificação de teste...');
  
  try {
    // Enviar notificação diretamente pelo Service Worker
    await registration.showNotification('Teste de Notificação 🔔', {
      body: 'Se você está vendo isso, as notificações estão funcionando!',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'test-notification',
      vibrate: [200, 100, 200],
      data: {
        url: '/'
      },
      actions: [
        {
          action: 'open',
          title: 'Abrir App'
        }
      ]
    });
    
    console.log('✅ Notificação enviada! Verifique o canto da tela.');
    console.log('\n🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
  }
})();
```

## Script Simplificado (Apenas Teste Rápido):

```javascript
// Teste rápido - apenas mostra uma notificação
(async () => {
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification('Teste 🔔', {
    body: 'Notificações estão funcionando!',
    icon: '/icon-192x192.png',
    vibrate: [200, 100, 200]
  });
  console.log('✅ Notificação enviada!');
})();
```

## Verificar Subscription no Banco:

```javascript
// Verificar se a subscription está salva no Supabase
import { supabase } from './integrations/supabase/client';

const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const { data } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('enabled', true)
    .single();
  
  console.log('Subscription no banco:', data);
}
```

## Troubleshooting:

- **Service Worker não registrado**: Verifique se o arquivo `sw.js` está na pasta `public/`
- **Permissão negada**: Vá em Configurações do navegador > Notificações e permita para localhost
- **Subscription não criada**: Verifique se a VAPID_PUBLIC_KEY está correta


