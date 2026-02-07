import React, { useState, useEffect } from 'react';
import { X, Bell, Loader2 } from 'lucide-react';
import { pushNotificationService } from '../services/pushNotificationService';
import { toast } from 'sonner';

interface NotificationPromptProps {
  onNotificationEnabled?: () => void;
}

const NotificationPrompt: React.FC<NotificationPromptProps> = ({ onNotificationEnabled }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    // Verificar se já tem subscription ativa
    const checkSubscription = async () => {
      const hasActive = await pushNotificationService.hasActiveSubscription();
      setHasSubscription(hasActive);
      
      // Se NÃO tiver subscription, mostra o prompt
      if (!hasActive) {
        setIsVisible(true);
      }
    };

    checkSubscription();
  }, []);

  const handleActivate = async () => {
    // Verificar se a conexão é segura (HTTPS ou localhost)
    const isSecureContext = window.isSecureContext;
    
    // Verificar se suporta notificações push
    if (!pushNotificationService.isSupported()) {
      toast.error('Seu navegador não suporta notificações push');
      return;
    }

    // No iPhone/Mobile, se não estiver em HTTPS, a API vai falhar ou travar
    if (!isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      toast.error('HTTPS Obrigatório', {
        description: 'Para ativar notificações no celular, o site precisa estar em uma conexão segura (HTTPS).'
      });
      return;
    }

    setIsLoading(true);

    // Timeout de segurança para não travar o botão se a API do OneSignal não responder
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        toast.error('O OneSignal demorou muito para responder', {
          description: 'Verifique sua conexão e se o app está instalado corretamente.'
        });
      }
    }, 10000);

    try {
      // 1. Solicitar permissão
      const permission = await pushNotificationService.requestPermission();
      
      if (permission !== 'granted') {
        toast.error('Permissão de notificações negada pelo iOS/Android');
        clearTimeout(timeoutId);
        setIsLoading(false);
        return;
      }

      // 2. Criar subscription
      const subscription = await pushNotificationService.subscribe();
      
      if (!subscription) {
        toast.error('Erro ao conectar com OneSignal. Verifique sua internet.');
        clearTimeout(timeoutId);
        setIsLoading(false);
        return;
      }

      // 3. Salvar no banco
      const saved = await pushNotificationService.saveSubscription(subscription);
      
      if (!saved) {
        toast.error('Erro ao salvar no banco de dados.');
        clearTimeout(timeoutId);
        setIsLoading(false);
        return;
      }

      if (onNotificationEnabled) {
        onNotificationEnabled();
      } else {
        toast.success('Notificações ativadas! 🔔', {
          description: 'Você receberá lembretes diários sobre seu devocional.',
          duration: 3000,
        });
      }

      setHasSubscription(true);
      setIsVisible(false);
      clearTimeout(timeoutId);
    } catch (error: any) {
      console.error('Erro ao ativar notificações:', error);
      toast.error('Erro ao ativar notificações', {
        description: error.message || 'Tente novamente mais tarde.',
      });
      clearTimeout(timeoutId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || hasSubscription) {
    return null;
  }

  return (
    <div className="bg-orange-50/80 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-3 relative shadow-sm animate-in fade-in slide-in-from-top duration-500 mb-4">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
        title="Fechar"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-2.5 pr-5">
        <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
          <Bell className="w-4.5 h-4.5 text-orange-500" />
        </div>

        <div className="flex-1 flex items-center justify-between gap-2">
          <div className="flex-1">
            <h3 className="text-[14px] font-bold text-slate-900 leading-tight">
              Ative as notificações
            </h3>
            <p className="text-[12px] text-slate-600 mt-0.5 leading-tight">
              Não perca o devocional diário
            </p>
          </div>

          <button
            onClick={handleActivate}
            disabled={isLoading}
            className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-[12px] font-bold hover:bg-orange-600 transition-colors active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>...</span>
              </>
            ) : (
              'Ativar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;

