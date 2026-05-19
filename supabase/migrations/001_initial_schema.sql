-- ============================================================
-- HIVI Para Restaurantes — Schema inicial
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Restaurantes (tenants)
CREATE TABLE restaurants (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  slug                   TEXT UNIQUE NOT NULL,
  logo_url               TEXT,
  is_active              BOOLEAN DEFAULT TRUE,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  plan                   TEXT DEFAULT 'basic',
  instagram_url          TEXT,
  whatsapp_number        TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários do restaurante (funcionários)
CREATE TABLE restaurant_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role            TEXT CHECK (role IN ('owner', 'admin', 'waiter')) DEFAULT 'waiter',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (restaurant_id, user_id)
);

-- Tema visual do restaurante
CREATE TABLE restaurant_themes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE NOT NULL,
  primary_color    TEXT DEFAULT '#FF6B00',
  secondary_color  TEXT DEFAULT '#1A0A00',
  background_color TEXT DEFAULT '#2C1A0E',
  font_family      TEXT DEFAULT 'serif',
  font_size_base   TEXT DEFAULT '16px',
  banner_url       TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias do cardápio
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  image_url       TEXT,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos (pratos e bebidas)
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10, 2) NOT NULL,
  image_url       TEXT,
  is_featured     BOOLEAN DEFAULT FALSE,
  is_available    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence para número de pedido por restaurante
CREATE SEQUENCE order_number_seq;

-- Pedidos
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  order_number    INTEGER NOT NULL,
  type            TEXT CHECK (type IN ('table', 'delivery')) NOT NULL,
  status          TEXT CHECK (status IN (
                    'pending', 'confirmed', 'preparing',
                    'ready', 'out_for_delivery', 'delivered', 'cancelled'
                  )) DEFAULT 'pending',
  customer_name   TEXT,
  customer_phone  TEXT,
  table_number    TEXT,
  address         TEXT,
  payment_method  TEXT,
  change_for      NUMERIC(10, 2),
  total           NUMERIC(10, 2) NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Função para gerar order_number sequencial por restaurante
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO NEW.order_number
  FROM orders
  WHERE restaurant_id = NEW.restaurant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Itens do pedido
CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  product_price   NUMERIC(10, 2) NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 1,
  notes           TEXT
);

-- Sessões de QR code (cliente → garçom)
CREATE TABLE qr_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  order_data      JSONB NOT NULL,
  confirmed       BOOLEAN DEFAULT FALSE,
  confirmed_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_sessions ENABLE ROW LEVEL SECURITY;

-- restaurants: dono vê/edita apenas os seus
CREATE POLICY "owner_select" ON restaurants FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "owner_insert" ON restaurants FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owner_update" ON restaurants FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "owner_delete" ON restaurants FOR DELETE
  USING (owner_id = auth.uid());

-- Leitura pública de restaurantes ativos (para o cardápio)
CREATE POLICY "public_read_active" ON restaurants FOR SELECT
  USING (is_active = TRUE);

-- restaurant_users: funcionário vê seus próprios vínculos
CREATE POLICY "user_select_own" ON restaurant_users FOR SELECT
  USING (user_id = auth.uid());

-- categories: leitura pública, escrita apenas por usuários do restaurante
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  USING (TRUE);

CREATE POLICY "restaurant_user_write_categories" ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_users ru
      WHERE ru.restaurant_id = categories.restaurant_id
        AND ru.user_id = auth.uid()
        AND ru.role IN ('owner', 'admin')
    )
  );

-- products: leitura pública, escrita apenas por usuários do restaurante
CREATE POLICY "public_read_products" ON products FOR SELECT
  USING (TRUE);

CREATE POLICY "restaurant_user_write_products" ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_users ru
      WHERE ru.restaurant_id = products.restaurant_id
        AND ru.user_id = auth.uid()
        AND ru.role IN ('owner', 'admin')
    )
  );

-- restaurant_themes: leitura pública, escrita por usuários do restaurante
CREATE POLICY "public_read_themes" ON restaurant_themes FOR SELECT
  USING (TRUE);

CREATE POLICY "restaurant_user_write_themes" ON restaurant_themes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_users ru
      WHERE ru.restaurant_id = restaurant_themes.restaurant_id
        AND ru.user_id = auth.uid()
        AND ru.role IN ('owner', 'admin')
    )
  );

-- orders: criação pública (cliente faz pedido), leitura/edição pelo restaurante
CREATE POLICY "public_insert_orders" ON orders FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "public_read_own_order" ON orders FOR SELECT
  USING (TRUE);

CREATE POLICY "restaurant_user_update_orders" ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_users ru
      WHERE ru.restaurant_id = orders.restaurant_id
        AND ru.user_id = auth.uid()
    )
  );

-- order_items: leitura/escrita pública (vinculada ao pedido)
CREATE POLICY "public_all_order_items" ON order_items FOR ALL
  USING (TRUE);

-- qr_sessions: criação pública, confirmação pelo restaurante
CREATE POLICY "public_insert_qr_sessions" ON qr_sessions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "public_read_qr_sessions" ON qr_sessions FOR SELECT
  USING (TRUE);

CREATE POLICY "restaurant_user_confirm_qr" ON qr_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_users ru
      WHERE ru.restaurant_id = qr_sessions.restaurant_id
        AND ru.user_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE: bucket para imagens do restaurante
-- Execute no dashboard Supabase > Storage > New Bucket
-- Nome: restaurant-images | Public: true
-- ============================================================
