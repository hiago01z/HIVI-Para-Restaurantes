# HIVI Para Restaurantes — Arquitetura Técnica

## Estrutura de Pastas (Next.js 15 App Router)

```
hivi/
├── app/
│   ├── (saas)/                        # Grupo: landing page e conta HIVI
│   │   ├── page.tsx                   # Landing page (/)
│   │   ├── conta/
│   │   │   └── page.tsx               # Área de conta do dono (/conta)
│   │   └── auth/
│   │       └── callback/route.ts      # Callback OAuth Google
│   │
│   ├── [slug]/                        # Grupo dinâmico: restaurante
│   │   ├── page.tsx                   # Cardápio público (home do restaurante)
│   │   ├── categoria/[id]/page.tsx    # Listagem por categoria
│   │   ├── pedido/page.tsx            # Carrinho / tela de pedido
│   │   ├── meu-pedido/[id]/page.tsx   # Acompanhar pedido (status)
│   │   └── adm/                       # Painel administrativo do restaurante
│   │       ├── layout.tsx             # Layout adm (auth guard)
│   │       ├── page.tsx               # Dashboard / redirect
│   │       ├── pedidos/page.tsx       # Gestão de pedidos
│   │       ├── pratos/page.tsx        # CRUD pratos e bebidas
│   │       ├── categorias/page.tsx    # CRUD categorias + ordenação
│   │       ├── configuracoes/page.tsx # Tema, redes sociais, QR code
│   │       └── qr/[sessionId]/page.tsx # Garçom confirma pedido via QR
│   │
│   └── api/
│       ├── stripe/
│       │   ├── webhook/route.ts       # Webhook Stripe (pagamentos)
│       │   └── checkout/route.ts      # Criar sessão de checkout
│       ├── orders/
│       │   ├── route.ts               # Criar pedido
│       │   └── [id]/status/route.ts   # Atualizar status + WhatsApp
│       ├── qrcode/
│       │   └── confirm/route.ts       # Garçom confirma pedido via QR
│       └── whatsapp/
│           └── notify/route.ts        # Disparo UltraMSG
│
├── components/
│   ├── saas/                          # Componentes da landing page HIVI
│   ├── adm/                           # Componentes do painel adm do restaurante
│   ├── menu/                          # Componentes do cardápio público
│   └── ui/                            # Shadcn/ui base
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Supabase browser client
│   │   ├── server.ts                  # Supabase server client
│   │   └── middleware.ts              # Auth middleware
│   ├── stripe.ts                      # Stripe client
│   ├── ultramsg.ts                    # UltraMSG client
│   ├── resend.ts                      # Resend client
│   └── utils.ts
│
├── middleware.ts                       # Proteção de rotas /[slug]/adm
└── supabase/
    └── migrations/                    # Migrations SQL
```

---

## Schema do Banco de Dados (Supabase / PostgreSQL)

### `restaurants` — Restaurantes (tenants)
```sql
id                       uuid PRIMARY KEY DEFAULT gen_random_uuid()
owner_id                 uuid REFERENCES auth.users(id)
name                     text NOT NULL
slug                     text UNIQUE NOT NULL
logo_url                 text
is_active                boolean DEFAULT true
stripe_customer_id       text
stripe_subscription_id   text
plan                     text DEFAULT 'basic' CHECK (plan IN ('basic','pro'))  -- migration 011
adm_password_hash        text                             -- senha legada do dono (via /conta)
instagram_url            text
whatsapp_number          text
whatsapp_notify_enabled  boolean NOT NULL DEFAULT true    -- migration 012
delivery_hours           jsonb                            -- migration 008
created_at               timestamptz DEFAULT now()
```

### `restaurant_users` — Funcionários do restaurante
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id    uuid REFERENCES restaurants(id) ON DELETE CASCADE
user_id          uuid REFERENCES auth.users(id)
role             text CHECK (role IN ('owner','manager','cook','waiter','delivery'))
name             text                                     -- nome de exibição no ADM
adm_password_hash text                                   -- senha ADM individual do membro
created_at       timestamptz DEFAULT now()
```

### `restaurant_themes` — Tema visual do restaurante
```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id         uuid REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE
primary_color         text DEFAULT '#FF6B00'
secondary_color       text DEFAULT '#1A0A00'
background_color      text DEFAULT '#2C1A0E'
font_family           text DEFAULT 'serif'
font_size_base        text DEFAULT '16px'
text_color            text DEFAULT '#FFFFFF'
icon_color            text DEFAULT '#FF6B00'
banner_url            text
label_font            text DEFAULT 'dancing-script'
label_color           text DEFAULT '#ffffff'
label_effect          text DEFAULT 'offset'
label_stroke_color    text DEFAULT '#000000'
label_stroke_size     int DEFAULT 50
label_offset_distance int DEFAULT 50
label_offset_angle    int DEFAULT -45
updated_at            timestamptz DEFAULT now()
```

### `categories` — Categorias do cardápio
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id   uuid REFERENCES restaurants(id) ON DELETE CASCADE
name            text NOT NULL
image_url       text
display_order   int DEFAULT 0                    -- ordem de exibição na home
created_at      timestamptz DEFAULT now()
```

### `products` — Pratos e bebidas
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id   uuid REFERENCES restaurants(id) ON DELETE CASCADE
category_id     uuid REFERENCES categories(id)
name            text NOT NULL
description     text
price           numeric(10,2) NOT NULL
image_url       text
is_featured     boolean DEFAULT false            -- exibir nos destaques da home
is_available    boolean DEFAULT true
created_at      timestamptz DEFAULT now()
```

### `orders` — Pedidos
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id   uuid REFERENCES restaurants(id)
order_number    int                              -- sequencial por restaurante
type            text CHECK (type IN ('table','delivery'))
status          text CHECK (status IN (
                  'pending',
                  'confirmed',
                  'preparing',
                  'ready',
                  'out_for_delivery',
                  'delivered',
                  'cancelled'
                )) DEFAULT 'pending'
customer_name   text
customer_phone  text                             -- WhatsApp para notificação
table_number    text
address         text
payment_method  text
change_for      numeric(10,2)
total           numeric(10,2)
notes           text
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### `order_items` — Itens do pedido
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
order_id         uuid REFERENCES orders(id) ON DELETE CASCADE
product_id       uuid REFERENCES products(id)
product_name     text NOT NULL
product_price    numeric(10,2) NOT NULL
quantity         int NOT NULL DEFAULT 1
notes            text
selected_options jsonb                           -- migration 010: adicionais escolhidos
```

### `product_option_groups` — Grupos de adicionais por produto (migration 010)
```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
product_id     uuid REFERENCES products(id) ON DELETE CASCADE
name           text NOT NULL
description    text
min_selections int NOT NULL DEFAULT 0
max_selections int NOT NULL DEFAULT 1
sort_order     int NOT NULL DEFAULT 0
created_at     timestamptz NOT NULL DEFAULT now()
```

### `product_option_items` — Itens de cada grupo (migration 010)
```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
group_id       uuid REFERENCES product_option_groups(id) ON DELETE CASCADE
name           text NOT NULL
price_addition numeric(10,2) NOT NULL DEFAULT 0
is_available   boolean NOT NULL DEFAULT true
sort_order     int NOT NULL DEFAULT 0
created_at     timestamptz NOT NULL DEFAULT now()
```

### `qr_sessions` — Sessões de QR code de pedido (cliente → garçom)
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id   uuid REFERENCES restaurants(id)
order_data      jsonb NOT NULL                   -- snapshot dos itens do carrinho
confirmed       boolean DEFAULT false
confirmed_at    timestamptz
expires_at      timestamptz DEFAULT now() + interval '15 minutes'
created_at      timestamptz DEFAULT now()
```

---

## Row Level Security (RLS)

- `restaurants`: dono só vê/edita seus próprios restaurantes
- `restaurant_users`: isolado por `restaurant_id`
- `categories`, `products`, `restaurant_themes`: isolado por `restaurant_id`
- `orders`, `order_items`: isolado por `restaurant_id`
- Cardápio público (categories, products): política de leitura pública filtrada por `slug`
- `qr_sessions`: criação pública, confirmação apenas por usuário autenticado do restaurante

---

## Rotas de API

### Auth
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/auth/google` | Inicia fluxo Google OAuth → redireciona para Supabase |
| GET | `/auth/callback` | Callback OAuth → troca code por sessão → redireciona para `/conta` |
| POST | `/api/auth/signout` | Encerra sessão Supabase → redireciona para `/entrar` |

### Stripe
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/stripe/checkout` | Cria sessão de checkout (`plan: basic|pro`) |
| POST | `/api/stripe/webhook` | Eventos Stripe: cria restaurante, salva `plan`, ativa/desativa, envia e-mail |
| POST | `/api/stripe/portal` | Abre portal de gerenciamento da assinatura |
| POST | `/api/stripe/upgrade` | Upgrade Basic → Pro via Stripe subscription update (`proration_behavior: 'none'`) |
| POST | `/api/stripe/downgrade` | Downgrade Pro → Básico (`proration_behavior: 'none'`) |

### Restaurantes
| Método | Rota | Descrição |
|---|---|---|
| PATCH | `/api/restaurants/[id]` | Pausar ou ativar loja (`is_active`) |
| DELETE | `/api/restaurants/[id]` | Excluir restaurante (dono autenticado) |

### Pedidos
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/orders` | Cliente cria pedido (entrega ou mesa) |
| PATCH | `/api/orders/[id]/status` | Funcionário altera status → dispara WhatsApp automático |

### QR Code
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/qrcode/session` | Cliente cria qr_session com itens do carrinho (TTL 15 min) |
| POST | `/api/qrcode/confirm` | Garçom confirma sessão → cria pedido `type=table` |

### ADM do Restaurante
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/adm/[slug]/login` | Login com e-mail + senha ADM — retorna cookie HMAC |
| POST | `/api/adm/[slug]/logout` | Logout do painel ADM |
| GET | `/api/adm/[slug]/funcionarios` | Lista membros enriquecidos com email/avatar do Supabase Auth |
| POST | `/api/adm/[slug]/funcionarios` | Convida membro por e-mail (Supabase invite) ou atualiza cargo |
| DELETE | `/api/adm/[slug]/funcionarios` | Remove membro (não pode remover owner) |
| POST | `/api/adm/[slug]/member-password` | Define/reseta senha ADM de um membro |

### WhatsApp
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/whatsapp/notify` | Envio interno via UltraMSG (protegido por X-Internal-Secret) |
| POST | `/api/whatsapp/test` | Testa configuração de WhatsApp do restaurante |

---

## Autenticação ADM do Restaurante

**Dois sistemas independentes** coexistem:

### 1. Conta HIVI (Google OAuth via Supabase)
- Rotas: `/conta`, `/criar-loja`, `/entrar`
- Cookie gerenciado pelo Supabase SSR
- Middleware protege `saasProtected = ['/conta', '/criar-loja']`

### 2. ADM do Restaurante (HMAC + PBKDF2 — `lib/adm-auth.ts`)
- Funcionários não precisam de conta HIVI
- Senha por membro: hash PBKDF2 (120.000 iterações, salt aleatório 16 bytes)
- Token: `base64url(JSON payload) + "." + HMAC-SHA256`
- Payload: `{ slug, role, name, memberId, ts }` — RBAC sem consulta ao banco
- Cookie `hivi_adm_{slug}`, HttpOnly, Path=`/`, TTL 8h
- Verificado no `adm/layout.tsx` (Node.js runtime, não Edge)
- Dono pode ter senha em `restaurants.adm_password_hash` (legado via /conta) **ou** em `restaurant_users.adm_password_hash`

## Middleware (`middleware.ts`)

Intercepta todas as rotas não estáticas:
- Protege `/conta` e `/criar-loja` via sessão Supabase (redireciona para `/entrar`)
- Injeta header `x-pathname` para layouts server-side detectarem se é rota ADM
- Proteção das rotas ADM (`/[slug]/adm/*`) feita no `adm/layout.tsx` (não no middleware Edge) para garantir que o runtime HMAC seja Node.js

---

## Variáveis de Ambiente

| Variável | Serviço | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | ✅ Configurada |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | ✅ Configurada |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | ✅ Configurada |
| `STRIPE_SECRET_KEY` | Stripe | ✅ Configurada |
| `STRIPE_WEBHOOK_SECRET` | Stripe | ✅ Configurada |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | ✅ Configurada |
| `STRIPE_PRICE_BASIC` | Stripe | ✅ Configurada |
| `STRIPE_PRICE_PRO` | Stripe | ✅ Configurada |
| `ULTRAMSG_INSTANCE_ID` | UltraMSG | ✅ Configurada |
| `ULTRAMSG_TOKEN` | UltraMSG | ✅ Configurada |
| `RESEND_API_KEY` | Resend | ✅ Configurada |
| `RESEND_FROM_EMAIL` | Resend | ✅ Configurada |
| `INTERNAL_API_SECRET` | App | ✅ Configurada (protege /api/whatsapp/notify) |
| `TEMPLATE_RESTAURANT_ID` | App | ✅ Configurada (restaurante template para novos cadastros) |
| `NEXT_PUBLIC_APP_URL` | App | ✅ Configurada (`https://hivi-web.com`) |
| Google OAuth | Supabase Dashboard | ✅ Configurado |

> Guia detalhado de obtenção de cada chave: [`Contextos/SETUP_KEYS.md`](./SETUP_KEYS.md)

---

## Fluxo de Dados: Pedido com Entrega + WhatsApp

```
Cliente (browser)
  → POST /api/orders          (cria pedido com status=pending)
  → Supabase salva pedido

Funcionário (painel adm do restaurante)
  → Vê pedido na lista
  → Altera status (ex: "saiu para entrega")
  → PATCH /api/orders/[id]/status
      → Supabase atualiza status
      → Chama /api/whatsapp/notify
          → UltraMSG envia mensagem no WhatsApp do cliente
```

## Fluxo de Dados: Pedido de Mesa com QR Code

```
Cliente (browser)
  → Monta carrinho
  → Clica "Gerar QR Code"
  → POST /api/orders (cria qr_session com os itens, retorna ID)
  → Exibe QR code com URL: /[slug]/adm/qr/[session_id]

Garçom (painel adm do restaurante, aba "Ler QR Code")
  → Câmera escaneia QR code
  → Acessa /[slug]/adm/qr/[session_id]
  → Sistema exibe itens do pedido + botão "Confirmar Pedido"
  → Garçom confirma
  → qr_session.confirmed = true
  → Pedido criado em orders com type=table
```
