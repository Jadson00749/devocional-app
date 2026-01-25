import React from 'react';
import { DevotionalPost } from '../types';
import { X, BookOpen, Lightbulb } from 'lucide-react';

interface DevotionalDetailModalProps {
  devotional: DevotionalPost;
  onClose: () => void;
}

const DevotionalDetailModal: React.FC<DevotionalDetailModalProps> = ({
  devotional,
  onClose,
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-slate-800">
            {formatDate(devotional.date)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Versículo */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={20} className="text-orange-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                VERSÍCULO
              </h3>
            </div>
            <p className="text-slate-800 text-base">{devotional.scripture}</p>
          </div>

          {/* Lição Aprendida */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={20} className="text-orange-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                LIÇÃO APRENDIDA
              </h3>
            </div>
            <p className="text-slate-800 text-base leading-relaxed">
              {devotional.lesson}
            </p>
          </div>

          {/* Pedido de Oração */}
          {devotional.prayerRequest && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🙏</span>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  PEDIDO DE ORAÇÃO
                </h3>
              </div>
              <p className="text-slate-800 text-base leading-relaxed">
                {devotional.prayerRequest}
              </p>
            </div>
          )}

          {/* Imagem do Devocional */}
          {devotional.photo && (
            <div className="mt-4">
              <img
                src={devotional.photo}
                alt="Foto do devocional"
                className="w-full rounded-xl object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevotionalDetailModal;




