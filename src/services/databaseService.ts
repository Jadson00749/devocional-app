import { DevotionalPost, User, DayTheme } from "@/types";
import { supabase } from "../integrations/supabase/client";

const GOOGLE_SHEETS_URL = '';

export const databaseService = {
  async fetchPosts(): Promise<DevotionalPost[]> {
    try {
      // Buscar TODOS os posts do Supabase (comunidade - todos podem ver todos)
      // Ordenados por data (mais recentes primeiro)
      const { data, error } = await supabase
        .from('devotional_posts')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

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
            avatar_url
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

      // Formatar data de nascimento
      const formatBirthday = (birthday: string | null): string | undefined => {
        if (!birthday) return undefined;
        try {
          const date = new Date(birthday);
          return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          });
        } catch {
          return birthday;
        }
      };

      // Transformar dados do Supabase para o formato User
      const formattedUser: User = {
        id: data.id,
        name: data.full_name || 'Usuário',
        avatar: data.avatar_url || '',
        bio: data.bio || '',
        streak: data.streak || 0,
        maxStreak: data.max_streak || 0,
        birthday: formatBirthday(data.birthday),
        phone: data.phone || undefined,
        isPhonePublic: data.is_phone_public || false,
        civilStatus: data.civil_status || undefined,
        congregation: data.congregation || undefined,
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
        // Se for erro de constraint única, significa que a reação já existe (race condition)
        // Verificar novamente e deletar se existir
        if (error.code === '23505') {
          const { data: existingReaction } = await supabase
            .from('reactions')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .eq('reaction_type', reactionType)
            .maybeSingle();
          
          if (existingReaction) {
            const { error: deleteError } = await supabase
              .from('reactions')
              .delete()
              .eq('id', existingReaction.id);
            
            if (deleteError) {
              console.error('Erro ao remover reação duplicada:', deleteError);
              return false;
            }
            return true;
          }
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
};

