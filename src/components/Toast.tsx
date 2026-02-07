import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  icon?: React.ReactNode;
}

const Toast: React.FC<ToastProps> = ({ message, description, type = 'success', duration = 3000, onClose, icon }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'success':
        return <CheckCircle size={24} className="text-green-600" />;
      case 'error':
        return <XCircle size={24} className="text-red-600" />;
      case 'warning':
        return <AlertCircle size={24} className="text-amber-600" />;
      case 'info':
        return <Info size={24} className="text-blue-600" />;
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-[10000] max-w-md mx-auto animate-in slide-in-from-top duration-500 fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1">
            <p className={`text-[15px] text-slate-900 leading-tight ${description ? 'font-bold mb-1' : 'font-medium'}`}>
              {message}
            </p>
            {description && (
              <p className="text-[13px] text-slate-500 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 transition-colors -mt-1"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
