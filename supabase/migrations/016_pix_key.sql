-- Migration 016: Chave PIX do restaurante
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS pix_key      TEXT,
  ADD COLUMN IF NOT EXISTS pix_key_type TEXT CHECK (pix_key_type IN ('cpf','cnpj','email','phone','evp'));
