-- Migration 019: link do Google Maps para o endereço do restaurante
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS address_url TEXT;
