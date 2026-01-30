import { supabase } from '../integrations/supabase/client';

// OneSignal App ID - já configurado no index.html
const ONESIGNAL_APP_ID = '16c9d19b-147b-4347-9b74-706e286decd5';

export interface OneSignalSubscription {
  player_id: string;
}

class PushNotificationService {
  private oneSignalInitialized = false;

  /**
   * Verifica se o navegador suporta notificações
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Aguarda o OneSignal SDK estar pronto
   */
  async waitForOneSignal(): Promise<any> {
    // Aguardar o OneSignal estar disponível (já carregado no index.html)
    return new Promise((resolve) => {
      if ((window as any).OneSignal) {
        resolve((window as any).OneSignal);
        return;
      }

      // Se usar o formato deferido
      if ((window as any).OneSignalDeferred) {
        (window as any).OneSignalDeferred.push((OneSignal: any) => {
          resolve(OneSignal);
        });
      } else {
        // Aguardar até estar disponível
        const checkInterval = setInterval(() => {
          if ((window as any).OneSignal) {
            clearInterval(checkInterval);
            resolve((window as any).OneSignal);
          }
        }, 100);
      }
    });
  }

  /**
   * Solicita permissão de notificações
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Este navegador não suporta notificações');
    }

    // Aguardar OneSignal estar pronto
    const OneSignal = await this.waitForOneSignal();

    // Solicitar permissão via OneSignal
    const permission = await OneSignal.Notifications.requestPermission();
    return permission;
  }

  /**
   * Obtém o Player ID do OneSignal
   */
  async getPlayerId(): Promise<string | null> {
    try {
      const OneSignal = await this.waitForOneSignal();
      
      // Obter o Player ID
      const userId = await OneSignal.User.PushSubscription.id;
      return userId || null;
    } catch (error) {
      console.error('Erro ao obter Player ID:', error);
      return null;
    }
  }

  /**
   * Cria subscription (obtém Player ID do OneSignal)
   */
  async subscribe(): Promise<OneSignalSubscription | null> {
    try {
      // Aguardar OneSignal estar pronto
      const OneSignal = await this.waitForOneSignal();

      // Solicitar permissão
      const permission = await OneSignal.Notifications.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permissão de notificações negada');
      }

      // Aguardar um pouco para o Player ID ser gerado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Obter Player ID
      const playerId = await OneSignal.User.PushSubscription.id;
      
      if (!playerId) {
        throw new Error('Não foi possível obter Player ID do OneSignal');
      }

      console.log('✅ Player ID obtido:', playerId);

      return {
        player_id: playerId
      };
    } catch (error) {
      console.error('Erro ao criar subscription:', error);
      return null;
    }
  }

  /**
   * Salva subscription no Supabase
   */
  async saveSubscription(subscription: OneSignalSubscription): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscription, // Armazena o objeto com player_id
          enabled: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Erro ao salvar subscription:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao salvar subscription:', error);
      return false;
    }
  }

  /**
   * Remove subscription (desativa notificações)
   */
  async unsubscribe(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      // Desativar no banco
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ enabled: false })
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao desativar subscription:', error);
        return false;
      }

      // Desativar no OneSignal
      try {
        const OneSignal = await this.waitForOneSignal();
        await OneSignal.Notifications.setSubscription(false);
      } catch (error) {
        console.error('Erro ao desativar no OneSignal:', error);
      }

      return true;
    } catch (error) {
      console.error('Erro ao desativar subscription:', error);
      return false;
    }
  }

  /**
   * Verifica se o usuário já tem subscription ativa
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('enabled')
        .eq('user_id', user.id)
        .eq('enabled', true)
        .maybeSingle();

      if (error || !data) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
