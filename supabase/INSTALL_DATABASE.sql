-- =====================================================
-- SCRIPT COMPLETO: Instalação do Banco de Dados
-- =====================================================
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo
-- 2. Cole no Supabase SQL Editor
-- 3. Execute (Run)
-- =====================================================

-- =====================================================
-- PARTE 1: Criar tabela de perfis
-- =====================================================

-- Criar tabela de perfis
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  is_phone_public BOOLEAN DEFAULT false,
  birthday DATE,
  civil_status TEXT,
  congregation TEXT,
  streak INTEGER DEFAULT 0 NOT NULL CHECK (streak >= 0),
  max_streak INTEGER DEFAULT 0 NOT NULL CHECK (max_streak >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_congregation ON public.profiles(congregation);
CREATE INDEX IF NOT EXISTS idx_profiles_streak ON public.profiles(streak DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver todos os perfis públicos
DROP POLICY IF EXISTS "Perfis são visíveis para todos os usuários autenticados" ON public.profiles;
CREATE POLICY "Perfis são visíveis para todos os usuários autenticados"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuários podem atualizar apenas seu próprio perfil
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: Usuários podem inserir apenas seu próprio perfil
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- PARTE 2: Criar tabela de posts/devocionais
-- =====================================================

-- Criar enum para tema do devocional
DO $$ BEGIN
  CREATE TYPE public.devotional_theme AS ENUM (
    'Normal',
    'Frase do Devocional',
    'Música do Dia',
    'Vitória da Semana',
    'O Que Deus Construiu'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_devotional_posts_user_id ON public.devotional_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_devotional_posts_created_at ON public.devotional_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devotional_posts_theme ON public.devotional_posts(theme);
CREATE INDEX IF NOT EXISTS idx_devotional_posts_user_created ON public.devotional_posts(user_id, created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.devotional_posts ENABLE ROW LEVEL SECURITY;

-- Política: Todos os usuários autenticados podem ver todos os posts
DROP POLICY IF EXISTS "Posts são visíveis para todos os usuários autenticados" ON public.devotional_posts;
CREATE POLICY "Posts são visíveis para todos os usuários autenticados"
  ON public.devotional_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuários podem criar seus próprios posts
DROP POLICY IF EXISTS "Usuários podem criar seus próprios posts" ON public.devotional_posts;
CREATE POLICY "Usuários podem criar seus próprios posts"
  ON public.devotional_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar apenas seus próprios posts
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios posts" ON public.devotional_posts;
CREATE POLICY "Usuários podem atualizar seus próprios posts"
  ON public.devotional_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar apenas seus próprios posts
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios posts" ON public.devotional_posts;
CREATE POLICY "Usuários podem deletar seus próprios posts"
  ON public.devotional_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- PARTE 3: Criar tabela de comentários
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

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON public.comments(post_id, created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Política: Todos os usuários autenticados podem ver todos os comentários
DROP POLICY IF EXISTS "Comentários são visíveis para todos os usuários autenticados" ON public.comments;
CREATE POLICY "Comentários são visíveis para todos os usuários autenticados"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuários podem criar comentários
DROP POLICY IF EXISTS "Usuários podem criar comentários" ON public.comments;
CREATE POLICY "Usuários podem criar comentários"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar apenas seus próprios comentários
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios comentários" ON public.comments;
CREATE POLICY "Usuários podem atualizar seus próprios comentários"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar apenas seus próprios comentários
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios comentários" ON public.comments;
CREATE POLICY "Usuários podem deletar seus próprios comentários"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- PARTE 4: Criar tabela de reações
-- =====================================================

-- Criar enum para tipo de reação
DO $$ BEGIN
  CREATE TYPE public.reaction_type AS ENUM (
    'pray',      -- 🙏 (Amém)
    'people',    -- 👥
    'fire'       -- 🔥
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON public.reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON public.reactions(reaction_type);
CREATE INDEX IF NOT EXISTS idx_reactions_post_type ON public.reactions(post_id, reaction_type);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Política: Todos os usuários autenticados podem ver todas as reações
DROP POLICY IF EXISTS "Reações são visíveis para todos os usuários autenticados" ON public.reactions;
CREATE POLICY "Reações são visíveis para todos os usuários autenticados"
  ON public.reactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuários podem criar reações
DROP POLICY IF EXISTS "Usuários podem criar reações" ON public.reactions;
CREATE POLICY "Usuários podem criar reações"
  ON public.reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar apenas suas próprias reações
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias reações" ON public.reactions;
CREATE POLICY "Usuários podem deletar suas próprias reações"
  ON public.reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- PARTE 5: Criar funções auxiliares
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em profiles
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para atualizar updated_at em devotional_posts
DROP TRIGGER IF EXISTS set_updated_at_devotional_posts ON public.devotional_posts;
CREATE TRIGGER set_updated_at_devotional_posts
  BEFORE UPDATE ON public.devotional_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para atualizar updated_at em comments
DROP TRIGGER IF EXISTS set_updated_at_comments ON public.comments;
CREATE TRIGGER set_updated_at_comments
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Função para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil quando usuário se cadastra
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

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
DROP TRIGGER IF EXISTS update_streak_on_post ON public.devotional_posts;
CREATE TRIGGER update_streak_on_post
  AFTER INSERT ON public.devotional_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_streak();

-- =====================================================
-- PARTE 6: Criar tabela de congregações
-- =====================================================

-- Criar tabela de congregações
CREATE TABLE IF NOT EXISTS public.congregations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    region TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_congregations_region ON public.congregations(region);
CREATE INDEX IF NOT EXISTS idx_congregations_name ON public.congregations(name);

-- Habilitar RLS
ALTER TABLE public.congregations ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: todos podem ler
DROP POLICY IF EXISTS "Congregations are viewable by everyone" ON public.congregations;
CREATE POLICY "Congregations are viewable by everyone"
    ON public.congregations
    FOR SELECT
    USING (true);

-- Política para INSERT: apenas autenticados podem inserir (para admins futuramente)
DROP POLICY IF EXISTS "Congregations are insertable by authenticated users" ON public.congregations;
CREATE POLICY "Congregations are insertable by authenticated users"
    ON public.congregations
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE: apenas autenticados podem atualizar
DROP POLICY IF EXISTS "Congregations are updatable by authenticated users" ON public.congregations;
CREATE POLICY "Congregations are updatable by authenticated users"
    ON public.congregations
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Política para DELETE: apenas autenticados podem deletar
DROP POLICY IF EXISTS "Congregations are deletable by authenticated users" ON public.congregations;
CREATE POLICY "Congregations are deletable by authenticated users"
    ON public.congregations
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Inserir dados das congregações
INSERT INTO public.congregations (name, region) VALUES
('ADBA JD. PAULISTA', 'Sul'),
('ADBA VILA MELHADO', 'Sul'),
('ADBA PQ. DAS HORTÊNSIAS I', 'Sul'),
('ADBA PQ. DAS HORTÊNSIAS II', 'Sul'),
('ADBA JD. IEDA', 'Sul'),
('ADBA JD. IMPERIAL', 'Sul'),
('ADBA JD. PORTUGAL', 'Sul'),
('ADBA JD. IGUATEMI', 'Sul'),
('ADBA JD. CRUZEIRO DO SUL', 'Sul'),
('ADBA VALE DO SOL', 'Oeste'),
('ADBA SEDE', 'Oeste'),
('ADBA JD. MARIA LUIZA - AQA', 'Oeste'),
('ADBA SANTA ANGELINA/YAMADA', 'Oeste'),
('ADBA PQ. DAS LARANJEIRAS', 'Oeste'),
('ADBA JD. DO VALLE', 'NORTE'),
('ADBA JD. INDAIÁ', 'NORTE'),
('ADBA JD. ROBERTO SELMI DEY V', 'NORTE'),
('ADBA JD. ROBERTO SELMI DEY III', 'NORTE'),
('ADBA JD. VENEZA', 'NORTE'),
('ADBA V. VERDE', 'NORTE'),
('ADBA JD. AMÉRICA', 'Leste'),
('ADBA ALTOS DO PINHEIROS', 'Leste'),
('ADBA JD ESMERALDA', 'Leste'),
('ADBA JD. EUROPA', 'Leste'),
('ADBA JD. SÃO PAULO', 'Leste'),
('ADBA PQ. RES. SÃO PAULO', 'Leste'),
('ADBA ALAMEDAS', 'Leste'),
('ADBA PQ. GRAMADO', 'Leste'),
('ADBA SANTA LÚCIA', 'Américo e Santa Lúcia'),
('ADBA ACO. NOVA CANAÃ', 'Américo e Santa Lúcia'),
('ADBA ACO. MARIA LUIZA', 'Américo e Santa Lúcia'),
('ADBA ACO. VISTA ALEGRE', 'Américo e Santa Lúcia'),
('ADBA ACO. SADIA', 'Américo e Santa Lúcia'),
('ADBA ACO. SÃO JOSÉ', 'Américo e Santa Lúcia'),
('ADBA ACO. SANTA TEREZINHA', 'Américo e Santa Lúcia'),
('ADBA GUATAPARÁ II', 'Região Guatapará'),
('ADBA MOMBUCA', 'Região Guatapará'),
('ADBA RINCÃO', 'Região Guatapará'),
('ADBA TAQUARAL', 'Região Guatapará')
ON CONFLICT (name) DO NOTHING;

-- Trigger para atualizar updated_at em congregations
DROP TRIGGER IF EXISTS update_congregations_updated_at ON public.congregations;
CREATE TRIGGER update_congregations_updated_at
    BEFORE UPDATE ON public.congregations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'devotional_posts', 'comments', 'reactions', 'congregations')
ORDER BY table_name;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Banco de dados criado com sucesso!';
  RAISE NOTICE '📊 Tabelas criadas: profiles, devotional_posts, comments, reactions, congregations';
  RAISE NOTICE '🔒 RLS habilitado em todas as tabelas';
  RAISE NOTICE '⚡ Triggers configurados para criação automática de perfil e atualização de streak';
END $$;

