-- ============================================================
-- STORAGE POLICIES: bucket restaurant-images
-- Execute no dashboard Supabase > SQL Editor
-- (o bucket deve ser criado antes com Public: true)
-- ============================================================

-- Permite que usuários autenticados façam upload de qualquer arquivo no bucket
CREATE POLICY "authenticated_can_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurant-images');

-- Permite que usuários autenticados atualizem (upsert) seus próprios arquivos
CREATE POLICY "authenticated_can_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurant-images');

-- Permite que usuários autenticados excluam arquivos no bucket
CREATE POLICY "authenticated_can_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'restaurant-images');

-- Leitura pública (necessário para o cardápio exibir as imagens)
CREATE POLICY "public_can_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurant-images');
