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
  const getCampfireImage = () => {
    if (currentCycleDevotionals <= 3) {
      return '/campfire-small.png';
    } else if (currentCycleDevotionals <= 7) {
      return '/campfire-medium.png';
    } else {
      return '/campfire-large.png';
    }
  };
  
  const campfireImage = getCampfireImage();
  
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
          {/* Imagem de fundo - limitada à parte superior */}
          <div className="absolute top-0 left-0 right-0 h-64 overflow-hidden rounded-t-3xl flex items-center justify-center">
            <img 
              src={campfireImage}
              alt="Fogueira"
              className="w-full h-full object-cover object-center transition-all duration-700 ease-in-out"
            />
          </div>
          
          {/* Gradiente escuro na parte inferior */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/60 to-slate-900 rounded-3xl"></div>
          
          {/* Conteúdo sobre a imagem */}
          <div className="relative z-10 space-y-4">
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wide">CHAMA ACESA</h3>
              <p className="text-slate-400 text-xs">{litFlames} chama{litFlames !== 1 ? 's' : ''} acesa{litFlames !== 1 ? 's' : ''}</p>
            </div>
            
            {/* Espaçador para a imagem */}
            <div className="h-48"></div>
            
            {/* Footer com badge e ciclos */}
            <div className="flex items-end justify-between">
              {/* Badge de ciclos com texto acima */}
              <div className="flex flex-col gap-2">
                <span className="text-slate-400 text-xs uppercase tracking-wide">Ciclos Completos</span>
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center">
                  <Flame size={24} className="text-white" />
                </div>
              </div>
              
              {/* Número de ciclos */}
              <span className="text-orange-500 font-bold text-3xl">{completedCycles}</span>
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
