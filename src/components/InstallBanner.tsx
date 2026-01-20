import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

const InstallBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const touchStartX = React.useRef<number>(0);

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

    // Se já está instalado, não mostra o banner
    if (installed) {
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Handler para o evento beforeinstallprompt (Android/Chrome)
    // Se esse evento disparar, significa que NÃO está instalado
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Se tem o prompt, significa que NÃO está instalado - mostra o banner
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS ou se não receber o evento beforeinstallprompt
    // mostra o banner imediatamente (iOS não tem esse evento)
    const timeoutId = setTimeout(() => {
      // Se não recebeu o prompt e não está instalado, mostra
      // (iOS sempre mostra se não estiver instalado, pois não tem beforeinstallprompt)
      if (!installed) {
        setIsVisible(true);
      }
    }, 100); // Pequeno delay para dar tempo do evento beforeinstallprompt disparar

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleInstall = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      // iOS - mostra as instruções em cima
      setShowInstructions(true);
      // Fecha automaticamente após 10 segundos com animação
      setTimeout(() => {
        setIsClosing(true);
        // Aguarda a animação terminar antes de fechar
        setTimeout(() => {
          setShowInstructions(false);
          setIsClosing(false);
        }, 600);
      }, 10000);
    } else if (deferredPrompt) {
      // Android/Chrome - usa o prompt nativo
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    // Apenas esconde o banner, mas não salva preferência
    // Na próxima vez que abrir, vai aparecer novamente (se não estiver instalado)
    setIsVisible(false);
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <>
      {/* Card de Instruções no TOPO da tela */}
      {showInstructions && isIOS && (
        <div className="fixed top-4 left-4 right-4 z-[150] max-w-md mx-auto">
          <div
            className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl ${
              isSwiping 
                ? '' 
                : isClosing 
                  ? 'animate-slide-out-to-right'
                  : 'animate-in slide-in-from-top duration-500 fade-in'
            }`}
            style={{
              transform: isSwiping ? `translateX(${swipeOffset}px)` : undefined,
              opacity: isSwiping && swipeOffset > 100 ? Math.max(0, 1 - swipeOffset / 200) : undefined
            }}
            onTouchStart={(e) => {
              if (isClosing) return;
              touchStartX.current = e.touches[0].clientX;
              setIsSwiping(true);
            }}
            onTouchMove={(e) => {
              if (isClosing) return;
              const currentX = e.touches[0].clientX;
              const diff = currentX - touchStartX.current;
              // Só permite deslizar para a direita (valores positivos)
              if (diff > 0) {
                setSwipeOffset(diff);
              }
            }}
            onTouchEnd={() => {
              if (isClosing) return;
              // Se deslizou mais de 100px, fecha a notificação com animação
              if (swipeOffset > 100) {
                setIsClosing(true);
                // Aguarda a animação terminar antes de fechar
                setTimeout(() => {
                  setShowInstructions(false);
                  setIsClosing(false);
                  setSwipeOffset(0);
                }, 600);
              } else {
                // Volta suavemente à posição original
                setSwipeOffset(0);
                setIsSwiping(false);
              }
            }}
          >
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Como instalar no iPhone/iPad
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Toque no botão <span className="font-bold">Compartilhar</span> (quadrado com seta) e depois em <span className="font-bold">"Adicionar à Tela de Início"</span>
            </p>
          </div>
        </div>
      )}

      {/* Banner de Instalação - SOBREPOSTO ao menu */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[110] pointer-events-none">
        <div className="pointer-events-auto bg-white border border-slate-200 rounded-2xl px-2 py-4 relative shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={handleDismiss}
            className="absolute top-2.5 right-2.5 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-start gap-2.5 pr-5">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-4.5 h-4.5 text-slate-600" />
            </div>

            <div className="flex-1 space-y-2.5 flex flex-col justify-between min-h-[80px]">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 leading-tight">
                  Instale o Geração Life
                </h3>
                <p className="text-[13px] text-slate-500 mt-1 leading-tight">
                  Adicione à tela inicial para acesso rápido
                </p>
              </div>

              <button
                onClick={handleInstall}
                className="w-full bg-[#12192b] text-white py-2.5 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InstallBanner;

