import React from 'react';
import { X, ArrowLeft, Flame, BookOpen, Calendar, TrendingUp, Award } from 'lucide-react';
import { User, DevotionalPost } from '@/types';

interface JourneyModalProps {
  user: User;
  onClose: () => void;
  totalDevotionals: number;
  weeklyDevotionals?: DevotionalPost[];
}

const JourneyModal: React.FC<JourneyModalProps> = ({ user, onClose, totalDevotionals, weeklyDevotionals = [] }) => {
  // Calcular ciclos completos (cada ciclo = 10 devocionais)
  const completedCycles = Math.floor(totalDevotionals / 10);
  
  // Calcular devocionais no ciclo atual
  const currentCycleDevotionals = totalDevotionals % 10;
  
  // Acesas = número de ciclos completos (a cada 10 devocionais = 1 ciclo)
  const litFlames = completedCycles;
  
  // Progresso da meta SEMANAL (0-7 para a semana atual)
  const weeklyGoalProgress = weeklyDevotionals.length;
  const weeklyGoalPercentage = (weeklyGoalProgress / 7) * 100;
  
  // Selecionar imagem da fogueira baseada no progresso do ciclo atual (0-10)
  // 0-3 devocionais = chama pequena
  // 4-7 devocionais = chama média
  // 8-10 devocionais = chama grande
  // Mapeamento de Fases da Chama (10 passos -> 6 imagens)
  // Reutilizando a lógica do DevotionalSuccessModal
  const getFlameLevel = (progress: number) => {
    if (progress >= 10) return 6; 
    if (progress >= 9) return 5;
    if (progress >= 7) return 4;
    if (progress >= 5) return 3;
    if (progress >= 3) return 2;
    return 1; 
  };

  const currentProgress = currentCycleDevotionals === 0 && totalDevotionals > 0 ? 10 : currentCycleDevotionals;
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
  const campfireImage = getFlameImage(flameLevel);
  
  // Sequências
  const currentStreak = user.streak || 0;
  const maxStreak = user.maxStreak || 0;
  
  // Dias da semana (D, S, T, Q, Q, S, S)
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  
  // Obter dia da semana atual (0 = Domingo, 1 = Segunda, etc.)
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  
  // Criar um Set com os dias da semana que têm devocionais
  const devotionalDays = new Set(
    weeklyDevotionals.map(dev => new Date(dev.date).getDay())
  );
  
  // Calcular quais dias da semana têm devocionais
  const getWeekDayStatus = (dayIndex: number) => {
    if (devotionalDays.has(dayIndex)) {
      return 'completed'; // Dia com devocional feito
    } else if (dayIndex === currentDayOfWeek) {
      return 'today'; // Dia atual
    }
    return 'pending'; // Dia pendente
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-white px-6 py-5 flex items-center gap-4 border-b border-slate-100 z-50 shadow-sm">
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={24} className="text-slate-700" />
        </button>
        <div className="flex items-center gap-2">
          <Flame size={20} className="text-orange-500" />
          <h2 className="text-lg font-bold text-slate-900">Minha Jornada</h2>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 py-6 space-y-4 pb-20">
        {/* Card Chama Acesa */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          {/* Imagem de fundo Full Height */}
          <div className="absolute inset-0 h-full overflow-hidden rounded-3xl flex items-center justify-center">
            <img 
              src={campfireImage}
              alt={`Nível de Chama ${flameLevel}`}
              className="w-full h-full object-cover object-center relative z-10 drop-shadow-[0_0_50px_rgba(249,115,22,0.6)]"
            />

             {/* Ambient Glow (Luz do Fogo) - SPOTLIGHT FOCADO E CONTIDO */}
             <div 
               className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[80%] blur-3xl z-20 pointer-events-none mix-blend-screen transition-opacity duration-1000"
               style={{
                 background: `radial-gradient(ellipse at top, rgba(249,115,22,${glowOpacity * 0.8}) 0%, rgba(249,115,22,${glowOpacity * 0.2}) 40%, transparent 60%)`
               }}
             />

             {/* Embers / Faíscas Saindo da Chama */}
             <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-3xl">
                <style>{`
                  @keyframes ember-rise {
                    0% { transform: translateY(0) scale(1); opacity: 1; }
                    100% { transform: translateY(-300px) scale(0); opacity: 0; }
                  }
                `}</style>
                {/* Quantidade e intensidade baseada no nível da chama (Mode Inferno no lvl 10) */}
                {[...Array(flameLevel === 6 ? 60 : 10 + (flameLevel * 5))].map((_, i) => (
                   <div
                     key={i}
                     className="absolute bg-orange-400 rounded-full mix-blend-screen"
                     style={{
                       left: '50%',
                       // Ajustado para o card full height, origem mais baixa
                       top: flameLevel === 6 ? '90%' : '40%', 
                       width: `${Math.random() * 3 + 1}px`,
                       height: `${Math.random() * 3 + 1}px`,
                       
                       // Espalhamento
                       marginLeft: flameLevel === 6 
                          ? `${Math.random() * 280 - 140}px` 
                          : `${Math.random() * (40 + flameLevel * 10) - (20 + flameLevel * 5)}px`, 
                       
                       marginTop: `${Math.random() * 20 - 10}px`,
                       opacity: 0,
                       animation: `ember-rise ${Math.random() * 3 + 2}s ease-out infinite`,
                       animationDelay: `${Math.random() * 3}s`,
                       boxShadow: '0 0 6px rgba(249, 115, 22, 1)'
                     }}
                   />
                ))}
             </div>
          </div>
          
          {/* Gradiente escuro para legibilidade do texto (Bottom-up e Top-down) */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900/90 rounded-3xl pointer-events-none z-20"></div>
          
          {/* Conteúdo sobre a imagem */}
          <div className="relative z-30 flex flex-col h-[320px] justify-between">
            <div className="mt-2">
              <h3 className="text-white font-bold text-sm uppercase tracking-wide opacity-90 drop-shadow-md">CHAMA ACESA</h3>
              <p className="text-white text-opacity-90 text-sm font-medium drop-shadow-md">{getFlameTitle(flameLevel)}</p>
            </div>
            
            {/* Footer com badge e ciclos */}
            <div className="flex items-end justify-between mt-auto z-30">
              {/* Badge de ciclos com texto acima */}
              <div className="flex flex-col gap-2">
                <span className="text-white/80 text-xs uppercase tracking-wide font-medium drop-shadow-md">Ciclos Completos</span>
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Flame size={24} className="text-white" />
                </div>
              </div>
              
              {/* Número de ciclos */}
              <span className="text-orange-500 font-bold text-4xl drop-shadow-sm filter brightness-110">{completedCycles}</span>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-3">
          {/* Nº Devocional */}
          <div className="bg-orange-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Nº Devocional</p>
            <p className="text-2xl font-bold text-slate-900">{totalDevotionals}</p>
          </div>
          
          {/* Acesas */}
          <div className="bg-orange-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Flame size={16} className="text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Acesas</p>
            <p className="text-2xl font-bold text-slate-900">{litFlames}</p>
          </div>
        </div>

        {/* Progresso da Meta */}
        <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp size={20} className="text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Progresso da Meta</h3>
                  <p className="text-xs text-slate-500">Semana atual</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-slate-900">{weeklyGoalProgress}</span>
                  <span className="text-slate-400 text-sm">/7</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Barra de progresso */}
          <div className="space-y-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${weeklyGoalPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Faltam <span className="font-bold text-orange-600">{7 - weeklyGoalProgress}</span> check-ins para completar
              </span>
              <span className="font-bold text-orange-600">{Math.round(weeklyGoalPercentage)}%</span>
            </div>
          </div>
        </div>

        {/* Sequências */}
        <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Flame size={20} className="text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Sequências</h3>
              <p className="text-xs text-slate-500">Dias consecutivos</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Atual */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-1 text-xs text-slate-500 uppercase tracking-wide mb-2">
                <div className="w-4 h-4 rounded-full border-2 border-slate-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                </div>
                Atual
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{currentStreak}</p>
              <p className="text-xs text-slate-600">dias</p>
              {currentStreak > 0 && (
                <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp size={12} />
                  Em andamento
                </p>
              )}
            </div>
            
            {/* Recorde */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-1 text-xs text-slate-500 uppercase tracking-wide mb-2">
                <Award size={14} className="text-slate-400" />
                Recorde
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{maxStreak}</p>
              <p className="text-xs text-slate-600">dias</p>
            </div>
          </div>
        </div>

        {/* Esta Semana */}
        <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Esta Semana</h3>
                <p className="text-xs text-slate-500">
                  {weeklyDevotionals.length} de 7 dias completos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-200 bg-opacity-60 px-2 py-2 rounded-xl">
              <TrendingUp size={14} />
              {Math.round((weeklyDevotionals.length / 7) * 100)}%
            </div>
          </div>
          
          {/* Calendário da semana */}
          <div className="flex gap-2">
            {weekDays.map((day, index) => {
              const status = getWeekDayStatus(index);
              return (
                <div 
                  key={index} 
                  className={`flex-1 rounded-2xl p-2 h-[95px] flex flex-col items-center justify-start transition-all relative opacity-70 ${
                    status === 'completed' 
                      ? 'border-2 border-orange-300' 
                      : status === 'today'
                      ? 'border-2 border-orange-500'
                      : 'border-2 border-slate-200'
                  }`}
                >
                  {/* Background com opacity */}
                  <div className={`absolute inset-0 rounded-2xl opacity-70 ${
                    status === 'completed' 
                      ? 'bg-orange-100' 
                      : status === 'today'
                      ? 'bg-orange-50'
                      : 'bg-slate-50'
                  }`} />
                  
                  {/* Conteúdo sem opacity */}
                  <span className={`text-xs font-bold mb-2 relative z-10 ${
                    status === 'completed' || status === 'today'
                      ? 'text-orange-600'
                      : 'text-slate-400'
                  }`}>
                    {day}
                  </span>
                  
                  {status === 'completed' && (
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center relative z-10">
                      <Flame size={12} className="text-white" />
                    </div>
                  )}
                  
                  {status === 'today' && (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-300 rounded-full bg-slate-200 relative z-10 mb-1" />
                      <div className="text-[10px] font-bold text-orange-600 relative z-10">Hoje</div>
                    </>
                  )}
                  
                  {status === 'pending' && (
                    <div className="w-5 h-5 border-2 border-slate-300 rounded-full bg-slate-200 relative z-10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyModal;
