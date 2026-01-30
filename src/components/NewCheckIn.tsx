import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, X, Loader2, PartyPopper } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { databaseService } from '../services/databaseService';
import { DayTheme, DevotionalPost } from '../types';
import { toast } from 'sonner';

interface NewCheckInProps {
  onClose: () => void;
  onPostCreated?: () => void;
}

const NewCheckIn: React.FC<NewCheckInProps> = ({ onClose, onPostCreated }) => {
  const [readingCompleted, setReadingCompleted] = useState(false);
  const [verse, setVerse] = useState('');
  const [lesson, setLesson] = useState('');
  const [prayerRequest, setPrayerRequest] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDevotionalToday, setHasDevotionalToday] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFormComplete = readingCompleted && verse.trim() !== '' && lesson.trim() !== '';

  // Bloquear scroll do body quando o modal está aberto
  useEffect(() => {
    // Salvar a posição atual do scroll
    const scrollY = window.scrollY;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setPhoto(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setPhotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Usuário não autenticado para upload');
        toast.error('Usuário não autenticado');
        return null;
      }

      // Validar tamanho do arquivo (máx 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
        return null;
      }

      // Validar tipo de arquivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Formato inválido. Use JPG, PNG, WEBP ou GIF');
        return null;
      }

      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const fileName = `${user.id}_${timestamp}_${randomStr}.${fileExt}`;
      const filePath = `devotionals/${fileName}`;

      console.log('Iniciando upload da foto:', filePath);

      // Upload para Supabase Storage (bucket: devotionals)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('devotionals')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Erro ao fazer upload da foto:', uploadError);
        toast.error(`Erro ao fazer upload: ${uploadError.message}`);
        return null;
      }

      if (!uploadData) {
        console.error('Upload retornou sem dados');
        toast.error('Erro ao fazer upload da foto');
        return null;
      }

      console.log('Upload bem-sucedido:', uploadData.path);

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('devotionals')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        console.error('Erro ao obter URL pública');
        toast.error('Erro ao obter URL da foto');
        return null;
      }

      console.log('URL pública gerada:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto:', error);
      toast.error(`Erro ao fazer upload: ${error.message || 'Erro desconhecido'}`);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!readingCompleted) {
      setShowErrors(true);
      toast.error('Marque a leitura como concluída primeiro');
      return;
    }
    if (!verse.trim() || !lesson.trim()) {
      setShowErrors(true);
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      // Buscar dados do usuário primeiro
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        setIsSubmitting(false);
        return;
      }

      // Verificar se já existe um devocional hoje
      const hasDevotional = await databaseService.hasDevotionalToday(user.id);
      if (hasDevotional) {
        setHasDevotionalToday(true);
        setIsSubmitting(false);
        return;
      }

      // Upload da foto se houver
      let finalPhotoUrl = photoUrl;
      if (photo && !photoUrl) {
        console.log('Fazendo upload da foto...');
        finalPhotoUrl = await uploadPhoto(photo);
        if (!finalPhotoUrl) {
          toast.error('Erro ao fazer upload da foto. O devocional será salvo sem foto.');
          // Continua salvando sem foto
        } else {
          console.log('Foto enviada com sucesso:', finalPhotoUrl);
        }
      }

      // Buscar perfil do usuário para obter nome e avatar
      const profile = await databaseService.fetchUserProfile(user.id);
      if (!profile) {
        toast.error('Erro ao buscar perfil do usuário');
        setIsSubmitting(false);
        return;
      }

      // Criar objeto do post
      const post: DevotionalPost = {
        id: '', // Será gerado pelo banco
        userId: user.id,
        userName: profile.name,
        userAvatar: profile.avatar,
        date: new Date().toISOString(),
        hasRead: readingCompleted,
        scripture: verse.trim(),
        lesson: lesson.trim(),
        prayerRequest: prayerRequest.trim() || undefined,
        photo: finalPhotoUrl || undefined,
        video: undefined,
        extraContent: undefined,
        theme: DayTheme.NORMAL,
      };

      // Salvar no banco
      const success = await databaseService.savePost(post);

      if (success) {
        toast.success('Devocional postado com sucesso!', {
          description: 'Seu devocional foi compartilhado no feed da comunidade.',
          duration: 3000,
        });
        onPostCreated?.();
        onClose();
      } else {
        toast.error('Erro ao salvar devocional', {
          description: 'Tente novamente em alguns instantes.',
        });
      }
    } catch (error) {
      console.error('Erro ao salvar devocional:', error);
      toast.error('Erro ao salvar devocional. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se já tem devocional hoje (após tentar compartilhar), mostrar card de sucesso
  if (hasDevotionalToday) {
    return (
      <div className="fixed inset-0 bg-white z-[90] overflow-y-scroll" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        {/* Header */}
        <header className="px-4 pt-6 pb-4 bg-white flex items-center gap-3 border-b border-slate-200 sticky top-0 z-10">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={22} className="text-slate-900" />
          </button>
          <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">
            Check-in
          </h1>
        </header>

        {/* Card de Sucesso */}
        <div className="px-4 pt-8 pb-40">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-sm">
            {/* Emoji de Celebração */}
            <div className="flex justify-center mb-4">
              <span className="text-6xl">🎉</span>
            </div>

            {/* Título */}
            <h2 className="text-[20px] font-bold text-slate-900 text-center mb-3">
              Parabéns! Você já fez sua parte hoje! 🔥
            </h2>

            {/* Descrição */}
            <p className="text-[14px] text-slate-700 text-center leading-relaxed mb-6">
              Seu devocional de hoje já foi compartilhado com a comunidade. Continue firme na caminhada! Amanhã você poderá criar um novo devocional.
            </p>

            {/* Botão */}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-orange-400 text-white font-bold text-[16px] hover:bg-orange-500 active:scale-95 transition-all shadow-md"
            >
              Voltar para o início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[90] overflow-y-scroll" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
      {/* Header */}
      <header className="px-4 pt-6 pb-4 bg-white flex items-center gap-3 border-b border-slate-200 sticky top-0 z-10">
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={22} className="text-slate-900" />
        </button>
        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">
          Novo Check-in
        </h1>
      </header>

      {/* Content */}
      <div className="px-4 pt-6 pb-40 space-y-5">
        {/* Leitura Concluída Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-bold text-slate-900">Leitura Concluída</h2>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-md uppercase">
              Obrigatório
            </span>
          </div>
          <p className="text-[12px] text-slate-600 mb-3 leading-relaxed">
            Marque quando finalizar a leitura do devocional
          </p>
          
          <label className={`flex items-center justify-between gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
            readingCompleted 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 shadow-lg shadow-green-100' 
              : 'bg-white border-2 border-slate-200 hover:border-green-300 hover:shadow-md'
          }`}>
            <div className="flex items-center gap-3">
              {/* Checkbox customizado */}
              <div className="relative">
                <input
                  type="checkbox"
                  checked={readingCompleted}
                  onChange={(e) => setReadingCompleted(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                  readingCompleted 
                    ? 'bg-green-500 border-green-500 scale-110' 
                    : 'bg-white border-slate-300 hover:border-green-400'
                }`}>
                  {readingCompleted && (
                    <svg 
                      className="w-4 h-4 text-white animate-in zoom-in duration-200" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className={`text-[14px] font-semibold transition-colors ${
                readingCompleted ? 'text-green-600' : 'text-slate-700'
              }`}>
                Leitura concluída
              </span>
            </div>
            {readingCompleted && (
              <svg 
                className="w-6 h-6 text-green-500 animate-in zoom-in duration-300" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </label>
        </div>

        {/* Versículo do Dia */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[14px] font-bold text-slate-900">
              Versículo do Dia <span className="text-orange-500">*</span>
            </label>
            <span className="text-[12px] text-slate-400 font-medium">
              {verse.length}/30
            </span>
          </div>
          <input
            type="text"
            value={verse}
            onChange={(e) => setVerse(e.target.value.slice(0, 30))}
            placeholder="Digite o versículo que mais tocou seu coração h"
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 transition-colors"
          />
          {showErrors && !readingCompleted && (
            <div className="flex items-start gap-1.5 mt-2">
              <span className="text-orange-500 text-[11px] mt-0.5">⚠</span>
              <p className="text-[11px] text-orange-600 font-medium">
                Complete a leitura primeiro para preencher este campo
              </p>
            </div>
          )}
        </div>

        {/* Lição Aprendida */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[14px] font-bold text-slate-900">
              Lição Aprendida <span className="text-orange-500">*</span>
            </label>
            <span className="text-[12px] text-slate-400 font-medium">
              {lesson.length}/600
            </span>
          </div>
          <textarea
            value={lesson}
            onChange={(e) => setLesson(e.target.value.slice(0, 600))}
            placeholder="O que Deus falou com você através dessa leitura?"
            rows={5}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 transition-colors resize-none"
          />
          {showErrors && !readingCompleted && (
            <div className="flex items-start gap-1.5 mt-2">
              <span className="text-orange-500 text-[11px] mt-0.5">⚠</span>
              <p className="text-[11px] text-orange-600 font-medium">
                Complete a leitura primeiro para preencher este campo
              </p>
            </div>
          )}
        </div>

        {/* Pedido de Oração */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[14px] font-bold text-slate-900">
              Pedido de Oração <span className="text-[12px] font-normal text-slate-500">(opcional)</span>
            </label>
            <span className="text-[12px] text-slate-400 font-medium">
              {prayerRequest.length}/100
            </span>
          </div>
          <textarea
            value={prayerRequest}
            onChange={(e) => setPrayerRequest(e.target.value.slice(0, 100))}
            placeholder="Compartilhe um pedido de oração..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 transition-colors resize-none"
          />
          {showErrors && !readingCompleted && (
            <div className="flex items-start gap-1.5 mt-2">
              <span className="text-orange-500 text-[11px] mt-0.5">⚠</span>
              <p className="text-[11px] text-orange-600 font-medium">
                Complete a leitura primeiro para preencher este campo
              </p>
            </div>
          )}
        </div>

        {/* Adicionar Foto */}
        <div>
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!readingCompleted}
              className={`w-full py-4 bg-slate-50 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-colors ${
                readingCompleted
                  ? 'border-slate-300 text-slate-400 hover:border-orange-300 hover:text-orange-400'
                  : 'border-slate-200 text-slate-300 cursor-not-allowed'
              }`}
            >
              <Camera size={20} />
              <span className="text-[14px] font-medium">Adicionar foto</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
            disabled={!readingCompleted}
          />
        </div>

        {/* Botão de Submissão */}
        <button
          onClick={handleSubmit}
          disabled={!isFormComplete || isSubmitting}
          className={`w-full py-5 rounded-3xl text-[16px] font-bold transition-all flex items-center justify-center gap-2 ${
            isFormComplete && !isSubmitting
              ? 'bg-orange-400 text-white hover:bg-orange-500 active:scale-95'
              : 'bg-orange-300 text-white cursor-not-allowed opacity-60'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Salvando...</span>
            </>
          ) : isFormComplete ? (
            <>Compartilhar Devocional 🔥</>
          ) : (
            <>Preencha todos os campos obrigatórios</>
          )}
        </button>
      </div>
    </div>
  );
};

export default NewCheckIn;

