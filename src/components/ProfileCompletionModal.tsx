import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ArrowRight, Building2, Calendar } from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onCompleteClick: () => void;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ isOpen, onCompleteClick }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Content */}
      <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col items-center text-center p-8">
        {/* Icon Header */}
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 relative">
          <AlertCircle size={40} className="text-orange-500" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full border-4 border-white animate-pulse" />
        </div>

        {/* Text */}
        <h2 className="text-2xl font-black text-slate-900 leading-tight mb-3">
          Perfil Incompleto!
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8 px-2">
          Para uma experiência completa na <span className="font-bold text-orange-500 uppercase">Geração Life</span>, precisamos que você complete seu cadastro com algumas informações importantes.
        </p>

        {/* Highlighted Missing Fields (Visual Only) */}
        <div className="w-full space-y-3 mb-8">
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <Calendar size={20} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-600">Data de Nascimento</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <Building2 size={20} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-600">Sua Congregação</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onCompleteClick}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-200"
        >
          Completar Perfil Agora
          <ArrowRight size={20} />
        </button>
        
        <p className="mt-6 text-[11px] text-slate-400 uppercase font-bold tracking-widest">
          Sua presença importa! 🔥
        </p>
      </div>
    </div>,
    document.body
  );
};

export default ProfileCompletionModal;
