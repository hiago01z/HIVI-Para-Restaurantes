-- ============================================================
-- STORAGE: bucket + policies para restaurant-images
-- Execute no dashboard Supabase > SQL Editor
-- Seguro para rodar múltiplas vezes (recria as policies)
-- ============================================================

-- Cria o bucket se não existir (public = true para leitura pública)
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-images', 'restaurant-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove policies antigas (seguro se não existirem)
DROP POLICY IF EXISTS "authenticated_can_upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_can_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_can_delete" ON storage.objects;
DROP POLICY IF EXISTS "public_can_read" ON storage.objects;

-- Permite upload por usuários autenticados
CREATE POLICY "authenticated_can_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurant-images');

-- Permite atualização (upsert) por usuários autenticados
CREATE POLICY "authenticated_can_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'restaurant-images');

-- Permite exclusão por usuários autenticados
CREATE POLICY "authenticated_can_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'restaurant-images');

-- Leitura pública (necessário para o cardápio exibir as imagens)
CREATE POLICY "public_can_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'restaurant-images');
