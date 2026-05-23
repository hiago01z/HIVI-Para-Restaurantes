-- Atualiza constraint de plano para incluir 'free'
ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS restaurants_plan_check;
ALTER TABLE restaurants ADD CONSTRAINT restaurants_plan_check CHECK (plan IN ('free','basic','pro'));
ALTER TABLE restaurants ALTER COLUMN plan SET DEFAULT 'free';

-- Trial period: 7 dias de funcionalidades Pro para novos restaurantes
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Single device: rastreia sessão ativa por membro
ALTER TABLE restaurant_users ADD COLUMN IF NOT EXISTS session_id TEXT;
