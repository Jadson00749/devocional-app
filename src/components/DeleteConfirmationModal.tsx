import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  isDeleting: boolean;
  confirmText?: string;
  cancelText?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isDeleting,
  confirmText = 'Sim, excluir',
  cancelText = 'Cancelar'
}) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-xs bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            {description}
          </p>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 active:scale-95 transition-all text-sm disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Excluindo...</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="w-full py-3 bg-white text-slate-500 font-bold rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-sm"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DeleteConfirmationModal;
