-- =====================================================
-- MIGRAÇÃO 003: Criar tabela de comentários
-- =====================================================
-- Descrição: Tabela para armazenar comentários nos posts
-- Autor: Sistema Geração Life
-- Data: 2025-01-XX
-- =====================================================

-- Criar tabela de comentários
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.devotional_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints de validação
  CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
  CONSTRAINT content_max_length CHECK (LENGTH(content) <= 500)
);

-- Comentários nas colunas
COMMENT ON TABLE public.comments IS 'Comentários nos posts/devocionais';
COMMENT ON COLUMN public.comments.id IS 'ID único do comentário';
COMMENT ON COLUMN public.comments.post_id IS 'ID do post comentado';
COMMENT ON COLUMN public.comments.user_id IS 'ID do usuário que comentou';
COMMENT ON COLUMN public.comments.content IS 'Conteúdo do comentário (máx 500 caracteres)';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON public.comments(post_id, created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Política: Todos os usuários autenticados podem ver todos os comentários
CREATE POLICY "Comentários são visíveis para todos os usuários autenticados"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuários podem criar comentários
CREATE POLICY "Usuários podem criar comentários"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar apenas seus próprios comentários
CREATE POLICY "Usuários podem atualizar seus próprios comentários"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar apenas seus próprios comentários
CREATE POLICY "Usuários podem deletar seus próprios comentários"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER set_updated_at_comments
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();











