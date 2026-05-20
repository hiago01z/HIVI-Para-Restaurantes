-- ============================================================
-- HIVI — Migração 006: order_id em qr_sessions + correções RLS
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Adiciona order_id em qr_sessions
--    Usado pelo /api/qrcode/confirm para vincular sessão ao pedido criado.
--    O cliente escuta via Realtime e usa este ID para redirecionar ao acompanhamento.
ALTER TABLE qr_sessions
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- 2. Corrige política public_read_active: is_active = NULL = restaurante novo = ativo
--    A política original (is_active = TRUE) bloqueava restaurantes com is_active = NULL,
--    causando 404 no cardápio público de restaurantes recém-criados.
DROP POLICY IF EXISTS "public_read_active" ON restaurants;
CREATE POLICY "public_read_active" ON restaurants FOR SELECT
  USING (is_active IS NOT FALSE);

-- 3. Corrige políticas de escrita de categorias/produtos/temas que referenciavam
--    o role 'admin' (antigo) — agora deve ser 'manager' (novo padrão do sistema).
DROP POLICY IF EXISTS "restaurant_user_write_categories" ON categories;
CREATE POLICY "restaurant_user_write_categories" ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_users ru
      WHERE ru.restaurant_id = categories.restaurant_id
        AND ru.user_id = auth.uid()
        AND ru.role IN ('owner', 'manager')
    )
  );

DROP POLICY IF EXISTS "restaurant_user_write_products" ON products;
CREATE POLICY "restaurant_user_write_products" ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_users ru
      WHERE ru.restaurant_id = products.restaurant_id
        AND ru.user_id = auth.uid()
        AND ru.role IN ('owner', 'manager')
    )
  );

DROP POLICY IF EXISTS "restaurant_user_write_themes" ON restaurant_themes;
CREATE POLICY "restaurant_user_write_themes" ON restaurant_themes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_users ru
      WHERE ru.restaurant_id = restaurant_themes.restaurant_id
        AND ru.user_id = auth.uid()
        AND ru.role IN ('owner', 'manager')
    )
  );
