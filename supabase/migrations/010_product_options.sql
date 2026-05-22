-- ============================================================
-- 010_product_options.sql
-- Adicionais: grupos de opções e itens por produto
-- ============================================================

-- Grupos de opções (ex: "Proteína", "Acompanhamento", "Tamanho")
CREATE TABLE IF NOT EXISTS product_option_groups (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  description      TEXT,
  min_selections   INT         NOT NULL DEFAULT 0,
  max_selections   INT         NOT NULL DEFAULT 1,
  sort_order       INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itens dentro de cada grupo
CREATE TABLE IF NOT EXISTS product_option_items (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id         UUID           NOT NULL REFERENCES product_option_groups(id) ON DELETE CASCADE,
  name             TEXT           NOT NULL,
  price_addition   NUMERIC(10,2)  NOT NULL DEFAULT 0,
  is_available     BOOLEAN        NOT NULL DEFAULT true,
  sort_order       INT            NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Opções escolhidas pelo cliente, persistidas no item do pedido
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_options JSONB;

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_option_groups_product ON product_option_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_option_items_group    ON product_option_items(group_id);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_items  ENABLE ROW LEVEL SECURITY;

-- Leitura pública (cardápio anon)
CREATE POLICY "public read option groups"
  ON product_option_groups FOR SELECT USING (true);

CREATE POLICY "public read option items"
  ON product_option_items FOR SELECT USING (true);

-- Escrita: apenas dono do restaurante ao qual o produto pertence
CREATE POLICY "owner manage option groups"
  ON product_option_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM products p
      JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.id = product_option_groups.product_id
        AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM products p
      JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.id = product_option_groups.product_id
        AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY "owner manage option items"
  ON product_option_items FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM product_option_groups g
      JOIN products p ON p.id = g.product_id
      JOIN restaurants r ON r.id = p.restaurant_id
      WHERE g.id = product_option_items.group_id
        AND r.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM product_option_groups g
      JOIN products p ON p.id = g.product_id
      JOIN restaurants r ON r.id = p.restaurant_id
      WHERE g.id = product_option_items.group_id
        AND r.owner_id = auth.uid()
    )
  );
