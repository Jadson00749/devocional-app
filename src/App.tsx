import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import PostForm from './components/PostForm';
import PostCard from './components/PostCard';
import ProfileEdit from './components/ProfileEdit';
import MobileRedirect from './components/MobileRedirect';
import InstallBanner from './components/InstallBanner';
import NotificationPrompt from './components/NotificationPrompt';
import NewCheckIn from './components/NewCheckIn';
import { DayTheme, DevotionalPost, User } from './types';
import { geminiService } from './services/geminiService';
import { databaseService } from './services/databaseService';
import { isMobileDevice } from './hooks/use-mobile';
import { Flame, RefreshCw, Calendar, Users as UsersIcon, Zap, Trophy, Settings, Edit3, Award, Search, Lightbulb, Heart, MessageCircle, Eye, X, Send } from 'lucide-react';

const App: React.FC = () => {
  // TODOS OS HOOKS DEVEM SER CHAMADOS PRIMEIRO (regra do React)
  // Detecta se é dispositivo móvel
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  
  // Hooks do app (sempre chamados, mesmo que não sejam usados)
  const [activeTab, setActiveTab] = useState<'home' | 'group' | 'profile'>('home');
  const [posts, setPosts] = useState<DevotionalPost[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [isPostFormOpen, setIsPostFormOpen] = useState<boolean>(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [showPostDetail, setShowPostDetail] = useState<string | null>(null);
  const [showNewCheckIn, setShowNewCheckIn] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<User>({
    id: 'u-me',
    name: 'Zero19Apps',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop',
    bio: 'Sou o Roni, da Comunidade SEDE. Jesus é o caminho! 🚀',
    streak: 5,
    maxStreak: 5,
    birthday: '06/09/1982',
    phone: '19998898393',
    civilStatus: 'Casado(a)',
    congregation: 'ADBA JARDIM PAULISTA'
  });

  // Effect para detectar mobile
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Effect para carregar dados (só executa se for mobile)
  useEffect(() => {
    if (isMobile === true) {
      const init = async () => {
        const [savedPosts, memberList] = await Promise.all([
          databaseService.fetchPosts(),
          databaseService.fetchMembers()
        ]);
        setPosts(savedPosts);
        setMembers(memberList);
        const msg = await geminiService.getDailyEncouragement();
        setAiMessage(msg);
      };
      init();
    }
  }, [isMobile]);

  // AGORA SIM, podemos fazer os returns condicionais
  // Se ainda não detectou, mostra loading
  if (isMobile === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  // Se NÃO for mobile, mostra a página de redirecionamento
  if (!isMobile) {
    return <MobileRedirect />;
  }

  // Se for mobile, mostra o app normal

  const handleNewPost = async (newPostData: any) => {
    const post: DevotionalPost = {
      ...newPostData,
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      date: new Date().toISOString()
    };
    await databaseService.savePost(post);
    setPosts(prev => [post, ...prev]);
  };

  const renderHome = () => (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 pb-10">
      {/* Card de Notificações Push */}
      <NotificationPrompt />
      
      {/* 1. Dashboard Principal - Black Typography */}
      <div className="dashboard-gradient rounded-[1.5rem] p-4 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-6 h-6 bg-amber-500/5 rounded-md flex items-center justify-center">
                <Flame size={18} className="text-amber-500 fill-amber-500" />
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide-custom">NÍVEL DE CONSTÂNCIA</span>
            </div>
            <h2 className="text-[13px] font-black text-white tracking-tight-custom">Geração Life em movimento</h2>
          </div>
          <button className="p-1.5 bg-white/5 rounded-full text-slate-400 active:scale-90 transition-transform">
            <RefreshCw size={13} />
          </button>
        </div>

        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3.5">
            <span className="text-[60px] font-black text-white leading-none tracking-tight-custom">{currentUser.streak}</span>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <Flame size={18} className="text-amber-500 fill-amber-500" />
                <span className="text-[13px] font-sm text-slate-500 tracking-tight">devocionais feitos</span>
              </div>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Flame size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-[12px] font-black text-amber-500 tracking-tight">{currentUser.streak} dias</span>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="flex justify-between items-center text-[9px] font-sm uppercase text-slate-500 tracking-wide-custom">
            <span>CHAMA: {currentUser.streak}/10 DIAS</span>
            <span>0 CHAMAS ACESAS</span>
          </div>

          <div className="flex justify-between items-center px-0.5">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${i < currentUser.streak ? 'bg-amber-500/20 border-amber-500 active-circle-glow' : 'bg-slate-800/50 border-slate-700'}`}
              >
                {i < currentUser.streak && <Flame size={12} className="text-amber-500 fill-amber-500 animate-soft-glow" />}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-[8px] font-black">
            <span className="text-slate-500 tracking-tight">{currentUser.streak}/10</span>
            <span className="text-amber-500 uppercase tracking-wide-custom">{10 - currentUser.streak} dias para completar</span>
          </div>

          <div className="pt-2 border-t border-white/5 flex justify-between px-1">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className={`text-[10px] font-black mb-0.5 ${i === 1 ? 'text-white' : 'text-slate-600'}`}>{day}</span>
                {i === 1 && <div className="w-2.5 h-[2px] bg-orange-500 rounded-full"></div>}
              </div>
            ))}
          </div>

          <button className="flex items-center gap-1 text-orange-500 text-[9px] font-black uppercase tracking-wide-custom pt-0.5 active:opacity-70 transition-opacity">
            <Calendar size={10} />
            VER CALENDÁRIO
          </button>
        </div>
      </div>

      {/* 2. Card Palavra do Dia */}
      <div className="bg-white border-2 border-orange-200/60 rounded-[1.5rem] p-5 shadow-sm flex items-start gap-4">
        <div className="shrink-0 w-11 h-11 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center">
          <Flame size={20} className="text-orange-500 fill-orange-500" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-500 uppercase tracking-wide-custom">PALAVRA DO DIA 💡</span>
            <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-slate-800 leading-relaxed tracking-tight">
            Lucas 5:16 - Jesus, porém, retirava-se para lugares solitários e orava.
          </p>
          <span className="text-[13px] font-semibold text-orange-400 tracking-tight">Toque para ler completo</span>
        </div>
      </div>

      {/* 3. Social Moving Card */}
      <div className="bg-gradient-to-br from-orange-100/90 to-amber-100/70 border-2 border-orange-200/60 rounded-[1.5rem] p-6 flex items-start gap-3 shadow-sm">
        <div className="shrink-0 w-10 h-10 bg-gradient-to-br from-orange-200 to-orange-300 rounded-2xl flex items-center justify-center">
          <UsersIcon size={20} className="text-slate-700" />
        </div>
        <div className="space-y-1 flex-1">
          <p className="text-[14px] font-semibold text-slate-700 leading-snug tracking-tight">
            5 pessoas fizeram devocional hoje! Faça você também e vamos crescer juntos! 🔥
          </p>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Flame size={13} className="text-orange-500 fill-orange-500" />
            <span className="text-[13px] font-bold text-orange-400 tracking-tight">5 devocionais hoje</span>
          </div>
        </div>
      </div>

        <PostForm isOpen={isPostFormOpen} onClose={() => setIsPostFormOpen(false)} onPost={handleNewPost} currentTheme={DayTheme.NORMAL} />
    </div>
  );

  const handleTabChange = (tab: 'home' | 'group' | 'profile') => {
    setActiveTab(tab);
    setShowNewCheckIn(false); // Fecha o modal ao mudar de aba
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {showNewCheckIn && <NewCheckIn onClose={() => setShowNewCheckIn(false)} />}
      
      <InstallBanner />
      <Layout activeTab={activeTab} setActiveTab={handleTabChange} onSearchToggle={() => setShowSearch(!showSearch)} onNewCheckIn={() => setShowNewCheckIn(true)} isCheckInOpen={showNewCheckIn}>
        {activeTab === 'home' && renderHome()}
      {activeTab === 'group' && (
        <div className="space-y-4 animate-in fade-in duration-500 pb-20 pt-2 bg-slate-50 px-4">
          {/* Barra de Busca com animação de slide */}
          {showSearch && (
            <div className="animate-in slide-in-from-top duration-300">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome do autor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-orange-500 rounded-3xl text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Lista de Posts */}
          <div className="space-y-3">
            {/* Post 1 - Debora Fernanda */}
            <div 
              className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm relative"
              onMouseDown={() => {
                const timer = setTimeout(() => {
                  setShowReactions('post-1');
                }, 500);
                setLongPressTimer(timer);
              }}
              onMouseUp={() => {
                if (longPressTimer) {
                  clearTimeout(longPressTimer);
                  setLongPressTimer(null);
                }
              }}
              onMouseLeave={() => {
                if (longPressTimer) {
                  clearTimeout(longPressTimer);
                  setLongPressTimer(null);
                }
              }}
              onTouchStart={() => {
                const timer = setTimeout(() => {
                  setShowReactions('post-1');
                }, 500);
                setLongPressTimer(timer);
              }}
              onTouchEnd={() => {
                if (longPressTimer) {
                  clearTimeout(longPressTimer);
                  setLongPressTimer(null);
                }
              }}
            >
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-base shrink-0">
                  D
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-[14px]">Debora Fernanda</h3>
                  <p className="text-[12px] text-slate-500 font-normal mt-0.5">há cerca de 3 horas</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {/* VERSÍCULO */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                    <span className="text-[13px] font-bold text-orange-500 uppercase tracking-wider">VERSÍCULO</span>
                  </div>
                  <p className="text-[17px] font-bold text-slate-800">Salmos4vrs 4</p>
                </div>

                {/* LIÇÃO APRENDIDA */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Lightbulb size={15} className="text-orange-500" />
                    <span className="text-[12px] font-bold text-orange-500 uppercase tracking-wider">LIÇÃO APRENDIDA</span>
                  </div>
                  <p className="text-[15px] font-normal text-slate-700 leading-relaxed">
                    Deus fala que nos separou pr ele, como Deus é lindo maravilhoso fico admirada quão grande é o amor e cuidado do Senhor conosco
                  </p>
                </div>

                {/* PEDIDO DE ORAÇÃO */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Heart size={12} className="text-slate-600" />
                    <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">PEDIDO DE ORAÇÃO</span>
                  </div>
                  <p className="text-[13px] font-normal text-slate-700">Oração por libertação</p>
                </div>
              </div>

              {/* Foto do Devocional */}
              <button 
                onClick={() => setShowPostDetail('post-1')}
                className="mt-3 rounded-xl overflow-hidden w-full active:opacity-90 transition-opacity"
              >
                <img 
                  src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop" 
                  alt="Bíblia aberta" 
                  className="w-full h-auto object-cover"
                />
              </button>

              {/* Ações */}
              <div className="flex items-center gap-2 mt-3.5 pt-3 px-9 border-t border-slate-100 w-full relative">
                {/* Reações flutuantes */}
                {showReactions === 'post-1' && (
                  <div className="absolute bottom-full left-0 mb-2 animate-in zoom-in-95 duration-200 z-50">
                    <div className="bg-white rounded-full p-2 shadow-2xl border border-slate-200 flex items-center gap-2">
                      <button 
                        className="w-10 h-10 rounded-full border-2 border-purple-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                        onClick={() => {
                          setShowReactions(null);
                        }}
                      >
                        <span className="text-xl">🙏</span>
                      </button>
                      <button 
                        className="w-10 h-10 rounded-full border-2 border-yellow-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                        onClick={() => {
                          setShowReactions(null);
                        }}
                      >
                        <span className="text-xl">👥</span>
                      </button>
                      <button 
                        className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                        onClick={() => {
                          setShowReactions(null);
                        }}
                      >
                        <Flame size={20} className="text-orange-500 fill-orange-500" />
                      </button>
                    </div>
                  </div>
                )}
                <button className="flex items-center gap-1 text-slate-600 hover:text-orange-500 transition-colors w-full relative">
                  <span className="text-[16px]">🙏</span>
                  <span className="text-[13px] font-normal">Amém (1)</span>
                </button>
                <button 
                  onClick={() => setShowComments('post-1')}
                  className="flex items-center gap-1 text-slate-600 hover:text-orange-500 transition-colors"
                >
                  <MessageCircle size={16} />
                  <span className="text-[13px] font-normal">Comentar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal de Detalhes do Post */}
          {showPostDetail && (
            <div className="fixed inset-0 bg-black/90 z-[200] flex flex-col animate-in fade-in duration-300 overflow-y-auto">
              {/* Header */}
              <div className="bg-[#12192b] flex items-center justify-between px-4 py-4 sticky top-0 z-10">
                <h3 className="text-[18px] font-black text-white">Feed da Comunidade</h3>
                <button className="p-2">
                  <Search size={20} className="text-white" />
                </button>
              </div>

              {/* Conteúdo do Post Detalhado */}
              <div className="flex-1 bg-white pt-6 pb-8">
                {/* Foto em Destaque */}
                <div className="w-full px-4 mb-6">
                  <div className="relative">
                    <img 
                      src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1200&auto=format&fit=crop" 
                      alt="Bíblia aberta" 
                      className="w-full h-auto object-cover rounded-xl"
                    />
                    <button
                      onClick={() => setShowPostDetail(null)}
                      className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors backdrop-blur-sm"
                    >
                      <X size={20} className="text-white" />
                    </button>
                  </div>
                </div>

                {/* Informações do Post */}
                <div className="px-4">
                  {/* Header do Post */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0">
                      D
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-[14px]">Debora Fernanda</h3>
                      <p className="text-[12px] text-slate-500 font-normal mt-0.5">há cerca de 3 horas</p>
                    </div>
                  </div>

                  {/* VERSÍCULO */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1 mb-1">
                      <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      <span className="text-[13px] font-bold text-orange-500 uppercase tracking-wider">VERSÍCULO</span>
                    </div>
                    <p className="text-[17px] font-bold text-slate-800">Salmos 88:1-18</p>
                  </div>

                  {/* LIÇÃO APRENDIDA */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1 mb-1">
                      <Lightbulb size={15} className="text-orange-500" />
                      <span className="text-[12px] font-bold text-orange-500 uppercase tracking-wider">LIÇÃO APRENDIDA</span>
                    </div>
                    <p className="text-[15px] font-normal text-slate-700 leading-relaxed">
                      Esse capítulo de Salmos nos mostra o salmista clamando e confiando em Deus, mesmo ele passando por muitas tribulações. É possível observar que em nenhum momento lhe falta fé, mesmo ele clamando a Deus por respostas e estando sem forças, ainda sim, ele clama ao Senhor e continua orando e confiando.
                    </p>
                  </div>

                  {/* PEDIDO DE ORAÇÃO */}
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Heart size={12} className="text-slate-600" />
                      <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">PEDIDO DE ORAÇÃO</span>
                    </div>
                    <p className="text-[13px] font-normal text-slate-700">Libertação</p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 mt-3.5 pt-3 px-9 border-t border-slate-100 relative">
                  {/* Reações flutuantes */}
                  {showReactions === 'post-1' && (
                    <div className="absolute bottom-full left-0 mb-2 animate-in zoom-in-95 duration-200 z-50">
                      <div className="bg-white rounded-full p-2 shadow-2xl border border-slate-200 flex items-center gap-2">
                        <button 
                          className="w-10 h-10 rounded-full border-2 border-purple-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                          onClick={() => {
                            setShowReactions(null);
                          }}
                        >
                          <span className="text-xl">🙏</span>
                        </button>
                        <button 
                          className="w-10 h-10 rounded-full border-2 border-yellow-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                          onClick={() => {
                            setShowReactions(null);
                          }}
                        >
                          <span className="text-xl">👥</span>
                        </button>
                        <button 
                          className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                          onClick={() => {
                            setShowReactions(null);
                          }}
                        >
                          <Flame size={20} className="text-orange-500 fill-orange-500" />
                        </button>
                      </div>
                    </div>
                  )}
                  <button 
                    onMouseDown={() => {
                      const timer = setTimeout(() => {
                        setShowReactions('post-1');
                      }, 500);
                      setLongPressTimer(timer);
                    }}
                    onMouseUp={() => {
                      if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        setLongPressTimer(null);
                      }
                    }}
                    onMouseLeave={() => {
                      if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        setLongPressTimer(null);
                      }
                    }}
                    onTouchStart={() => {
                      const timer = setTimeout(() => {
                        setShowReactions('post-1');
                      }, 500);
                      setLongPressTimer(timer);
                    }}
                    onTouchEnd={() => {
                      if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        setLongPressTimer(null);
                      }
                    }}
                    className="flex items-center gap-1 text-slate-600 hover:text-orange-500 transition-colors w-full relative"
                  >
                    <span className="text-[16px]">🙏</span>
                    <span className="text-[13px] font-normal">Amém (1)</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowPostDetail(null);
                      setShowComments('post-1');
                    }}
                    className="flex items-center gap-1 text-slate-600 hover:text-orange-500 transition-colors"
                  >
                    <MessageCircle size={16} />
                    <span className="text-[13px] font-normal">Comentar</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Comentários */}
          {showComments && (
            <div className="fixed inset-0 bg-black/80 z-[200] flex items-end animate-in fade-in duration-300">
              <div className="w-full bg-white rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col">
                {/* Header do Modal */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                  <h3 className="text-[18px] font-black text-slate-900">Comentários</h3>
                  <button
                    onClick={() => {
                      setShowComments(null);
                      setCommentText('');
                    }}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-slate-600" />
                  </button>
                </div>

                {/* Conteúdo do Modal */}
                <div className="flex-1 overflow-y-auto mb-4">
                  <div className="text-center py-12">
                    <p className="text-[14px] font-md text-slate-500">
                      Nenhum comentário ainda. Seja o primeiro a comentar!
                    </p>
                  </div>
                </div>

                {/* Input de Comentário */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        value={commentText}
                        onChange={(e) => {
                          if (e.target.value.length <= 100) {
                            setCommentText(e.target.value);
                          }
                        }}
                        placeholder="Escreva um comentário..."
                        className="w-full px-4 py-3 pr-16 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 resize-none"
                        rows={3}
                      />
                      <span className="absolute bottom-3 right-4 text-[11px] text-slate-400 font-medium">
                        {commentText.length}/100
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (commentText.trim()) {
                          // Aqui você pode adicionar a lógica para salvar o comentário
                          setCommentText('');
                          setShowComments(null);
                        }
                      }}
                      disabled={!commentText.trim()}
                      className="p-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === 'profile' && (
        <div className="animate-in fade-in duration-500 pb-20 px-6">
          <div className="py-8 flex items-center justify-between">
            <h2 className="text-[22px] font-black text-slate-900 tracking-tight-custom">Meu Perfil</h2>
            <Settings size={22} className="text-slate-400" />
          </div>

          <div className="bg-[#12192b] rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden mb-8">
            <button onClick={() => setIsProfileEditOpen(true)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-transform">
              <Edit3 size={20} />
            </button>
            <div className="w-28 h-28 mx-auto mb-6 relative">
              <img src={currentUser.avatar} className="w-full h-full rounded-[2.5rem] object-cover ring-4 ring-white/10" alt="" />
              <div className="absolute -bottom-2 -right-2 bg-amber-500 p-2 rounded-xl shadow-lg ring-4 ring-[#12192b]">
                <Award size={16} className="text-white" />
              </div>
            </div>
            <h3 className="text-[24px] font-black text-white tracking-tight-custom">{currentUser.name}</h3>
            <p className="text-[14px] font-bold text-slate-400 mt-3 px-6 leading-relaxed italic opacity-80">
              "{currentUser.bio}"
            </p>

            <div className="flex justify-center gap-10 mt-10 pt-10 border-t border-white/5">
              <div className="text-center">
                <span className="block text-[28px] font-black text-white tracking-tighter leading-none">{currentUser.streak}</span>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide-custom mt-2 block">Sequência</span>
              </div>
              <div className="text-center">
                <span className="block text-[28px] font-black text-white tracking-tighter leading-none">{currentUser.maxStreak}</span>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide-custom mt-2 block">Recorde</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div className="bg-slate-50 p-7 rounded-[2rem] border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide-custom mb-1.5">Congregação</p>
                <p className="text-[16px] font-black text-slate-800 tracking-tight-custom">ADBA {currentUser.congregation}</p>
              </div>
              <UsersIcon size={22} className="text-slate-300" />
            </div>
          </div>

          {isProfileEditOpen && <ProfileEdit user={currentUser} onClose={() => setIsProfileEditOpen(false)} onSave={(updated) => { setCurrentUser(updated); setIsProfileEditOpen(false); }} />}
        </div>
      )}
      </Layout>
    </div>
  );
};

export default App;

