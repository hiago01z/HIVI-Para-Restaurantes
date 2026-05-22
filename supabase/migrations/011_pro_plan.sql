-- Fase 12 — Plano Pro
-- Adiciona coluna `plan` em restaurants para diferenciar Basic e Pro.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'basic'
  CHECK (plan IN ('basic', 'pro'));

-- Índice para facilitar queries de plano (ex: buscar todos os Pro)
CREATE INDEX IF NOT EXISTS idx_restaurants_plan ON restaurants(plan);
