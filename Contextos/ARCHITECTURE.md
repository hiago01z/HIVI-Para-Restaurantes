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
id                     uuid PRIMARY KEY DEFAULT gen_random_uuid()
owner_id               uuid REFERENCES auth.users(id)   -- dono (conta HIVI)
name                   text NOT NULL
slug                   text UNIQUE NOT NULL              -- usado na URL /[slug]
logo_url               text
is_active              boolean DEFAULT true              -- pausar/ativar loja
stripe_customer_id     text
stripe_subscription_id text
plan                   text DEFAULT 'basic'
instagram_url          text
whatsapp_number        text                             -- número para UltraMSG
created_at             timestamptz DEFAULT now()
```

### `restaurant_users` — Funcionários do restaurante
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id   uuid REFERENCES restaurants(id) ON DELETE CASCADE
user_id         uuid REFERENCES auth.users(id)
role            text CHECK (role IN ('owner','admin','waiter'))
created_at      timestamptz DEFAULT now()
```

### `restaurant_themes` — Tema visual do restaurante
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id    uuid REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE
primary_color    text DEFAULT '#FF6B00'
secondary_color  text DEFAULT '#1A0A00'
background_color text DEFAULT '#2C1A0E'
font_family      text DEFAULT 'serif'
font_size_base   text DEFAULT '16px'
banner_url       text
updated_at       timestamptz DEFAULT now()
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
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
order_id        uuid REFERENCES orders(id) ON DELETE CASCADE
product_id      uuid REFERENCES products(id)
product_name    text NOT NULL                    -- snapshot do nome no momento
product_price   numeric(10,2) NOT NULL           -- snapshot do preço
quantity        int NOT NULL DEFAULT 1
notes           text
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
| GET | `/api/auth/callback` | Callback OAuth → troca code por sessão → redireciona para `/conta` |
| POST | `/api/auth/signout` | Encerra sessão Supabase → redireciona para `/entrar` |

### Stripe
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/stripe/checkout` | Cria sessão de checkout (valida slug + auth) |
| POST | `/api/stripe/webhook` | Eventos Stripe: cria restaurante, ativa/desativa, envia e-mail Resend |
| POST | `/api/stripe/portal` | Cria sessão do Billing Portal (gerenciar assinatura) |

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

### WhatsApp
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/whatsapp/notify` | Envio interno via UltraMSG |

---

## Middleware de Autenticação

`middleware.ts` intercepta toda rota `/[slug]/adm/*`:
1. Verifica sessão Supabase
2. Verifica se o usuário é `restaurant_user` do restaurante com aquele `slug`
3. Redireciona para `/[slug]/adm/login` se não autenticado

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
| `ULTRAMSG_INSTANCE_ID` | UltraMSG | ✅ Configurada |
| `ULTRAMSG_TOKEN` | UltraMSG | ✅ Configurada |
| `RESEND_API_KEY` | Resend | ⬜ Pendente |
| `RESEND_FROM_EMAIL` | Resend | ⬜ Pendente |
| `NEXT_PUBLIC_APP_URL` | App | ✅ Configurada (`https://hivi.vercel.app`) |
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
