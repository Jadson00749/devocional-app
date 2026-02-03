import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactionEffect from './components/ReactionEffect';
import Layout from './components/Layout';
import PostForm from './components/PostForm';
import PostCard from './components/PostCard';
import ProfileEdit from './components/ProfileEdit';
import JourneyModal from './components/JourneyModal';
import MobileRedirect from './components/MobileRedirect';
import InstallBanner from './components/InstallBanner';
import NotificationPrompt from './components/NotificationPrompt';
import NewCheckIn from './components/NewCheckIn';
import Auth from './components/Auth';
import MyDevotionals from './components/MyDevotionals';
import CalendarModal from './components/CalendarModal';
import DevotionalDetailModal from './components/DevotionalDetailModal';
import UserProfileModal from './components/UserProfileModal';
import Analytics from './components/Analytics';
import { useAuth } from './contexts/AuthContext';
import { DayTheme, DevotionalPost, User } from './types';
import { geminiService } from './services/geminiService';
import { databaseService } from './services/databaseService';
import { calculateUserStreak } from './utils/streakUtils';
import { isMobileDevice } from './hooks/use-mobile';
import { Flame, RefreshCw, Calendar, Users as UsersIcon, Zap, Trophy, Settings, Edit3, Award, Search, Lightbulb, Heart, MessageCircle, Eye, X, Send, Building2, ChevronRight, ArrowRight, BookOpen, Flag, LogOut, PartyPopper, BadgeCheck } from 'lucide-react';
import { formatTimeAgo } from './utils/formatTime';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from './integrations/supabase/client';
import Toast, { ToastType } from './components/Toast';

const App: React.FC = () => {
  // TODOS OS HOOKS DEVEM SER CHAMADOS PRIMEIRO (regra do React)
  // Autenticação
  const { user, loading: authLoading, signOut } = useAuth();
  
  // Detecta se é dispositivo móvel
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  
  // Hooks do app (sempre chamados, mesmo que não sejam usados)
  const [activeTab, setActiveTab] = useState<'home' | 'group' | 'profile' | 'analytics'>('home');
  const [posts, setPosts] = useState<DevotionalPost[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [isPostFormOpen, setIsPostFormOpen] = useState<boolean>(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [wasLongPress, setWasLongPress] = useState<boolean>(false);
  const [primaryReaction, setPrimaryReaction] = useState<Record<string, 'pray' | 'fire' | 'people'>>({});
  const [reactionProcessing, setReactionProcessing] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [showPostDetail, setShowPostDetail] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<DevotionalPost | null>(null);
  const [isModalFromProfile, setIsModalFromProfile] = useState<boolean>(false);
  const [commentsCount, setCommentsCount] = useState<Record<string, number>>({});
  const [reactionsCount, setReactionsCount] = useState<Record<string, { pray: number; people: number; fire: number }>>({});
  const [userReactions, setUserReactions] = useState<Record<string, ('pray' | 'people' | 'fire')[]>>({});
  const [showNewCheckIn, setShowNewCheckIn] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(false);
  const [showRefreshToast, setShowRefreshToast] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const pullStartY = useRef<number | null>(null);
  const [showMyDevotionals, setShowMyDevotionals] = useState<boolean>(false);
  const [userDevotionals, setUserDevotionals] = useState<DevotionalPost[]>([]);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  const [showDevotionalDetail, setShowDevotionalDetail] = useState<boolean>(false);
  const [selectedDevotional, setSelectedDevotional] = useState<DevotionalPost | null>(null);
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState<boolean>(false);
  const [showJourneyModal, setShowJourneyModal] = useState<boolean>(false);
  const [showAnalyticsFilter, setShowAnalyticsFilter] = useState<boolean>(false);
  
  // Novo estado para o modal de perfil de usuário da comunidade
  const [showUserProfileModal, setShowUserProfileModal] = useState<boolean>(false);
  const [selectedUserProfileId, setSelectedUserProfileId] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [appToast, setAppToast] = useState<{ message: string; type: ToastType; icon?: React.ReactNode } | null>(null);
  const [reactionEffects, setReactionEffects] = useState<{ id: string; x: number; y: number; type: 'pray' | 'people' | 'fire' }[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [totalDevotionals, setTotalDevotionals] = useState<number>(0);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [weeklyDevotionals, setWeeklyDevotionals] = useState<Set<number>>(new Set()); // Dias da semana com devocional (0-6)
  
  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Buscar devocionais da semana atual e total de devocionais
  useEffect(() => {
    const fetchDevotionalsData = async () => {
      if (!user) return;
      
      try {
        const today = new Date();
        const currentDayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        
        // Buscar posts do usuário da semana atual E total de posts
        const [weeklyResult, totalResult] = await Promise.all([
          supabase
            .from('devotional_posts')
            .select('created_at')
            .eq('user_id', user.id)
            .gte('created_at', startOfWeek.toISOString())
            .lt('created_at', endOfWeek.toISOString()),
          supabase
            .from('devotional_posts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
        ]);
        
        if (weeklyResult.error) throw weeklyResult.error;
        if (totalResult.error) throw totalResult.error;
        
        // Mapear para dias da semana (0-6)
        const daysWithDevotional = new Set<number>();
        weeklyResult.data?.forEach(post => {
          const postDate = new Date(post.created_at);
          const dayOfWeek = postDate.getDay();
          daysWithDevotional.add(dayOfWeek);
        });
        
        setWeeklyDevotionals(daysWithDevotional);
        setTotalDevotionals(totalResult.count || 0);
      } catch (error) {
        console.error('Erro ao buscar devocionais:', error);
      }
    };
    
    fetchDevotionalsData();
  }, [user, posts]); // Recarrega quando posts mudam

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoadingPosts) {
          loadMorePosts();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoadingMore, isLoadingPosts]);

  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const newPosts = await databaseService.fetchPosts(nextPage, 10);
      
      if (newPosts.length < 10) {
        setHasMore(false);
      }
      
      if (newPosts.length > 0) {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(nextPage);
        
        // Fetch metadata for new posts
        const newPostIds = newPosts.map(p => p.id);
        const [commentCounts, reactionCounts, userReacts, primaryReacts] = await Promise.all([
           databaseService.fetchCommentsCount(newPostIds),
           databaseService.fetchReactionsCount(newPostIds),
           databaseService.fetchUserReactions(newPostIds),
           databaseService.fetchUserPrimaryReactions(newPostIds),
        ]);
        
        setCommentsCount(prev => ({ ...prev, ...commentCounts }));
        setReactionsCount(prev => ({ ...prev, ...reactionCounts }));
        setUserReactions(prev => ({ ...prev, ...userReacts }));
        setPrimaryReaction(prev => ({ ...prev, ...primaryReacts }));
      }
    } catch (error) {
      console.error('Erro ao carregar mais posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handler para selecionar uma reação do menu (Lógica de Troca/Switch)
  // Remove qualquer reação anterior e aplica a nova
  const handleReactionClick = async (post: DevotionalPost, reactionType: 'pray' | 'people' | 'fire', event?: React.MouseEvent | React.TouchEvent) => {
    if (!currentUser) return;

    // Trigger effect
    if (event) {
      let clientX, clientY;
      const touchEvent = event as React.TouchEvent;
      const mouseEvent = event as React.MouseEvent;

      if ('changedTouches' in event && touchEvent.changedTouches.length > 0) {
        clientX = touchEvent.changedTouches[0].clientX;
        clientY = touchEvent.changedTouches[0].clientY;
      } else if ('touches' in event && touchEvent.touches.length > 0) {
        clientX = touchEvent.touches[0].clientX;
        clientY = touchEvent.touches[0].clientY;
      } else {
        clientX = mouseEvent.clientX;
        clientY = mouseEvent.clientY;
      }

      // Fallback: Se não conseguiu coordenadas do evento, tenta pegar do elemento alvo
      if ((clientX === undefined || clientY === undefined || (clientX === 0 && clientY === 0)) && event.target) {
         try {
           const rect = (event.target as HTMLElement).getBoundingClientRect();
           clientX = rect.left + rect.width / 2;
           clientY = rect.top + rect.height / 2;
         } catch (e) {
           console.error("Erro ao pegar rect do elemento", e);
         }
      }
      
      if (clientX !== undefined && clientY !== undefined) {
        const id = Math.random().toString(36).substr(2, 9);
        setReactionEffects(prev => [...prev, { id, x: clientX, y: clientY, type: reactionType }]);
      }
    }
    
    const processingKey = `${post.id}-switch`;
    if (reactionProcessing.has(processingKey)) return;
    setReactionProcessing(prev => new Set(prev).add(processingKey));

    try {
        const currentReactions = userReactions[post.id] || [];
        const isAlreadyActive = currentReactions.includes(reactionType);
        
        if (isAlreadyActive) {
            // Se já está ativo, apenas fecha o menu
            setShowReactions(null);
            return;
        }

        // Optimistic Update
        const reactionsToRemove = [...currentReactions];
        
        setUserReactions(prev => ({
            ...prev,
            [post.id]: [reactionType] // Substitui tudo pela nova
        }));
        
        setReactionsCount(prev => {
            const counts = prev[post.id] || { pray: 0, people: 0, fire: 0 };
            const newCounts = { ...counts };
            
            reactionsToRemove.forEach(r => {
                newCounts[r] = Math.max(0, newCounts[r] - 1);
            });
            
            newCounts[reactionType] = (newCounts[reactionType] || 0) + 1;
            
            return {
                ...prev,
                [post.id]: newCounts
            };
        });

        setPrimaryReaction(prev => ({ ...prev, [post.id]: reactionType }));
        setShowReactions(null);

        // API Calls
        const promises = [];
        // Remove as antigas
        reactionsToRemove.forEach(r => {
            promises.push(databaseService.toggleReaction(post.id, r));
        });
        // Adiciona a nova
        promises.push(databaseService.toggleReaction(post.id, reactionType));
        
        await Promise.all(promises);
        
        // Sincroniza estado final
        const [counts, userReacts] = await Promise.all([
             databaseService.fetchReactionsCount([post.id]),
             databaseService.fetchUserReactions([post.id])
        ]);
        
        setReactionsCount(prev => ({ ...prev, ...counts }));
        setUserReactions(prev => ({ ...prev, ...userReacts }));
        
        const active = userReacts[post.id] || [];
        if (active.length > 0) {
             setPrimaryReaction(prev => ({ ...prev, [post.id]: active[0] }));
        } else {
             setPrimaryReaction(prev => {
                 const next = { ...prev };
                 delete next[post.id];
                 return next;
             });
        }

    } catch (error) {
        console.error('Erro ao trocar reação:', error);
    } finally {
        setReactionProcessing(prev => {
            const next = new Set(prev);
            next.delete(processingKey);
            return next;
        });
    }
  };

  const handleMainReactionClick = async (post: DevotionalPost, event?: React.MouseEvent | React.TouchEvent) => {
    if (!currentUser) return;
    if (showReactions === post.id) return; // Não faz nada se menu estiver aberto

    // Trigger effect
    if (event) {
      let clientX, clientY;
      const touchEvent = event as React.TouchEvent;
      const mouseEvent = event as React.MouseEvent;

      if ('changedTouches' in event && touchEvent.changedTouches.length > 0) {
        clientX = touchEvent.changedTouches[0].clientX;
        clientY = touchEvent.changedTouches[0].clientY;
      } else if ('touches' in event && touchEvent.touches.length > 0) {
        clientX = touchEvent.touches[0].clientX;
        clientY = touchEvent.touches[0].clientY;
      } else {
        clientX = mouseEvent.clientX;
        clientY = mouseEvent.clientY;
      }
      
      const activeReactions = userReactions[post.id] || [];
      const primary = primaryReaction[post.id];
      const activeType = (primary && activeReactions.includes(primary)) ? primary : activeReactions[0];
      
      // Só dispara efeito se for ADICIONAR (não se for remover)
      if (!activeReactions.includes(activeType)) {
          if (clientX !== undefined && clientY !== undefined) {
             const id = Math.random().toString(36).substr(2, 9);
             setReactionEffects(prev => [...prev, { id, x: clientX, y: clientY, type: 'pray' }]);
          }
      }
    }

    const processingKey = `${post.id}-main`;
    if (reactionProcessing.has(processingKey)) return;
    setReactionProcessing(prev => new Set(prev).add(processingKey));

    try {
        const currentReactions = userReactions[post.id] || [];
        const hasReaction = currentReactions.length > 0;
        
        // Se tem reação, vamos remover a primeira encontrada (ou todas, mas assumindo uma por vez na UI)
        // Se não tem, vamos adicionar 'pray'
        
        if (hasReaction) {
            // REMOVER REAÇÃO ATUAL
            const reactionToRemove = currentReactions[0]; // Pega a primeira ativa
            
            // Optimistic Update (Remove)
            setUserReactions(prev => ({
                ...prev,
                [post.id]: [] // Remove todas visualmente
            }));
            
            setReactionsCount(prev => {
                const counts = prev[post.id] || { pray: 0, people: 0, fire: 0 };
                const newCounts = { ...counts };
                newCounts[reactionToRemove] = Math.max(0, newCounts[reactionToRemove] - 1);
                return { ...prev, [post.id]: newCounts };
            });
            
            setPrimaryReaction(prev => {
                const next = { ...prev };
                delete next[post.id];
                return next;
            });

            // API Call
            await databaseService.toggleReaction(post.id, reactionToRemove);
        
        } else {
            // ADICIONAR 'PRAY' (AMÉM)
            const reactionType = 'pray';
            
            // Optimistic Update (Add)
            setUserReactions(prev => ({
                ...prev,
                [post.id]: [reactionType]
            }));
            
            setReactionsCount(prev => {
                const counts = prev[post.id] || { pray: 0, people: 0, fire: 0 };
                const newCounts = { ...counts };
                newCounts[reactionType] = (newCounts[reactionType] || 0) + 1;
                return { ...prev, [post.id]: newCounts };
            });
            
            setPrimaryReaction(prev => ({ ...prev, [post.id]: reactionType }));
            
            // API Call
            await databaseService.toggleReaction(post.id, reactionType);
        }

        // Sincroniza estado final
        const [counts, userReacts] = await Promise.all([
             databaseService.fetchReactionsCount([post.id]),
             databaseService.fetchUserReactions([post.id])
        ]);
        
        setReactionsCount(prev => ({ ...prev, ...counts }));
        setUserReactions(prev => ({ ...prev, ...userReacts }));
        
        const active = userReacts[post.id] || [];
        if (active.length > 0) {
             setPrimaryReaction(prev => ({ ...prev, [post.id]: active[0] }));
        } else {
             setPrimaryReaction(prev => {
                 const next = { ...prev };
                 delete next[post.id];
                 return next;
             });
        }

    } catch (error) {
        console.error('Erro ao processar reação principal:', error);
    } finally {
        setReactionProcessing(prev => {
            const next = new Set(prev);
            next.delete(processingKey);
            return next;
        });
    }
  };

  // Effect para detectar mobile
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Effect para carregar dados (só executa se for mobile) - pré-carrega posts sempre
  useEffect(() => {
    if (isMobile === true) {
      const init = async () => {
        try {
          // Sempre pré-carregar posts e membros em paralelo
          const [savedPosts, memberList] = await Promise.all([
            databaseService.fetchPosts(),
            databaseService.fetchMembers()
          ]);
          setPosts(savedPosts);
          setMembers(memberList);
          
          // Carregar contagens de comentários e reações em background (não bloqueia UI)
          if (savedPosts.length > 0) {
            const postIds = savedPosts.map(post => post.id);
            Promise.all([
              databaseService.fetchCommentsCount(postIds),
              databaseService.fetchReactionsCount(postIds),
              databaseService.fetchUserReactions(postIds),
              databaseService.fetchUserPrimaryReactions(postIds),
            ]).then(([commentCounts, reactionCounts, userReacts, primaryReacts]) => {
              setCommentsCount(commentCounts);
              setReactionsCount(reactionCounts);
              setUserReactions(userReacts);
              // Só definir primaryReaction se o usuário realmente tem reações ativas
              const validPrimaryReacts: Record<string, 'pray' | 'people' | 'fire'> = {};
              Object.keys(primaryReacts).forEach(postId => {
                // Só usar primaryReaction se o usuário ainda tem essa reação ativa
                if (userReacts[postId] && userReacts[postId].length > 0) {
                  // Verificar se a reação primária ainda está nas reações ativas do usuário
                  if (userReacts[postId].includes(primaryReacts[postId])) {
                    validPrimaryReacts[postId] = primaryReacts[postId];
                  } else {
                    // Se não está mais ativa, usar a primeira reação ativa ou 'pray' como padrão
                    validPrimaryReacts[postId] = userReacts[postId][0] || 'pray';
                  }
                }
              });
              setPrimaryReaction(prev => ({ ...prev, ...validPrimaryReacts }));
            }).catch(error => {
              console.error('Erro ao carregar dados adicionais:', error);
            });
          }
          
          // Tentar carregar mensagem do Gemini (pode falhar se não tiver API key)
          try {
            const msg = await geminiService.getDailyEncouragement();
            setAiMessage(msg);
          } catch (error) {
            console.warn('Erro ao carregar mensagem do Gemini (pode ser falta de API key):', error);
            setAiMessage('Lucas 5:16 - Jesus, porém, retirava-se para lugares solitários e orava.');
          }
        } catch (error) {
          console.error('Erro ao inicializar app:', error);
        }
      };
      init();
    }
  }, [isMobile]);

  // Effect para atualizar posts quando mudar de aba para 'group' (apenas refresh em background)
  useEffect(() => {
    if (isMobile === true && activeTab === 'group') {
      // Se não temos posts, carregar a primeira página
      if (posts.length === 0) {
        setIsLoadingPosts(true);
        setPage(1);
        setHasMore(true);
        
        databaseService.fetchPosts(1, 10).then(savedPosts => {
          setPosts(savedPosts);
          setHasMore(savedPosts.length >= 10);
          
          if (savedPosts.length > 0) {
            const postIds = savedPosts.map(post => post.id);
            return Promise.all([
              databaseService.fetchCommentsCount(postIds),
              databaseService.fetchReactionsCount(postIds),
              databaseService.fetchUserReactions(postIds),
              databaseService.fetchUserPrimaryReactions(postIds),
            ]).then(([commentCounts, reactionCounts, userReacts, primaryReacts]) => {
              setCommentsCount(commentCounts);
              setReactionsCount(reactionCounts);
              setUserReactions(userReacts);
              setPrimaryReaction(prev => ({ ...prev, ...primaryReacts }));
            });
          }
        }).catch(error => {
          console.error('Erro ao carregar posts:', error);
        }).finally(() => {
          setIsLoadingPosts(false);
        });
      }
    }
  }, [isMobile, activeTab]); // Removido posts.length para evitar loops

  // Effect para carregar contagens quando posts são carregados inicialmente
  useEffect(() => {
    if (posts.length > 0 && activeTab === 'group') {
      const loadCounts = async () => {
        const postIds = posts.map(post => post.id);
        const [commentCounts, reactionCounts, userReacts] = await Promise.all([
          databaseService.fetchCommentsCount(postIds),
          databaseService.fetchReactionsCount(postIds),
          databaseService.fetchUserReactions(postIds),
        ]);
        setCommentsCount(commentCounts);
        setReactionsCount(reactionCounts);
        setUserReactions(userReacts);
        
        // Definir primaryReaction baseado na reação mais recente do usuário
        const primaryReacts = await databaseService.fetchUserPrimaryReactions(postIds);
        setPrimaryReaction(prev => ({ ...prev, ...primaryReacts }));
      };
      loadCounts();
    }
  }, [posts.length, activeTab]);

  // Função para abrir comentários e carregar
  const handleOpenComments = async (postId: string) => {
    setShowComments(postId);
    setIsLoadingComments(true);
    try {
      const postComments = await databaseService.fetchComments(postId);
      setComments(postComments);
      
      // Atualizar contagem de comentários
      setCommentsCount(prev => ({
        ...prev,
        [postId]: postComments.length
      }));
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Função para enviar comentário
  const handleSubmitComment = async () => {
    if (!showComments || !commentText.trim()) return;

    const success = await databaseService.createComment(showComments, commentText.trim());
    
    if (success) {
      setCommentText('');
      // Recarregar comentários
      const postComments = await databaseService.fetchComments(showComments);
      setComments(postComments);
      
      // Atualizar contagem de comentários
      setCommentsCount(prev => ({
        ...prev,
        [showComments]: (prev[showComments] || 0) + 1
      }));
    } else {
      toast.error('Erro ao publicar comentário', {
        description: 'Tente novamente em alguns instantes.',
      });
    }
  };

  // Buscar perfil do usuário quando estiver autenticado
  useEffect(() => {
    if (user) {
      setIsLoadingProfile(true);
      const fetchProfile = async () => {
        try {
          const profile = await databaseService.fetchUserProfile(user.id);
          if (profile) {
            setCurrentUser(profile);
          } else {
            // Se não encontrar perfil, criar um básico
            setCurrentUser({
              id: user.id,
              name: user.email?.split('@')[0] || 'Usuário',
              avatar: '',
              bio: '',
              streak: 0,
              maxStreak: 0,
              birthday: undefined,
              congregation: undefined,
              civilStatus: undefined,
            });
          }
        } catch (error) {
          console.error('Erro ao buscar perfil do usuário:', error);
          // Em caso de erro, criar perfil básico
          setCurrentUser({
            id: user.id,
            name: user.email?.split('@')[0] || 'Usuário',
            avatar: '',
            bio: '',
            streak: 0,
            maxStreak: 0,
            birthday: undefined,
            congregation: undefined,
            civilStatus: undefined,
          });
        } finally {
          setIsLoadingProfile(false);
        }
      };
      fetchProfile();
    } else {
      setCurrentUser(null);
      setIsLoadingProfile(false);
    }
  }, [user]);

  // Buscar devocionais do usuário quando a aba de perfil for ativada ou quando o calendário for aberto
  useEffect(() => {
    if ((activeTab === 'profile' || showCalendar) && user) {
      const fetchUserDataAndStreak = async () => {
        try {
          // fetchUserProfile (already fetches updated data if databaseService reads fresh)
          const profile = await databaseService.fetchUserProfile(user.id);
          
          // Fetch ALL user devotionals for accurate streak calculation
          const userPosts = await databaseService.fetchUserDevotionals(user.id);
          setUserDevotionals(userPosts);

          if (profile) {
            const { currentStreak, maxStreak } = calculateUserStreak(userPosts);
            
            // Check if DB needs update
            if (currentStreak !== profile.streak || maxStreak !== profile.maxStreak) {
              await databaseService.updateUserProfile(user.id, {
                streak: currentStreak,
                maxStreak: maxStreak
              });
              
              // Force UI update
              setCurrentUser({
                ...profile,
                streak: currentStreak,
                maxStreak: maxStreak
              });
            } else {
              setCurrentUser(profile);
            }
          }
        } catch (error) {
          console.error('Erro ao atualizar streak:', error);
        }
      };
      
      fetchUserDataAndStreak();
    }
  }, [activeTab, user, showCalendar]);

  // Buscar total de devocionais quando estiver na home
  useEffect(() => {
    if (activeTab === 'home' && user) {
      const fetchTotalDevotionals = async () => {
        try {
          const devotionals = await databaseService.fetchUserDevotionals(user.id);
          setTotalDevotionals(devotionals.length);
        } catch (error) {
          console.error('Erro ao buscar total de devocionais:', error);
        }
      };

      const fetchTodayStats = async () => {
        const count = await databaseService.countTodayActiveUsers();
        setTodayCount(count);
      };

      fetchTotalDevotionals();
      fetchTodayStats();
    }
  }, [activeTab, user]);

  // Função central para simular o getList (pull-to-refresh)
  const triggerRefresh = () => {
    if (isRefreshing) return;

    // Aqui no futuro vamos chamar o getList real no backend
    setIsRefreshing(true);

    setTimeout(() => {
      setIsRefreshing(false);
      setShowRefreshToast(true);

      // Esconde o toast depois de alguns segundos
      setTimeout(() => {
        setShowRefreshToast(false);
      }, 2200);
    }, 1200);
  };

  // Handlers de touch para pull-to-refresh apenas na Home
  const handleHomeTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (activeTab !== 'home' || showNewCheckIn || isRefreshing) return;

    // Garante que estamos no topo da página
    if (window.scrollY <= 0) {
      pullStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleHomeTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPulling || pullStartY.current === null) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - pullStartY.current;

    // Threshold para considerar que o usuário puxou para atualizar
    if (diff > 90) {
      setIsPulling(false);
      pullStartY.current = null;
      triggerRefresh();
    }
  };

  const handleHomeTouchEnd = () => {
    setIsPulling(false);
    pullStartY.current = null;
  };

  // AGORA SIM, podemos fazer os returns condicionais
  // PRIORIDADE 1: Verificar se é mobile primeiro (app é exclusivo para mobile)
  // Se ainda não detectou mobile, mostra loading
  if (isMobile === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  // Se NÃO for mobile, mostra a página de redirecionamento (ANTES de verificar auth)
  if (!isMobile) {
    return <MobileRedirect />;
  }

  // PRIORIDADE 2: Se for mobile, verificar autenticação
  // Se ainda está carregando autenticação, mostra loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, mostra tela de login (apenas em mobile)
  if (!user) {
    return <Auth onAuthSuccess={() => window.location.reload()} />;
  }

  // Se for mobile e autenticado, mostra o app normal

  const handleNewPost = async (newPostData: any) => {
    if (!currentUser) return;
    
    const post: DevotionalPost = {
      ...newPostData,
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userRole: currentUser.role,
      date: new Date().toISOString()
    };
    await databaseService.savePost(post);
    setPosts(prev => [post, ...prev]);
    activeTab === 'home' ? setActiveTab('group') : null;
    setAppToast({ 
      message: 'Parabéns! Seu devocional foi postado com sucesso na comunidade! 🎉', 
      type: 'success',
      icon: <PartyPopper size={24} className="text-orange-500" />
    });
  };

  const renderHome = () => {
    // Se ainda está carregando o perfil, mostrar skeleton
    if (isLoadingProfile || !currentUser) {
      return (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 pb-10">
          {/* Skeleton Dashboard Principal */}
          <div className="dashboard-gradient rounded-[1.5rem] p-4 shadow-2xl relative overflow-hidden border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <div className="h-3 bg-slate-700/50 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-slate-700/50 rounded w-40 animate-pulse"></div>
              </div>
              <div className="w-8 h-8 bg-slate-700/50 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 bg-slate-700/50 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700/50 rounded w-24 animate-pulse"></div>
                </div>
              </div>
              <div className="h-8 bg-slate-700/50 rounded-full w-24 animate-pulse"></div>
            </div>
            <div className="space-y-3.5">
              <div className="flex justify-between">
                <div className="h-3 bg-slate-700/50 rounded w-28 animate-pulse"></div>
                <div className="h-3 bg-slate-700/50 rounded w-24 animate-pulse"></div>
              </div>
              <div className="flex justify-between px-0.5">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="w-6 h-6 bg-slate-700/50 rounded-full animate-pulse"></div>
                ))}
              </div>
              <div className="flex justify-between">
                <div className="h-2 bg-slate-700/50 rounded w-8 animate-pulse"></div>
                <div className="h-2 bg-slate-700/50 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Skeleton Card Palavra do Dia */}
          <div className="bg-white border-2 border-orange-200/60 rounded-[1.5rem] p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-slate-200 rounded-2xl animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-slate-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Skeleton Social Card */}
          <div className="bg-gradient-to-br from-orange-100/90 to-amber-100/70 border-2 border-orange-200/60 rounded-[1.5rem] p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-200 rounded-2xl animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-orange-200 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-orange-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 pb-10"
        onTouchStart={handleHomeTouchStart}
        onTouchMove={handleHomeTouchMove}
        onTouchEnd={handleHomeTouchEnd}
      >
        {/* Indicador de atualização (pull-to-refresh) */}
        {isRefreshing && (
          <div className="flex items-center justify-center py-2 text-[12px] text-slate-500 gap-2">
            <RefreshCw size={14} className="animate-spin text-orange-500" />
            <span className="font-medium">Atualizando dados...</span>
          </div>
        )}

        {/* Card de Notificações Push */}
        <NotificationPrompt />
        
        {/* 1. Dashboard Principal - Black Typography */}
        <div className="dashboard-gradient rounded-[1.5rem] p-4 shadow-2xl relative overflow-hidden border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-6 h-6 bg-amber-500/5 rounded-md flex items-center justify-center">
                  <Flame size={18} className="text-amber-500" />
                </div>
                <span className="text-[9px] font-sm text-slate-500 uppercase tracking-wide-custom">NÍVEL DE CONSTÂNCIA</span>
              </div>
              <h2 className="text-[14px] font-bold text-white tracking-tight-custom ml-7">Geração Life em movimento</h2>
            </div>
            <button className="p-1.5 bg-white/5 rounded-full text-slate-400 active:scale-90 transition-transform">
              <RefreshCw size={13} />
            </button>
          </div>

          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-1.5">
              <span className="text-[60px] font-black text-white leading-none tracking-tight-custom">{totalDevotionals}</span>
              <div className="flex flex-col items-start justify-center h-full">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-blue-500/10 rounded-md flex items-center justify-center mt-5">
                    <Flame size={26} className="text-amber-500/80" />
                  </div>
                  <span className="text-[14px] font-sm text-slate-500 tracking-normal">devocionais feitos</span>
                </div>
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <Flame size={16} className="text-amber-500" />
              <span className="text-[12px] font-black text-amber-500 tracking-tight">{totalDevotionals} dias</span>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex justify-between items-center text-[9px] font-sm uppercase text-slate-500 tracking-wide-custom">
              <span>CHAMA: {totalDevotionals}/10 DIAS</span>
              <span>0 CHAMAS ACESAS</span>
            </div>

            <div className="flex justify-between items-center px-0.5">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${i < totalDevotionals ? 'bg-amber-500/20 border-amber-500 active-circle-glow' : 'bg-slate-800/50 border-slate-700'}`}
                >
                  {i < totalDevotionals && (
                    <Flame 
                      size={14} 
                      className="text-amber-500 fill-amber-500 animate-soft-glow"
                      style={{
                        filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.8))',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-[8px] font-black">
              <span className="text-slate-500 tracking-tight">{totalDevotionals}/10</span>
              <span className="text-amber-600 uppercase tracking-wide-custom">{10 - totalDevotionals} dias para completar</span>
            </div>

          <div className="pt-2 border-t border-white/5 flex justify-between">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => {
              // Obter dia atual da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
              const today = new Date();
              const currentDayOfWeek = today.getDay();
              
              // Verificar se este dia (i) é o dia atual
              const isToday = i === currentDayOfWeek;
              
              // Verificar se há devocional feito neste dia usando o estado weeklyDevotionals
              const hasDevotionalOnThisDay = weeklyDevotionals.has(i);
              
              // Determinar a cor da barra
              let barColor = '';
              let showBar = false;
              
              if (isToday && !hasDevotionalOnThisDay) {
                // Dia atual sem devocional = amarelo
                barColor = 'bg-amber-500';
                showBar = true;
              } else if (hasDevotionalOnThisDay) {
                // Dia com devocional = verde
                barColor = 'bg-green-500';
                showBar = true;
              }
              
              return (
                <div key={i} className="w-[30px] h-[30.5px] flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-black text-slate-500 opacity-70`}>{day}</span>
                  {showBar && <div className={`w-[25px] h-[8px] ${barColor} rounded-full`}></div>}
                </div>
              );
            })}
          </div>

          <button 
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                if (user) {
                  const devotionals = await databaseService.fetchUserDevotionals(user.id);
                  setUserDevotionals(devotionals);
                }
                setShowCalendar(true);
              } catch (error) {
                console.error('Erro ao abrir calendário:', error);
                // Mesmo com erro, tentar abrir o calendário
                setShowCalendar(true);
              }
            }}
            className="flex items-center gap-1 text-amber-600/90 text-[9px] font-black uppercase tracking-wide-custom pt-0.5 active:opacity-70 transition-opacity cursor-pointer"
            type="button"
          >
            <Calendar size={12} />
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
        <div className="flex-1">
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                <span className="font-bold text-orange-500">{todayCount} pessoas</span> fizeram devocional hoje! Faça você também e vamos crescer juntos! 🔥
            </p>
            <div className="flex items-center gap-2 mt-2">
                <Flame size={14} className="text-orange-500 fill-orange-500" />
                <span className="text-xs font-bold text-orange-500">{todayCount} devocionais hoje</span>
            </div>
        </div>
      </div>

        <PostForm isOpen={isPostFormOpen} onClose={() => setIsPostFormOpen(false)} onPost={handleNewPost} currentTheme={DayTheme.NORMAL} />
      </div>
    );
  };

  const handleTabChange = (tab: 'home' | 'group' | 'profile') => {
    setActiveTab(tab);
    setShowNewCheckIn(false); // Fecha o modal ao mudar de aba
  };

  // Se a tela de Meus Devocionais estiver aberta, renderizar ela
  if (showMyDevotionals) {
    return (
      <MyDevotionals onBack={() => setShowMyDevotionals(false)} />
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Toast de atualização de dados (ao puxar para baixo) */}
      {showRefreshToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[250] w-[92%] max-w-sm animate-in slide-in-from-top fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 px-4 py-3 flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
              <RefreshCw size={16} className="text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-slate-900 flex items-center gap-1">
                Atualizado!
              </p>
              <p className="text-[13px] text-slate-500">
                Dados atualizados com sucesso.
              </p>
            </div>
          </div>
        </div>
      )}

      {showNewCheckIn && (
        <NewCheckIn 
          onClose={() => setShowNewCheckIn(false)} 
          onPostCreated={async () => {
            // Mudar para a aba de grupo e mostrar toast IMEDIATAMENTE antes de carregar dados
            setActiveTab('group');
            setAppToast({ 
              message: 'Parabéns! Seu devocional foi postado com sucesso na comunidade! 🎉', 
              type: 'success',
              icon: <PartyPopper size={24} className="text-orange-500" />
            });
            
            // Atualizar lista de posts (importante para o feed da comunidade)
            const updatedPosts = await databaseService.fetchPosts();
            setPosts(updatedPosts);
            
            // Atualizar devocionais do usuário
            if (user) {
              const devotionals = await databaseService.fetchUserDevotionals(user.id);
              setUserDevotionals(devotionals);
              // Atualizar total de devocionais para o calendário
              setTotalDevotionals(devotionals.length);
            }
            
            // Atualizar perfil do usuário para atualizar streak
            if (user) {
              const profile = await databaseService.fetchUserProfile(user.id);
              if (profile) {
                setCurrentUser(profile);
              }
            }
          }}
        />
      )}
      
      {/* ProfileEdit Modal - Renderizado fora do Layout para garantir z-index correto */}
      {isProfileEditOpen && currentUser && (
        <ProfileEdit 
          user={currentUser} 
          onClose={() => setIsProfileEditOpen(false)} 
          onSave={async (updated) => { 
            const success = await databaseService.updateUserProfile(updated.id, updated);
            if (success) {
              setCurrentUser(updated); 
              setIsProfileEditOpen(false);
              toast.success('Perfil atualizado com sucesso!');
            } else {
              toast.error('Erro ao atualizar perfil.');
            }
          }} 
        />
      )}
      
      {/* JourneyModal - Modal de Jornada do Usuário */}
      {showJourneyModal && currentUser && (
        <JourneyModal 
          user={currentUser}
          totalDevotionals={totalDevotionals}
          weeklyDevotionals={(() => {
            // Filtrar devocionais da semana atual
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Domingo da semana atual
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Sábado da semana atual
            endOfWeek.setHours(23, 59, 59, 999);
            
            return userDevotionals.filter(dev => {
              const devDate = new Date(dev.date);
              return devDate >= startOfWeek && devDate <= endOfWeek;
            });
          })()}
          onClose={() => setShowJourneyModal(false)}
        />
      )}
      
      <InstallBanner />
      <Layout 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        onSearchToggle={() => setShowSearch(!showSearch)} 
        onNewCheckIn={() => setShowNewCheckIn(true)} 
        isCheckInOpen={showNewCheckIn}
        onEditProfile={() => setIsProfileEditOpen(true)}
        onMyDevotionals={() => setShowMyDevotionals(true)}
        onJourneyClick={() => setShowJourneyModal(true)}
        onAnalyticsFilterClick={() => setShowAnalyticsFilter(true)}
        userRole={currentUser?.role}
      >
        {activeTab === 'home' && renderHome()}
        {activeTab === 'analytics' && currentUser && (
          <Analytics 
            currentUser={currentUser}
            showFilter={showAnalyticsFilter}
            onCloseFilter={() => setShowAnalyticsFilter(false)}
          />
        )}
      {activeTab === 'group' && (
        <div className="space-y-4 animate-in fade-in duration-500 pb-20 pt-2 bg-slate-100 px-4">
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
            {isLoadingPosts ? (
              // Skeleton Screen para Posts
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                    {/* Skeleton Header do Post */}
                    <div className="flex items-start gap-2.5 mb-3">
                      <div className="w-11 h-11 bg-slate-200 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div>
                        <div className="h-3 bg-slate-200 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* Skeleton Versículo */}
                    <div className="mb-3 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-20 animate-pulse"></div>
                      <div className="h-5 bg-slate-200 rounded w-28 animate-pulse"></div>
                    </div>
                    
                    {/* Skeleton Lição Aprendida */}
                    <div className="mb-3 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-24 animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                    
                    {/* Skeleton Pedido de Oração */}
                    <div className="mb-3 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-28 animate-pulse"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse"></div>
                    </div>
                    
                    {/* Skeleton Foto */}
                    <div className="mt-3 h-48 bg-slate-200 rounded-xl animate-pulse"></div>
                    
                    {/* Skeleton Botões de Ação */}
                    <div className="flex items-center justify-between gap-4 mt-3.5 pt-3 px-4 border-t border-slate-100">
                      <div className="h-8 bg-slate-200 rounded-2xl w-24 animate-pulse"></div>
                      <div className="h-8 bg-slate-200 rounded-2xl w-24 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-xl p-8 shadow-sm text-center">
                <BookOpen size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-[15px] font-semibold text-slate-700 mb-2">
                  Nenhum devocional ainda
                </p>
                <p className="text-[13px] text-slate-500">
                  Seja o primeiro a compartilhar um devocional!
                </p>
              </div>
            ) : (() => {
              // Filtrar posts baseado na busca
              const filteredPosts = posts.filter(post => {
                // Filtrar por busca se houver
                if (searchQuery.trim()) {
                  return post.userName.toLowerCase().includes(searchQuery.toLowerCase());
                }
                return true;
              });

              // Se não houver posts após filtro
              if (filteredPosts.length === 0) {
                // Se há uma busca ativa, mostrar mensagem de "não encontrado"
                if (searchQuery.trim()) {
                  return (
                    <div key="no-results" className="bg-white border border-slate-100 rounded-xl p-8 shadow-sm text-center">
                      <Search size={48} className="text-slate-300 mx-auto mb-4" />
                      <p className="text-[15px] font-semibold text-slate-700 mb-2">
                        Nenhum resultado encontrado
                      </p>
                      <p className="text-[13px] text-slate-500">
                        Não encontramos devocionais de &quot;{searchQuery}&quot;. Tente buscar por outro nome.
                      </p>
                    </div>
                  );
                }
                // Se não há busca e não há posts, mostrar mensagem padrão
                return (
                  <div key="no-posts" className="bg-white border border-slate-100 rounded-xl p-8 shadow-sm text-center">
                    <BookOpen size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-[15px] font-semibold text-slate-700 mb-2">
                      Nenhum devocional ainda
                    </p>
                    <p className="text-[13px] text-slate-500">
                      Seja o primeiro a compartilhar um devocional!
                    </p>
                  </div>
                );
              }

              // Se houver posts filtrados, renderizar normalmente
              return (
                <>
                  {filteredPosts.map((post) => {
                  const getInitials = (name: string) => {
                    return name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                  };

                  return (
                    <div 
                      key={post.id}
                      className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm relative select-none"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    >
                      <div className="flex items-start gap-2.5 mb-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserProfileId(post.userId);
                            setShowUserProfileModal(true);
                          }}
                          className="focus:outline-none active:opacity-80 transition-opacity"
                        >
                          {post.userAvatar ? (
                            <img 
                              src={post.userAvatar} 
                              alt={post.userName}
                              className="w-11 h-11 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-base shrink-0">
                              {getInitials(post.userName)}
                            </div>
                          )}
                        </button>
                        <div className="flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserProfileId(post.userId);
                              setShowUserProfileModal(true);
                            }}
                            className="text-left focus:outline-none hover:text-orange-600 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              <h3 className="font-bold text-slate-900 text-[14px]">{post.userName}</h3>
                              {post.userRole === 'admin_master' && (
                                <BadgeCheck size={16} className="text-white fill-green-500" />
                              )}
                              {post.userRole === 'admin' && (
                                <BadgeCheck size={16} className="text-white fill-blue-500" />
                              )}
                            </div>
                          </button>
                          <p className="text-[12px] text-slate-500 font-normal mt-0.5">
                            {formatTimeAgo(post.date)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {/* VERSÍCULO */}
                        {post.scripture && (
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                              </svg>
                              <span className="text-[13px] font-bold text-orange-500 uppercase tracking-wider">VERSÍCULO</span>
                            </div>
                            <p className="text-[17px] font-bold text-slate-800">{post.scripture}</p>
                          </div>
                        )}

                        {/* LIÇÃO APRENDIDA */}
                        {post.lesson && (
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <Lightbulb size={15} className="text-orange-500" />
                              <span className="text-[12px] font-bold text-orange-500 uppercase tracking-wider">LIÇÃO APRENDIDA</span>
                            </div>
                            <p className="text-[15px] font-normal text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
                              {expandedPosts.has(post.id) || post.lesson.length <= 200
                                ? post.lesson
                                : `${post.lesson.slice(0, 200)}... `}
                              {post.lesson.length > 200 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedPosts(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(post.id)) {
                                        newSet.delete(post.id);
                                      } else {
                                        newSet.add(post.id);
                                      }
                                      return newSet;
                                    });
                                  }}
                                  className="text-[13.5px] text-orange-600 font-bold bg-transparent border-none p-0 mt-1 block"
                                >
                                  {expandedPosts.has(post.id) ? 'Ver menos' : 'Ver mais'}
                                </button>
                              )}
                            </p>
                          </div>
                        )}

                        {/* PEDIDO DE ORAÇÃO */}
                        {post.prayerRequest && (
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <Heart size={12} className="text-slate-600" />
                              <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">PEDIDO DE ORAÇÃO</span>
                            </div>
                            <p className="text-[13px] font-normal text-slate-700 break-words whitespace-pre-wrap">{post.prayerRequest}</p>
                          </div>
                        )}
                      </div>

                      {/* Foto do Devocional */}
                      {post.photo && (
                        <button 
                          onClick={() => {
                            setSelectedPost(post);
                            setShowPostDetail(post.id);
                          }}
                          className="mt-3 rounded-xl overflow-hidden w-full active:opacity-90 transition-opacity"
                        >
                          <img 
                            src={post.photo} 
                            alt="Devocional" 
                            className="w-full h-auto object-cover"
                          />
                        </button>
                      )}

                      {/* Ações */}
                      <div className="flex items-center justify-between gap-4 mt-3.5 pt-3 px-4 border-t border-slate-100 w-full relative">
                        {/* Reações flutuantes */}
                        {showReactions === post.id && (
                          <>
                            {/* Overlay para fechar o menu ao clicar fora */}
                            <div 
                              className="fixed inset-0 z-40"
                              onClick={() => setShowReactions(null)}
                            />
                            <div className="absolute bottom-full left-0 mb-2 animate-in zoom-in-95 duration-200 z-50">
                            <div className="bg-white rounded-full p-2 shadow-2xl border border-slate-200 flex items-center gap-2">
                              <button 
                                className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                                onClick={async () => {
                                  if (!user) return;
                                  handleReactionClick(post, 'pray');
                                }}
                                title="Amém"
                              >
                                <span className="text-xl">🙏</span>
                              </button>
                              <button 
                                className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                                onClick={async () => {
                                  if (!user) return;
                                  handleReactionClick(post, 'people');
                                }}
                                title="Glória"
                              >
                                <span className="text-xl">🙌</span>
                              </button>
                              <button 
                                className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                                onClick={async () => {
                                  if (!user) return;
                                  handleReactionClick(post, 'fire');
                                }}
                                title="Aleluia"
                              >
                                <span className="text-xl">🔥</span>
                              </button>
                            </div>
                          </div>
                          </>
                        )}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            if (wasLongPress) return;
                            handleMainReactionClick(post);
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setWasLongPress(false);
                            const timer = setTimeout(() => {
                              setWasLongPress(true);
                              setShowReactions(post.id);
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
                            setWasLongPress(false);
                            const timer = setTimeout(() => {
                              setWasLongPress(true);
                              setShowReactions(post.id);
                            }, 500);
                            setLongPressTimer(timer);
                          }}
                          onTouchEnd={(e) => {
                            if (longPressTimer) {
                              clearTimeout(longPressTimer);
                              setLongPressTimer(null);
                            }
                            // Não executa se o menu de reações estiver aberto
                            if (showReactions === post.id) {
                              setWasLongPress(false);
                              return;
                            }
                            // Se não foi long press, executa o clique normal (toggle da reação exibida)
                            if (!wasLongPress && !showReactions) {
                              e.preventDefault(); // Prevenir double click issues
                              handleMainReactionClick(post, e);
                            }
                            setWasLongPress(false);
                          }}
                          className={`flex items-center gap-2 transition-all duration-150 flex-1 justify-center rounded-2xl px-4 py-2 ${
                            (() => {
                              // Só mostrar fundo suave se o usuário realmente reagiu
                              const activeReactions = userReactions[post.id] || [];
                              if (activeReactions.length === 0) {
                                // Sem reações ativas, sem fundo suave
                                return 'text-slate-600 hover:text-orange-500';
                              }
                              // Se tem reações, verificar se a primaryReaction ainda está ativa
                              const reactionType = (primaryReaction[post.id] && activeReactions.includes(primaryReaction[post.id]))
                                ? primaryReaction[post.id]
                                : activeReactions[0];
                              return activeReactions.includes(reactionType)
                                ? 'bg-orange-50 text-orange-500'
                                : 'text-slate-600 hover:text-orange-500';
                            })()
                          }`}
                        >
                          {(() => {
                            // Só usar primaryReaction se o usuário realmente tem reações ativas
                            const activeReactions = userReactions[post.id] || [];
                            let reactionType: 'pray' | 'people' | 'fire';
                            
                            if (activeReactions.length === 0) {
                              // Sem reações, mostrar 'pray' como padrão
                              reactionType = 'pray';
                            } else {
                              // Se tem reações, usar primaryReaction se ainda estiver ativa, senão usar a primeira reação ativa
                              reactionType = (primaryReaction[post.id] && activeReactions.includes(primaryReaction[post.id]))
                                ? primaryReaction[post.id]
                                : activeReactions[0];
                            }

                            // Calcular total de reações
                            const counts = reactionsCount[post.id] || { pray: 0, people: 0, fire: 0 };
                            const total = (counts.pray || 0) + (counts.people || 0) + (counts.fire || 0);
                            const countDisplay = total > 0 ? ` (${total})` : '';

                            if (reactionType === 'fire') {
                              return (
                                <>
                                  <span className="text-[16px]">🔥</span>
                                  <span className="text-[13px] font-normal">
                                    Aleluia{countDisplay}
                                  </span>
                                </>
                              );
                            } else if (reactionType === 'people') {
                              return (
                                <>
                                  <span className="text-[16px]">🙌</span>
                                  <span className="text-[13px] font-normal">
                                    Glória{countDisplay}
                                  </span>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <span className="text-[16px]">🙏</span>
                                  <span className="text-[13px] font-normal">
                                    Amém{countDisplay}
                                  </span>
                                </>
                              );
                            }
                          })()}
                        </button>
                        <button 
                          onClick={() => handleOpenComments(post.id)}
                          className="flex items-center gap-2 text-slate-600 hover:text-orange-500 transition-colors flex-1 justify-center"
                        >
                          <MessageCircle size={16} />
                          <span className="text-[13px] font-normal">
                            Comentar {commentsCount[post.id] > 0 && ` (${commentsCount[post.id]})`}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                  })}
                </>
              );
            })()}
            
            {/* Infinite Scroll Sentinel & Loading Indicator */}
            {!isLoadingPosts && posts.length > 0 && (
              <div className="pb-4">
                <div ref={observerTarget} className="h-10 w-full" />
                {isLoadingMore && (
                  <div className="flex justify-center items-center py-4 gap-2 text-slate-400 text-sm">
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Carregando posts...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal de Detalhes do Post */}
          {showPostDetail && selectedPost && (
              <div className="fixed inset-0 bg-black/50 z-[200] flex items-end animate-in fade-in duration-300">
                <div className="w-full bg-white rounded-t-3xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200 flex-shrink-0">
                  <h3 className="text-[18px] font-semibold text-slate-900">
                      {selectedPost?.date ? new Date(selectedPost?.date).toLocaleDateString('pt-BR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      }) : 'Data não disponível'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowPostDetail(null);
                        setSelectedPost(null);
                        setIsModalFromProfile(false);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X size={20} className="text-slate-600" />
                    </button>
                  </div>

                  {/* Conteúdo do Post Detalhado */}
                  <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8">
                      {/* Foto em Destaque */}
                      {selectedPost?.photo && (
                        <div className="w-full mb-6">
                          <div className="relative">
                            <img 
                              src={selectedPost.photo} 
                              alt="Devocional" 
                              className="w-full h-auto object-cover rounded-xl"
                            />
                          </div>
                        </div>
                      )}

                      {/* Informações do Post */}
                      <div>
                        {/* Header do Post */}
                        <div className="flex items-start gap-3 mb-4">
                          {selectedPost?.userAvatar ? (
                            <img 
                              src={selectedPost?.userAvatar} 
                              alt={selectedPost?.userName}
                              className="w-11 h-11 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0">
                              {selectedPost?.userName
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900 text-[14px]">{selectedPost?.userName}</h3>
                            <p className="text-[12px] text-slate-500 font-normal mt-0.5">
                              {formatTimeAgo(selectedPost?.date)}
                            </p>
                          </div>
                        </div>

                        {/* VERSÍCULO */}
                        {selectedPost?.scripture && (
                          <div className="mb-4">
                            <div className="flex items-center gap-1 mb-1">
                              <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                              </svg>
                              <span className="text-[13px] font-bold text-orange-500 uppercase tracking-wider">VERSÍCULO</span>
                            </div>
                            <p className="text-[17px] font-bold text-slate-800">{selectedPost.scripture}</p>
                          </div>
                        )}

                        {/* LIÇÃO APRENDIDA */}
                        {selectedPost?.lesson && (
                          <div className="mb-4">
                            <div className="flex items-center gap-1 mb-1">
                              <Lightbulb size={15} className="text-orange-500" />
                              <span className="text-[12px] font-bold text-orange-500 uppercase tracking-wider">LIÇÃO APRENDIDA</span>
                            </div>
                            <p className="text-[15px] font-normal text-slate-700 leading-relaxed">
                              {selectedPost?.lesson}
                            </p>
                          </div>
                        )}

                        {/* PEDIDO DE ORAÇÃO */}
                        {selectedPost?.prayerRequest && (
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <Heart size={12} className="text-slate-600" />
                              <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">PEDIDO DE ORAÇÃO</span>
                            </div>
                            <p className="text-[13px] font-normal text-slate-700">{selectedPost?.prayerRequest}</p>
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between gap-4 relative">
                        {/* Reações flutuantes no modal */}
                        {showReactions === selectedPost?.id && (
                          <div>
                            {/* Overlay para fechar o menu ao clicar fora */}
                            <div 
                              className="fixed inset-0 z-40"
                              onClick={() => setShowReactions(null)}
                            />
                            <div className="absolute bottom-full left-0 mb-2 animate-in zoom-in-95 duration-200 z-50">
                              <div className="bg-white rounded-full p-2 shadow-2xl border border-slate-200 flex items-center gap-2">
                                <button 
                                  className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!user || !selectedPost) return;
                                    handleReactionClick(selectedPost, 'pray', e);
                                    setShowReactions(null);
                                  }}
                                  onTouchEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!user || !selectedPost) return;
                                    handleReactionClick(selectedPost, 'pray', e);
                                    setShowReactions(null);
                                  }}
                                >
                                  <span className="text-xl">🙏</span>
                                </button>
                                <button 
                                  className="w-10 h-10 rounded-full border-2 border-yellow-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!user || !selectedPost) return;
                                    handleReactionClick(selectedPost, 'people', e);
                                    setShowReactions(null);
                                  }}
                                  onTouchEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!user || !selectedPost) return;
                                    handleReactionClick(selectedPost, 'people', e);
                                    setShowReactions(null);
                                  }}
                                >
                                  <span className="text-xl">🙌</span>
                                </button>
                                <button 
                                  className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!user || !selectedPost) return;
                                    handleReactionClick(selectedPost, 'fire', e);
                                    setShowReactions(null);
                                  }}
                                  onTouchEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!user || !selectedPost) return;
                                    handleReactionClick(selectedPost, 'fire', e);
                                    setShowReactions(null);
                                  }}
                                >
                                  <span className="text-xl">🔥</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        <button 
                    onClick={(e) => {
                      e.preventDefault();
                      // Não executa se o menu de reações estiver aberto
                      // Mas na verdade handleMainReactionClick já verifica isso, então é seguro chamar
                      if (showReactions === selectedPost.id) return;
                      // Se tem timer ativo (long press em andamento), não clica
                      if (longPressTimer) return;
                      
                      if (!user || !selectedPost || wasLongPress) return;
                      
                      // Usar o handler centralizado que lida corretamente com toggle inteligente (remove qualquer que esteja ativa)
                      // Usar o handler centralizado que lida corretamente com toggle inteligente (remove qualquer que esteja ativa)
                      handleMainReactionClick(selectedPost, e);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setWasLongPress(false);
                      const timer = setTimeout(() => {
                        setWasLongPress(true);
                        setShowReactions(selectedPost.id);
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
                    onTouchStart={(e) => {
                      e.preventDefault();
                      setWasLongPress(false);
                      const timer = setTimeout(() => {
                        setWasLongPress(true);
                        setShowReactions(selectedPost.id);
                      }, 500);
                      setLongPressTimer(timer);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        setLongPressTimer(null);
                      }
                      // Não executa se o menu de reações estiver aberto
                      if (showReactions === selectedPost.id) {
                        setWasLongPress(false);
                        return;
                      }
                      // Se não foi long press, executa o clique normal
                      if (!wasLongPress && !showReactions) {
                        handleMainReactionClick(selectedPost, e);
                      }
                      setWasLongPress(false);
                    }}
                    className={`flex items-center gap-2 transition-colors flex-1 justify-center rounded-full px-3 py-1.5 ${
                      primaryReaction[selectedPost?.id]
                        ? 'bg-orange-100 text-orange-500'
                        : 'text-slate-600 hover:text-orange-500'
                    }`}
                  >

                    {(() => {
                      const activeReactions = userReactions[selectedPost?.id] || [];
                      let reactionType = 'pray';
                      
                      if (activeReactions.length > 0) {
                        reactionType = (primaryReaction[selectedPost?.id] && activeReactions.includes(primaryReaction[selectedPost?.id]))
                          ? primaryReaction[selectedPost?.id]
                          : activeReactions[0];
                      }

                      // Calcular total
                      const counts = reactionsCount[selectedPost?.id] || { pray: 0, people: 0, fire: 0 };
                      const total = (counts.pray || 0) + (counts.people || 0) + (counts.fire || 0);
                      const countDisplay = total > 0 ? ` (${total})` : '';

                      if (reactionType === 'people') {
                         return (
                           <>
                             <span className="text-[16px]">🙌</span>
                             <span className="text-[13px] font-normal">Glória{countDisplay}</span>
                           </>
                         );
                      } else if (reactionType === 'fire') {
                         return (
                           <>
                             <span className="text-[16px]">🔥</span>
                             <span className="text-[13px] font-normal">Aleluia{countDisplay}</span>
                           </>
                         );
                      } else {
                         return (
                           <>
                             <span className="text-[16px]">🙏</span>
                             <span className="text-[13px] font-normal">Amém{countDisplay}</span>
                           </>
                         );
                      }
                    })()}
                  </button>
                  <button 
                    onClick={() => {
                      setShowPostDetail(null);
                      setSelectedPost(null);
                      handleOpenComments(selectedPost.id);
                    }}
                    className="flex items-center gap-2 text-slate-600 hover:text-orange-500 transition-colors flex-1 justify-center"
                  >
                    <MessageCircle size={16} />
                    <span className="text-[13px] font-normal">
                      Comentar{commentsCount[selectedPost?.id] > 0 && ` (${commentsCount[selectedPost?.id]})`}
                    </span>
                  </button>
                </div>
              </div>
                </div>
              </div>
          )}

            {/* Modal de Detalhes do Post - Versão Fullscreen */}
            {showPostDetail && selectedPost && (
                  <div className="fixed inset-0 bg-black/90 z-[200] flex flex-col animate-in fade-in duration-300 overflow-y-auto">
                      {/* Header */}
                      <div className="bg-[#12192b] flex items-center justify-between px-4 py-4 sticky top-0 z-10">
                        <h3 className="text-[18px] font-black text-white">Feed da Comunidade</h3>
                        <button
                          onClick={() => {
                            setShowPostDetail(null);
                            setSelectedPost(null);
                            setIsModalFromProfile(false);
                          }}
                          className="p-2"
                        >
                          <X size={20} className="text-white" />
                        </button>
                      </div>

                      {/* Conteúdo do Post Detalhado */}
                      <div className="flex-1 bg-white pt-6 pb-8">
                        {/* Foto em Destaque */}
                        {selectedPost?.photo && (
                          <div className="w-full px-4 mb-6">
                            <div className="relative">
                              <img 
                                src={selectedPost.photo} 
                                alt="Devocional" 
                                className="w-full h-auto object-cover rounded-xl"
                              />
                            </div>
                          </div>
                        )}

                        {/* Informações do Post */}
                        <div className="px-4">
                        {/* Header do Post */}
                        <div className="flex items-start gap-3 mb-4">
                          {selectedPost?.userAvatar ? (
                            <img 
                              src={selectedPost?.userAvatar} 
                              alt={selectedPost?.userName}
                              className="w-11 h-11 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0">
                              {selectedPost?.userName
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900 text-[14px]">{selectedPost?.userName}</h3>
                            <p className="text-[12px] text-slate-500 font-normal mt-0.5">
                              {formatTimeAgo(selectedPost?.date)}
                            </p>
                          </div>
                        </div>

                        {/* VERSÍCULO */}
                        {selectedPost?.scripture && (
                          <div className="mb-4">
                            <div className="flex items-center gap-1 mb-1">
                              <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                              </svg>
                              <span className="text-[13px] font-bold text-orange-500 uppercase tracking-wider">VERSÍCULO</span>
                            </div>
                            <p className="text-[17px] font-bold text-slate-800">{selectedPost?.scripture}</p>
                          </div>
                        )}

                        {/* LIÇÃO APRENDIDA */}
                        {selectedPost?.lesson && (
                          <div className="mb-4">
                            <div className="flex items-center gap-1 mb-1">
                              <Lightbulb size={15} className="text-orange-500" />
                              <span className="text-[12px] font-bold text-orange-500 uppercase tracking-wider">LIÇÃO APRENDIDA</span>
                            </div>
                            <p className="text-[15px] font-normal text-slate-700 leading-relaxed">
                              {selectedPost?.lesson}
                            </p>
                          </div>
                        )}

                        {/* PEDIDO DE ORAÇÃO */}
                        {selectedPost?.prayerRequest && (
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <Heart size={12} className="text-slate-600" />
                              <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">PEDIDO DE ORAÇÃO</span>
                            </div>
                            <p className="text-[13px] font-normal text-slate-700">{selectedPost?.prayerRequest}</p>
                          </div>
                        )}
                        </div>

                        {/* Ações */}
                        <div className="px-4 mt-6 pt-4 border-t border-slate-200 flex items-center justify-between gap-4 relative">
                          {/* Reações flutuantes no modal */}
                          {showReactions === selectedPost?.id && (
                            <div>
                              {/* Overlay para fechar o menu ao clicar fora */}
                              <div 
                                className="fixed inset-0 z-40"
                                onClick={() => setShowReactions(null)}
                              />
                              <div className="absolute bottom-full left-0 mb-2 animate-in zoom-in-95 duration-200 z-50">
                                <div className="bg-white rounded-full p-2 shadow-2xl border border-slate-200 flex items-center gap-2">
                                  <button 
                                    className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!user || !selectedPost) return;
                                      handleReactionClick(selectedPost, 'pray', e);
                                      setShowReactions(null);
                                    }}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (!user || !selectedPost) return;
                                      handleReactionClick(selectedPost, 'pray', e);
                                      setShowReactions(null);
                                    }}
                                  >
                                    <span className="text-xl">🙏</span>
                                  </button>
                                  <button 
                                    className="w-10 h-10 rounded-full border-2 border-yellow-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!user || !selectedPost) return;
                                      handleReactionClick(selectedPost, 'people', e);
                                      setShowReactions(null);
                                    }}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (!user || !selectedPost) return;
                                      handleReactionClick(selectedPost, 'people', e);
                                      setShowReactions(null);
                                    }}
                                  >
                                    <span className="text-xl">🙌</span>
                                  </button>
                                  <button 
                                    className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!user || !selectedPost) return;
                                      handleReactionClick(selectedPost, 'fire', e);
                                      setShowReactions(null);
                                    }}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (!user || !selectedPost) return;
                                      handleReactionClick(selectedPost, 'fire', e);
                                      setShowReactions(null);
                                    }}
                                  >
                                    <span className="text-xl">🔥</span>
                                  </button>
                                </div>
                              </div>
                          </div>
                          )}
                          <button 
                          onClick={(e) => {
                            e.preventDefault();
                            // Não executa se o menu de reações estiver aberto
                            if (showReactions === selectedPost.id) return;
                            if (!user || !selectedPost || wasLongPress) return; // Não executa se foi long press
                            
                            handleMainReactionClick(selectedPost, e);
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setWasLongPress(false);
                            const timer = setTimeout(() => {
                              setWasLongPress(true);
                              setShowReactions(selectedPost.id);
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
                          onTouchStart={(e) => {
                            e.preventDefault();
                            setWasLongPress(false);
                            const timer = setTimeout(() => {
                              setWasLongPress(true);
                              setShowReactions(selectedPost.id);
                            }, 500);
                            setLongPressTimer(timer);
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            if (longPressTimer) {
                              clearTimeout(longPressTimer);
                              setLongPressTimer(null);
                            }
                            // Não executa se o menu de reações estiver aberto
                            if (showReactions === selectedPost.id) {
                              setWasLongPress(false);
                              return;
                            }
                            // Se não foi long press, executa o clique normal
                            if (!wasLongPress && !showReactions) {
                                handleMainReactionClick(selectedPost, e);
                            }
                            setWasLongPress(false);
                          }}
                          className={`flex items-center gap-2 transition-colors flex-1 justify-center rounded-full px-3 py-1.5 ${
                            userReactions[selectedPost?.id]?.includes('pray')
                              ? 'bg-orange-100 text-orange-500'
                              : 'text-slate-600 hover:text-orange-500'
                          }`}
                        >
                          <span className="text-[16px]">🙏</span>
                          <span className="text-[13px] font-normal">
                            Amém{reactionsCount[selectedPost?.id]?.pray > 0 && ` (${reactionsCount[selectedPost?.id].pray})`}
                          </span>
                        </button>
                        <button 
                          onClick={() => {
                            setShowPostDetail(null);
                            setSelectedPost(null);
                            handleOpenComments(selectedPost.id);
                          }}
                          className="flex items-center gap-2 text-slate-600 hover:text-orange-500 transition-colors flex-1 justify-center"
                        >
                          <MessageCircle size={16} />
                          <span className="text-[13px] font-normal">
                            Comentar{commentsCount[selectedPost?.id] > 0 && ` (${commentsCount[selectedPost?.id]})`}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
            )}
             

          {/* Modal de Comentários */}
          {showComments && createPortal(
            <div className="fixed inset-0 bg-black/80 z-[250] flex items-end animate-in fade-in duration-300">
              <div className="w-full bg-white rounded-t-3xl flex flex-col h-[60vh] max-h-[50vh]">
                {/* Header do Modal */}
                <div className="flex items-center justify-between p-4 pb-3 border-b border-slate-200 flex-shrink-0">
                  <h3 className="text-[16px] font-semibold text-slate-900">
                    Comentários {comments?.length > 0 && `(${comments?.length})`}
                  </h3>
                  <button
                    onClick={() => {
                      setShowComments(null);
                      setCommentText('');
                      setComments([]);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={18} className="text-slate-600" />
                  </button>
                </div>

                {/* Conteúdo do Modal com Scroll */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                  {isLoadingComments ? (
                    <div className="text-center py-8">
                      <RefreshCw size={20} className="text-orange-500 animate-spin mx-auto mb-2" />
                      <p className="text-[13px] font-normal text-slate-500">
                        Carregando comentários...
                      </p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle size={36} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-[13px] font-normal text-slate-500">
                        Nenhum comentário ainda. Seja o primeiro a comentar!
                      </p>
                    </div>
                  ) : (
                    comments.map((comment) => {
                      const getInitials = (name: string) => {
                        return name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);
                      };

                      return (
                        <div key={comment.id} className="flex items-start gap-3">
                          {comment.userAvatar ? (
                            <img 
                              src={comment.userAvatar} 
                              alt={comment.userName}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0">
                              {getInitials(comment.userName)}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-[13px] font-semibold text-slate-900">{comment.userName}</h4>
                              <span className="text-[11px] text-slate-500 font-normal">
                                {formatTimeAgo(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-[13px] font-normal text-slate-700 leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input de Comentário */}
                {user && (
                  <div className="border-t border-slate-200 p-4 flex-shrink-0">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 relative">
                        <textarea
                          value={commentText}
                          onChange={(e) => {
                            if (e.target.value.length <= 500) {
                              setCommentText(e.target.value);
                            }
                          }}
                          placeholder="Escreva um comentário..."
                          className="w-full px-3 py-2 pr-14 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-normal text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 resize-none"
                          rows={2}
                        />
                        <span className="absolute bottom-2 right-3 text-[11px] text-slate-400 font-normal">
                          {commentText.length}/500
                        </span>
                      </div>
                      <button
                        onClick={handleSubmitComment}
                        disabled={!commentText.trim() || isLoadingComments}
                        className="p-2.5 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
                {!user && (
                  <div className="border-t border-slate-200 p-4 text-center flex-shrink-0">
                    <p className="text-[12px] font-normal text-slate-500">
                      Faça login para comentar
                    </p>
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
          </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-500 px-4 pt-2 pb-8">
              {isLoadingProfile || !currentUser ? (
                <div className="space-y-5">
                  {/* Skeleton Card de Perfil */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 mb-5 shadow-xl">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Skeleton Avatar */}
                      <div className="w-16 h-16 rounded-full bg-slate-700 animate-pulse"></div>
                      <div className="flex-1 space-y-3">
                        {/* Skeleton Nome */}
                        <div className="h-5 bg-slate-700 rounded-lg w-3/4 animate-pulse"></div>
                        {/* Skeleton Informações */}
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-700 rounded w-2/3 animate-pulse"></div>
                          <div className="h-4 bg-slate-700 rounded w-1/2 animate-pulse"></div>
                          <div className="h-4 bg-slate-700 rounded w-2/5 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    {/* Skeleton Botão */}
                    <div className="h-10 bg-slate-700 rounded-full w-full animate-pulse"></div>
                  </div>

                  {/* Skeleton Card de Estatísticas */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 mb-5 shadow-xl">
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="text-center space-y-3">
                          <div className="w-6 h-6 bg-slate-700 rounded mx-auto animate-pulse"></div>
                          <div className="h-3 bg-slate-700 rounded w-full animate-pulse"></div>
                          <div className="h-8 bg-slate-700 rounded w-2/3 mx-auto animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skeleton MEUS DEVOCIONAIS */}
                  <div className="mb-5">
                    <div className="h-4 bg-slate-300 rounded w-1/3 mb-3 animate-pulse"></div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-[110px] w-[130px] bg-slate-300 rounded-2xl animate-pulse flex-shrink-0"></div>
                      ))}
                    </div>
                  </div>

                  {/* Skeleton Gerenciar Eventos */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-700 rounded-xl animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-700 rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-slate-700 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="w-5 h-5 bg-slate-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <React.Fragment>
                  {/* Card de Perfil */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 mb-5 shadow-xl">
                    <div className="flex items-start gap-4 mb-4">
                      {/* Foto do perfil - clicável para abrir modal */}
                      <button 
                        onClick={() => setShowProfilePhotoModal(true)}
                        className="flex-shrink-0 focus:outline-none active:scale-95 transition-transform"
                      >
                        {currentUser.avatar ? (
                          <img 
                            src={currentUser.avatar} 
                            className="w-16 h-16 rounded-full object-cover" 
                            alt={currentUser.name} 
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-orange-400 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                              {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </button>
                      <div className="flex-1">
                        <button 
                          onClick={() => setIsProfileEditOpen(true)}
                          className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity active:scale-95"
                        >
                          <h3 className="text-lg font-bold text-white">{currentUser.name}</h3>
                          <Edit3 size={16} className="text-slate-400" />
                        </button>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Calendar size={16} className="text-orange-400" />
                            <span>
                              {currentUser.birthday 
                                ? new Date(currentUser.birthday + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                                : 'Não informado'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Building2 size={16} className="text-orange-400" />
                            <span>{currentUser.congregation || 'Não informado'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Heart size={16} className="text-orange-400" />
                            <span>{currentUser.civilStatus || 'Não informado'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        await signOut();
                      }}
                      className="w-full bg-white rounded-full py-2 px-4 flex items-center justify-center gap-2 text-orange-500 font-semibold mt-4 hover:bg-slate-50 transition-colors mb-5"
                    >
                      <LogOut size={18} />
                      <span>Sair</span>
                    </button>
                  </div>

                  {/* Card de Estatísticas */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 mb-5 shadow-xl">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <Flame size={24} className="text-orange-500 mx-auto mb-6" />
                        <div className="text-xs text-white font-bold mb-2 uppercase">MAIOR SEQUÊNCIA</div>
                        <div className="text-2xl font-bold text-white">{currentUser?.maxStreak}</div>
                      </div>
                      <div className="text-center">
                        <Calendar size={22} className="text-orange-500 mx-auto mb-6" />
                        <div className="text-xs text-white font-bold mb-2 uppercase">DEVOCIONAIS DIÁRIOS</div>
                        <div className="text-2xl font-bold text-white">{userDevotionals?.length}</div>
                      </div>
                      <div className="text-center">
                        <Flag size={22} className="text-orange-500 mx-auto mb-6" />
                        <div className="text-xs text-white font-bold mb-2 uppercase">CICLOS</div>
                        <div className="text-2xl font-bold text-white">0</div>
                      </div>
                    </div>
                  </div>

                  {/* MEUS DEVOCIONAIS */}
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-black text-opacity-70 mb-3 uppercase tracking-wide">MEUS DEVOCIONAIS</h3>
                {userDevotionals.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center">
                    <BookOpen size={40} className="text-slate-300 mb-3" />
                    <p className="text-slate-500 text-sm font-medium text-center mb-1">
                      Você ainda não tem devocionais postados
                    </p>
                    <p className="text-slate-400 text-xs text-center mb-4">
                      Comece a compartilhar seus devocionais diários
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('home');
                        setShowNewCheckIn(true);
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 transition-colors shadow-md w-full max-w-[280px] justify-center"
                    >
                      <span className="text-sm">Criar meu primeiro devocional</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 mb-1 overflow-x-hidden pb-2">
                      {userDevotionals.slice(0, 3).map((devotional, index) => {
                        const colors = ['bg-orange-500', 'bg-purple-500', 'bg-slate-700'];
                        const color = colors[index % colors.length];
                        
                        const formatScripture = (scripture: string): string => {
                          const match = scripture.match(/(Jó|Job)\s*(\d+)[-\s]*(\d+)/i);
                          if (match) {
                            return `${match[1]} ${match[2]}-${match[3]}`;
                          }
                          return scripture.substring(0, 15);
                        };

                        return (
                          <button
                            key={devotional.id}
                            onClick={() => {
                              setSelectedDevotional(devotional);
                              setShowDevotionalDetail(true);
                              setIsModalFromProfile(true); // Marcar que veio do perfil
                            }}
                            className={`${color} rounded-2xl px-5 py-4 min-w-[130px] h-[110px] flex-shrink-0 relative overflow-hidden flex items-center justify-center active:opacity-90 transition-opacity`}
                          >
                            {devotional.photo ? (
                              <>
                                <img
                                  src={devotional.photo}
                                  alt=""
                                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                                />
                                <p className="text-white font-bold text-base relative z-10">
                                  {formatScripture(devotional.scripture)}
                                </p>
                              </>
                            ) : (
                              <p className="text-white font-bold text-base">
                                {formatScripture(devotional.scripture)}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {userDevotionals.length > 0 && (
                      <div className="flex justify-end">
                        <button 
                          onClick={() => setShowMyDevotionals(true)}
                          className="text-orange-500 text-[12px] font-semibold flex items-center gap-1 border border-orange-500 rounded-full px-2 py-1 border-opacity-25"
                        >
                          Ver mais <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
                  </div>

                  {/* Gerenciar Eventos */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                          <Settings size={20} className="text-orange-500" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white mb-1">Gerenciar Eventos</h4>
                          <p className="text-xs text-slate-400">Criar e editar eventos</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-400" />
                    </div>
                  </div>
                </React.Fragment>
              )}
            </div>
          )}

      </Layout>

      {/* Modal do Calendário - Renderizado fora do Layout para evitar problemas de z-index */}
      {user && (
        <CalendarModal
          isOpen={showCalendar}
          onClose={() => setShowCalendar(false)}
          devotionalDates={userDevotionals.map(devotional => new Date(devotional.date))}
          selectedDate={selectedCalendarDate}
          onDateSelect={(date) => {
            setSelectedCalendarDate(date);
            // Aqui você pode adicionar lógica adicional quando uma data é selecionada
          }}
          onDevotionalClick={(date) => {
            // Buscar o devocional da data clicada
            const devotional = userDevotionals.find(dev => {
              const devDate = new Date(dev.date);
              return format(devDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
            });
            
            if (devotional) {
              setSelectedDevotional(devotional);
              setShowDevotionalDetail(true);
              // Não fechar o calendário, manter aberto
            }
          }}
        />
      )}

      {/* Modal de Detalhes do Devocional */}
      {selectedDevotional && (
        <DevotionalDetailModal
          devotional={selectedDevotional}
          isOpen={showDevotionalDetail}
          onClose={() => {
            setShowDevotionalDetail(false);
            setSelectedDevotional(null);
            // Só voltar para o calendário se não veio do perfil
            if (!isModalFromProfile) {
              setShowCalendar(true);
            } else {
              setIsModalFromProfile(false);
            }
          }}
        />
      )}

      {/* Modal de Perfil de Usuário */}
      <UserProfileModal 
        userId={selectedUserProfileId}
        isOpen={showUserProfileModal}
        onClose={() => {
          setShowUserProfileModal(false);
          setSelectedUserProfileId(null);
        }}
        onUserUpdated={(userId, updates) => {
          if (updates.role) {
            setPosts(prev => prev.map(post => 
              post.userId === userId ? { ...post, userRole: updates.role } : post
            ));
            setUserDevotionals(prev => prev.map(post => 
              post.userId === userId ? { ...post, userRole: updates.role } : post
            ));
            
            // Atualizar currentUser se for o próprio usuário sendo editado
            if (currentUser && currentUser.id === userId && updates.role) {
              setCurrentUser(prev => prev ? { ...prev, role: updates.role! } : null);
            }
          }
        }}
      />

      {/* Modal de Visualização da Foto do Perfil */}
      {showProfilePhotoModal && currentUser && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowProfilePhotoModal(false)}
        >
          {/* Overlay com blur */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Botão X para fechar - fixo no canto superior direito */}
          <button
            onClick={() => setShowProfilePhotoModal(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all z-20 active:scale-95"
          >
            <X size={22} className="text-white" strokeWidth={2.5} />
          </button>
          
          {/* Container do modal */}
          <div 
            className="relative z-10 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Foto ou Inicial ampliada */}
            <div className="bg-white rounded-3xl p-2 shadow-2xl">
              {currentUser.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  className="w-full h-auto rounded-2xl object-cover" 
                  alt={currentUser.name}
                  style={{ maxHeight: '70vh' }}
                />
              ) : (
                <div className="w-full aspect-square rounded-2xl bg-orange-400 flex items-center justify-center">
                  <span className="text-white text-9xl font-bold">
                    {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {appToast && (
        <Toast
          message={appToast.message}
          type={appToast.type}
          icon={appToast.icon}
          onClose={() => setAppToast(null)}
        />
      )}
      
      {/* Reaction Effects Portal */}
      {reactionEffects.map(effect => (
        <ReactionEffect
          key={effect.id}
          x={effect.x}
          y={effect.y}
          type={effect.type}
          onComplete={() => {
            setReactionEffects(prev => prev.filter(e => e.id !== effect.id));
          }}
        />
      ))}

    </div>
  );
};

export default App;

