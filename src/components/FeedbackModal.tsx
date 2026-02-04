import React, { useState } from 'react';
import { Star, X, Flame } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: (reason?: 'dismiss' | 'submit') => void;
  onSubmit: (rating: number, testimonial?: string) => Promise<void>;
  triggerType: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, triggerType }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [testimonial, setTestimonial] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(rating, testimonial.trim() || undefined);
      setShowThanks(true);
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    onClose('submit');
    setShowThanks(false);
    setRating(0);
    setTestimonial('');
    setIsSubmitting(false);
  };


  const handleDismiss = () => {
    onClose('dismiss');
    setRating(0);
    setTestimonial('');
  };

  if (showThanks) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-10 max-w-[320px] w-full text-center animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
          {/* Confetti Decoration Background */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
             <div className="absolute top-10 left-10 w-4 h-4 bg-red-500 rounded-full"></div>
             <div className="absolute top-20 right-10 w-3 h-3 bg-blue-500 transform rotate-45"></div>
             <div className="absolute bottom-10 left-20 w-5 h-5 bg-yellow-500 rounded-full"></div>
          </div>

          <div className="mx-auto mb-4 flex items-center justify-center animate-in zoom-in duration-500">
            <Flame className="text-[#f1590d]" size={48} strokeWidth={1.5} />
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center justify-center gap-2 whitespace-nowrap">
            Feedback Recebido! <span className="text-2xl">🙏</span>
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Sua opinião é fundamental para o crescimento da nossa comunidade.
            <br/><br/>
            Obrigado por fazer parte disso! 🚀
          </p>

          <button 
            onClick={handleCloseSuccess}
            className="mt-6 px-12 py-3 bg-orange-500/85 text-white rounded-full font-bold text-sm shadow-md hover:bg-[#d04d0b] hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-start justify-center mb-6 gap-4">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-1.5 whitespace-nowrap tracking-tight">
            Como tem sido sua jornada? <span className="shrink-0 text-2xl">🙏</span>
          </h3>
        </div>

        {/* Rating Stars */}
        <div className="mb-6">
          <p className="text-sm text-slate-600 mb-3 text-center">
            Como você avalia sua experiência no app?
          </p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-all duration-200 hover:scale-110 active:scale-95"
                disabled={isSubmitting}
              >
                <Star
                  size={40}
                  className={`${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-slate-300'
                  } transition-colors duration-200`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center mt-2 text-sm font-medium text-slate-700 animate-in fade-in duration-200">
              {rating === 5 && '🌟 Excelente!'}
              {rating === 4 && '😊 Muito bom!'}
              {rating === 3 && '👍 Bom!'}
              {rating === 2 && '😐 Pode melhorar'}
              {rating === 1 && '😔 Precisa melhorar'}
            </p>
          )}
        </div>

        {/* Testimonial (Optional) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Quer compartilhar algo mais? (opcional)
          </label>
          <textarea
            value={testimonial}
            onChange={(e) => setTestimonial(e.target.value)}
            placeholder="O que mais te impactou na sua caminhada com Deus?"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={500}
            disabled={isSubmitting}
          />
          <p className="text-xs text-slate-500 mt-1 text-right">
            {testimonial.length}/500 caracteres
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            disabled={isSubmitting}
          >
            Agora não
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              rating === 0 || isSubmitting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
