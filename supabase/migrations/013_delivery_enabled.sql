-- Migration 013: adicionar coluna delivery_enabled em restaurants
-- Restaurantes que não fazem entrega podem desativar a opção no cardápio

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN NOT NULL DEFAULT TRUE;
