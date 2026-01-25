-- =====================================================
-- MIGRAÇÃO 004: Criar tabela de reações
-- =====================================================
-- Descrição: Tabela para armazenar reações nos posts (Amém, etc)
-- Autor: Sistema Geração Life
-- Data: 2025-01-XX
-- =====================================================

-- Criar enum para tipo de reação
CREATE TYPE public.reaction_type AS ENUM (
  'pray',      -- 🙏 (Amém)
  'people',    -- 👥
  'fire'       -- 🔥
);

-- Criar tabela de reações
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.devotional_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type public.reaction_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraint: Um usuário só pode reagir uma vez por post com cada tipo
  CONSTRAINT unique_user_post_reaction UNIQUE (user_id, post_id, reaction_type)
);

-- Comentários nas colunas
COMMENT ON TABLE public.reactions IS 'Reações dos usuários nos posts';
COMMENT ON COLUMN public.reactions.id IS 'ID único da reação';
COMMENT ON COLUMN public.reactions.post_id IS 'ID do post reagido';
COMMENT ON COLUMN public.reactions.user_id IS 'ID do usuário que reagiu';
COMMENT ON COLUMN public.reactions.reaction_type IS 'Tipo de reação (pray, people, fire)';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON public.reactions(reaction_type);
CREATE INDEX IF NOT EXISTS idx_reactions_post_type ON public.reactions(post_id, reaction_type);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Política: Todos os usuários autenticados podem ver todas as reações
CREATE POLICY "Reações são visíveis para todos os usuários autenticados"
  ON public.reactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuários podem criar reações
CREATE POLICY "Usuários podem criar reações"
  ON public.reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar apenas suas próprias reações
CREATE POLICY "Usuários podem deletar suas próprias reações"
  ON public.reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);




