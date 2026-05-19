-- ============================================================
-- HIVI — Migração 002: cores extras no tema
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE restaurant_themes
  ADD COLUMN IF NOT EXISTS text_color  TEXT DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS icon_color  TEXT DEFAULT NULL;
-- icon_color NULL = usa primary_color como fallback no frontend
