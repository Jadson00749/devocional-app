import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Flame } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  devotionalDates: Date[]; // Datas que têm devocionais
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onDevotionalClick?: (date: Date) => void; // Callback quando clicar em um dia com devocional
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  devotionalDates,
  selectedDate,
  onDateSelect,
  onDevotionalClick
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const closingRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      closingRef.current = false;
    }
  }, [isOpen]);

  const handleClose = () => {
    if (closingRef.current) return; // Prevenir múltiplos cliques
    closingRef.current = true;
    setIsClosing(true);
    setTimeout(() => {
      closingRef.current = false;
      setIsClosing(false);
      onClose();
    }, 200);
  };

  if (!isOpen && !isClosing) return null;

  // Função para verificar se uma data tem devocional
  const hasDevotional = (date: Date): boolean => {
    return devotionalDates.some(devDate => {
      const devDateStr = format(devDate, 'yyyy-MM-dd');
      const dateStr = format(date, 'yyyy-MM-dd');
      return devDateStr === dateStr;
    });
  };

  // Função para verificar se é hoje
  const isToday = (date: Date): boolean => {
    return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  };

  // Função para verificar se é a data selecionada
  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  };

  // Navegação de mês
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Verificar se pode navegar para o futuro (não permitir ir além do mês atual)
  const canGoToNextMonth = () => {
    const now = new Date();
    const nextMonth = addMonths(currentMonth, 1);
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();
    const nextMonthYear = nextMonth.getFullYear();
    const nextMonthNum = nextMonth.getMonth();
    
    // Não permitir se o próximo mês for maior que o mês atual
    if (nextMonthYear > currentYear) return false;
    if (nextMonthYear === currentYear && nextMonthNum > currentMonthNum) return false;
    
    return true;
  };

  // Gerar dias do calendário
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0, locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0, locale: ptBR });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Dias da semana
  const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  const handleDateClick = (date: Date) => {
    const hasDev = hasDevotional(date);
    
    // Apenas dias com devocional abrem o modal
    if (hasDev && onDevotionalClick) {
      onDevotionalClick(date);
    }
    
    // Dias sem devocional não fazem nada
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end">
      {/* Overlay escuro com tom azulado */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          animation: isClosing ? 'fadeOut 0.2s ease-out' : 'fadeIn 0.15s ease-out'
        }}
        onClick={handleClose}
      />
      
      {/* Modal do Calendário */}
      <div 
        className="relative rounded-t-3xl w-full shadow-2xl z-10 overflow-hidden flex flex-col"
        style={{
          background: '#0f172a',
          animation: isClosing ? 'slideDown 0.2s ease-out' : 'slideUp 0.2s ease-out',
          maxHeight: '50vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Calendário */}
        <div className="rounded-t-3xl px-4 py-3 flex items-center justify-between border-b border-slate-700/30" style={{ background: '#1e293b' }}>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-semibold tracking-tight">
              {format(new Date(), "d MMM yyyy", { locale: ptBR }).toUpperCase()}
            </span>
          </div>
          {/* Indicador visual (chaveirinho) no header - centralizado */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <div className="w-20 h-2 bg-black/70 rounded-full"></div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X size={18} className="text-slate-300" />
          </button>
        </div>

        {/* Navegação do Mês */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-slate-700/30" style={{ background: '#0f172a' }}>
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          
          <h2 className="text-white text-base font-extrabold tracking-tight">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
          </h2>
          
          <button
            onClick={handleNextMonth}
            disabled={!canGoToNextMonth()}
            className={`p-2 rounded-lg transition-colors ${
              canGoToNextMonth() 
                ? 'hover:bg-slate-800/50 cursor-pointer' 
                : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>

        {/* Calendário */}
        <div className="px-4 pt-3 pb-10 overflow-hidden flex-1 flex flex-col" style={{ background: '#0f172a', minHeight: 0 }}>
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 mb-1" style={{ gap: 0 }}>
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="text-center text-[10px] font-semibold text-slate-400 uppercase py-1 tracking-wide"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid de dias */}
          <div className="grid grid-cols-7 flex-1" style={{ gap: 0 }}>
            {calendarDays.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);
              const isSelectedDate = isSelected(day);
              const hasDev = hasDevotional(day);

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`
                    w-full rounded-[15px] flex items-center justify-center text-sm font-medium transition-all relative
                    ${!isCurrentMonth ? 'text-slate-600 opacity-40' : 'text-white'}
                    ${isTodayDate && !hasDev ? 'border border-orange-500/40 bg-orange-500/10' : ''}
                    ${hasDev && isCurrentMonth ? 'bg-orange-500/10 cursor-pointer' : ''}
                    ${!isTodayDate && !hasDev && isCurrentMonth ? 'cursor-default' : ''}
                    ${hasDev && isCurrentMonth ? 'hover:bg-orange-500/15 active:bg-orange-500/20' : ''}
                  `}
                  style={{ aspectRatio: '1' }}
                >
                  {hasDev && isCurrentMonth ? (
                    <div className="w-8 h-8 rounded-full border-2 border-orange-500 bg-orange-500/20 flex items-center justify-center active-circle-glow">
                      <Flame 
                        size={16} 
                        className="text-orange-500 fill-orange-500 animate-soft-glow"
                        style={{
                          filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.8))',
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-sm font-medium">{format(day, 'd')}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarModal;
