import React from 'react';
import { DevotionalPost } from '../types';
import { X, BookOpen, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DevotionalDetailModalProps {
  devotional: DevotionalPost;
  isOpen: boolean;
  onClose: () => void;
}

const DevotionalDetailModal: React.FC<DevotionalDetailModalProps> = ({
  devotional,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-end">
      {/* Overlay escuro com tom azulado */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          background: 'rgba(0, 0, 0, 0.75)',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      />
      
      {/* Modal do Devocional */}
      <div 
        className="relative rounded-t-3xl w-full shadow-2xl z-10 overflow-hidden flex flex-col"
        style={{
          background: '#0f172a',
          animation: 'slideUp 0.3s ease-out',
          minHeight: '65vh',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="rounded-t-3xl px-5 py-4 flex items-center justify-between border-b border-slate-700/30" style={{ background: '#0f172a' }}>
          <div className="flex items-center gap-2">
            <span className="text-white text-lg font-semibold tracking-tight">
              {formatDate(devotional.date)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X size={18} className="text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 overflow-y-auto flex-1 flex flex-col" style={{ background: '#0f172a' }}>
          {/* Versículo */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={20} className="text-orange-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                VERSÍCULO
              </h3>
            </div>
            <p className="text-white text-base leading-relaxed">{devotional.scripture}</p>
          </div>

          {/* Lição Aprendida */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={22} className="text-orange-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                LIÇÃO APRENDIDA
              </h3>
            </div>
            <p className="text-white text-base leading-relaxed">
              {devotional.lesson}
            </p>
          </div>

          {/* Imagem do Devocional */}
          {devotional.photo && (
            <div className="mt-4 -mb-4 pb-6 flex-1 flex">
              <img
                src={devotional.photo}
                alt="Foto do devocional"
                className="w-full rounded-xl object-cover flex-1"
              />
            </div>
          )}
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

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default DevotionalDetailModal;






