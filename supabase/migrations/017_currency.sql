-- Migration 017: Moeda por restaurante (suporte a Portugal/EUR)
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'BRL'
  CHECK (currency IN ('BRL', 'EUR'));
