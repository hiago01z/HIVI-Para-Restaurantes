-- ============================================================
-- HIVI — Migração 003: senha dedicada para o ADM do restaurante
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS adm_password_hash TEXT;
-- NULL = senha ainda não definida pelo dono
