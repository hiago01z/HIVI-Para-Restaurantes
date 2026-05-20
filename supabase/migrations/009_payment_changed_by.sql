-- Migration 009: Registra quem alterou o status de pagamento
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_changed_by text;
