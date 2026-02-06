import React, { useEffect, useState } from 'react';
import { X, Flame } from 'lucide-react';

interface DevotionalSuccessModalProps {
  isOpen: boolean;
  onContinue: () => void;
  currentStreak: number; 
}

const DevotionalSuccessModal: React.FC<DevotionalSuccessModalProps> = ({ isOpen, onContinue, currentStreak }) => {
  const [isVisible, setIsVisible] = useState(false);
  // Animação da Barra: Começa um passo atrás e enche
  const [displayedProgress, setDisplayedProgress] = useState(0);

  // Lógica do Ciclo (10 dias)
  const cycleLength = 10;
  const currentProgress = currentStreak % cycleLength === 0 && currentStreak > 0 ? 10 : currentStreak % cycleLength;
  const cyclesCompleted = Math.floor((currentStreak - 1) / cycleLength);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      
      // Setup inicial da animação: começa um antes
      const startValue = Math.max(0, currentProgress - 1);
      setDisplayedProgress(startValue);

      // Dispara a animação de preenchimento após o modal abrir
      const timer = setTimeout(() => {
        setDisplayedProgress(currentProgress);

        // Se completou o ciclo (10/10), inicia a sequência de "reset" visual após um tempo
        if (currentProgress === 10) {
           setTimeout(() => {
              // Sequência de diminuição (1 por 1)
              let step = 10;
              const interval = setInterval(() => {
                 step -= 1;
                 setDisplayedProgress(step);
                 if (step <= 0) clearInterval(interval);
              }, 150); // Velocidade da diminuição (rápida)
           }, 2000); // Espera 2 segundos com a barra cheia celebrando
        }

      }, 600); // Delay sincronizado com a entrada do modal

      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setIsVisible(false), 300);
      setDisplayedProgress(0); // Reset
    }
  }, [isOpen, currentProgress]);

  if (!isVisible && !isOpen) return null;

  // Mapeamento de Fases da Chama (10 passos -> 6 imagens)
  const getFlameLevel = (progress: number) => {
    if (progress >= 10) return 6; 
    if (progress >= 9) return 5;
    if (progress >= 7) return 4;
    if (progress >= 5) return 3;
    if (progress >= 3) return 2;
    return 1; 
  };

  const flameLevel = getFlameLevel(currentProgress);

  const getFlameImage = (level: number) => {
    if (level === 6) return '/flame-level-6.jpeg';
    return `/flame-level-${level}.png`;
  };

  const getFlameTitle = (level: number) => {
    switch (level) {
      case 1: return 'Chama Iniciada';
      case 2: return 'Aquecendo';
      case 3: return 'Fogo Crescendo';
      case 4: return 'Chama Forte';
      case 5: return 'Fogo Alto';
      case 6: return 'Labareda!';
      default: return 'Chama Acesa';
    }
  };

  // Intensidade da Luz (0.2 a 0.8) baseada no nível da chama
  const getGlowIntensity = (level: number) => {
    switch(level) {
      case 1: return 0.2;
      case 2: return 0.3;
      case 3: return 0.45;
      case 4: return 0.6;
      case 5: return 0.75;
      case 6: return 0.9;
      default: return 0.2;
    }
  };
  
  const glowOpacity = getGlowIntensity(flameLevel);

  return (
    <div className={`fixed inset-0 z-[300] flex items-center justify-center transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Background Opaco Full Screen (Slate-900 similar ao App) */}
      <div className="absolute inset-0 bg-[#0f172a] overflow-hidden">
        {/* Cinematic Background Embers (Faíscas Globais) */}
        <div className="absolute inset-0 pointer-events-none">
          <style>{`
            @keyframes cinematic-rise {
               0% { transform: translateY(110vh) scale(0); opacity: 0; }
               20% { opacity: 1; } // Full opacity
               100% { transform: translateY(-10vh) scale(1.5); opacity: 0; }
            }
          `}</style>
          {[...Array(40)].map((_, i) => (
             <div
               key={i}
               className="absolute bg-orange-300 rounded-full blur-[2px]"
               style={{
                 left: `${Math.random() * 100}%`,
                 width: `${Math.random() * 8 + 4}px`, // Bigger particles
                 height: `${Math.random() * 8 + 4}px`,
                 opacity: 0,
                 animation: `cinematic-rise ${Math.random() * 5 + 5}s linear infinite`, // Faster
                 animationDelay: `${Math.random() * 5}s`,
                 boxShadow: '0 0 20px rgba(255, 140, 0, 1)' // Super bright glow
               }}
             />
          ))}
        </div>
      </div>

      {/* Close Button Top Right */}
      <button 
        onClick={onContinue}
        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[310]"
      >
        <X size={24} />
      </button>

      {/* Container Principal */}
      {/* Container Principal */}
      <div className={`relative w-full h-full max-w-md mx-auto flex flex-col px-6 pt-16 pb-8 transition-all duration-500 delay-100 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        {/* Header Section */}
        <div className="mb-8">
           <h2 className="text-2xl font-bold text-white tracking-tight mb-6 text-center">
            Devocional concluído!
          </h2>

          {/* Progress Bar Row */}
          <div className="flex items-center gap-4">
            {/* Barra de Segmentos "Coladinhos" */}
            <div className="flex-1 flex gap-0.5 h-3">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i}
                  className={`flex-1 h-full transition-all duration-700 ease-out relative ${
                    i < displayedProgress 
                      ? 'bg-orange-500 scale-100 opacity-100' 
                      : 'bg-slate-700/50 scale-100 opacity-100'
                  }`}
                  style={{
                     // Arredondamento das pontas
                     borderTopLeftRadius: i === 0 ? '6px' : '0',
                     borderBottomLeftRadius: i === 0 ? '6px' : '0',
                     borderTopRightRadius: i === 9 ? '6px' : '0',
                     borderBottomRightRadius: i === 9 ? '6px' : '0',
                     // Brilho Progressivo "Power": Sem pulso, só intensidade
                     // Camada 1: Brilho central intenso
                     // Camada 2: Difusão laranja forte
                     boxShadow: i < displayedProgress 
                       ? `0 0 ${8 + i}px rgba(255, 150, 50, 0.9), 0 0 ${15 + (i * 3)}px rgba(249, 115, 22, 0.6)` 
                       : 'none',
                     zIndex: i < displayedProgress ? 10 + i : 0, // Z-index progressivo para o brilho ficar por cima do anterior
                     
                     // Efeito "Pop" para o último segmento que acabou de preencher
                     transform: i === displayedProgress - 1 && displayedProgress === currentProgress && isOpen ? 'scale(1.15)' : 'scale(1)',
                     transitionDelay: i === displayedProgress - 1 ? '0.1s' : '0s'
                  }}
                />
              ))}
            </div>
            
            {/* Contador na Mesma Linha */}
            <div className="text-white font-bold text-xl flex items-baseline gap-1 min-w-[3rem] justify-end transition-all duration-300">
              <span className={displayedProgress === currentProgress ? "animate-in zoom-in duration-300" : ""}>
                 {displayedProgress}
              </span>
              <span className="text-slate-500 text-sm font-normal">/10</span>
            </div>
          </div>
        </div>

        {/* Flame Card - Estilo JourneyModal (Fixed Height Compact) */}
        <div className="w-full h-[70%] bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-white/5 flex flex-col">
          
          {/* Imagem de Fundo (Topo) */}
          <div className="absolute top-0 left-0 right-0 h-full overflow-hidden rounded-t-3xl flex items-center justify-center">
             
             <img 
              src={getFlameImage(flameLevel)}
              alt={`Nível de Chama ${flameLevel}`}
              className="w-full h-full object-cover object-center relative z-10 drop-shadow-[0_0_50px_rgba(249,115,22,0.6)]"
            />
             
             {/* Ambient Glow (Luz do Fogo) - SPOTLIGHT FOCADO E CONTIDO */}
             <div 
               className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60%] blur-2xl z-20 pointer-events-none mix-blend-screen transition-opacity duration-1000"
               style={{
                 background: `radial-gradient(ellipse at top, rgba(249,115,22,${glowOpacity}) 0%, rgba(249,115,22,${glowOpacity * 0.2}) 30%, transparent 50%)`
               }}
             />

             {/* Embers / Faíscas Saindo da Chama */}
             <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-t-3xl">
                <style>{`
                  @keyframes ember-rise {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-200px) scale(0); opacity: 0; }
                  }
                `}</style>
                {/* Quantidade e intensidade baseada no nível da chama (Mode Inferno no lvl 10) */}
                {[...Array(flameLevel === 6 ? 60 : 10 + (flameLevel * 5))].map((_, i) => (
                   <div
                     key={i}
                     className="absolute bg-orange-400 rounded-full mix-blend-screen"
                     style={{
                       left: '50%',
                       // No nível máximo (6), as faíscas vêm de baixo (fundo da tela). Nos outros, do centro.
                       top: flameLevel === 6 ? '85%' : '35%', 
                       width: `${Math.random() * 3 + 1}px`,
                       height: `${Math.random() * 3 + 1}px`,
                       
                       // Espalhamento: Muito maior no nível máximo para cobrir o fundo
                       marginLeft: flameLevel === 6 
                          ? `${Math.random() * 280 - 140}px` 
                          : `${Math.random() * (40 + flameLevel * 10) - (20 + flameLevel * 5)}px`, 
                       
                       marginTop: `${Math.random() * 20 - 10}px`,
                       opacity: 0,
                       animation: `ember-rise ${Math.random() * 2 + 1.5}s ease-out infinite`,
                       animationDelay: `${Math.random() * 3}s`,
                       boxShadow: '0 0 6px rgba(249, 115, 22, 1)'
                     }}
                   />
                ))}
             </div>
          </div>

          {/* Gradiente Overlay para Texto */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-slate-900 rounded-3xl pointer-events-none"></div>

          {/* Conteúdo Sobreposto */}
          <div className="relative z-30 flex flex-col h-full pointer-events-none">
            {/* Top Text */}
            <div className="mt-4">
              <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">
                CHAMA ACESA
              </h3>
              <p className="text-white text-2xl font-bold tracking-tight">
                {getFlameTitle(flameLevel)}
              </p>
            </div>

            <div className="flex-1"></div>

            {/* Bottom Info: Ciclos */}
            <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
               <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                    CICLOS COMPLETOS
                  </h4>
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                     <span className="text-white font-bold text-xl">{cyclesCompleted}</span>
                  </div>
               </div>
               
               {currentProgress === 10 && (
                 <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg">
                    <span className="text-orange-400 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                       <Flame size={12} fill="currentColor" />
                       Ciclo Completo!
                    </span>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <button
            onClick={onContinue}
            className="w-full bg-white text-slate-900 font-black text-sm tracking-wide py-4 rounded-2xl shadow-xl hover:bg-slate-50 active:scale-[0.98] transition-all uppercase"
          >
            CONTINUAR
          </button>
        </div>

      </div>
    </div>
  );
};

export default DevotionalSuccessModal;
