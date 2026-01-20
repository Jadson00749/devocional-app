
import React, { useEffect, useState } from 'react';
import { DevotionalPost } from '../types';
import { X, Heart, MessageCircle, ChevronRight, ChevronLeft } from 'lucide-react';

interface StoryViewerProps {
  post: DevotionalPost;
  onClose: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ post, onClose }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          onClose();
          return 100;
        }
        return prev + 1;
      });
    }, 50); // 5 segundos de duração total (100 * 50ms)

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
        <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-100 ease-linear" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={post.userAvatar} className="w-10 h-10 rounded-full border-2 border-white shadow-lg" alt="" />
          <div>
            <h4 className="text-white text-sm font-bold shadow-sm">{post.userName}</h4>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{post.scripture}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-white/80 hover:text-white transition-colors">
          <X size={28} />
        </button>
      </div>

      {/* Content */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {post.video ? (
          <video 
            src={post.video} 
            className="w-full h-full object-cover" 
            autoPlay 
            muted 
            playsInline 
            loop
          />
        ) : post.photo ? (
          <img src={post.photo} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center p-12">
            <p className="text-white text-3xl font-serif font-black italic text-center leading-tight">
              "{post.lesson}"
            </p>
          </div>
        )}

        {/* Lesson Overlay for Media */}
        {(post.photo || post.video) && (
          <div className="absolute bottom-24 left-6 right-6 p-6 glass rounded-[2.5rem] border border-white/20 shadow-2xl animate-in slide-in-from-bottom-10">
            <p className="text-stone-900 text-sm font-bold leading-relaxed">
              {post.lesson}
            </p>
            {post.prayerRequest && (
              <div className="mt-3 pt-3 border-t border-black/5">
                <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mb-1">Oração</p>
                <p className="text-xs text-stone-600 italic">"{post.prayerRequest}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Action */}
      <div className="absolute bottom-8 left-0 right-0 px-6 flex items-center gap-4 z-20">
        <div className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3">
          <input 
            type="text" 
            placeholder="Enviar amém..." 
            className="bg-transparent border-none w-full text-white text-sm focus:ring-0 placeholder:text-white/40"
          />
        </div>
        <button className="p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-white/20 transition-all">
          <Heart size={24} />
        </button>
      </div>
    </div>
  );
};

export default StoryViewer;
