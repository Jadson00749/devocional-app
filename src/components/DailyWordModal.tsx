import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Lightbulb, Heart, Zap, Check, ChevronDown, CheckCircle2 } from 'lucide-react';
import { DailyWord } from '../types';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';

interface DailyWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyWord: DailyWord;
  initialHasRead: boolean;
  onReadComplete: () => void;
}

import { createPortal } from 'react-dom';

const DailyWordModal: React.FC<DailyWordModalProps> = ({ 
  isOpen, 
  onClose, 
  dailyWord, 
  initialHasRead,
  onReadComplete 
}) => {
  const [hasRead, setHasRead] = useState(initialHasRead);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompletionEffect, setShowCompletionEffect] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setHasRead(initialHasRead);
    // Reset effect when modal opens
    setShowCompletionEffect(false);
  }, [initialHasRead]);

  // Check initial scroll state (for short content)
  useEffect(() => {
    if (contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current;
      if (scrollHeight <= clientHeight + 10) { 
        setShowCompletionEffect(true);
        handleCompleteReading();
      }
    }
  }, [dailyWord]); 

  const handleScroll = () => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    
    // Safety check to avoid division by zero
    if (scrollHeight === 0) return;

    const progress = (scrollTop + clientHeight) / scrollHeight;
    setScrollProgress(progress);

    // Show effect when near bottom, hide when scrolling up
    // Using 0.95 threshold (95% scrolled)
    const shouldShow = progress > 0.95;
    
    if (shouldShow !== showCompletionEffect) {
      setShowCompletionEffect(shouldShow);
    }

    // Mark as read only once when reaching bottom
    if (shouldShow) {
      handleCompleteReading();
    }
  };

  const handleCompleteReading = async () => {
    if (hasRead) return;
    
    setHasRead(true);
    setShowConfetti(true);
    
    // Optimistic update locally first
    onReadComplete();

    // Persist to DB
    try {
      await databaseService.markDailyWordAsRead(dailyWord.id);
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    }).format(date).toUpperCase();
  };

  // Safe parsing for reflection questions
  const reflectionQuestions = React.useMemo(() => {
    if (!dailyWord.reflection_questions) return [];
    
    // Case 1: Already an array
    if (Array.isArray(dailyWord.reflection_questions)) {
      return dailyWord.reflection_questions;
    }

    // Helper to split string into questions
    const splitQuestions = (str: string) => {
      // Split by "?," (question mark + comma) or just "?" if followed by space/uppercase
      // The user screenshot showed "Question?,Question"
      if (str.includes('?,')) {
        return str.split('?,').map(q => {
          const trimmed = q.trim();
          return trimmed.endsWith('?') ? trimmed : trimmed + '?';
        });
      }
      return [str];
    };

    // Case 2: String that needs parsing
    try {
      const parsed = JSON.parse(dailyWord.reflection_questions as unknown as string);
      
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return splitQuestions(parsed);
      
      return [parsed];
    } catch (e) {
      // Case 3: Raw string that failed parsing
      return splitQuestions(String(dailyWord.reflection_questions));
    }
  }, [dailyWord.reflection_questions]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full h-full bg-slate-50 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Palavra do Dia</h2>
            <p className="text-[12px] font-semibold text-slate-500 tracking-wider uppercase">
              {formatDate(dailyWord.date)}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          {/* Main Card (Theme/Intro) */}
          <div className="bg-[#1e293b] rounded-[20px] p-6 text-center shadow-sm flex items-center justify-center min-h-[140px]">
             <p className="text-white font-medium text-md leading-relaxed max-w-[280px] mx-auto">
               Deus quer uma conversa diária, onde seu coração esteja aberto para ouvi-Lo e responder.
             </p>
          </div>

          {/* Scripture */}
          <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-lg shadow-orange-100/50">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="text-orange-500" size={20} />
              <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">ESCRITURA</h3>
            </div>
            <p className="text-slate-800 leading-relaxed font-normal text-[0.99rem]">
              <span className="font-normal text-slate-800">{dailyWord.reference} – {dailyWord.scripture_text || dailyWord.text}</span>
            </p>
          </div>

          {/* Translation */}
          <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-lg shadow-orange-100/50">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="text-orange-500" size={20} />
              <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">TRADUÇÃO PRÁTICA</h3>
            </div>
            <p className="text-slate-800 leading-relaxed text-[0.99rem]">
              {dailyWord.practical_translation || dailyWord.lesson}
            </p>
          </div>

          {/* Reflection */}
          {reflectionQuestions && reflectionQuestions.length > 0 && (
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-lg shadow-orange-100/50">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="text-orange-500" size={20} />
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wide">REFLEXÃO</h3>
              </div>
              <div className="space-y-4">
                {reflectionQuestions.map((question: string, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-slate-800 leading-relaxed text-[0.99rem]">
                      {question}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application (Vivência) */}
          {dailyWord.application && (
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-lg shadow-orange-100/50">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="text-orange-500" size={20} />
                <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wide">VIVÊNCIA</h3>
              </div>
              <p className="text-slate-800 leading-relaxed text-[0.99rem]">
                {dailyWord.application}
              </p>
            </div>
          )}

          {/* Completion Status */}
          <div className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${showCompletionEffect ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="bg-green-100/70 border border-green-300 rounded-2xl p-4 flex items-center justify-center gap-2 shadow-sm mb-6">
              <Check size={20} className="text-green-500" strokeWidth={4} />
              <span className="text-green-500 font-bold text-sm tracking-wide uppercase">LEITURA CONCLUÍDA</span>
            </div>
          </div>
          
          {/* Padding for scroll */}
          {!showCompletionEffect && <div className="h-20 flex items-center justify-center text-slate-300 animate-pulse">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-medium">Continue lendo</span>
              <ChevronDown size={16} />
            </div>
          </div>}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DailyWordModal;
