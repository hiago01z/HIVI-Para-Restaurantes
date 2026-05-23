-- Migration 015: fila de e-mails de onboarding
-- Armazena e-mails agendados para processamento pelo Vercel Cron (/api/cron/emails)

CREATE TABLE IF NOT EXISTS email_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  to_email        text NOT NULL,
  type            text NOT NULL CHECK (type IN (
                    'welcome',         -- imediato ao criar
                    'onboarding_d3',   -- dia 3: setup checklist
                    'trial_ending'     -- dia 6: trial termina amanhã
                  )),
  send_at         timestamptz NOT NULL,
  sent_at         timestamptz,         -- null = pendente, preenchido = enviado
  error           text,                -- mensagem de erro se falhou
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índice para o cron: busca pendentes com send_at <= now()
CREATE INDEX IF NOT EXISTS idx_email_queue_pending
  ON email_queue (send_at)
  WHERE sent_at IS NULL;

-- RLS: somente service role acessa (nunca leitura pública)
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
-- Sem políticas públicas — apenas service role key bypassa o RLS
