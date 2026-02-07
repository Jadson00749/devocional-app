
import { DevotionalPost, User, UserRole, UserFeedback, FeedbackTracking, FeedbackStats, FeedbackTriggerType, DailyWord, Event, DayTheme } from '../types';
import { supabase } from "../integrations/supabase/client";

const GOOGLE_SHEETS_URL = '';

export const databaseService = {
  // ... existing functions ...

  // Feedback System
  async submitFeedback(
    userId: string,
    rating: number,
    testimonial: string | undefined,
    triggerType: FeedbackTriggerType
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_feedbacks')
        .insert({
          user_id: userId,
          rating,
          testimonial,
          trigger_type: triggerType
        });

      if (error) throw error;
      
      // Update tracking
      await this.updateFeedbackTracking(userId, 'submit');
      
      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
  },

  async getFeedbackTracking(userId: string): Promise<FeedbackTracking | null> {
    try {
      const { data, error } = await supabase
        .from('feedback_tracking')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
      
      return data as FeedbackTracking | null;
    } catch (error) {
      console.error('Error fetching feedback tracking:', error);
      return null;
    }
  },

  async fetchDailyWord(userId?: string): Promise<{ word: DailyWord | null; hasRead: boolean }> {
    try {
      // Usar data local (YYYY-MM-DD) para evitar problemas de fuso horário com UTC
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayLocal = `${year}-${month}-${day}`;

      // Prepare promises for parallel execution
      const wordPromise = supabase
        .from('daily_words')
        .select('*')
        .eq('date', todayLocal)
        .maybeSingle();

      // Only check reading if userId is provided or can be retrieved
      let readPromise: any = null;
      let effectiveUserId = userId;

      if (!effectiveUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        effectiveUserId = user?.id;
      }

      if (effectiveUserId) {
        // Query user_daily_readings joined with daily_words by date
        // This allows checking status without waiting for the word ID first
        readPromise = supabase
          .from('user_daily_readings')
          .select('id, daily_words!inner(date)')
          .eq('user_id', effectiveUserId)
          .eq('daily_words.date', todayLocal)
          .maybeSingle();
      }

      // Execute in parallel
      const [wordResult, readResult] = await Promise.all([
        wordPromise,
        readPromise ? readPromise : Promise.resolve({ data: null })
      ]);

      if (wordResult.error) throw wordResult.error;
      
      const wordData = wordResult.data;
      const hasRead = !!readResult?.data;

      return { word: wordData as DailyWord, hasRead };
    } catch (error) {
      console.error('Error fetching daily word:', error);
      return { word: null, hasRead: false };
    }
  },

  async markDailyWordAsRead(dailyWordId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_daily_readings')
        .insert({
          user_id: user.id,
          daily_word_id: dailyWordId
        });

      if (error) {
        // Ignore unique constraint violation (already read)
        if (error.code === '23505') return true;
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error marking daily word as read:', error);
      return false;
    }
  },

  async updateFeedbackTracking(userId: string, action: 'submit' | 'dismiss'): Promise<boolean> {
    try {
      const current = await this.getFeedbackTracking(userId);
      const now = new Date().toISOString();

      if (!current) {
        // Create new tracking
        const { error } = await supabase
          .from('feedback_tracking')
          .insert({
            user_id: userId,
            last_feedback_date: action === 'submit' ? now : null,
            feedback_count: action === 'submit' ? 1 : 0,
            dismissed_count: action === 'dismiss' ? 1 : 0,
            last_dismissed_date: action === 'dismiss' ? now : null
          });
        if (error) throw error;
      } else {
        // Update existing
        const updates: any = { updated_at: now };
        
        if (action === 'submit') {
          updates.last_feedback_date = now;
          updates.feedback_count = (current.feedback_count || 0) + 1;
          updates.dismissed_count = 0; // Reset dismissed count on success
        } else {
          updates.last_dismissed_date = now;
          updates.dismissed_count = (current.dismissed_count || 0) + 1;
        }

        const { error } = await supabase
          .from('feedback_tracking')
          .update(updates)
          .eq('user_id', userId);
        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error('Error updating feedback tracking:', error);
      return false;
    }
  },

  async fetchAllFeedbacks(filters?: {
    minRating?: number,
    startDate?: Date,
    endDate?: Date,
    congregation?: string
  }): Promise<UserFeedback[]> {
    try {
      let query = supabase
        .from('user_feedbacks')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            congregation
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Client-side filtering for congregation (since it's on joined table)
      // Or we could use !inner join if we want database filtering, but profiles might be null
      let feedbacks = data.map((item: any) => ({
        ...item,
        user_name: item.profiles?.full_name || 'Anônimo',
        user_avatar: item.profiles?.avatar_url,
        user_congregation: item.profiles?.congregation
      }));

      if (filters?.congregation && filters.congregation !== 'Todas') {
        feedbacks = feedbacks.filter((f: any) => f.user_congregation === filters.congregation);
      }

      return feedbacks;
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      return [];
    }
  },

  async getFeedbackStats(): Promise<FeedbackStats> {
    try {
      const { data, error } = await supabase
        .from('user_feedbacks')
        .select('rating, testimonial');

      if (error) throw error;

      const total = data.length;
      if (total === 0) {
        return {
          averageRating: 0,
          totalFeedbacks: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          testimonialCount: 0,
          responseRate: 0 // Would need total active users for real rate, using placeholder
        };
      }

      const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
      const distribution = data.reduce((acc: any, curr) => {
        acc[curr.rating] = (acc[curr.rating] || 0) + 1;
        return acc;
      }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

      const testimonials = data.filter(f => f.testimonial && f.testimonial.trim().length > 0).length;

      return {
        averageRating: Number((sum / total).toFixed(1)),
        totalFeedbacks: total,
        ratingDistribution: distribution,
        testimonialCount: testimonials,
        responseRate: 0 // To be calculated or mocked
      };
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      return {
        averageRating: 0,
        totalFeedbacks: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        testimonialCount: 0,
        responseRate: 0
      };
    }
  },
  async fetchPosts(page: number = 1, limit: number = 10): Promise<DevotionalPost[]> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Buscar TODOS os posts do Supabase (comunidade - todos podem ver todos)
      // Ordenados por data (mais recentes primeiro)
      const { data, error } = await supabase
        .from('devotional_posts')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Erro ao buscar posts:', error);
        console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
        return []; // Retorna array vazio em caso de erro
      }

      if (!data || data.length === 0) {
        return [];
      }


      // Transformar dados do Supabase para o formato DevotionalPost
      // Mostrar TODOS os posts, mesmo sem perfil completo
      const formattedPosts: DevotionalPost[] = data.map((post: any) => {
        // Se profiles for um array (pode acontecer com LEFT JOIN), pegar o primeiro
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
        
        return {
          id: post.id,
          userId: post.user_id,
          userName: profile?.full_name || 'Usuário',
          userAvatar: profile?.avatar_url || '',
          date: post.created_at,
          hasRead: post.has_read,
          scripture: post.scripture,
          lesson: post.lesson,
          prayerRequest: post.prayer_request,
          photo: post.photo_url,
          video: post.video_url,
          extraContent: post.extra_content,
          theme: post.theme as DayTheme,
          userRole: profile?.role,
        };
      });

      return formattedPosts;
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      return []; // Retorna array vazio em caso de erro
    }
  },

  async fetchUserDevotionals(userId: string): Promise<DevotionalPost[]> {
    try {
      const { data, error } = await supabase
        .from('devotional_posts')
        .select(`
          *,
          profiles (
            full_name,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar devocionais do usuário:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transformar dados do Supabase para o formato DevotionalPost
      const formattedPosts: DevotionalPost[] = data.map((post: any) => ({
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
        theme: post.theme as DayTheme,
        userRole: post.profiles?.role,
      }));

      return formattedPosts;
    } catch (error) {
      console.error('Erro ao buscar devocionais do usuário:', error);
      return [];
    }
  },

  async savePost(post: DevotionalPost): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado');
        return false;
      }

      // Inserir post no Supabase
      const { data: insertedData, error } = await supabase
        .from('devotional_posts')
        .insert([
          {
            user_id: user.id,
            scripture: post.scripture,
            lesson: post.lesson,
            prayer_request: post.prayerRequest || null,
            photo_url: post.photo || null,
            video_url: post.video || null,
            extra_content: post.extraContent || null,
            theme: post.theme,
            has_read: post.hasRead,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar post:', error);
        console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao salvar post:', error);
      return false;
    }
  },

  async deletePost(postId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Verificar permissão (apenas admin ou admin_master)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'admin_master'].includes(profile.role)) {
        console.error('Usuário não autorizado a deletar posts');
        return false;
      }

      // Deletar o post (Cascading vai remover comentários e reações automaticamente se configurado no banco)
      const { error } = await supabase
        .from('devotional_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Erro ao deletar post:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      return false;
    }
  },

  async hasDevotionalToday(userId: string): Promise<boolean> {
    try {
      // Pegar data de hoje (início e fim do dia)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Buscar posts do usuário criados hoje
      const { data, error } = await supabase
        .from('devotional_posts')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .limit(1);

      if (error) {
        console.error('Erro ao verificar devocional de hoje:', error);
        return false;
      }

      // Retorna true se encontrou algum post hoje
      return data && data.length > 0;
    } catch (error) {
      console.error('Erro ao verificar devocional de hoje:', error);
      return false;
    }
  },

  async countTodayActiveUsers(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('devotional_posts')
        .select('user_id')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (error) {
        console.error('Erro ao contar usuários ativos hoje:', error);
        return 0;
      }

      const uniqueUsers = new Set(data?.map(p => p.user_id));
      return uniqueUsers.size;
    } catch (error) {
      console.error('Erro ao contar usuários ativos hoje:', error);
      return 0;
    }
  },

  async addDevotionalToday(userId: string, data: { hasRead: boolean; scripture: string; lesson: string; photo?: string }): Promise<boolean> {
    try {
      // Esta função usa o Supabase para salvar o devocional
      // Adaptando para usar a função savePost existente
      const newPost: DevotionalPost = {
        id: `post-${Date.now()}`, // ID será gerado pelo Supabase, este é apenas placeholder
        userId: userId,
        userName: '', // Será buscado do perfil durante a exibição
        userAvatar: '', // Será buscado do perfil durante a exibição
        date: new Date().toISOString(),
        hasRead: data.hasRead,
        scripture: data.scripture,
        lesson: data.lesson,
        theme: DayTheme.NORMAL, // Assumindo tema padrão
        photo: data.photo
      };

      return await this.savePost(newPost);
    } catch (error) {
      console.error('Erro ao adicionar devocional:', error);
      return false;
    }
  },

  async fetchMembers(): Promise<User[]> {
    try {
      // Buscar membros do Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar membros:', error);
        return []; // Retorna array vazio em caso de erro
      }

      if (!data || data.length === 0) {
        return []; // Retorna array vazio se não houver membros
      }

      // Transformar dados do Supabase para o formato User
      const formattedUsers: User[] = data.map((profile: any) => ({
        id: profile.id,
        name: profile.full_name || 'Usuário',
        avatar: profile.avatar_url || '',
        bio: profile.bio || '',
        streak: profile.streak || 0,
        maxStreak: profile.max_streak || 0,
        birthday: profile.birthday || undefined,
        phone: profile.phone || undefined,
        isPhonePublic: profile.is_phone_public || false,
        civilStatus: profile.civil_status || undefined,
        congregation: profile.congregation || undefined,
        role: profile.role || 'user',
      }));

      return formattedUsers;
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      return []; // Retorna array vazio em caso de erro
    }
  },

  async fetchUserProfile(userId: string): Promise<User | null> {
    try {
      // Buscar perfil do usuário
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        return null;
      }

      if (!data) {
        console.warn('Perfil não encontrado para o usuário:', userId);
        return null;
      }

      // Transformar dados do Supabase para o formato User
      const formattedUser: User = {
        id: data.id,
        name: data.full_name || 'Usuário',
        avatar: data.avatar_url || '',
        bio: data.bio || '',
        streak: data.streak || 0,
        maxStreak: data.max_streak || 0,
        birthday: data.birthday || undefined,
        phone: data.phone || undefined,
        isPhonePublic: data.is_phone_public || false,
        civilStatus: data.civil_status || undefined,
        congregation: data.congregation || undefined,
        role: data.role || 'user',
      };

      return formattedUser;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      return null;
    }
  },

  // ========== FUNÇÕES DE COMENTÁRIOS ==========
  
  async fetchComments(postId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar comentários:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transformar dados do Supabase para o formato de comentário
      const formattedComments = data.map((comment: any) => ({
        id: comment.id,
        postId: comment.post_id,
        userId: comment.user_id,
        userName: comment.profiles?.full_name || 'Usuário',
        userAvatar: comment.profiles?.avatar_url || '',
        content: comment.content,
        createdAt: comment.created_at,
      }));

      return formattedComments;
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      return [];
    }
  },

  async fetchCommentsCount(postIds: string[]): Promise<Record<string, number>> {
    try {
      if (!postIds || postIds.length === 0) {
        return {};
      }

      const { data, error } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds);

      if (error) {
        console.error('Erro ao buscar contagem de comentários:', error);
        return {};
      }

      if (!data || data.length === 0) {
        return {};
      }

      // Contar comentários por post
      const counts: Record<string, number> = {};
      data.forEach((comment: any) => {
        counts[comment.post_id] = (counts[comment.post_id] || 0) + 1;
      });

      return counts;
    } catch (error) {
      console.error('Erro ao buscar contagem de comentários:', error);
      return {};
    }
  },

  async createComment(postId: string, content: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado');
        return false;
      }

      // Validar conteúdo
      if (!content.trim() || content.trim().length > 500) {
        console.error('Comentário inválido');
        return false;
      }

      // Inserir comentário no Supabase
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            content: content.trim(),
          },
        ]);

      if (error) {
        console.error('Erro ao criar comentário:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      return false;
    }
  },

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado');
        return false;
      }

      // Verificar se o comentário pertence ao usuário
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .maybeSingle();

      if (fetchError || !comment) {
        console.error('Erro ao buscar comentário:', fetchError);
        return false;
      }

      if (comment.user_id !== user.id) {
        console.error('Usuário não autorizado a deletar este comentário');
        return false;
      }

      // Deletar comentário
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Erro ao deletar comentário:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      return false;
    }
  },

  // ========== REAÇÕES ==========
  
  /**
   * Criar ou remover uma reação em um post (toggle)
   */
  async toggleReaction(postId: string, reactionType: 'pray' | 'people' | 'fire'): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Usuário não autenticado');
        return false;
      }

      // Verificar se o usuário já reagiu com esse tipo (usando maybeSingle para não dar erro quando não encontra)
      const { data: existing, error: fetchError } = await supabase
        .from('reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType)
        .maybeSingle();

      // Se houver erro diferente de "não encontrado", retornar false
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao verificar reação existente:', fetchError);
        return false;
      }

      if (existing) {
        // Se já reagiu, remove a reação (toggle)
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existing.id);

        if (error) {
          console.error('Erro ao remover reação:', error);
          return false;
        }
        return true;
      }

      // Criar nova reação
      const { error } = await supabase
        .from('reactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
        });

      if (error) {
        // Se for erro de constraint única (23505) ou Conflito (409), significa que a reação já existe.
        // Isso pode acontecer se o usuário clicou muito rápido ou se houve um erro de rede anterior.
        // Nesses casos, devemos DELETAR a reação existente para completar o "toggle".
        if (error.code === '23505' || error.message.includes('409') || error.details?.includes('already exists')) {
          console.log('Reação já existe (conflito detectado). Tentando remover...');
          const { error: deleteError } = await supabase
            .from('reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .eq('reaction_type', reactionType);
            
          if (deleteError) {
             console.error('Erro ao resolver conflito de reação (tentativa de remoção falhou):', deleteError);
             return false;
          }
          return true; // Sincronizado: reação removida com sucesso após conflito
        }
        
        console.error('Erro ao criar reação:', error);
        return false;
      }


      return true;
    } catch (error) {
      console.error('Erro ao criar/remover reação:', error);
      return false;
    }
  },

  /**
   * Buscar contagem de reações para múltiplos posts
   */
  async fetchReactionsCount(postIds: string[]): Promise<{ [postId: string]: { pray: number; people: number; fire: number } }> {
    try {
      if (postIds.length === 0) return {};

      const { data, error } = await supabase
        .from('reactions')
        .select('post_id, reaction_type')
        .in('post_id', postIds);

      if (error) {
        console.error('Erro ao buscar contagem de reações:', error);
        return {};
      }

      if (!data || data.length === 0) {
        return {};
      }

      // Agrupar por post_id e reaction_type
      const counts: { [postId: string]: { pray: number; people: number; fire: number } } = {};

      data.forEach((reaction) => {
        const postId = reaction.post_id;
        if (!counts[postId]) {
          counts[postId] = { pray: 0, people: 0, fire: 0 };
        }
        counts[postId][reaction.reaction_type as 'pray' | 'people' | 'fire']++;
      });

      return counts;
    } catch (error) {
      console.error('Erro ao buscar contagem de reações:', error);
      return {};
    }
  },

  /**
   * Verificar quais reações o usuário já fez em múltiplos posts
   */
  async fetchUserReactions(postIds: string[]): Promise<{ [postId: string]: ('pray' | 'people' | 'fire')[] }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || postIds.length === 0) return {};

      const { data, error } = await supabase
        .from('reactions')
        .select('post_id, reaction_type, created_at')
        .eq('user_id', user.id)
        .in('post_id', postIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar reações do usuário:', error);
        return {};
      }

      if (!data || data.length === 0) {
        return {};
      }

      // Agrupar por post_id
      const userReactions: { [postId: string]: ('pray' | 'people' | 'fire')[] } = {};

      data.forEach((reaction) => {
        const postId = reaction.post_id;
        if (!userReactions[postId]) {
          userReactions[postId] = [];
        }
        userReactions[postId].push(reaction.reaction_type as 'pray' | 'people' | 'fire');
      });

      return userReactions;
    } catch (error) {
      console.error('Erro ao buscar reações do usuário:', error);
      return {};
    }
  },

  /**
   * Buscar a reação primária (mais recente) do usuário para cada post
   */
  async fetchUserPrimaryReactions(postIds: string[]): Promise<{ [postId: string]: 'pray' | 'people' | 'fire' }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || postIds.length === 0) return {};

      const { data, error } = await supabase
        .from('reactions')
        .select('post_id, reaction_type, created_at')
        .eq('user_id', user.id)
        .in('post_id', postIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar reações primárias do usuário:', error);
        return {};
      }

      if (!data || data.length === 0) {
        return {};
      }

      // Pegar a reação mais recente para cada post
      const primaryReactions: { [postId: string]: 'pray' | 'people' | 'fire' } = {};
      const seenPosts = new Set<string>();

      data.forEach((reaction) => {
        const postId = reaction.post_id;
        // Como está ordenado por created_at descendente, a primeira reação de cada post é a mais recente
        if (!seenPosts.has(postId)) {
          primaryReactions[postId] = reaction.reaction_type as 'pray' | 'people' | 'fire';
          seenPosts.add(postId);
        }
      });

      return primaryReactions;
    } catch (error) {
      console.error('Erro ao buscar reações primárias do usuário:', error);
      return {};
    }
  },

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    try {
      const supabaseUpdates: any = {};
      
      if (updates.name !== undefined) supabaseUpdates.full_name = updates.name;
      if (updates.avatar !== undefined) supabaseUpdates.avatar_url = updates.avatar;
      if (updates.bio !== undefined) supabaseUpdates.bio = updates.bio;
      if (updates.phone !== undefined) supabaseUpdates.phone = updates.phone;
      if (updates.isPhonePublic !== undefined) supabaseUpdates.is_phone_public = updates.isPhonePublic;
      if (updates.birthday !== undefined) supabaseUpdates.birthday = updates.birthday;
      if (updates.civilStatus !== undefined) supabaseUpdates.civil_status = updates.civilStatus;
      if (updates.congregation !== undefined) supabaseUpdates.congregation = updates.congregation;
      if (updates.role !== undefined) supabaseUpdates.role = updates.role;
      if (updates.streak !== undefined) supabaseUpdates.streak = updates.streak;
      if (updates.maxStreak !== undefined) supabaseUpdates.max_streak = updates.maxStreak;

      const { error } = await supabase
        .from('profiles')
        .update(supabaseUpdates)
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar perfil no Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return false;
    }
  },

  async createEvent(event: Omit<Event, 'id' | 'created_at'>): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }
    return data;
  },

  async updateEvent(eventId: string, event: Partial<Omit<Event, 'id' | 'created_at'>>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .update(event)
        .eq('id', eventId);

      if (error) {
        console.error('Error updating event:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  },

  async fetchEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }
    return data || [];
  },

  async deleteEvent(eventId: string): Promise<boolean> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      return false;
    }
    return true;
  },
  
  async checkEventOverlap(startDate: string, endDate: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .lte('start_date', endDate)
        .gte('end_date', startDate)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking event overlap:', error);
      return false;
    }
  },


};