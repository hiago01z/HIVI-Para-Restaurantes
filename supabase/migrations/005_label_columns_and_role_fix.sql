-- ============================================================
-- HIVI — Migração 005: colunas de label e correção de roles
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Adiciona colunas de label sobre imagem em restaurant_themes
--    (usadas no ADM configurações e no cardápio público)
ALTER TABLE restaurant_themes
  ADD COLUMN IF NOT EXISTS label_font           TEXT    DEFAULT 'dancing-script',
  ADD COLUMN IF NOT EXISTS label_color          TEXT    DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS label_effect         TEXT    DEFAULT 'offset',
  ADD COLUMN IF NOT EXISTS label_stroke_color   TEXT    DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS label_stroke_size    INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS label_offset_distance INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS label_offset_angle   INTEGER DEFAULT -45;

-- 2. Corrige o CHECK constraint de roles em restaurant_users
--    O código usa 'owner', 'manager', 'staff' mas a constraint original
--    só permitia 'owner', 'admin', 'waiter' (mismatch causava falha silenciosa no insert)
ALTER TABLE restaurant_users
  DROP CONSTRAINT IF EXISTS restaurant_users_role_check;

ALTER TABLE restaurant_users
  ADD CONSTRAINT restaurant_users_role_check
  CHECK (role IN ('owner', 'manager', 'staff'));

-- Atualiza registros existentes com roles antigos para equivalentes novos
UPDATE restaurant_users SET role = 'manager' WHERE role = 'admin';
UPDATE restaurant_users SET role = 'staff'   WHERE role = 'waiter';
