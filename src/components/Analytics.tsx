import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, UserFeedback, FeedbackStats } from '../types';
import { Users, BookOpen, Search, MessageCircle, Filter, Flame, Star, MessageSquare, TrendingUp } from 'lucide-react';

import { databaseService } from '../services/databaseService';
import { supabase } from '../integrations/supabase/client';
import UserProfileModal from './UserProfileModal';

interface AnalyticsProps {
  currentUser: User;
  showFilter: boolean;
  onCloseFilter: () => void;
  onTestFeedback?: () => void;
  feedbackUpdateTrigger?: number;
}

type MemberStatus = 'active' | 'inactive' | 'very_inactive';

interface MemberStats {
  user: User;
  lastPostDate: string | null; // ISO string
  status: MemberStatus;
}

const Analytics: React.FC<AnalyticsProps> = ({ currentUser, showFilter, onCloseFilter, onTestFeedback, feedbackUpdateTrigger = 0 }) => {
  // Helper Component for Avatar
  const SafeAvatar = ({ src, name, className = "w-12 h-12", iconSize = 24, onClick }: { src?: string, name: string, className?: string, iconSize?: number, onClick?: () => void }) => {
    const [error, setError] = useState(false);

    if (!src || error) {
      return (
        <div 
          onClick={onClick}
          className={`${className} rounded-full bg-[#f1590d] flex items-center justify-center text-white border-2 border-white shadow-sm ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
        >
          <Flame size={iconSize} strokeWidth={2} />
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={name}
        onError={() => setError(true)}
        onClick={onClick}
        className={`${className} rounded-full object-cover border-2 border-slate-50 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
      />
    );
  };

  // Members State
  const [members, setMembers] = useState<MemberStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    veryInactive: 0
  });

  // Profile Modal State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
  };

  // Feedback State
  const [activeTab, setActiveTab] = useState<'members' | 'feedbacks'>('members');
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<{
    minRating: number;
    period: '7d' | '30d' | '90d' | 'all';
  }>({
    minRating: 0,
    period: 'all'
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [currentUser.congregation, currentUser.role]);

  const fetchAnalyticsData = async () => {
    if (!currentUser.congregation && currentUser.role !== 'admin_master') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // 1. Fetch profiles based on role
      let query = supabase
        .from('profiles')
        .select('*');

      // Filter by congregation only if NOT admin_master
      if (currentUser.role !== 'admin_master') {
        query = query.eq('congregation', currentUser.congregation);
      }

      const { data: profiles, error: profilesError } = await query.order('full_name');

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setMembers([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch last post date for each user
      // We'll use a slightly inefficient but simple approach: fetch all posts by these users and group in memory
      // Or better: use a specialized RPC query if we had one, but strict frontend query is safer for now.
      const userIds = profiles.map(p => p.id);
      
      // Fetch latest post for each user
      // This is tricky with basic supabase select. 
      // Instead, let's fetch ALL posts for these users, ordenado, but limited per user is hard.
      // Let's fetch the most recent post for the whole congregation group in one go? 
      // Or just fetch all posts from the last 30 days for these users to calculate status.
      // If no post in last 30 days => very inactive.
      
      const { data: posts, error: postsError } = await supabase
        .from('devotional_posts')
        .select('user_id, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Map user last post
      const lastPostMap = new Map<string, string>();
      if (posts) {
        posts.forEach(post => {
          if (!lastPostMap.has(post.user_id)) {
            lastPostMap.set(post.user_id, post.created_at);
          }
        });
      }

      // 3. Compile MemberStats
      const memberStats: MemberStats[] = profiles.map(profile => {
        const lastDate = lastPostMap.get(profile.id) || null;
        let status: MemberStatus = 'very_inactive';
        
        if (lastDate) {
          const daysDiff = differenceInDays(new Date(), new Date(lastDate));
          if (daysDiff <= 3) {
            status = 'active';
          } else if (daysDiff <= 14) {
            status = 'inactive';
          }
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
      
      // Calculate totals
      setStats({
        total: memberStats.length,
        active: memberStats.filter(m => m.status === 'active').length,
        inactive: memberStats.filter(m => m.status === 'inactive').length,
        veryInactive: memberStats.filter(m => m.status === 'very_inactive').length
      });

      setMembers(memberStats);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeedbackData = async () => {
    setIsLoadingFeedbacks(true);
    try {
      // Calculate date based on filter
      let startDate: Date | undefined;
      const now = new Date();
      if (feedbackFilter.period === '7d') startDate = new Date(now.setDate(now.getDate() - 7));
      if (feedbackFilter.period === '30d') startDate = new Date(now.setDate(now.getDate() - 30));
      if (feedbackFilter.period === '90d') startDate = new Date(now.setDate(now.getDate() - 90));

      const [statsData, feedbacksList] = await Promise.all([
        databaseService.getFeedbackStats(),
        databaseService.fetchAllFeedbacks({
          minRating: feedbackFilter.minRating,
          startDate
        })
      ]);

      setFeedbackStats(statsData);
      setFeedbacks(feedbacksList);
    } catch (error) {
      console.error('Error fetching feedback data:', error);
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'feedbacks') {
      fetchFeedbackData();
    }
  }, [activeTab, feedbackFilter, feedbackUpdateTrigger]);

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusLabel = (status: MemberStatus) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'very_inactive': return 'Muito Inativo';
      default: return '';
    }
  };

  const getStatusColor = (status: MemberStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-yellow-100 text-yellow-700';
      case 'very_inactive': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusBorderColor = (status: MemberStatus) => {
    switch (status) {
      case 'active': return 'border-green-200';
      case 'inactive': return 'border-yellow-200';
      case 'very_inactive': return 'border-red-200';
      default: return 'border-slate-200';
    }
  };

  return (
    <div className="pb-24 pt-2 px-4 bg-slate-50 min-h-screen animate-in fade-in duration-500">
      {/* Tabs Header */}
      {/* Tabs Header - Sticky */}
      {/* Tabs Header - Sticky */}
      <div className="sticky top-0 z-30 bg-slate-50 pt-2 pb-0 mb-6">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all rounded-t-xl relative -mb-px ${
              activeTab === 'members' 
                ? 'bg-[#12192b] text-white' 
                : 'text-slate-500 hover:bg-slate-100 bg-transparent'
            }`}
          >
            <Users size={18} />
            Membros
          </button>
          <button
            onClick={() => setActiveTab('feedbacks')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all rounded-t-xl relative -mb-px ${
              activeTab === 'feedbacks' 
                ? 'bg-[#12192b] text-white' 
                : 'text-slate-500 hover:bg-slate-100 bg-transparent'
            }`}
          >
            <MessageSquare size={18} />
            Feedbacks
          </button>
        </div>
      </div>

      {activeTab === 'members' && (
        <>
          {/* Stats Section */}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b-[2px] border-slate-200 border-opacity-50 pb-3">
              {currentUser?.role === 'admin_master' ? 'Todas as Congregações' : currentUser?.congregation}
            </h3>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Users size={18} />
                <span className="font-medium">Total de Usuários</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-green-500"></span>
                  <span className="text-sm text-slate-600 font-medium">Usuários Ativos</span>
                </div>
                <span className="text-lg font-bold text-green-600">{stats.active}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
                  <span className="text-sm text-slate-600 font-medium">Inativos</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">{stats.inactive}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-red-500"></span>
                  <span className="text-sm text-slate-600 font-medium">Muito Inativos</span>
                </div>
                <span className="text-lg font-bold text-red-600">{stats.veryInactive}</span>
              </div>
            </div>
          </div>

          {/* Members List Header */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              USUÁRIOS ({filteredMembers.length})
            </h2>
             {/* Simple Filter/Search toggle could go here */}
          </div>

          {/* Members List */}
          <div className="space-y-3">
            {isLoading ? (
               <div className="text-center py-10 text-slate-400">Carregando dados...</div>
            ) : filteredMembers.map((member) => (
              <div key={member.user.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col gap-4">
                {/* Top Row: Profile & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <SafeAvatar 
                      src={member.user.avatar} 
                      name={member.user.name} 
                      onClick={() => handleUserClick(member.user.id)}
                    />
                    
                    <div>
                      <h4 className="font-bold text-slate-900 text-[15px] leading-tight">{member.user.name}</h4>
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">
                        {member.user.congregation}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-3 py-2 rounded-md border ${getStatusBorderColor(member.status)} ${getStatusColor(member.status)}`}>
                    {getStatusLabel(member.status)}
                  </span>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 w-full" />

                {/* Bottom Row: Activity & Action */}
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-500">
                    Última atividade: <strong className="font-medium text-slate-700">
                      {member.lastPostDate 
                        ? formatDistanceToNow(new Date(member.lastPostDate), { addSuffix: true, locale: ptBR }) 
                        : 'Nunca fez check-in'}
                    </strong>
                  </span>

                  {member.user.phone && (
                    <a 
                      href={`https://wa.me/55${member.user.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm hover:bg-green-600 active:scale-95 transition-all"
                    >
                      <MessageCircle size={18} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}


      {activeTab === 'feedbacks' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Feedback Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold uppercase">Média</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-900">{feedbackStats?.averageRating || '0.0'}</span>
                <span className="text-xs text-slate-400 font-medium mb-1">/ 5.0</span>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <MessageSquare size={16} />
                <span className="text-xs font-bold uppercase">Total</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-900">{feedbackStats?.totalFeedbacks || 0}</span>
                <span className="text-xs text-slate-400 font-medium mb-1">feedbacks</span>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Distribuição de Avaliações</h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = feedbackStats?.ratingDistribution[stars as 1|2|3|4|5] || 0;
                const percentage = feedbackStats?.totalFeedbacks 
                  ? (count / feedbackStats.totalFeedbacks) * 100 
                  : 0;
                
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12 flex-shrink-0">
                      <span className="text-sm font-bold text-slate-700">{stars}</span>
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right font-medium">{Math.round(percentage)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['all', '7d', '30d', '90d'].map((period) => (
              <button
                key={period}
                onClick={() => setFeedbackFilter(prev => ({ ...prev, period: period as any }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  feedbackFilter.period === period
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {period === 'all' && 'Todo período'}
                {period === '7d' && 'Últimos 7 dias'}
                {period === '30d' && 'Últimos 30 dias'}
                {period === '90d' && 'Últimos 90 dias'}
              </button>
            ))}
          </div>

          {/* Feedbacks List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Feedbacks Recentes
            </h3>
            
            {isLoadingFeedbacks ? (
              <div className="text-center py-10 text-slate-400">Carregando feedbacks...</div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">Nenhum feedback encontrado neste período.</p>
              </div>
            ) : (
              feedbacks.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <SafeAvatar 
                        src={item.user_avatar} 
                        name={item.user_name || 'Usuário'} 
                        className="w-10 h-10" 
                        iconSize={18}
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.user_name}</h4>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              size={10} 
                              className={s <= item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>

                  {item.testimonial && (
                    <div className="bg-slate-50 p-3 rounded-lg mb-2">
                       <p className="text-sm text-slate-700 italic">"{item.testimonial}"</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
                      {item.user_congregation || 'Sem congregação'}
                    </span>
                    {item.trigger_type && (
                      <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                        {item.trigger_type === '7_days' ? '7 dias' : '30 dias'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {onTestFeedback && (
             <div className="flex justify-center pt-8 pb-4">
                <button 
                  onClick={onTestFeedback}
                  className="bg-purple-100 text-purple-700 px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-purple-200 transition-colors shadow-sm"
                >
                  <MessageCircle size={16} /> 
                  Simular Novo Feedback
                </button>
             </div>
          )}
        </div>
      )}

      {/* Filter Modal */}
      {showFilter && (
        <div 
          className="fixed inset-0 bg-black/50 z-[200] flex items-end justify-center"
          onClick={onCloseFilter}
        >
          <div 
            className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-slate-700" />
                <h3 className="text-lg font-bold text-slate-900">Filtros</h3>
              </div>
              <button 
                onClick={onCloseFilter}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="text-slate-400 text-2xl leading-none">×</span>
              </button>
            </div>

            {/* Congregation Filter (Disabled) */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Congregação <span className="text-xs text-slate-400 font-normal">
                  ({currentUser.role === 'admin_master' ? 'Todas as Congregações' : `Apenas ${currentUser.congregation}`})
                </span>
              </label>
              <div className="relative">
                <select 
                  disabled
                  value={currentUser.congregation || ''}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed appearance-none"
                >
                  <option>Todas as Congregações</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Você tem acesso apenas aos dados da sua congregação.
              </p>
            </div>

            {/* Status Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-slate-600" />
                <label className="block text-sm font-bold text-slate-700">
                  Status - Membros
                </label>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`w-full px-4 py-3 rounded-2xl text-sm font-bold text-left transition-all border-[3px] active:scale-[0.96] ${
                    statusFilter === 'all'
                      ? 'bg-slate-50 border-slate-400 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Todos
                </button>

                <button
                  onClick={() => setStatusFilter('active')}
                  className={`w-full px-4 py-3 rounded-2xl text-sm font-bold text-left transition-all border-[3px] flex items-center justify-between active:scale-[0.96] ${
                    statusFilter === 'active'
                      ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
                      : 'bg-white border-green-200 text-slate-600 hover:border-green-300'
                  }`}
                >
                  <span>Ativo</span>
                  {statusFilter === 'active' && <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>}
                </button>

                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`w-full px-4 py-3 rounded-2xl text-sm font-bold text-left transition-all border-[3px] flex items-center justify-between active:scale-[0.96] ${
                    statusFilter === 'inactive'
                      ? 'bg-yellow-50 border-yellow-400 text-yellow-700 shadow-sm'
                      : 'bg-white border-yellow-200 text-slate-600 hover:border-yellow-300'
                  }`}
                >
                  <span>Inativo</span>
                  {statusFilter === 'inactive' && <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>}
                </button>

                <button
                  onClick={() => setStatusFilter('very_inactive')}
                  className={`w-full px-4 py-3 rounded-2xl text-sm font-bold text-left transition-all border-[3px] flex items-center justify-between active:scale-[0.96] ${
                    statusFilter === 'very_inactive'
                      ? 'bg-red-50 border-red-400 text-red-700 shadow-sm'
                      : 'bg-white border-red-200 text-slate-600 hover:border-red-300'
                  }`}
                >
                  <span>Muito Inativo</span>
                  {statusFilter === 'very_inactive' && <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        userId={selectedUserId}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedUserId(null);
        }}
      />
    </div>
  );
};

export default Analytics;
