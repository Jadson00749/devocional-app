-- =====================================================
-- MIGRAÇÃO 002: Criar tabela de posts/devocionais
-- =====================================================
-- Descrição: Tabela para armazenar devocionais postados pelos usuários
-- Autor: Sistema Geração Life
-- Data: 2025-01-XX
-- =====================================================

-- Criar enum para tema do devocional
CREATE TYPE public.devotional_theme AS ENUM (
  'Normal',
  'Frase do Devocional',
  'Música do Dia',
  'Vitória da Semana',
  'O Que Deus Construiu'
);

-- Criar tabela de posts/devocionais
CREATE TABLE IF NOT EXISTS public.devotional_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scripture TEXT NOT NULL,
  lesson TEXT NOT NULL,
  prayer_request TEXT,
  photo_url TEXT,
  video_url TEXT,
  extra_content TEXT,
  theme public.devotional_theme DEFAULT 'Normal' NOT NULL,
  has_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints de validação
  CONSTRAINT scripture_not_empty CHECK (LENGTH(TRIM(scripture)) > 0),
  CONSTRAINT lesson_not_empty CHECK (LENGTH(TRIM(lesson)) > 0),
  CONSTRAINT prayer_request_max_length CHECK (prayer_request IS NULL OR LENGTH(prayer_request) <= 500)
);

-- Comentários nas colunas
COMMENT ON TABLE public.devotional_posts IS 'Posts/devocionais dos usuários';
COMMENT ON COLUMN public.devotional_posts.id IS 'ID único do post';
COMMENT ON COLUMN public.devotional_posts.user_id IS 'ID do usuário que criou o post';
COMMENT ON COLUMN public.devotional_posts.scripture IS 'Versículo bíblico';
COMMENT ON COLUMN public.devotional_posts.lesson IS 'Lição aprendida';
COMMENT ON COLUMN public.devotional_posts.prayer_request IS 'Pedido de oração';
COMMENT ON COLUMN public.devotional_posts.photo_url IS 'URL da foto do devocional';
COMMENT ON COLUMN public.devotional_posts.video_url IS 'URL do vídeo do devocional';
COMMENT ON COLUMN public.devotional_posts.theme IS 'Tema do devocional';
COMMENT ON COLUMN public.devotional_posts.has_read IS 'Se o usuário já leu o devocional';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_devotional_posts_user_id ON public.devotional_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_devotional_posts_created_at ON public.devotional_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devotional_posts_theme ON public.devotional_posts(theme);
CREATE INDEX IF NOT EXISTS idx_devotional_posts_user_created ON public.devotional_posts(user_id, created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.devotional_posts ENABLE ROW LEVEL SECURITY;

-- Política: Todos os usuários autenticados podem ver todos os posts
CREATE POLICY "Posts são visíveis para todos os usuários autenticados"
  ON public.devotional_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuários podem criar seus próprios posts
CREATE POLICY "Usuários podem criar seus próprios posts"
  ON public.devotional_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar apenas seus próprios posts
CREATE POLICY "Usuários podem atualizar seus próprios posts"
  ON public.devotional_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar apenas seus próprios posts
CREATE POLICY "Usuários podem deletar seus próprios posts"
  ON public.devotional_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER set_updated_at_devotional_posts
  BEFORE UPDATE ON public.devotional_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();











