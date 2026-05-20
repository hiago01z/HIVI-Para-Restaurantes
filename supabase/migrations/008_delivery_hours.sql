-- Migration 008: Horário de funcionamento das entregas
-- Coluna JSONB na tabela restaurants para armazenar a configuração completa

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS delivery_hours jsonb;

-- Comentário descritivo do schema esperado:
-- {
--   "enabled":    boolean,          -- false = sem restrição (sempre aberto)
--   "sameForAll": boolean,          -- true = mesmo horário todos os dias
--   "allFrom":    "HH:MM",          -- usado quando sameForAll = true
--   "allTo":      "HH:MM",
--   "days": {
--     "0": { "open": bool, "from": "HH:MM", "to": "HH:MM" },  -- Domingo
--     "1": { ... },  -- Segunda
--     ...
--     "6": { ... }   -- Sábado
--   }
-- }
