-- ============================================================
-- HIVI — Migração 007: payment_status em orders
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Adiciona coluna de status de pagamento nos pedidos
-- Valores: 'unpaid' (padrão) | 'paid'
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT
    DEFAULT 'unpaid'
    CHECK (payment_status IN ('paid', 'unpaid'));
