-- =====================================================
-- MIGRAÇÃO 005: Funções auxiliares e triggers
-- =====================================================
-- Descrição: Funções para atualizar streak e outras operações
-- Autor: Sistema Geração Life
-- Data: 2025-01-XX
-- =====================================================

-- Função para atualizar streak do usuário quando criar um post
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_post_date DATE;
  current_streak INTEGER;
  new_streak INTEGER;
BEGIN
  -- Buscar a data do último post do usuário (antes deste)
  SELECT DATE(created_at) INTO last_post_date
  FROM public.devotional_posts
  WHERE user_id = NEW.user_id
    AND id != NEW.id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Buscar streak atual
  SELECT streak INTO current_streak
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Se não há post anterior ou o último post foi hoje, incrementa streak
  IF last_post_date IS NULL OR last_post_date = CURRENT_DATE THEN
    new_streak := current_streak + 1;
  -- Se o último post foi ontem, continua a sequência
  ELSIF last_post_date = CURRENT_DATE - INTERVAL '1 day' THEN
    new_streak := current_streak + 1;
  -- Se passou mais de um dia, reseta para 1
  ELSE
    new_streak := 1;
  END IF;

  -- Atualizar streak e max_streak
  UPDATE public.profiles
  SET 
    streak = new_streak,
    max_streak = GREATEST(max_streak, new_streak)
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar streak quando criar post
CREATE TRIGGER update_streak_on_post
  AFTER INSERT ON public.devotional_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_streak();

-- Função para resetar streak se usuário não postar por 2 dias
CREATE OR REPLACE FUNCTION public.check_and_reset_streaks()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET streak = 0
  WHERE streak > 0
    AND id NOT IN (
      SELECT DISTINCT user_id
      FROM public.devotional_posts
      WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '1 day'
    )
    AND id IN (
      SELECT DISTINCT user_id
      FROM public.devotional_posts
      WHERE DATE(created_at) < CURRENT_DATE - INTERVAL '1 day'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar posts com informações do usuário (view helper)
CREATE OR REPLACE FUNCTION public.get_posts_with_user_info()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  scripture TEXT,
  lesson TEXT,
  prayer_request TEXT,
  photo_url TEXT,
  video_url TEXT,
  theme TEXT,
  has_read BOOLEAN,
  created_at TIMESTAMPTZ,
  reaction_count BIGINT,
  comment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.id,
    dp.user_id,
    p.full_name as user_name,
    p.avatar_url as user_avatar,
    dp.scripture,
    dp.lesson,
    dp.prayer_request,
    dp.photo_url,
    dp.video_url,
    dp.theme::TEXT,
    dp.has_read,
    dp.created_at,
    COUNT(DISTINCT r.id) as reaction_count,
    COUNT(DISTINCT c.id) as comment_count
  FROM public.devotional_posts dp
  INNER JOIN public.profiles p ON dp.user_id = p.id
  LEFT JOIN public.reactions r ON dp.id = r.post_id
  LEFT JOIN public.comments c ON dp.id = c.post_id
  GROUP BY dp.id, p.full_name, p.avatar_url
  ORDER BY dp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;











