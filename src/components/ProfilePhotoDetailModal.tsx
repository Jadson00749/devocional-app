import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ProfilePhotoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  userName: string;
}

const ProfilePhotoDetailModal: React.FC<ProfilePhotoDetailModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  userName
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Overlay com blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Botão X para fechar - fixo no canto superior direito */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all z-20 active:scale-95"
      >
        <X size={22} className="text-white" strokeWidth={2.5} />
      </button>
      
      {/* Container do modal */}
      <div 
        className="relative z-10 w-full max-w-md animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Foto ou Inicial ampliada */}
        <div className="bg-white rounded-3xl p-2 shadow-2xl overflow-hidden">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              className="w-full h-auto rounded-2xl object-cover" 
              alt={userName}
              style={{ maxHeight: '70vh' }}
            />
          ) : (
            <div className="w-full aspect-square rounded-2xl bg-orange-400 flex items-center justify-center">
              <span className="text-white text-9xl font-bold">
                {userName.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfilePhotoDetailModal;
