# Configuração do Storage para Fotos de Devocionais

## Passo 1: Criar o Bucket no Supabase

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Storage** no menu lateral
4. Clique em **New bucket**
5. Configure:
   - **Name**: `devotionals`
   - **Public bucket**: ✅ **SIM** (marcar como público)
   - **File size limit**: `10485760` (10MB em bytes)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/webp`
     - `image/gif`
6. Clique em **Create bucket**

## Passo 2: Configurar Políticas RLS

Execute o script SQL no **SQL Editor** do Supabase:

```sql
-- Política 1: Permitir Upload (INSERT)
CREATE POLICY "Users can upload devotional photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'devotionals');

-- Política 2: Permitir Leitura (SELECT) - PÚBLICA
CREATE POLICY "Public can view devotional photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'devotionals');

-- Política 3: Permitir Atualização (UPDATE)
CREATE POLICY "Users can update their own devotional photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'devotionals' 
  AND name LIKE ('devotionals/' || auth.uid()::text || '_%')
);

-- Política 4: Permitir Exclusão (DELETE)
CREATE POLICY "Users can delete their own devotional photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'devotionals' 
  AND name LIKE ('devotionals/' || auth.uid()::text || '_%')
);
```

Ou execute o arquivo: `supabase/migrations/007_create_devotionals_storage_bucket.sql`

## Passo 3: Verificar Configuração

Para verificar se as políticas foram criadas:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%devotional%';
```

## Como Funciona

1. **Upload**: Quando o usuário seleciona uma foto no formulário de devocional, o arquivo é enviado para o bucket `devotionals` no Supabase Storage
2. **Nome do arquivo**: Formato `devotionals/{user_id}_{timestamp}_{random}.{ext}`
3. **URL pública**: Após o upload, uma URL pública é gerada e salva no campo `photo_url` da tabela `devotional_posts`
4. **Exibição**: A foto é exibida no feed usando a URL pública

## Troubleshooting

### Erro: "Bucket not found"
- Verifique se o bucket `devotionals` foi criado
- Verifique se o nome está exatamente como `devotionals` (minúsculas)

### Erro: "new row violates row-level security policy"
- Execute o script SQL das políticas RLS
- Verifique se o usuário está autenticado

### Foto não aparece após upload
- Verifique no console do navegador se há erros
- Verifique se a URL foi salva no banco (campo `photo_url`)
- Verifique se o bucket está configurado como público

### Upload falha silenciosamente
- Verifique o tamanho do arquivo (máx 10MB)
- Verifique o formato do arquivo (JPG, PNG, WEBP, GIF)
- Verifique os logs no console do navegador

