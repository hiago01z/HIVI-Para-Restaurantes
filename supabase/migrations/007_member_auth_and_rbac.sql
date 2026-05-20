-- ============================================================
-- HIVI — Migração 007: RBAC — Senhas individuais + audit trail
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Colunas de autenticação individual para membros da equipe
ALTER TABLE restaurant_users
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS adm_password_hash TEXT;

-- 2. Audit trail: registra quem alterou o status de cada pedido
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS status_changed_by TEXT;

-- 3. Remove a constraint antiga PRIMEIRO (aceita apenas owner|manager|staff)
--    para permitir o UPDATE de 'staff' → 'delivery' sem violação
ALTER TABLE restaurant_users DROP CONSTRAINT IF EXISTS restaurant_users_role_check;

-- 4. Migra registros antigos (sem constraint ativa — seguro agora)
UPDATE restaurant_users SET role = 'delivery' WHERE role = 'staff';

-- 5. Recria a constraint com todos os cargos do RBAC
ALTER TABLE restaurant_users ADD CONSTRAINT restaurant_users_role_check
  CHECK (role IN ('owner', 'manager', 'cook', 'waiter', 'delivery'));
