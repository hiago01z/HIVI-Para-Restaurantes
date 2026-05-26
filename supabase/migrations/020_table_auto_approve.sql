-- Migration 020: Auto-aprovação de pedidos na mesa
-- O dono pode habilitar para que o cliente faça o pedido diretamente
-- informando nome e número da mesa — sem precisar do garçom escanear QR code.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS table_order_auto_approve BOOLEAN DEFAULT FALSE;
