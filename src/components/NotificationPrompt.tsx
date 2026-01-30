import React, { useState, useEffect } from 'react';
import { X, Bell, Loader2 } from 'lucide-react';
import { pushNotificationService } from '../services/pushNotificationService';
import { toast } from 'sonner';

const NotificationPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    // Verificar se já tem subscription ativa
    const checkSubscription = async () => {
      const hasActive = await pushNotificationService.hasActiveSubscription();
      setHasSubscription(hasActive);
      
      if (hasActive) {
        setIsVisible(false);
        return;
      }
    };

    checkSubscription();

    // Verifica se já está instalado
    let installed = false;

    // Verifica se está em modo standalone (PWA instalado) - Android/Chrome
    if (window.matchMedia('(display-mode: standalone)').matches) {
      installed = true;
      setIsInstalled(true);
      return;
    }

    // Verifica se está em modo standalone no iOS
    if ((window.navigator as any).standalone === true) {
      installed = true;
      setIsInstalled(true);
      return;
    }

    // Verifica se está rodando como app instalado (outros métodos)
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      installed = true;
      setIsInstalled(true);
      return;
    }

    // Se não está instalado e não tem subscription, mostra o prompt
    if (!installed && !hasSubscription) {
      setIsVisible(true);
    }
  }, []);

  const handleActivate = async () => {
    // Verificar se suporta notificações push
    if (!pushNotificationService.isSupported()) {
      toast.error('Seu navegador não suporta notificações push');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Solicitar permissão
      const permission = await pushNotificationService.requestPermission();
      
      if (permission !== 'granted') {
        toast.error('Permissão de notificações negada');
        setIsLoading(false);
        return;
      }

      // 2. Criar subscription
      const subscription = await pushNotificationService.subscribe();
      
      if (!subscription) {
        toast.error('Erro ao criar subscription de notificações');
        setIsLoading(false);
        return;
      }

      // 3. Salvar no banco
      const saved = await pushNotificationService.saveSubscription(subscription);
      
      if (!saved) {
        toast.error('Erro ao salvar subscription');
        setIsLoading(false);
        return;
      }

      toast.success('Notificações ativadas! 🔔', {
        description: 'Você receberá lembretes diários sobre seu devocional.',
        duration: 3000,
      });

      setHasSubscription(true);
      setIsVisible(false);
    } catch (error: any) {
      console.error('Erro ao ativar notificações:', error);
      toast.error('Erro ao ativar notificações', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <div className="bg-orange-50/80 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-3 relative shadow-sm animate-in fade-in slide-in-from-top duration-500">
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
              Instale o app primeiro
            </h3>
            <p className="text-[12px] text-slate-600 mt-0.5 leading-tight">
              Adicione à tela inicial para receber notificações
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
                <span>Ativando...</span>
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

