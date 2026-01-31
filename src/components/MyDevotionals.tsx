import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { DevotionalPost } from '../types';
import { ArrowLeft, BookOpen } from 'lucide-react';
import DevotionalDetailModal from './DevotionalDetailModal';

interface MyDevotionalsProps {
  onBack: () => void;
}

const MyDevotionals: React.FC<MyDevotionalsProps> = ({ onBack }) => {
  const [devotionals, setDevotionals] = useState<DevotionalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevotional, setSelectedDevotional] = useState<DevotionalPost | null>(null);

  useEffect(() => {
    fetchUserDevotionals();
  }, []);

  const fetchUserDevotionals = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Buscar posts do usuário ordenados por data (mais recentes primeiro)
      const { data, error } = await supabase
        .from('devotional_posts')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar devocionais:', error);
        setLoading(false);
        return;
      }

      // Transformar dados do Supabase para o formato DevotionalPost
      const formattedPosts: DevotionalPost[] = (data || []).map((post: any) => ({
        id: post.id,
        userId: post.user_id,
        userName: post.profiles?.full_name || 'Usuário',
        userAvatar: post.profiles?.avatar_url || '',
        date: post.created_at,
        hasRead: post.has_read,
        scripture: post.scripture,
        lesson: post.lesson,
        prayerRequest: post.prayer_request,
        photo: post.photo_url,
        video: post.video_url,
        extraContent: post.extra_content,
        theme: post.theme as any,
      }));

      setDevotionals(formattedPosts);
    } catch (error) {
      console.error('Erro ao buscar devocionais:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatScriptureForCard = (scripture: string): string => {
    // Extrair apenas "Jó 30-32" do texto completo
    const match = scripture.match(/(Jó|Job)\s*(\d+)[-\s]*(\d+)/i);
    if (match) {
      return `${match[1]} ${match[2]}-${match[3]}`;
    }
    // Se não encontrar, retornar os primeiros 15 caracteres
    return scripture.substring(0, 15);
  };

  const getCardColor = (index: number): string => {
    const colors = ['bg-orange-500', 'bg-purple-500', 'bg-slate-700'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="flex items-center justify-center h-screen">
          <div className="text-slate-400">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="mr-3 p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Meus Devocionais</h1>
        </div>

        {/* Grid de Devocionais */}
        {devotionals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <BookOpen size={64} className="text-slate-300 mb-4" />
            <p className="text-slate-400 text-center">
              Você ainda não tem devocionais postados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {devotionals.map((devotional, index) => (
              <button
                key={devotional.id}
                onClick={() => setSelectedDevotional(devotional)}
                className={`${getCardColor(index)} rounded-2xl min-h-[110px] flex items-center justify-center relative overflow-hidden group`}
              >
                {devotional.photo ? (
                  <>
                    <img
                      src={devotional.photo}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                    <p className="text-white font-bold text-base relative z-10">
                      {formatScriptureForCard(devotional.scripture)}
                    </p>
                  </>
                ) : (
                  <p className="text-white font-bold text-base">
                    {formatScriptureForCard(devotional.scripture)}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedDevotional && (
        <DevotionalDetailModal
          devotional={selectedDevotional}
          isOpen={!!selectedDevotional}
          onClose={() => setSelectedDevotional(null)}
        />
      )}
    </>
  );
};

export default MyDevotionals;

