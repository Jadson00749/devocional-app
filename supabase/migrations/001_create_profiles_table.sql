-- =====================================================
-- MIGRAÇÃO 001: Criar tabela de perfis de usuários
-- =====================================================
-- Descrição: Tabela principal para armazenar dados do perfil do usuário
-- Autor: Sistema Geração Life
-- Data: 2025-01-XX
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

-- Comentários nas colunas
COMMENT ON TABLE public.profiles IS 'Perfis de usuários do app Geração Life';
COMMENT ON COLUMN public.profiles.id IS 'ID do usuário (FK para auth.users)';
COMMENT ON COLUMN public.profiles.full_name IS 'Nome completo do usuário';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL do avatar do usuário';
COMMENT ON COLUMN public.profiles.bio IS 'Biografia do usuário';
COMMENT ON COLUMN public.profiles.phone IS 'Telefone do usuário';
COMMENT ON COLUMN public.profiles.is_phone_public IS 'Se o telefone é público';
COMMENT ON COLUMN public.profiles.birthday IS 'Data de nascimento';
COMMENT ON COLUMN public.profiles.civil_status IS 'Estado civil';
COMMENT ON COLUMN public.profiles.congregation IS 'Congregação do usuário';
COMMENT ON COLUMN public.profiles.streak IS 'Sequência atual de devocionais';
COMMENT ON COLUMN public.profiles.max_streak IS 'Maior sequência alcançada';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_congregation ON public.profiles(congregation);
CREATE INDEX IF NOT EXISTS idx_profiles_streak ON public.profiles(streak DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver todos os perfis públicos
CREATE POLICY "Perfis são visíveis para todos os usuários autenticados"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: Usuários podem inserir apenas seu próprio perfil
CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil quando usuário se cadastra
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();











