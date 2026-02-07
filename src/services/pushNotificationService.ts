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
    return new Promise((resolve, reject) => {
      // Timeout de segurança (5s)
      const timeout = setTimeout(() => {
        console.error('Timeout aguardando OneSignal SDK');
        reject(new Error('OneSignal SDK não carregou em 5s'));
      }, 5000);

      // Função de resolução segura
      const safeResolve = (os: any) => {
        clearTimeout(timeout);
        this.oneSignalInitialized = true;
        resolve(os);
      };

      if ((window as any).OneSignal) {
        safeResolve((window as any).OneSignal);
        return;
      }

      // Se usar o formato deferido
      if ((window as any).OneSignalDeferred) {
        try {
          (window as any).OneSignalDeferred.push((OneSignal: any) => {
            safeResolve(OneSignal);
          });
        } catch (e) {
          console.error('Erro ao acessar OneSignalDeferred', e);
          // Fallback para checkInterval
        }
      } 
      
      // Fallback: Aguardar até estar disponível via intervalo
      const checkInterval = setInterval(() => {
        if ((window as any).OneSignal) {
          clearInterval(checkInterval);
          safeResolve((window as any).OneSignal);
        }
      }, 100);
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
    await OneSignal.Notifications.requestPermission();
    
    // Retornar o status nativo do navegador (garante que seja 'granted', 'denied' ou 'default')
    return Notification.permission;
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
      await OneSignal.Notifications.requestPermission();
      
      if (Notification.permission !== 'granted') {
        throw new Error('Permissão de notificações negada (status: ' + Notification.permission + ')');
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
   * Salva subscription no Supabase (na tabela profiles)
   */
  async saveSubscription(subscription: OneSignalSubscription): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Atualiza o player_id no perfil do usuário
      const { error } = await supabase
        .from('profiles')
        .update({
          player_id: subscription.player_id
        })
        .eq('id', user.id);

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

      // Remove player_id do banco
      const { error } = await supabase
        .from('profiles')
        .update({ player_id: null })
        .eq('id', user.id);

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

      // Verifica se existe player_id no perfil
      const { data, error } = await supabase
        .from('profiles')
        .select('player_id')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data || !data.player_id) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
