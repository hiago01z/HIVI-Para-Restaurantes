-- Migration 018: taxa de entrega e endereço do restaurante
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Snapshot da taxa no momento do pedido (analytics usa só orders.total = itens)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0;
