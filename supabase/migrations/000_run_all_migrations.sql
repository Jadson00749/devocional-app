-- =====================================================
-- SCRIPT PRINCIPAL: Executar todas as migrações
-- =====================================================
-- Descrição: Execute este script no Supabase SQL Editor
--            Ele executa todas as migrações na ordem correta
-- Autor: Sistema Geração Life
-- Data: 2025-01-XX
-- =====================================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- Ordem de execução:
-- 1. 001_create_profiles_table.sql
-- 2. 002_create_devotional_posts_table.sql
-- 3. 003_create_comments_table.sql
-- 4. 004_create_reactions_table.sql
-- 5. 005_create_functions_and_triggers.sql

-- =====================================================
-- MIGRAÇÃO 001: Perfis
-- =====================================================
\i supabase/migrations/001_create_profiles_table.sql

-- =====================================================
-- MIGRAÇÃO 002: Posts
-- =====================================================
\i supabase/migrations/002_create_devotional_posts_table.sql

-- =====================================================
-- MIGRAÇÃO 003: Comentários
-- =====================================================
\i supabase/migrations/003_create_comments_table.sql

-- =====================================================
-- MIGRAÇÃO 004: Reações
-- =====================================================
\i supabase/migrations/004_create_reactions_table.sql

-- =====================================================
-- MIGRAÇÃO 005: Funções e Triggers
-- =====================================================
\i supabase/migrations/005_create_functions_and_triggers.sql

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
-- Verificar se todas as tabelas foram criadas
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'devotional_posts', 'comments', 'reactions')
ORDER BY table_name;











