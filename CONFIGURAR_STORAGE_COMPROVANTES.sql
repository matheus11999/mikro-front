-- =====================================================
-- SCRIPT PARA CONFIGURAR STORAGE DE COMPROVANTES
-- Execute este script no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VERIFICAR SE O BUCKET JÁ EXISTE
SELECT * FROM storage.buckets WHERE id = 'withdrawal-proofs';

-- 2. CRIAR O BUCKET (SE NÃO EXISTIR)
-- IMPORTANTE: Este comando deve ser executado no Dashboard do Supabase
-- Vá em Storage > Create Bucket com as seguintes configurações:
-- Nome: withdrawal-proofs
-- Público: true
-- Tipos permitidos: image/jpeg, image/jpg, image/png, image/gif, application/pdf
-- Tamanho máximo: 10MB

-- 3. CRIAR POLÍTICAS DE SEGURANÇA

-- Política para permitir que admins façam upload
CREATE POLICY "Admins can upload withdrawal proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'withdrawal-proofs' AND
  EXISTS (
    SELECT 1 FROM clientes 
    WHERE email = auth.email() 
    AND role = 'admin'
  )
);

-- Política para permitir que todos vejam os comprovantes
CREATE POLICY "Anyone can view withdrawal proofs" ON storage.objects
FOR SELECT USING (bucket_id = 'withdrawal-proofs');

-- Política para permitir que admins atualizem arquivos
CREATE POLICY "Admins can update withdrawal proofs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'withdrawal-proofs' AND
  EXISTS (
    SELECT 1 FROM clientes 
    WHERE email = auth.email() 
    AND role = 'admin'
  )
);

-- Política para permitir que admins deletem arquivos
CREATE POLICY "Admins can delete withdrawal proofs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'withdrawal-proofs' AND
  EXISTS (
    SELECT 1 FROM clientes 
    WHERE email = auth.email() 
    AND role = 'admin'
  )
);

-- 4. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 5. TESTAR PERMISSÕES (OPCIONAL)
-- Execute este comando logado como admin para testar
-- SELECT storage.foldername('withdrawal-proofs');

-- =====================================================
-- INSTRUÇÕES MANUAIS PARA CRIAR O BUCKET
-- =====================================================

/*
PASSO A PASSO NO DASHBOARD DO SUPABASE:

1. Acesse o Supabase Dashboard
2. Vá para "Storage" no menu lateral
3. Clique em "Create Bucket"
4. Configure:
   - Name: withdrawal-proofs
   - Public bucket: ✅ (marcado)
   - File size limit: 10485760 (10MB em bytes)
   - Allowed MIME types: image/jpeg,image/jpg,image/png,image/gif,application/pdf

5. Clique em "Create bucket"

DEPOIS execute as políticas SQL acima.
*/

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se o bucket foi criado
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'withdrawal-proofs';

-- Verificar políticas
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'WITH CHECK'
    WHEN with_check IS NOT NULL THEN 'USING'
    ELSE 'NO CONDITION'
  END as condition_type
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%withdrawal%'
ORDER BY policyname; 