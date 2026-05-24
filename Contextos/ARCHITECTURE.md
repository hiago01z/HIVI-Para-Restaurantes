# HIVI Para Restaurantes — Arquitetura Técnica

## Estrutura de Pastas (Next.js 15 App Router)

```
hivi/
├── app/
│   ├── (saas)/                        # Grupo: landing page e conta HIVI
│   │   ├── page.tsx                   # Landing page (/)
│   │   ├── conta/page.tsx             # Área de conta do dono (/conta)
│   │   ├── criar-loja/page.tsx        # Checkout / criação de cardápio
│   │   ├── entrar/page.tsx
│   │   ├── criar-conta/page.tsx
│   │   ├── como-funciona/page.tsx
│   │   ├── precos/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── feedback/page.tsx
│   │   ├── privacidade/page.tsx
│   │   ├── termos/page.tsx
│   │   └── unsubscribe/page.tsx       # Landing para descadastro de e-mails (List-Unsubscribe)
│   │
│   ├── [slug]/                        # Grupo dinâmico: restaurante
│   │   ├── layout.tsx                 # Tema dinâmico (CSS vars) + CartProvider
│   │   ├── page.tsx                   # Cardápio público: destaques + categorias
│   │   ├── categoria/[id]/page.tsx    # Listagem por categoria
│   │   ├── pedido/page.tsx            # Carrinho + fluxo de pedido (mesa/entrega)
│   │   ├── meu-pedido/[id]/page.tsx   # Acompanhamento realtime (Supabase Realtime)
│   │   ├── _components/               # Componentes do cardápio público
│   │   │   ├── preview-listener.tsx   # postMessage do ADM → prévia ao vivo
│   │   │   ├── active-order-banner.tsx
│   │   │   └── paused-page.tsx        # Tela quando restaurante está inativo
│   │   │
│   │   └── adm/                       # Painel administrativo do restaurante
│   │       ├── layout.tsx             # Auth HMAC + ADM CSS vars + AdmNav
│   │       ├── page.tsx               # Dashboard com métricas do dia
│   │       ├── login/                 # Login e-mail + senha ADM
│   │       ├── pedidos/               # Gestão de pedidos (realtime, RBAC)
│   │       ├── pratos/                # CRUD pratos + adicionais
│   │       ├── categorias/            # CRUD + reordenação
│   │       ├── funcionarios/          # Equipe: convidar, cargo, senha, RBAC
│   │       ├── configuracoes/         # Tema, redes sociais, impressora, horários
│   │       ├── analytics/             # Gráficos e KPIs (Plano Pro)
│   │       ├── qr/[sessionId]/        # Garçom confirma pedido via QR
│   │       └── _components/           # AdmNav, DashboardClient, ImageCropPicker, QrScanner
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── google/route.ts        # Inicia Google OAuth
│   │   │   └── signout/route.ts       # Logout HIVI
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts      # Checkout para planos pagos (basic/pro)
│   │   │   ├── subscribe/route.ts     # Upgrade free → pago (novo checkout)
│   │   │   ├── webhook/route.ts       # Eventos Stripe → cria restaurante, plano
│   │   │   ├── portal/route.ts        # Customer Portal
│   │   │   ├── upgrade/route.ts       # Basic → Pro (subscription update)
│   │   │   └── downgrade/route.ts     # Pro → Basic (subscription update)
│   │   ├── orders/
│   │   │   ├── route.ts               # POST: criar pedido
│   │   │   └── [id]/
│   │   │       ├── status/route.ts    # PATCH: alterar status + WhatsApp
│   │   │       └── payment-status/route.ts # PATCH: alternar pago/não pago
│   │   ├── qrcode/
│   │   │   ├── session/route.ts       # POST: criar qr_session
│   │   │   └── confirm/route.ts       # POST: garçom confirma → cria pedido
│   │   ├── restaurants/
│   │   │   ├── free/route.ts          # POST: criar restaurante gratuito (sem Stripe)
│   │   │   └── [id]/
│   │   │       ├── route.ts           # PATCH (pausar/ativar) + DELETE (excluir + cancelar Stripe)
│   │   │       └── adm-password/route.ts # POST: senha ADM do dono
│   │   ├── adm/[slug]/
│   │   │   ├── login/route.ts         # POST: login ADM → cookie HMAC
│   │   │   ├── logout/route.ts        # POST: logout ADM
│   │   │   ├── funcionarios/route.ts  # GET/POST/DELETE: gerenciar equipe
│   │   │   ├── member-password/route.ts # POST: senha ADM de membro
│   │   │   ├── settings/route.ts      # PATCH: configurações do restaurante (service role)
│   │   │   └── theme/route.ts         # PATCH: tema visual (service role)
│   │   ├── whatsapp/
│   │   │   ├── notify/route.ts        # POST: disparo UltraMSG (internal)
│   │   │   └── test/route.ts          # POST: teste de WhatsApp do restaurante
│   │   └── feedback/route.ts          # POST: envio de feedback
│   │
│   ├── auth/callback/route.ts         # Callback OAuth Supabase
│   ├── icon.tsx                       # Favicon dinâmico (Next.js OG)
│   └── not-found.tsx                  # 404 personalizado HIVI
│
├── contexts/
│   └── cart-context.tsx               # Carrinho global (localStorage)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser client (anon key)
│   │   ├── server.ts                  # Server client (cookies)
│   │   └── adm-restaurant.ts          # Helpers: getAdmRestaurant(), getAdmRestaurantId() (service role)
│   ├── adm-auth.ts                    # HMAC tokens + PBKDF2 (senhas ADM)
│   ├── analytics-pdf.ts               # Geração PDF de analytics (jsPDF + autotable)
│   ├── color-utils.ts                 # getContrastColor, computeLabelShadow
│   ├── currency.ts                    # formatCurrency(value, currency) — Intl.NumberFormat BRL/EUR
│   ├── delivery-hours.ts              # Tipos DeliveryHoursConfig + checkDeliveryOpen()
│   ├── phone.ts                       # Utilitários tel. internacional: parseStoredPhone, buildFullPhone, isPhoneValid
│   ├── pix.ts                         # Gerador BR Code EMV (PIX Banco Central) sem dependências externas
│   ├── plan-limits.ts                 # getEffectiveLimits(plan, trial_ends_at)
│   ├── rate-limit.ts                  # Rate limiting in-memory (sem Redis)
│   ├── resend.ts                      # Resend SDK: 3 identidades (noreply/support/feedback), List-Unsubscribe, onboarding queue
│   ├── ultramsg.ts                    # Cliente UltraMSG (WhatsApp)
│   └── thermal-printer/
│       ├── escpos.ts                  # Encoder ESC/POS: CutMode, Charset, entrega
│       ├── printer.ts                 # USB/BT/Rede/Browser + checkNetworkAgent
│       └── receipt-html.ts            # HTML de cupom para modo "Via sistema"
│
├── public/
│   └── hivi-print-agent.js            # Agente TCP local (Node.js): browser → porta 9100
│
├── middleware.ts                       # Proteção /conta e /criar-loja; header x-pathname; detecção locale por IP → cookie hivi_locale
└── supabase/migrations/               # 17 migrations SQL em ordem
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
plan                     text DEFAULT 'free' CHECK (plan IN ('free','basic','pro'))  -- 011/014
trial_ends_at            timestamptz                              -- migration 014
stripe_customer_id       text
stripe_subscription_id   text
adm_password_hash        text                                     -- senha legada do dono
instagram_url            text
whatsapp_number          text
whatsapp_notify_enabled  boolean NOT NULL DEFAULT true           -- migration 012
delivery_enabled         boolean NOT NULL DEFAULT true           -- migration 013
delivery_hours           jsonb                                    -- migration 008
pix_key                  text                                     -- migration 016
pix_key_type             text CHECK (pix_key_type IN ('cpf','cnpj','email','phone','evp'))  -- migration 016
currency                 text NOT NULL DEFAULT 'BRL'              -- migration 017: 'BRL' | 'EUR'
created_at               timestamptz DEFAULT now()
```

### `restaurant_users` — Membros da equipe
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id     uuid REFERENCES restaurants(id) ON DELETE CASCADE
user_id           uuid REFERENCES auth.users(id)
role              text CHECK (role IN ('owner','manager','cook','waiter','delivery'))
name              text                                            -- migration 007: nome de exibição
adm_password_hash text                                           -- migration 007: senha ADM individual
session_id        text                                           -- migration 014: login único (free)
created_at        timestamptz DEFAULT now()
```

### `restaurant_themes` — Tema visual
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
label_font            text DEFAULT 'dancing-script'              -- migration 005
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
display_order   int DEFAULT 0
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
is_featured     boolean DEFAULT false
is_available    boolean DEFAULT true
created_at      timestamptz DEFAULT now()
```

### `product_option_groups` — Grupos de adicionais (migration 010)
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

### `orders` — Pedidos
```sql
id                   uuid PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id        uuid REFERENCES restaurants(id)
order_number         int
type                 text CHECK (type IN ('table','delivery'))
status               text CHECK (status IN (
                       'pending','confirmed','preparing','ready',
                       'out_for_delivery','delivered','cancelled'
                     )) DEFAULT 'pending'
payment_status       text DEFAULT 'unpaid'                       -- migration 006b
payment_changed_by   text                                        -- migration 009: audit trail
status_changed_by    text                                        -- migration 007: audit trail
customer_name        text
customer_phone       text
table_number         text
address              text
payment_method       text
change_for           numeric(10,2)
total                numeric(10,2)
notes                text
created_at           timestamptz DEFAULT now()
updated_at           timestamptz DEFAULT now()
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
selected_options jsonb                                           -- migration 010: adicionais
```

### `email_queue` — Fila de e-mails de onboarding (migration 015)
```sql
id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id  uuid REFERENCES restaurants(id) ON DELETE CASCADE
to_email       text NOT NULL
type           text NOT NULL CHECK (type IN ('welcome','onboarding_d3','trial_ending'))
send_at        timestamptz NOT NULL
sent_at        timestamptz                -- null = pendente
error          text                       -- mensagem de erro se falhou
created_at     timestamptz NOT NULL DEFAULT now()
```

### `qr_sessions` — Sessões QR (cliente → garçom)
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
restaurant_id   uuid REFERENCES restaurants(id)
order_data      jsonb NOT NULL
confirmed       boolean DEFAULT false
confirmed_at    timestamptz
order_id        uuid REFERENCES orders(id)                      -- migration 006
expires_at      timestamptz DEFAULT now() + interval '15 minutes'
created_at      timestamptz DEFAULT now()
```

---

## Migrations (ordem de execução)

| Arquivo | Conteúdo |
|---|---|
| `001_initial_schema.sql` | Tabelas base + RLS inicial |
| `002_theme_extra_colors.sql` | Colunas extras de tema |
| `003_adm_password.sql` | `adm_password_hash` em `restaurants` |
| `004_storage_policies.sql` | Bucket `restaurant-images` + políticas RLS de storage |
| `005_label_columns_and_role_fix.sql` | Colunas `label_*` em `restaurant_themes` + constraint de role |
| `006_qr_session_order_id_and_rls_fixes.sql` | `order_id` em `qr_sessions` + correções de políticas |
| `006b_payment_status.sql` | Coluna `payment_status` em `orders` |
| `007_member_auth_and_rbac.sql` | `name`, `adm_password_hash` em `restaurant_users`; `status_changed_by` em `orders`; constraint 5 cargos |
| `008_delivery_hours.sql` | `delivery_hours` jsonb em `restaurants` |
| `009_payment_changed_by.sql` | `payment_changed_by` em `orders` |
| `010_product_options.sql` | `product_option_groups`, `product_option_items`, `selected_options` em `order_items` |
| `011_pro_plan.sql` | `plan TEXT CHECK (basic\|pro)` em `restaurants` |
| `012_whatsapp_notify_enabled.sql` | `whatsapp_notify_enabled BOOLEAN DEFAULT true` |
| `013_delivery_enabled.sql` | `delivery_enabled BOOLEAN DEFAULT true` |
| `014_free_plan.sql` | `plan` default → `'free'`, `trial_ends_at TIMESTAMPTZ`, `session_id TEXT` em `restaurant_users` |
| `015_email_queue.sql` | Tabela `email_queue` para fila de e-mails de onboarding (welcome / dia 3 / dia 6) |
| `016_pix_key.sql` | `pix_key TEXT`, `pix_key_type TEXT CHECK (cpf\|cnpj\|email\|phone\|evp)` em `restaurants` |
| `017_currency.sql` | `currency TEXT NOT NULL DEFAULT 'BRL' CHECK (BRL\|EUR)` em `restaurants` |

**Status em produção: todas as 17 migrations aplicadas.**

---

## Row Level Security (RLS)

- `restaurants`: dono vê/edita apenas seus restaurantes (`owner_id = auth.uid()`)
- `restaurant_users`: isolado por `restaurant_id`
- `categories`, `products`, `restaurant_themes`: isolado por `restaurant_id`
- **Cardápio público**: leitura de categorias, produtos e temas filtrada por `is_active IS NOT FALSE`
- `orders`, `order_items`: inserção pública; leitura/atualização via API com token ADM + service role
- `product_option_groups`, `product_option_items`: leitura pública (cardápio), escrita autenticada
- `qr_sessions`: criação pública; leitura pelo restaurant_id
- **Storage** (`restaurant-images`): upload autenticado, leitura pública sem autenticação
- **Regra crítica ADM**: todas as rotas ADM usam `adminClient()` (service role key) após verificar o HMAC cookie — o `createClient()` (anon key) seria bloqueado silenciosamente por RLS pois funcionários ADM não têm sessão Supabase Auth

---

## Rotas de API

### Auth (conta HIVI)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/auth/google` | Inicia fluxo Google OAuth |
| GET | `/auth/callback` | Callback Supabase → sessão → `/conta` |
| POST | `/api/auth/signout` | Logout da conta HIVI |

### Stripe
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/stripe/checkout` | Checkout para novos planos pagos (`plan: basic\|pro`) |
| POST | `/api/stripe/subscribe` | Upgrade free → pago: novo Checkout Session |
| POST | `/api/stripe/webhook` | Eventos Stripe: cria restaurante, plano, e-mail boas-vindas |
| POST | `/api/stripe/portal` | Customer Portal (gerenciar assinatura) |
| POST | `/api/stripe/upgrade` | Basic → Pro (subscription update, `proration_behavior: 'none'`) |
| POST | `/api/stripe/downgrade` | Pro → Basic (subscription update, `proration_behavior: 'none'`) |

### Restaurantes
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/restaurants/free` | Cria restaurante gratuito (sem Stripe): slug, plan='free', trial_ends_at=+7d |
| PATCH | `/api/restaurants/[id]` | Pausar/ativar (`is_active`) |
| DELETE | `/api/restaurants/[id]` | Excluir + cancelar Stripe subscription automaticamente |
| POST | `/api/restaurants/[id]/adm-password` | Define/reseta senha ADM do dono |

### Pedidos
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/orders` | Cliente cria pedido. Rate limit: 10/IP/min. Dispara WhatsApp para entregas. |
| PATCH | `/api/orders/[id]/status` | Alterar status. Requer token ADM. Salva `status_changed_by`. |
| PATCH | `/api/orders/[id]/payment-status` | Alternar pago/não pago. Requer token ADM. Salva `payment_changed_by`. |

### QR Code
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/qrcode/session` | Cliente cria sessão com itens (TTL 15 min). Rate limit: 5/IP/5min. |
| POST | `/api/qrcode/confirm` | Garçom confirma sessão → cria pedido `type=table`. |

### ADM do Restaurante
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/adm/[slug]/login` | Login e-mail + senha ADM → cookie HMAC (`hivi_adm_{slug}`, 8h) |
| POST | `/api/adm/[slug]/logout` | Logout do painel ADM |
| GET | `/api/adm/[slug]/funcionarios` | Lista membros com email/avatar do Supabase Auth |
| POST | `/api/adm/[slug]/funcionarios` | Convida membro ou atualiza cargo/nome |
| DELETE | `/api/adm/[slug]/funcionarios` | Remove membro (não pode remover owner) |
| POST | `/api/adm/[slug]/member-password` | Define/reseta senha ADM de membro específico |
| PATCH | `/api/adm/[slug]/settings` | Atualiza campos do restaurante via service role. Campos PIX (`pix_key`, `pix_key_type`) exigem `role = owner` (403 caso contrário). |
| PATCH | `/api/adm/[slug]/theme` | Upsert completo de `restaurant_themes` via service role |

### WhatsApp
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/whatsapp/notify` | Disparo UltraMSG (interno, protegido por `X-Internal-Secret`) |
| POST | `/api/whatsapp/test` | Envia WhatsApp de teste para o restaurante |

### Outros
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/feedback` | Envia feedback de usuário |

---

## Autenticação

### 1. Conta HIVI (Google OAuth via Supabase)
- Rotas: `/conta`, `/criar-loja`, `/entrar`
- Cookie gerenciado pelo Supabase SSR
- Middleware protege `/conta` e `/criar-loja` → redireciona para `/entrar`

### 2. ADM do Restaurante (HMAC + PBKDF2 — `lib/adm-auth.ts`)
- Funcionários não precisam de conta HIVI
- **Senha por membro**: hash PBKDF2 (120.000 iterações, salt aleatório 16 bytes)
- **Token**: `base64url(JSON) + "." + HMAC-SHA256`
- **Payload**: `{ slug, role, name, memberId, ts, sessionId }` — RBAC sem consulta ao banco
- Cookie `hivi_adm_{slug}`, HttpOnly, Path=`/`, TTL 8h
- Verificado no `adm/layout.tsx` (Node.js runtime — não Edge)
- Dono pode ter senha em `restaurants.adm_password_hash` (legado) **ou** em `restaurant_users.adm_password_hash`
- Tokens antigos (sem `.`) retornam null → forçam re-login uma vez
- **Login único por dispositivo (plano free)**: login gera novo `session_id`; `adm/layout.tsx` compara com o do banco a cada page load — mismatch → redirect `/login?reason=session_expired`

### Middleware (`middleware.ts`)
- Protege `/conta` e `/criar-loja` via Supabase session
- Injeta header `x-pathname` para layouts server detectarem rota ADM
- Proteção ADM feita no `adm/layout.tsx` (não no middleware Edge) — HMAC requer Node.js runtime
- **Detecção de locale por IP**: `request.geo?.country` (Vercel Edge nativo) → seta cookie `hivi_locale` ('BR' ou 'PT') em toda requisição; ignora se `hivi_locale_manual` presente; override via `?locale=PT`

---

## Planos e Limites

| | **Gratuito** | **Básico** | **Pro** |
|---|---|---|---|
| Preço (BRL) | R$ 0 | R$ 59,99/mês | R$ 99,99/mês |
| Preço (EUR) | € 0 | € 24,99/mês | € 39,99/mês |
| Pratos | 16 | Ilimitado | Ilimitado |
| Categorias | 4 | Ilimitado | Ilimitado |
| Adicionais/prato | 1 grupo | Ilimitado | Ilimitado |
| Membros da equipe | 4 | Ilimitado | Ilimitado |
| WhatsApp automático | ❌ | ✅ | ✅ |
| Analytics (gráficos, CSV, PDF) | ❌ | ❌ | ✅ |
| Login único por dispositivo | ✅ (session_id) | ❌ | ❌ |
| Trial | 7 dias Pro | — | — |

**Soft-lock (plano free)**: pratos em excesso são auto-pausados (`is_available=false`) no carregamento da página ADM — nunca deletados. Implementado em `lib/plan-limits.ts → getEffectiveLimits()`.

**Regras do Trial de 7 dias:**
- O trial começa no momento da criação do restaurante (qualquer plano) e dura 7 dias (`trial_ends_at = now() + 7d`)
- Durante o trial, `getEffectiveLimits()` retorna `PRO_LIMITS` independente do plano atual
- Banner "Trial Pro ativo" exibido **apenas para planos `free` e `basic`** — plano `pro` já tem todos os recursos e não precisa do aviso
- Planos `basic` e `pro` são cobrados imediatamente pelo Stripe no momento da assinatura — o trial não é um período gratuito de planos pagos; é um período do **plano free com recursos Pro**
- Se o cliente estiver em trial free e fizer upgrade para `basic`, o banner continua visível e os recursos Pro continuam ativos até o trial expirar
- Se o cliente fizer upgrade para `pro` durante o trial, o banner desaparece mas o `trial_ends_at` continua contando — se fizer downgrade antes de expirar, ainda terá os dias restantes

---

## Impressão Térmica

### Modos de conexão (`lib/thermal-printer/printer.ts`)

| Tipo | Protocolo | Requisito |
|---|---|---|
| `usb` | WebUSB API | Chrome desktop, cabo USB |
| `bluetooth` | Web Bluetooth API | Chrome desktop/mobile, BT ativo |
| `network` | HTTP → agente TCP local | `hivi-print-agent.js` rodando, impressora em rede (porta 9100) |
| `browser` | `window.print()` + iframe | Qualquer browser, impressora no OS |

### BLE UUIDs cobertos
- Generic ESC/POS: `000018f0-...`
- SUNMI / Xprinter: `49535343-fe7d-...`
- Peripage / modelos chineses: `0000ff00-...`, `0000ffe0-...`
- Nordic UART (budget): `6e400001-...` (TX: `6e400002-...`)

### ESC/POS encoder (`lib/thermal-printer/escpos.ts`)
- `CutMode`: `'partial' | 'full' | 'none'`
- `Charset`: `'ascii'` (seguro, sem acentos) ou `'latin1'` (Windows-1252, ã ç é á)
- Delivery details no cupom: endereço, telefone, forma de pagamento, troco
- `encodeOrder(order, restaurantName?, width?, cutMode?, charset?)`

### Agente TCP local (`public/hivi-print-agent.js`)
- Node.js: `node hivi-print-agent.js`
- Expõe `POST /print` e `GET /status` em `http://localhost:6557`
- `checkNetworkAgent(agentUrl)` — verifica se o agente está online (timeout 3s)

---

## Fluxo de Dados: Pedido de Entrega + WhatsApp

```
Cliente (browser)
  → POST /api/orders          (cria pedido, status=pending)
  → Supabase salva pedido
  → WhatsApp disparado via UltraMSG se whatsapp_notify_enabled=true e plano≥basic

Funcionário (ADM)
  → Vê pedido na lista (Realtime)
  → Altera status
  → PATCH /api/orders/[id]/status (service role)
      → atualiza status + status_changed_by no banco
      → chama /api/whatsapp/notify → UltraMSG → WhatsApp do cliente
```

## Fluxo de Dados: Pedido de Mesa com QR Code

```
Cliente (browser)
  → Monta carrinho → "Gerar QR Code"
  → POST /api/qrcode/session → retorna session_id
  → Exibe QR com URL /[slug]/adm/qr/[session_id]

Garçom (ADM → aba "Ler QR Code")
  → Câmera escaneia QR (jsQR + canvas)
  → Acessa /[slug]/adm/qr/[session_id]
  → Exibe itens + "Confirmar Pedido"
  → POST /api/qrcode/confirm → cria orders (type=table)
  → Aparece na aba "Mesa" do ADM em tempo real
```

## Fluxo de Dados: Novo Restaurante Gratuito

```
Dono acessa /criar-loja → seleciona "Gratuito"
  → POST /api/restaurants/free
      → gera slug único
      → INSERT em restaurants: plan='free', trial_ends_at=now()+7d
      → INSERT em restaurant_users: role='owner'
      → copia template (categorias, produtos, tema)
      → seta cookie HMAC para primeiro acesso imediato
  → redirect /[slug]/adm (já autenticado)
```

## Fluxo de Dados: Upgrade Free → Pro

```
Dono em /conta → "Assinar plano"
  → POST /api/stripe/subscribe (se não tem Stripe) → Checkout Session
  OU
  → POST /api/stripe/upgrade (se já tem assinatura Basic) → subscription update
  → Stripe webhook: customer.subscription.updated
      → UPDATE restaurants SET plan='pro', stripe_*=...
  → /conta mostra badge Pro
```

---

## Gerador de PIX BR Code (`lib/pix.ts`)

Implementação do padrão EMV QR Code do Banco Central do Brasil **sem dependências externas**.

### Funções exportadas

| Função / Constante | Descrição |
|---|---|
| `generatePixPayload(options)` | Gera o BR Code completo (string) para QR Code estático |
| `validatePixKey(type, value)` | Valida chave por tipo (regex BCB) |
| `normalizePixKey(type, value)` | Normaliza para formato esperado (remove máscara, adiciona `+55`) |
| `PIX_KEY_LABELS` | Mapa `PixKeyType → label` em PT-BR |
| `PIX_KEY_PLACEHOLDERS` | Mapa `PixKeyType → placeholder` para inputs |

### Detalhes técnicos

- **CRC16-CCITT**: cada shift mascara para 16 bits (`& 0xffff`) — obrigatório em JavaScript por causa dos inteiros 32-bit internos
- **Point of Initiation**: `11` (QR estático reutilizável) — não `12` (QR dinâmico/PSP que exigiria API do banco)
- **Campos EMV** em ordem crescente de ID: `00` → `01` → `26` → `52` → `53` → `54` (valor) → `58` → `59` → `60` → `62` → `6304` + CRC
- **Sanitização**: nome e cidade do lojista têm acentos removidos via NFD + regex antes de entrar no payload

### Uso nos pedidos

```tsx
// Pedidos → modal PIX
const payload = generatePixPayload({
  key: pixKey,
  merchantName: restaurantName,
  amount: order.total,
  txid: `HIVI${order.order_number}`,
})
// Renderiza com <QRCodeSVG value={payload} />
```

---

## Sistema de E-mail (`lib/resend.ts`)

Três identidades separadas para clareza e deliverability:

| Identidade | Endereço | Uso |
|---|---|---|
| `FROM_NOREPLY` | `noreply@hivi-web.com` | E-mails automáticos: boas-vindas, convite de membro |
| `FROM_SUPPORT` | `support@hivi-web.com` | `Reply-To` em todos os transacionais; atendimento manual |
| `FROM_FEEDBACK` | `feedback@hivi-web.com` | Canal de feedback de usuários |

Todos os e-mails transacionais incluem cabeçalhos de deliverability:
- `List-Unsubscribe: <mailto:support@hivi-web.com?subject=unsubscribe>, <https://hivi-web.com/unsubscribe>`
- `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
- `X-Entity-Ref-ID: <email-destino>` (previne duplicatas em alguns provedores)

Funções: `sendWelcomeEmail()`, `sendMemberInviteEmail()`, `sendSupportEmail()`, `sendFeedbackEmail()`.

---

## Variáveis de Ambiente

| Variável | Serviço |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (escrita ADM) |
| `STRIPE_SECRET_KEY` | Stripe |
| `STRIPE_WEBHOOK_SECRET` | Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe |
| `STRIPE_PRICE_BASIC` | Price ID R$59,99/mês (BRL) |
| `STRIPE_PRICE_PRO` | Price ID R$99,99/mês (BRL) |
| `STRIPE_PRICE_BASIC_EUR` | Price ID €24,99/mês (EUR — Portugal) |
| `STRIPE_PRICE_PRO_EUR` | Price ID €39,99/mês (EUR — Portugal) |
| `ULTRAMSG_INSTANCE_ID` | UltraMSG |
| `ULTRAMSG_TOKEN` | UltraMSG |
| `RESEND_API_KEY` | Resend |
| `RESEND_FROM_NOREPLY` | `noreply@hivi-web.com` — e-mails automáticos (boas-vindas, convite) |
| `RESEND_FROM_SUPPORT` | `support@hivi-web.com` — reply-to em todos os transacionais |
| `RESEND_FROM_FEEDBACK` | `feedback@hivi-web.com` — canal de feedback |
| `INTERNAL_API_SECRET` | Protege `/api/whatsapp/notify` |
| `TEMPLATE_RESTAURANT_ID` | ID do restaurante template |
| `NEXT_PUBLIC_APP_URL` | `https://hivi-web.com` |

> Guia detalhado de obtenção de cada chave: [`SETUP_KEYS.md`](./SETUP_KEYS.md)
