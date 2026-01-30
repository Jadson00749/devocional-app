// Edge Function para enviar notificações diárias via OneSignal
// Roda a cada 5 minutos (para testes) - depois mudar para 8h da manhã

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// OneSignal App ID e REST API Key - configuradas como secrets no Supabase
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID') || '';
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY') || '';

// Função para enviar notificação push via OneSignal
async function sendPushNotification(
  playerId: string,
  payload: { title: string; body: string; icon?: string; tag?: string; data?: any }
): Promise<boolean> {
  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('❌ OneSignal não configurado');
      console.error('   Configure ONESIGNAL_APP_ID e ONESIGNAL_REST_API_KEY nas secrets');
      return false;
    }

    console.log('📤 Enviando notificação via OneSignal...');
    console.log('   Player ID:', playerId.substring(0, 20) + '...');

    // Criar payload para OneSignal API
    const onesignalPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: [playerId],
      headings: { en: payload.title, pt: payload.title },
      contents: { en: payload.body, pt: payload.body },
      url: payload.data?.url || '/',
      chrome_web_icon: payload.icon || '/icon-192x192.png',
      chrome_web_badge: payload.icon || '/icon-192x192.png',
      data: payload.data || {}
    };

    // Enviar via OneSignal REST API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(onesignalPayload)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Notificação enviada com sucesso via OneSignal');
      console.log('   ID da notificação:', result.id);
      return true;
    } else {
      console.error('❌ Erro ao enviar notificação:', result);
      
      // Se o player ID é inválido
      if (result.errors && Array.isArray(result.errors) && result.errors.some((e: string) => e.includes('Invalid'))) {
        console.log('⚠️ Player ID inválido ou expirado');
      }
      
      return false;
    }
  } catch (error: any) {
    console.error('❌ Erro ao enviar notificação:', error.message);
    console.error('   Stack:', error.stack?.substring(0, 300));
    return false;
  }
}

serve(async (req) => {
  console.log('🔔 Edge Function iniciada - send-daily-notifications');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    // Verificar se é uma chamada autorizada (cron job do Supabase)
    const authHeader = req.headers.get('Authorization');
    
    console.log('🔐 Verificando autenticação...');
    console.log('   Auth header presente:', !!authHeader);
    
    // Para testes, vamos aceitar qualquer requisição com Authorization header
    // Em produção, você pode adicionar validação mais rigorosa
    if (!authHeader) {
      console.error('❌ Autenticação falhou: Header ausente');
      return new Response(JSON.stringify({ error: 'Unauthorized - Missing Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log('✅ Autenticação OK (header presente)');

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📊 Buscando subscriptions ativas...');
    // Buscar todas as subscriptions ativas
    // Assumindo que o campo 'subscription' contém o OneSignal Player ID
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription')
      .eq('enabled', true);

    if (subError) {
      console.error('❌ Erro ao buscar subscriptions:', subError);
      throw subError;
    }

    console.log(`📋 Encontradas ${subscriptions?.length || 0} subscriptions ativas`);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ Nenhuma subscription ativa encontrada');
      return new Response(
        JSON.stringify({ message: 'Nenhuma subscription ativa', sent: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    let sentCount = 0;
    let errorCount = 0;
    
    console.log('🚀 Iniciando processamento de notificações...');

    // Para cada subscription, verificar se o usuário fez devocional hoje
    for (const sub of subscriptions) {
      try {
        const userId = sub.user_id;
        // Assumindo que subscription contém o OneSignal Player ID
        // Se for objeto JSON, extrair o player_id
        let playerId = '';
        
        if (typeof sub.subscription === 'string') {
          try {
            const subData = JSON.parse(sub.subscription);
            playerId = subData.player_id || subData.onesignal_player_id || sub.subscription;
          } catch {
            playerId = sub.subscription; // Se não for JSON, usar diretamente
          }
        } else if (typeof sub.subscription === 'object') {
          playerId = sub.subscription.player_id || sub.subscription.onesignal_player_id || '';
        }

        if (!playerId) {
          console.error(`⚠️ Player ID não encontrado para usuário ${userId}`);
          errorCount++;
          continue;
        }

        // Verificar se o usuário já fez devocional hoje
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const { data: devotionals, error: devError } = await supabase
          .from('devotional_posts')
          .select('id')
          .eq('user_id', userId)
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString())
          .limit(1);

        if (devError) {
          console.error(`Erro ao verificar devocional do usuário ${userId}:`, devError);
          errorCount++;
          continue;
        }

        const hasDevotionalToday = devotionals && devotionals.length > 0;

        // Preparar mensagem baseada no status
        let notificationPayload;
        
        if (hasDevotionalToday) {
          // Mensagens motivacionais (variar)
          const messages = [
            { title: 'Parabéns! 🎉', body: 'Você já fez seu devocional hoje! Continue firme na caminhada!' },
            { title: 'Que benção! 🔥', body: 'Seu compromisso com Deus está gerando frutos. Continue assim!' },
            { title: 'Você está no caminho certo! ✨', body: 'Seu devocional de hoje foi uma benção. Não desista!' },
            { title: 'Deus está te abençoando! 🙏', body: 'Parabéns por manter seu devocional em dia!' },
          ];
          const randomMessage = messages[Math.floor(Math.random() * messages.length)];
          notificationPayload = randomMessage;
        } else {
          // Mensagens de lembrete (variar)
          const messages = [
            { title: 'Não esqueça seu devocional! 🔥', body: 'Ainda não vi seu devocional hoje. Vamos crescer juntos!' },
            { title: 'Lembrete do devocional 📖', body: 'Que tal fazer seu devocional agora? Sua comunidade está esperando!' },
            { title: 'Momento de conexão com Deus 🙏', body: 'Não deixe passar o dia sem seu devocional. Vamos juntos!' },
            { title: 'Sua jornada continua! ✨', body: 'Faça seu devocional hoje e mantenha sua constância!' },
          ];
          const randomMessage = messages[Math.floor(Math.random() * messages.length)];
          notificationPayload = randomMessage;
        }

        // Enviar notificação via OneSignal
        const sent = await sendPushNotification(playerId, {
          ...notificationPayload,
          icon: '/icon-192x192.png',
          tag: 'devocional-daily',
          data: {
            url: '/'
          }
        });

        if (sent) {
          sentCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Erro ao processar subscription do usuário ${sub.user_id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Processamento concluído: ${sentCount} enviadas, ${errorCount} erros`);
    
    return new Response(
      JSON.stringify({
        message: 'Notificações processadas',
        sent: sentCount,
        errors: errorCount,
        total: subscriptions.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Erro na função:', error);
    console.error('Stack:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
