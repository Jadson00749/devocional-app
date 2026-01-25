-- Migration: Criar bucket e políticas RLS para fotos de devocionais
-- Execute este script no SQL Editor do Supabase

-- IMPORTANTE: 
-- 1. Primeiro, crie o bucket manualmente no Storage do Supabase:
--    - Nome: "devotionals"
--    - Público: SIM (para permitir acesso às imagens)
--    - File size limit: 10MB (ou o valor desejado)
--    - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif

-- 2. Depois execute este arquivo para criar as políticas RLS

-- ============================================
-- POLÍTICAS RLS PARA O BUCKET "devotionals"
-- ============================================

-- Política 1: Permitir Upload (INSERT)
-- Permite usuários autenticados fazerem upload na pasta devotionals/
CREATE POLICY "Users can upload devotional photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'devotionals'
);

-- Política 2: Permitir Leitura (SELECT) - PÚBLICA
-- Permite leitura pública de todas as imagens (já que o bucket é público)
CREATE POLICY "Public can view devotional photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'devotionals');

-- Política 3: Permitir Atualização (UPDATE)
-- Permite usuários atualizarem suas próprias fotos (que começam com seu user_id)
CREATE POLICY "Users can update their own devotional photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'devotionals' 
  AND name LIKE ('devotionals/' || auth.uid()::text || '_%')
);

-- Política 4: Permitir Exclusão (DELETE)
-- Permite usuários deletarem suas próprias fotos (que começam com seu user_id)
CREATE POLICY "Users can delete their own devotional photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'devotionals' 
  AND name LIKE ('devotionals/' || auth.uid()::text || '_%')
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Para verificar se as políticas foram criadas:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%devotional%';

