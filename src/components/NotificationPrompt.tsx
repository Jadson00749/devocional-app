import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';

const NotificationPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
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

    // Se não está instalado, mostra o prompt imediatamente
    if (!installed) {
      setIsVisible(true);
    }
  }, []);

  const handleActivate = () => {
    // Aqui você pode adicionar a lógica para solicitar permissão de notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notificações ativadas');
        }
      });
    }
    setIsVisible(false);
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
            className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-[12px] font-bold hover:bg-orange-600 transition-colors active:scale-95 shrink-0"
          >
            Ativar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;

