
import React, { useState, useEffect, useRef } from 'react';
import { DayTheme, DevotionalPost } from '../types';
import { Camera, X, BookOpen, Video, Trash2, Check, Loader2, Image as ImageIcon, Sparkles, Send } from 'lucide-react';

interface PostFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (post: Omit<DevotionalPost, 'id' | 'userId' | 'userName' | 'userAvatar' | 'date'>) => void;
  currentTheme: DayTheme;
}

const PostForm: React.FC<PostFormProps> = ({ isOpen, onClose, onPost, currentTheme }) => {
  const [hasRead, setHasRead] = useState(true);
  const [scripture, setScripture] = useState('');
  const [lesson, setLesson] = useState('');
  const [prayerRequest, setPrayerRequest] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const [video, setVideo] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const handleMedia = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'photo') {
          setPhoto(reader.result as string);
          setVideo(undefined);
        } else {
          setVideo(reader.result as string);
          setPhoto(undefined);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onPublish = async () => {
    if (!scripture || isSubmitting) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    onPost({ 
      hasRead, scripture, lesson: lesson || "Passo de hoje!", 
      prayerRequest, theme: currentTheme, photo, video 
    });
    setIsSubmitting(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setScripture(''); setLesson(''); setPrayerRequest(''); setPhoto(undefined); setVideo(undefined);
    onClose();
  };

  if (!isOpen) return null;

  const isFormValid = !!scripture.trim();

  return (
    <div className="fixed inset-0 z-[150] bg-white flex flex-col h-[100dvh] w-full animate-in slide-in-from-bottom duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overscroll-none">
      {/* Header Premium */}
      <div className="flex justify-between items-center px-6 h-20 shrink-0 bg-white border-b border-stone-50 z-30">
        <button onClick={resetAndClose} className="p-3 -ml-3 text-stone-400 active:scale-90 transition-all bg-stone-50 rounded-full">
          <X size={20} />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles size={12} className="text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400">Assembleia de Deus</span>
          </div>
          <span className="text-base font-bold text-stone-900 tracking-tight">Check-in Belém</span>
        </div>
        <button 
          onClick={onPublish}
          disabled={!isFormValid || isSubmitting}
          className={`px-5 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all ${!isFormValid ? 'bg-stone-100 text-stone-300' : 'bg-[#0f172a] text-white shadow-xl active:scale-95'}`}
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'POSTAR'}
        </button>
      </div>

      {/* Progress Line */}
      <div className="h-[2px] w-full bg-stone-50 shrink-0 overflow-hidden">
        <div 
          className="h-full bg-[#0369a1] transition-all duration-700 ease-out"
          style={{ width: `${(!!scripture ? 33 : 0) + (!!lesson ? 33 : 0) + (!!photo || !!video ? 34 : 0)}%` }}
        />
      </div>

      {/* Área de Conteúdo */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-scroll overflow-x-hidden bg-white touch-pan-y"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          height: 'calc(100dvh - 82px)' 
        }}
      >
        <div className="max-w-md mx-auto px-6 py-8 space-y-10 pb-64">
          
          {/* Mídia: Visual Minimalista */}
          {!photo && !video ? (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
              <label className="snap-center flex-shrink-0 w-40 h-52 rounded-[2.5rem] bg-stone-50 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-4 cursor-pointer active:scale-95 transition-all group">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-stone-100 group-hover:scale-110 transition-transform">
                  <Camera size={28} className="text-[#0369a1]" />
                </div>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Adicionar Foto</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMedia(e, 'photo')} />
              </label>
              
              <label className="snap-center flex-shrink-0 w-40 h-52 rounded-[2.5rem] bg-stone-50 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-4 cursor-pointer active:scale-95 transition-all group">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-stone-100 group-hover:scale-110 transition-transform">
                  <Video size={28} className="text-amber-500" />
                </div>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Adicionar Vídeo</span>
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleMedia(e, 'video')} />
              </label>

              <div className="snap-center flex-shrink-0 w-40 h-52 bg-slate-50 rounded-[2.5rem] p-6 flex flex-col justify-center border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed italic tracking-tighter">
                  "Sua constância inspira o corpo de Cristo."
                </p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/5] bg-stone-900 ring-1 ring-black/5 animate-in zoom-in-95">
              {photo && <img src={photo} className="w-full h-full object-cover" alt="Preview" />}
              {video && <video src={video} className="w-full h-full object-cover" controls playsInline autoPlay muted loop />}
              <button 
                onClick={() => { setPhoto(undefined); setVideo(undefined); }} 
                className="absolute top-6 right-6 bg-red-500 text-white p-3 rounded-xl shadow-lg active:scale-90 transition-all z-20"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}

          {/* Inputs em Blocos */}
          <div className="space-y-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3">
                <BookOpen size={14} className="text-[#0369a1]" />
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Onde você leu? (Obrigatório)</label>
              </div>
              <input 
                type="text"
                placeholder="Ex: Mateus 5:14"
                value={scripture}
                onChange={(e) => setScripture(e.target.value)}
                className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl text-lg font-bold focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all outline-none placeholder:text-stone-300"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3">
                <ImageIcon size={14} className="text-stone-400" />
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">O que Deus falou?</label>
              </div>
              <textarea 
                placeholder="Uma frase marcante do seu tempo com Deus hoje..."
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                className="w-full h-40 p-6 bg-stone-50 border border-stone-100 rounded-2xl text-base font-medium resize-none focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all outline-none leading-relaxed placeholder:text-stone-200"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-3">Pedidos de oração? (opcional)</label>
              <input 
                type="text"
                placeholder="Deixe seu pedido..."
                value={prayerRequest}
                onChange={(e) => setPrayerRequest(e.target.value)}
                className="w-full p-5 bg-stone-50 border border-stone-100 rounded-2xl text-base font-medium focus:bg-white outline-none placeholder:text-stone-300"
              />
            </div>

            <div className="space-y-4 pt-4">
              <button 
                type="button"
                onClick={() => setHasRead(!hasRead)}
                className={`w-full py-6 rounded-2xl text-[10px] font-bold tracking-[0.2em] transition-all border flex items-center justify-center gap-4 active:scale-[0.98] ${hasRead ? 'bg-slate-50 text-slate-700 border-slate-100' : 'bg-stone-50 text-stone-400 border-stone-100'}`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shadow-inner ${hasRead ? 'bg-[#0369a1] text-white' : 'bg-stone-200'}`}>
                  {hasRead && <Check size={12} strokeWidth={4} />}
                </div>
                CONCLUÍ A LEITURA!
              </button>

              {/* BOTÃO DE PUBLICAÇÃO NO FINAL DO FORMULÁRIO */}
              <button 
                onClick={onPublish}
                disabled={!isFormValid || isSubmitting}
                className={`w-full py-6 rounded-2xl text-[12px] font-bold tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${!isFormValid ? 'bg-stone-100 text-stone-300' : 'bg-[#0f172a] text-white active:scale-95'}`}
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    PUBLICAR DEVOCIONAL
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostForm;
