
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import FeedPostDetailModal from './components/FeedPostDetailModal';
import { useAuth } from './contexts/AuthContext';
import { DayTheme, DevotionalPost, DailyWord, UserFeedback, FeedbackStats, User } from './types';
import { geminiService } from './services/geminiService';
import { databaseService } from './services/databaseService';
import { calculateUserStreak } from './utils/streakUtils';
import { isMobileDevice } from './hooks/use-mobile';
import {
  Flame,
  MessageCircle,
  X,
  Send,
  Search,
  BookOpen,
  Settings,
  ChevronRight,
  Edit3,
  Calendar,
  Building2,
  Heart,
  LogOut,
  ArrowRight,
  BadgeCheck,
  Lightbulb,
  HeartHandshake,
  Flag,
  Users as UsersIcon,
  Check,
  RefreshCw,
  PartyPopper,
  MoreVertical
} from 'lucide-react';
import { formatTimeAgo } from './utils/formatTime';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from './integrations/supabase/client';
import Toast, { ToastType } from './components/Toast';
import FeedbackModal from './components/FeedbackModal';
import DevotionalSuccessModal from './components/DevotionalSuccessModal';
import EventManagerModal from './components/EventManagerModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import DailyWordModal from './components/DailyWordModal';
import ProfileCompletionModal from './components/ProfileCompletionModal';
import ProfilePhotoDetailModal from './components/ProfilePhotoDetailModal';
import { useFeedbackTrigger } from './hooks/useFeedbackTrigger';

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

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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
  const [dailyWord, setDailyWord] = useState<DailyWord | null>(null);
  const [isLoadingDailyWord, setIsLoadingDailyWord] = useState<boolean>(true);
  
  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const observer = useRef<IntersectionObserver | null>(null);
  
  // Feedback System Hook
  const { isOpen: isFeedbackOpen, triggerType: feedbackTriggerType, handleClose: handleFeedbackClose, forceOpen } = useFeedbackTrigger(currentUser);
  const [feedbackUpdateTrigger, setFeedbackUpdateTrigger] = useState(0);
  // States related to Daily Word (new features)
  const [isDailyWordRead, setIsDailyWordRead] = useState(false);
  const [showDailyWordModal, setShowDailyWordModal] = useState(false);

  const [showEventManager, setShowEventManager] = useState(false);
  
  // Post Deletion State (Admin)
  const [postToDelete, setPostToDelete] = useState<DevotionalPost | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [showProfileCompletionPrompt, setShowProfileCompletionPrompt] = useState(false);

  // Analytics State (para Cache Global)
  const [analyticsMembers, setAnalyticsMembers] = useState<any[]>([]);
  const [analyticsStats, setAnalyticsStats] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Load More Posts Function
  const loadMorePosts = React.useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const newPosts = await databaseService.fetchPosts(nextPage, 10);
      
      if (newPosts.length < 10) {
        setHasMore(false);
      }
      
      if (newPosts.length > 0) {
        setPosts(prev => {
          // Filtrar duplicados por garantia
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
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
  }, [page, hasMore, isLoadingMore]);

  const lastPostElementRef = React.useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore || isLoadingPosts) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMore) {
        loadMorePosts();
      }
    }, { threshold: 0.1, rootMargin: '100px' });
    
    if (node) observer.current.observe(node);
  }, [isLoadingMore, isLoadingPosts, hasMore, loadMorePosts, page]);

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
    const switchProcessingKey = `${post.id}-switch`;
    
    // Não permite executar se já houver QUALQUER processamento ativo para este post
    if (reactionProcessing.has(processingKey) || reactionProcessing.has(switchProcessingKey)) {
      return;
    }
    
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

  // Effect para carregar posts iniciais quando mudar para 'group'
  useEffect(() => {
    if (isMobile === true && activeTab === 'group') {
      // CACHE: Só carrega se não tiver posts
      if (posts.length > 0) {
        setIsLoadingPosts(false);
        return;
      }

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
  }, [isMobile, activeTab]);

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
            
            // Verificar se o perfil está completo (campos cruciais: exceto bio e avatar)
            const isComplete = !!(
              profile.name?.trim() && 
              profile.birthday && 
              profile.phone && 
              profile.civilStatus && 
              profile.congregation
            );
            if (!isComplete) {
              setShowProfileCompletionPrompt(true);
            }
          } else {
            // Se não encontrar perfil, criar um básico e marcar como incompleto
            const baseUser: User = {
              id: user.id,
              name: user.email?.split('@')[0] || 'Usuário',
              avatar: '',
              bio: '',
              streak: 0,
              maxStreak: 0,
              birthday: undefined,
              congregation: undefined,
              civilStatus: undefined,
              role: 'user'
            };
            setCurrentUser(baseUser);
            setShowProfileCompletionPrompt(true);
          }
        } catch (error) {
          console.error('Erro ao buscar perfil do usuário:', error);
          setShowProfileCompletionPrompt(true);
        } finally {
          setIsLoadingProfile(false);
        }
      };
      fetchProfile();
    } else {
      setCurrentUser(null);
      setIsLoadingProfile(false);
      setShowProfileCompletionPrompt(false);
    }
  }, [user]);

  const fetchUserDataAndStreak = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await databaseService.fetchUserProfile(user.id);
      const userPosts = await databaseService.fetchUserDevotionals(user.id);
      setUserDevotionals(userPosts);

      if (profile) {
        const { currentStreak, maxStreak } = calculateUserStreak(userPosts);
        if (currentStreak !== profile.streak || maxStreak !== profile.maxStreak) {
          await databaseService.updateUserProfile(user.id, {
            streak: currentStreak,
            maxStreak: maxStreak
          });
          setCurrentUser({ ...profile, streak: currentStreak, maxStreak: maxStreak });
        } else {
          setCurrentUser(profile);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar streak:', error);
    }
  }, [user]);

  // Buscar devocionais do usuário quando a aba de perfil for ativada
  useEffect(() => {
    if ((activeTab === 'profile' || showCalendar) && user) {
      // CACHE: Só busca se for a primeira vez ou se for refresh forçado
      if (userDevotionals.length > 0 && activeTab === 'profile' && !showCalendar && !isRefreshing) {
        return;
      }
      fetchUserDataAndStreak();
    }
  }, [activeTab, user, showCalendar, fetchUserDataAndStreak, isRefreshing]);

  const fetchTotalDevotionals = useCallback(async () => {
    if (!user) return;
    try {
      const devotionals = await databaseService.fetchUserDevotionals(user.id);
      setTotalDevotionals(devotionals.length);
    } catch (error) {
      console.error('Erro ao buscar total de devocionais:', error);
    }
  }, [user]);

  const fetchTodayStats = useCallback(async () => {
    const count = await databaseService.countTodayActiveUsers();
    setTodayCount(count);
  }, []);

  const fetchDailyWordLogic = useCallback(async () => {
    if (!user) return;
    setIsLoadingDailyWord(true);
    try {
      const { word, hasRead } = await databaseService.fetchDailyWord(user.id);
      if (word) {
        setDailyWord(word);
        setIsDailyWordRead(hasRead);
      }
    } catch (error) {
      console.error('Erro ao buscar palavra do dia:', error);
    } finally {
      setIsLoadingDailyWord(false);
    }
  }, [user]);

  // Buscar dados da home quando necessário
  useEffect(() => {
    if (activeTab === 'home' && user) {
      // Data atual local para comparação
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Cache Guards - Só busca se não tiver nada (primeiro carregamento)
      // O refresh forçado é tratado diretamente no triggerRefresh
      if (totalDevotionals === 0) fetchTotalDevotionals();
      if (todayCount === 0) fetchTodayStats();
      
      const shouldFetchWord = !dailyWord || dailyWord.date !== todayStr;
      if (shouldFetchWord) fetchDailyWordLogic();
    }
  }, [activeTab, user, fetchTotalDevotionals, fetchTodayStats, fetchDailyWordLogic, dailyWord, totalDevotionals, todayCount]);

  // Analytics Fetchers (para Cache Global)
  const fetchAnalyticsData = useCallback(async () => {
    if (!currentUser?.congregation && currentUser?.role !== 'admin_master') return;
    setIsLoadingAnalytics(true);
    try {
      let query = supabase.from('profiles').select('*');
      if (currentUser.role !== 'admin_master') {
        query = query.eq('congregation', currentUser.congregation);
      }
      const { data: profiles, error: profilesError } = await query.order('full_name');
      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) {
        setAnalyticsMembers([]);
        setIsLoadingAnalytics(false);
        return;
      }
      const userIds = profiles.map(p => p.id);
      const { data: posts, error: postsError } = await supabase
        .from('devotional_posts')
        .select('user_id, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      const lastPostMap = new Map<string, string>();
      if (posts) {
        posts.forEach(post => {
          if (!lastPostMap.has(post.user_id)) lastPostMap.set(post.user_id, post.created_at);
        });
      }

      const memberStats = profiles.map(profile => {
        const lastDate = lastPostMap.get(profile.id) || null;
        let status: 'active' | 'inactive' | 'very_inactive' = 'very_inactive';
        if (lastDate) {
          const daysDiff = differenceInDays(new Date(), new Date(lastDate));
          if (daysDiff <= 3) status = 'active';
          else if (daysDiff <= 14) status = 'inactive';
        }
        return {
          user: {
            id: profile.id,
            name: profile.full_name || 'Usuário',
            avatar: profile.avatar_url || '',
            bio: profile.bio,
            streak: profile.streak || 0,
            maxStreak: profile.max_streak || 0,
            congregation: profile.congregation,
            phone: profile.phone,
            isPhonePublic: profile.is_phone_public,
            role: profile.role
          },
          lastPostDate: lastDate,
          status
        };
      });
      
      setAnalyticsStats({
        total: memberStats.length,
        active: memberStats.filter(m => m.status === 'active').length,
        inactive: memberStats.filter(m => m.status === 'inactive').length,
        veryInactive: memberStats.filter(m => m.status === 'very_inactive').length
      });
      setAnalyticsMembers(memberStats);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [currentUser?.id, currentUser?.congregation, currentUser?.role]);

  const fetchFeedbackData = useCallback(async () => {
    try {
      const [statsData, feedbacksList] = await Promise.all([
        databaseService.getFeedbackStats(),
        databaseService.fetchAllFeedbacks({
          minRating: 0
        })
      ]);
      setFeedbackStats(statsData);
      setFeedbacks(feedbacksList);
    } catch (error) {
      console.error('Error fetching feedback data:', error);
    }
  }, []);

  // Effect para Analytics
  useEffect(() => {
    if (activeTab === 'analytics' && currentUser) {
      // CACHE: Só busca se não tiver nada
      if (analyticsMembers.length === 0) {
        fetchAnalyticsData();
        fetchFeedbackData();
      }
    }
  }, [activeTab, currentUser, fetchAnalyticsData, fetchFeedbackData]);

  // Função central para Pull-to-Refresh
  const triggerRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    
    // Se for o Feed, recarregar posts reais
    if (activeTab === 'group') {
      try {
        const savedPosts = await databaseService.fetchPosts(1, 10);
        setPosts(savedPosts);
        setPage(1);
        setHasMore(savedPosts.length >= 10);
        
        // Atualizar metadados
        if (savedPosts.length > 0) {
          const postIds = savedPosts.map(post => post.id);
          const [commentCounts, reactionCounts, userReacts, primaryReacts] = await Promise.all([
            databaseService.fetchCommentsCount(postIds),
            databaseService.fetchReactionsCount(postIds),
            databaseService.fetchUserReactions(postIds),
            databaseService.fetchUserPrimaryReactions(postIds),
          ]);
          
          setCommentsCount(commentCounts);
          setReactionsCount(reactionCounts);
          setUserReactions(userReacts);
          setPrimaryReaction(prev => ({ ...prev, ...primaryReacts }));
        }
      } catch (error) {
        console.error('Erro ao atualizar posts:', error);
      }
    } else if (activeTab === 'home') {
      // Refresh focado em buscar novos dados sem zerar o estado (evita piscar/flicker)
      await Promise.all([
        fetchTotalDevotionals(),
        fetchTodayStats(),
        fetchDailyWordLogic()
      ]);
    } else if (activeTab === 'profile') {
      // Forçar re-fetch do perfil e streak
      await Promise.all([
        fetchUserDataAndStreak(),
        fetchTotalDevotionals()
      ]);
    } else if (activeTab === 'analytics') {
      // Limpar cache de analytics
      setAnalyticsMembers([]);
      await Promise.all([
        fetchAnalyticsData(),
        fetchFeedbackData()
      ]);
    }

    setTimeout(() => {
      setIsRefreshing(false);
      setShowRefreshToast(true);

      // Esconde o toast depois de alguns segundos
      setTimeout(() => {
        setShowRefreshToast(false);
      }, 2200);
    }, 1200);
  };

  // Handlers de touch genéricos para home e feed
   const handlePullTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
     // Permitir em todas as abas principais
     if (!['home', 'group', 'profile', 'analytics'].includes(activeTab) || showNewCheckIn || isRefreshing) return;
 
     // Garante que estamos no topo do container que faz scroll (o main do Layout)
     const scrollContainer = document.querySelector('main');
     const isAtTop = (scrollContainer?.scrollTop || 0) <= 0;
 
     if (isAtTop) {
       pullStartY.current = e.touches[0].clientY;
       setIsPulling(true);
       setPullDistance(0);
     }
   };
 
   const handlePullTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
     if (!isPulling || pullStartY.current === null) return;
 
     const currentY = e.touches[0].clientY;
     const diff = currentY - pullStartY.current;
 
     // Apenas se estiver puxando para baixo
     if (diff > 0) {
       // Aplicar resistência (fator de 0.4) para o feedback visual
       const resistedDistance = Math.min(diff * 0.4, 200);
       setPullDistance(resistedDistance);
 
       // Threshold dinâmico: Só ativa se puxar bastante (140px de "distância real" sentida)
       if (resistedDistance > 60) { // 60 de distância resistida = ~150px de movimento real
         setIsPulling(false);
         pullStartY.current = null;
         setPullDistance(0);
         triggerRefresh();
       }
     }
   };
 
   const handlePullTouchEnd = () => {
     setIsPulling(false);
     pullStartY.current = null;
     setPullDistance(0);
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

  // Se for mobile e autenticado, mostra o app normal

  const confirmDeletePost = async () => {
    if (!postToDelete) return;

    setIsDeletingPost(true);
    try {
      const success = await databaseService.deletePost(postToDelete.id);
      if (success) {
        setPosts(prev => prev.filter(p => p.id !== postToDelete.id));
        setUserDevotionals(prev => prev.filter(p => p.id !== postToDelete.id));
        setAppToast({
          message: 'Post excluído com sucesso',
          type: 'success'
        });
        setPostToDelete(null);
      } else {
        setAppToast({
          message: 'Erro ao excluir post',
          type: 'error'
        });
      }
    } catch (error) {
      setAppToast({
        message: 'Erro ao excluir post',
        type: 'error'
      });
    } finally {
      setIsDeletingPost(false);
    }
  };

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
    // Atualizar contagem total sem navegar ainda
    const allPosts = await databaseService.fetchUserDevotionals(currentUser.id);
    setTotalDevotionals(allPosts.length);
    setUserDevotionals(allPosts);
    
    // Mostrar modal de sucesso em vez de toast
    setShowSuccessModal(true);
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
        onTouchStart={handlePullTouchStart}
        onTouchMove={handlePullTouchMove}
        onTouchEnd={handlePullTouchEnd}
      >
        {/* Indicador de atualização (pull-to-refresh) */}
        {isRefreshing && (
          <div className="flex items-center justify-center py-2 text-[12px] text-slate-500 gap-2">
            <RefreshCw size={14} className="animate-spin text-orange-500" />
            <span className="font-medium">Atualizando dados...</span>
          </div>
        )}

        {/* Feedback visual do Pull (opcional, mas ajuda a sentir a resistência) */}
        {!isRefreshing && pullDistance > 10 && (
          <div 
            className="flex items-center justify-center py-2 overflow-hidden transition-all duration-75"
            style={{ height: `${pullDistance}px`, opacity: pullDistance / 60 }}
          >
            <RefreshCw 
              size={18} 
              className="text-orange-500 transition-transform" 
              style={{ transform: `rotate(${pullDistance * 4}deg)` }}
            />
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
                  <div className="mt-5">
                    <Flame size={26} className="text-amber-500" />
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
      <div 
        onClick={() => dailyWord && setShowDailyWordModal(true)}
        className={`rounded-[1.5rem] p-5 shadow-2xl flex items-start gap-4 cursor-pointer transition-all active:scale-[0.98] ${
          isDailyWordRead 
            ? 'bg-white border-2 border-green-200 shadow-[0_2px_10px_-2px_rgba(16,185,129,0.1)]' 
            : 'bg-white border-2 border-orange-200/60'
        }`}
      >
        <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${
           isDailyWordRead 
             ? 'bg-emerald-100/70 shadow-sm' 
             : 'bg-gradient-to-br from-orange-100/70 to-amber-100/70'
        }`}>
          {isDailyWordRead ? (
             <Flame size={20} className="text-emerald-600" />
          ) : (
             <Flame size={20} className="text-orange-600" />
          )}
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wide-custom flex items-center gap-1 ${
               isDailyWordRead ? 'text-emerald-600' : 'text-orange-500'
            }`}>
              PALAVRA DO DIA {isDailyWordRead ? <Lightbulb size={11} className="mb-0.5" /> : '💡'}
            </span>
            {isDailyWordRead ? (
               <Check size={18} className="text-emerald-500" strokeWidth={3} />
            ) : (
               <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
               </svg>
            )}
          </div>
          {isLoadingDailyWord && !dailyWord ? (
            <div className="space-y-3 animate-pulse pt-1">
              <div className="flex gap-2">
                <div className="h-4 bg-slate-100 rounded-full w-24"></div>
                <div className="h-4 bg-slate-100 rounded-md w-full"></div>
              </div>
              <div className="h-4 bg-slate-100 rounded-md w-5/6"></div>
              <div className="h-3 bg-slate-50 rounded-full w-1/2 mt-2"></div>
            </div>
          ) : dailyWord ? (
            <>
              <p className="text-[15px] font-normal text-slate-800 leading-relaxed tracking-tight">
                <span className={`font-bold ${isDailyWordRead ? 'text-slate-800' : 'text-orange-600/90'}`}>
                  {dailyWord.reference}
                </span> – {dailyWord.text}
              </p>
              <p className={`text-[12px] font-normal mt-1 ${isDailyWordRead ? 'text-emerald-600/90' : 'text-orange-600/90'}`}>
                 {isDailyWordRead ? 'Toque para ler completo' : dailyWord.lesson}
              </p>
            </>
          ) : (
            <p className="text-[14px] font-semibold text-slate-400 leading-relaxed tracking-tight">
              A palavra de hoje está sendo preparada...
            </p>
          )}
        </div>
      </div>

      {/* 3. Social Moving Card */}
      <div className="bg-gradient-to-br from-orange-100/90 to-amber-100/70 border-2 border-orange-200/60 rounded-[1.5rem] p-6 flex items-start gap-3 shadow-sm">
        <div className="shrink-0 w-10 h-10 bg-gradient-to-br from-orange-200 to-orange-300 rounded-2xl flex items-center justify-center">
          <UsersIcon size={20} className="text-slate-700" />
        </div>
        <div className="flex-1">
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                <span className="font-bold text-orange-500">{todayCount} {todayCount === 1 ? 'pessoa' : 'pessoas'}</span> {todayCount === 1 ? 'fez' : 'fizeram'} devocional hoje! Faça você também e vamos crescer juntos! 🔥
            </p>
            <div className="flex items-center gap-2 mt-2">
                <Flame size={14} className="text-orange-500 fill-orange-500" />
                <span className="text-xs font-bold text-orange-500">{todayCount} {todayCount === 1 ? 'devocional' : 'devocionais'} hoje</span>
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
            // Mudar para a aba de grupo
            setActiveTab('group');
            // Mostrar modal de sucesso ANIMADO em vez de toast
            setShowSuccessModal(true);
            
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
              
              // Recalcular se o perfil está completo para fechar o prompt obrigatório
              const isComplete = !!(
                updated.name?.trim() && 
                updated.birthday && 
                updated.phone && 
                updated.civilStatus && 
                updated.congregation
              );
              
              if (isComplete) {
                setShowProfileCompletionPrompt(false);
              }
            } else {
              toast.error('Erro ao atualizar perfil.');
            }
          }} 
          isMandatory={showProfileCompletionPrompt}
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
      
      {/* Modal de Conclusão de Perfil (Obrigatório) */}
      <ProfileCompletionModal 
        isOpen={showProfileCompletionPrompt && activeTab !== 'profile'} 
        onCompleteClick={() => {
          setShowProfileCompletionPrompt(false);
          setIsProfileEditOpen(true);
        }}
      />
      
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
        {/* Analytics Modal */}
      {activeTab === 'analytics' && currentUser && (
        <div 
          className="animate-in fade-in duration-500"
          onTouchStart={handlePullTouchStart}
          onTouchMove={handlePullTouchMove}
          onTouchEnd={handlePullTouchEnd}
        >
          {/* Indicador de atualização (pull-to-refresh) */}
          {isRefreshing && (
            <div className="flex items-center justify-center py-2 text-[12px] text-slate-500 gap-2 bg-slate-100">
              <RefreshCw size={14} className="animate-spin text-orange-500" />
              <span className="font-medium">Atualizando insights...</span>
            </div>
          )}

          {/* Feedback visual do Pull */}
          {!isRefreshing && pullDistance > 10 && (
            <div 
              className="flex items-center justify-center py-2 overflow-hidden transition-all duration-75 bg-slate-100"
              style={{ height: `${pullDistance}px`, opacity: pullDistance / 60 }}
            >
              <RefreshCw 
                size={18} 
                className="text-orange-500 transition-transform" 
                style={{ transform: `rotate(${pullDistance * 4}deg)` }}
              />
            </div>
          )}

          <Analytics 
            currentUser={currentUser!} 
            showFilter={showAnalyticsFilter}
            onCloseFilter={() => setShowAnalyticsFilter(false)}
            // Props de Cache (App.tsx)
            members={analyticsMembers}
            stats={analyticsStats}
            feedbacks={feedbacks}
            feedbackStats={feedbackStats}
            isLoading={isLoadingAnalytics}
            onRefresh={() => {
              fetchAnalyticsData();
              fetchFeedbackData();
            }}
            onTestFeedback={currentUser?.role === 'admin_master' ? forceOpen : undefined}
            feedbackUpdateTrigger={feedbackUpdateTrigger}
          />
        </div>
      )}
      {activeTab === 'group' && (
        <div 
          className="space-y-4 animate-in fade-in duration-500 pb-20 pt-2 bg-slate-100 px-4"
          onTouchStart={handlePullTouchStart}
          onTouchMove={handlePullTouchMove}
          onTouchEnd={handlePullTouchEnd}
        >
          {/* Indicador de atualização (pull-to-refresh) */}
          {isRefreshing && (
            <div className="flex items-center justify-center py-2 text-[12px] text-slate-500 gap-2">
              <RefreshCw size={14} className="animate-spin text-orange-500" />
              <span className="font-medium">Atualizando feed...</span>
            </div>
          )}

          {/* Feedback visual do Pull */}
          {!isRefreshing && pullDistance > 10 && (
            <div 
              className="flex items-center justify-center py-2 overflow-hidden transition-all duration-75"
              style={{ height: `${pullDistance}px`, opacity: pullDistance / 60 }}
            >
              <RefreshCw 
                size={18} 
                className="text-orange-500 transition-transform" 
                style={{ transform: `rotate(${pullDistance * 4}deg)` }}
              />
            </div>
          )}
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
                      <div className="flex items-start justify-between gap-2.5 mb-3">
                         <div className="flex items-start gap-2.5 flex-1">
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

                         {/* Admin Menu (Delete) */}
                         {(currentUser?.role === 'admin' || currentUser?.role === 'admin_master') && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id);
                                }}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors self-start"
                              >
                                <MoreVertical size={20} />
                              </button>

                              {/* Dropdown Menu */}
                              {activeMenuPostId === post.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-[5] cursor-default" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuPostId(null);
                                    }}
                                  />
                                  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 z-[10] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPostToDelete(post);
                                        setActiveMenuPostId(null);
                                      }}
                                      className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                    >
                                      <LogOut size={16} className="rotate-180" />
                                      Excluir
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                         )}
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
                          <div className="border-t border-slate-100 pt-2 mt-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <HeartHandshake size={14} className="text-slate-400" />
                              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">PEDIDO DE ORAÇÃO</span>
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!user) return;
                                  handleReactionClick(post, 'pray', e);
                                  setShowReactions(null);
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation();
                                  if (!user) return;
                                  handleReactionClick(post, 'pray', e);
                                  setShowReactions(null);
                                  e.preventDefault(); // Previne click sintético DEPOIS de capturar coordenadas
                                }}
                                title="Amém"
                              >
                                <span className="text-xl">🙏</span>
                              </button>
                              <button 
                                className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!user) return;
                                  handleReactionClick(post, 'people', e);
                                  setShowReactions(null);
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation();
                                  if (!user) return;
                                  handleReactionClick(post, 'people', e);
                                  setShowReactions(null);
                                  e.preventDefault(); // Previne click sintético DEPOIS de capturar coordenadas
                                }}
                                title="Glória"
                              >
                                <span className="text-xl">🙌</span>
                              </button>
                              <button 
                                className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!user) return;
                                  handleReactionClick(post, 'fire', e);
                                  setShowReactions(null);
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation();
                                  if (!user) return;
                                  handleReactionClick(post, 'fire', e);
                                  setShowReactions(null);
                                  e.preventDefault(); // Previne click sintético DEPOIS de capturar coordenadas
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
                <div ref={lastPostElementRef} className="h-10 w-full" />
                {isLoadingMore && (
                  <div className="flex justify-center items-center py-4 gap-2 text-slate-400 text-sm">
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Carregando posts...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal de Detalhes do Post (Portal) */}
          {selectedPost && (
            <FeedPostDetailModal
              isOpen={!!showPostDetail}
              post={selectedPost}
              onClose={() => {
                setShowPostDetail(null);
                setSelectedPost(null);
                setIsModalFromProfile(false);
              }}
              currentUser={user}
              onReactionClick={handleReactionClick}
              onCommentClick={(postId) => {
                setShowPostDetail(null);
                setSelectedPost(null);
                handleOpenComments(postId);
              }}
              reactionsCount={reactionsCount}
              userReactions={userReactions}
              primaryReaction={primaryReaction}
              commentsCount={commentsCount}
            />
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
            <div 
              className="animate-in fade-in duration-500 px-4 pt-2 pb-8"
              onTouchStart={handlePullTouchStart}
              onTouchMove={handlePullTouchMove}
              onTouchEnd={handlePullTouchEnd}
            >
              {/* Indicador de atualização (pull-to-refresh) */}
              {isRefreshing && (
                <div className="flex items-center justify-center py-2 text-[12px] text-slate-500 gap-2">
                  <RefreshCw size={14} className="animate-spin text-orange-500" />
                  <span className="font-medium">Atualizando perfil...</span>
                </div>
              )}

              {/* Feedback visual do Pull */}
              {!isRefreshing && pullDistance > 10 && (
                <div 
                  className="flex items-center justify-center py-2 overflow-hidden transition-all duration-75"
                  style={{ height: `${pullDistance}px`, opacity: pullDistance / 60 }}
                >
                  <RefreshCw 
                    size={18} 
                    className="text-orange-500 transition-transform" 
                    style={{ transform: `rotate(${pullDistance * 4}deg)` }}
                  />
                </div>
              )}
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

                  {/* Gerenciar Eventos - Apenas para ADMIN_MASTER */}
                  {currentUser?.role === 'admin_master' && (
                    <button 
                      onClick={() => setShowEventManager(true)}
                      className="w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 shadow-xl active:scale-[0.98] transition-transform text-left"
                    >
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
                    </button>
                  )}
                </React.Fragment>
              )}
            </div>
          )}

      </Layout>

      {/* Modal de Gerenciamento de Eventos */}
      {currentUser?.role === 'admin_master' && (
        <EventManagerModal
          isOpen={showEventManager}
          onClose={() => setShowEventManager(false)}
        />
      )}

      {/* Delete Post Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={confirmDeletePost}
        title="Excluir Post?"
        description={
          <>
            Tem certeza que deseja excluir o post de <span className="font-bold text-slate-700">{postToDelete?.userName}</span>? Esta ação não pode ser desfeita.
          </>
        }
        isDeleting={isDeletingPost}
      />

      {/* Modal de Leitura da Palavra do Dia */}
      {dailyWord && (
        <DailyWordModal
          isOpen={showDailyWordModal}
          onClose={() => setShowDailyWordModal(false)}
          dailyWord={dailyWord}
          initialHasRead={isDailyWordRead}
          onReadComplete={() => setIsDailyWordRead(true)}
        />
      )}

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
      <ProfilePhotoDetailModal
        isOpen={showProfilePhotoModal}
        onClose={() => setShowProfilePhotoModal(false)}
        photoUrl={currentUser?.avatar || null}
        userName={currentUser?.name || ''}
      />
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

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        triggerType={feedbackTriggerType}
        onClose={(reason) => handleFeedbackClose(reason || 'dismiss')}
        onSubmit={async (rating, testimonial) => {
          if (currentUser) {
            await databaseService.submitFeedback(currentUser.id, rating, testimonial, feedbackTriggerType);
            setFeedbackUpdateTrigger(prev => prev + 1);
          }
        }}
      />

      {/* Devotional Success Modal */}
      <DevotionalSuccessModal 
        isOpen={showSuccessModal}
        currentStreak={totalDevotionals}
        onContinue={() => {
          setShowSuccessModal(false);
          setActiveTab('group');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};

export default App;

