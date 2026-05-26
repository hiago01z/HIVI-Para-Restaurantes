-- Histórico de contatos do painel adm-master (uso interno HIVI)
CREATE TABLE IF NOT EXISTS adm_contacts (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL CHECK (type IN ('welcome_email','manual_email','note','whatsapp','call')),
  content       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS adm_contacts_restaurant_id_idx ON adm_contacts(restaurant_id);
CREATE INDEX IF NOT EXISTS adm_contacts_created_at_idx    ON adm_contacts(created_at DESC);

-- Sem RLS — tabela interna, acessada apenas via service role
