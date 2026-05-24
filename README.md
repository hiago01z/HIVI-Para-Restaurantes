# HIVI Para Restaurantes

> SaaS multi-tenant de cardápio digital para restaurantes. Cada restaurante tem seu próprio cardápio público, painel administrativo e QR code — tudo a partir de uma única plataforma.

**Produção:** [hivi-web.com](https://hivi-web.com)

---

## Índice

- [O que é](#o-que-é)
- [As Três Áreas](#as-três-áreas)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Banco de Dados](#banco-de-dados)
- [API Reference](#api-reference)
- [Autenticação](#autenticação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Como Rodar Localmente](#como-rodar-localmente)
- [Migrations](#migrations)
- [Deploy](#deploy)
- [Documentação Interna](#documentação-interna)

---

## O que é

HIVI é uma plataforma SaaS onde donos de restaurante contratam um plano e recebem:

- Um **cardápio digital público** acessível por QR code ou link direto
- Um **painel administrativo** para gerenciar pedidos, pratos, equipe e configurações
- **Integrações automáticas** com WhatsApp (notificação de entregas) e Stripe (billing)

O modelo é **multi-tenant path-based**: todos os restaurantes rodam no mesmo código Next.js via `[slug]` dinâmico. Dados completamente isolados por `restaurant_id` com RLS no Supabase.

---

## As Três Áreas

```
hivi-web.com/               → Plataforma HIVI (landing, conta, billing)
hivi-web.com/[slug]         → Cardápio público do restaurante
hivi-web.com/[slug]/adm     → Painel administrativo do restaurante
```

---

## Funcionalidades

### Plataforma HIVI (`/`)

| Funcionalidade | Detalhe |
|---|---|
| Landing page | Hero, como funciona, depoimentos, preços, FAQ, rodapé |
| Autenticação | Login/cadastro via Google OAuth (Supabase Auth) |
| Área de conta (`/conta`) | Listar cardápios, acessar painel ADM, pausar, excluir |
| Criar cardápio (`/criar-loja`) | Checkout Stripe ou criação gratuita; seletor de plano; copia template |
| Billing portal | Gerenciar assinatura via Stripe Customer Portal |
| Banners de feedback | Sucesso em `/conta?success=1`, cancelamento em `/criar-loja?cancelled=1` |
| Internacionalização EUR/PT | Detecção de locale por IP (Vercel Edge `request.geo?.country`) → cookie `hivi_locale`; preços exibidos em BRL ou EUR em toda a plataforma automaticamente; override via `?locale=PT` |

### Cardápio Público (`/[slug]`)

| Funcionalidade | Detalhe |
|---|---|
| Home | Carrossel de destaques + grid de categorias com imagens |
| Categorias | Listagem de pratos com ordenação (preço, nome) |
| Carrinho | Persistido em `localStorage`, acessível em qualquer página |
| Pré-preenchimento de entrega | Nome, endereço e telefone salvos do último pedido (sem login) |
| Telefone internacional | Campo de código de país editável (+55 BR / +351 PT padrão); aceita qualquer código |
| Pedido de mesa via QR | Gera QR code → garçom escaneia e confirma |
| Pedido de entrega | Formulário completo → WhatsApp automático para o restaurante |
| Observações | Campo de obs em ambos os fluxos (mesa e entrega) |
| Horário de entregas | Bloqueio automático do botão de entrega fora do horário configurado |
| Entregas desativadas | Quando `delivery_enabled=false`, botão de entrega some completamente do cardápio |
| Acompanhamento em tempo real | `/meu-pedido/[id]` com status via Supabase Realtime |
| Banner ativo | Exibe o pedido em andamento em todas as páginas do cardápio |
| Temas dinâmicos | CSS vars por restaurante (4 temas pré-definidos + personalização) |
| Página pausada | Tela específica quando restaurante está inativo (não 404) |
| SEO | `generateMetadata` por restaurante, OG tags, Twitter card |
| Favicon dinâmico | Garfo laranja via `app/icon.tsx` (Next.js OG) |

### Painel Administrativo (`/[slug]/adm`)

| Área | Funcionalidades |
|---|---|
| **Dashboard** | Métricas do dia (pedidos, em andamento, receita), últimos pedidos |
| **Pedidos** | Tabs entrega/mesa/QR, filtro de período, realtime, alterar status, badge Pago/Não Pago com audit trail, observações, impressão por pedido |
| **Leitor de QR Code** | Scanner via câmera (jsQR + canvas, iOS/Android) + fallback por foto |
| **Pratos** | CRUD completo, destaques, crop de imagem, **Adicionais** (grupos e itens com edição inline) |
| **Categorias** | CRUD + reordenação, crop de imagem |
| **Funcionários** | Convidar por e-mail (Supabase invite), cargo, nome de exibição, senha ADM individual, remover |
| **Analytics** ⭐ Pro | Receita/pedidos por dia, top produtos, pedidos por tipo, horário de pico, KPIs, comparativo semanal, exportação CSV e PDF |
| **Configurações** | Status, redes sociais, WhatsApp + toggle de notificação + teste (com telefone internacional), logo, banner, tema completo com prévia ao vivo, **toggle de entregas** (restaurantes só mesa), horário de entregas, **taxa de entrega** (owner/manager), chave PIX + QR code (apenas BRL), impressora térmica (USB/BT/Sistema), QR code download, **endereço do restaurante** (exibido no rodapé do cardápio) |
| **Notificação sonora** | Beep duplo (Web Audio API), toggle ativo/pausado no header |
| **Impressão térmica** | USB (WebUSB), Bluetooth (Web BT), Rede TCP (agente local), Via Sistema (window.print); cut mode; charset Latin-1 para acentos; auto-impressão; reimpressão manual por pedido |

### RBAC — Controle de Acesso por Cargo

| Cargo | Tabs visíveis | Status permitidos | Pagamento |
|---|---|---|---|
| `owner` | Entrega + Mesa + QR | Todos | ✅ |
| `manager` | Entrega + Mesa + QR | Todos | ✅ |
| `cook` | Entrega + Mesa | Aguardando → Pronto | ✅ |
| `waiter` | Entrega + Mesa + QR | Aguardando → Saiu p/ entrega | ✅ |
| `delivery` | Apenas Entrega | Saiu p/ entrega → Entregue | ✅ |

### Planos

| Plano | Preço BR | Preço PT | Inclui |
|---|---|---|---|
| **Gratuito** | R$ 0 | € 0 | Até 16 pratos, 4 categorias, 1 adicional/prato, equipe de 4, sem WhatsApp automático, sem Analytics. 7 dias de trial com tudo do Pro ao criar. Login único por dispositivo (session_id). |
| **Básico** | R$ 59,99/mês | € 24,99/mês | Tudo do Free ilimitado + WhatsApp automático + equipe ilimitada |
| **Pro** | R$ 99,99/mês | € 39,99/mês | Tudo do Básico + Analytics completo (gráficos, KPIs, CSV, PDF) |

A moeda é determinada pelo locale detectado no momento da criação (`currency: 'BRL' | 'EUR'` salvo no restaurante). Upgrade e downgrade via `/conta` sem cancelar a assinatura — troca o price na subscription do Stripe (`proration_behavior: 'none'`), próxima fatura já reflete o novo valor.

Restaurantes criados no plano Gratuito usam `POST /api/restaurants/free` (sem Stripe) e têm `trial_ends_at = now() + 7 days`. Durante o trial, `getEffectiveLimits()` retorna `PRO_LIMITS`. Após o trial, pratos em excesso são auto-pausados (`is_available=false`) no carregamento da página ADM — nunca deletados (soft-lock).

---

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js (App Router) | 14.2.x | Framework principal — SSR, API Routes, middleware |
| React | 18 | UI |
| TypeScript | 5 | Tipagem estática |
| Tailwind CSS | 3 | Estilização |
| Supabase | — | PostgreSQL, Auth (Google OAuth), Storage, Realtime |
| Stripe | — | Checkout, webhooks, Customer Portal, upgrade/downgrade de plano |
| Resend | — | E-mails transacionais (boas-vindas) |
| UltraMSG | — | WhatsApp automático para pedidos de entrega |
| Vercel | — | Hospedagem, deploy automático via GitHub |
| Zod | — | Validação de schemas nas API Routes |
| `recharts` | — | Gráficos do Analytics (AreaChart, BarChart, PieChart) |
| `jspdf` + `jspdf-autotable` | — | Geração de PDF do Analytics (dynamic import) |
| `qrcode.react` | — | Geração de QR codes (SVG) |
| `jsqr` | — | Leitura de QR codes via câmera/canvas |
| `lucide-react` | — | Ícones |

---

## Estrutura do Projeto

```
app/
├── (saas)/                     # Plataforma HIVI
│   ├── page.tsx                # Landing page
│   ├── conta/                  # Área de conta do dono
│   ├── criar-loja/             # Checkout Stripe
│   ├── entrar/                 # Login Google
│   ├── criar-conta/
│   ├── como-funciona/
│   ├── precos/
│   ├── faq/
│   ├── feedback/
│   ├── privacidade/
│   └── termos/
│
├── [slug]/                     # Cardápio por restaurante
│   ├── layout.tsx              # Aplica tema dinâmico (CSS vars) + CartProvider
│   ├── page.tsx                # Home: destaques + categorias
│   ├── categoria/[id]/         # Listagem por categoria
│   ├── pedido/                 # Carrinho + fluxo de pedido
│   ├── meu-pedido/[id]/        # Acompanhamento realtime
│   ├── _components/            # Componentes do cardápio público
│   │   ├── preview-listener    # Recebe postMessage do ADM para prévia ao vivo
│   │   ├── active-order-banner # Banner flutuante de pedido ativo
│   │   └── paused-page         # Tela de restaurante pausado
│   │
│   └── adm/                    # Painel administrativo
│       ├── layout.tsx          # Auth HMAC + ADM CSS vars + AdmNav
│       ├── page.tsx            # Dashboard
│       ├── login/              # Login do restaurante (e-mail + senha)
│       ├── pedidos/            # Gestão de pedidos
│       ├── pratos/             # CRUD de pratos
│       ├── categorias/         # CRUD de categorias
│       ├── funcionarios/       # Gerenciar equipe
│       ├── configuracoes/      # Todas as configurações
│       ├── qr/[sessionId]/     # Garçom confirma pedido via QR
│       └── _components/        # AdmNav, DashboardClient, ImageCropPicker, QrScanner
│
├── api/
│   ├── auth/                   # signout, google
│   ├── stripe/                 # checkout, webhook, portal
│   ├── orders/                 # POST (criar), PATCH status, PATCH payment-status
│   ├── qrcode/                 # session (criar), confirm (garçom)
│   ├── restaurants/[id]/       # PATCH, DELETE, adm-password
│   ├── adm/[slug]/             # login, logout, funcionarios, member-password
│   ├── whatsapp/               # notify, test
│   └── feedback/
│
├── auth/callback/              # Callback OAuth do Supabase
├── icon.tsx                    # Favicon dinâmico (Next.js OG)
└── not-found.tsx               # 404 personalizado

contexts/
└── cart-context.tsx            # Carrinho global (localStorage)

lib/
├── supabase/
│   ├── client.ts               # Browser client
│   ├── server.ts               # Server client (cookies)
│   └── adm-restaurant.ts       # Helpers de lookup de restaurante
├── adm-auth.ts                 # HMAC tokens + PBKDF2 para senhas ADM
├── analytics-pdf.ts            # Geração de PDF de analytics (jsPDF + autotable)
├── color-utils.ts              # getContrastColor, computeLabelShadow
├── currency.ts                 # formatCurrency(value, currency) — Intl.NumberFormat BRL/EUR
├── delivery-hours.ts           # Tipos e lógica de horário de entregas
├── phone.ts                    # Utilitários de telefone internacional (parse, validate, build)
├── pix.ts                      # Gerador BR Code EMV (PIX Banco Central) sem dependências
├── plan-limits.ts              # getEffectiveLimits(plan, trial_ends_at) — limites por plano + trial
├── rate-limit.ts               # Rate limiting in-memory
├── resend.ts                   # SDK Resend: 3 identidades, List-Unsubscribe, onboarding queue
├── ultramsg.ts                 # Cliente UltraMSG (WhatsApp)
└── thermal-printer/
    ├── escpos.ts               # Encoder ESC/POS puro (CutMode, Charset Latin-1/ASCII, entrega)
    ├── printer.ts              # Conexão USB/BT/Rede/Browser + checkNetworkAgent
    └── receipt-html.ts         # HTML de cupom para modo "Via sistema"

supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_theme_extra_colors.sql
    ├── 003_adm_password.sql
    ├── 004_storage_policies.sql
    ├── 005_label_columns_and_role_fix.sql
    ├── 006_qr_session_order_id_and_rls_fixes.sql
    ├── 006b_payment_status.sql
    ├── 007_member_auth_and_rbac.sql
    ├── 008_delivery_hours.sql
    ├── 009_payment_changed_by.sql
    ├── 010_product_options.sql
    ├── 011_pro_plan.sql
    ├── 012_whatsapp_notify_enabled.sql
    ├── 013_delivery_enabled.sql
    └── 014_free_plan.sql
```

---

## Banco de Dados

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `restaurants` | Dados do restaurante: slug, nome, logo, status, plano (`free`/`basic`/`pro`), currency (`BRL`/`EUR`), whatsapp_number, whatsapp_notify_enabled, delivery_enabled, delivery_hours, delivery_fee, address, pix_key, pix_key_type, trial_ends_at, stripe_*, adm_password_hash |
| `restaurant_users` | Membros da equipe: role (owner/manager/cook/waiter/delivery), name, adm_password_hash, session_id (login único por dispositivo no plano free) |
| `restaurant_themes` | Tema visual completo: cores, fonte, tamanho, banner, label (fonte/cor/efeito/stroke/offset) |
| `categories` | Categorias do cardápio: nome, imagem, display_order |
| `products` | Pratos/bebidas: nome, preço, imagem, is_featured, is_available, category_id |
| `product_option_groups` | Grupos de adicionais por produto: nome, min/max seleções, sort_order |
| `product_option_items` | Itens de cada grupo: nome, price_addition, is_available, sort_order |
| `orders` | Pedidos: type (table/delivery), status (7 estados), payment_status, payment_changed_by, status_changed_by, customer_*, notes, total (itens-only, analytics usa este), delivery_fee (snapshot da taxa no momento do pedido — não soma em analytics) |
| `order_items` | Itens de cada pedido com snapshot de nome/preço + selected_options JSONB |
| `qr_sessions` | Sessões QR de mesa: TTL 15 min, order_data JSON, confirmed, order_id |

### RLS (Row Level Security)

Todas as tabelas têm RLS ativo. Políticas principais:

- **Cardápio público**: leitura de categorias, produtos e temas de restaurantes ativos (`is_active IS NOT FALSE`)
- **Funcionários**: acesso via `restaurant_users` com `auth.uid()`
- **Pedidos**: inserção pública (qualquer cliente pode criar), leitura/atualização apenas via API com autenticação ADM
- **Storage** (`restaurant-images`): upload autenticado, leitura pública

---

## API Reference

### Autenticação HIVI (Google OAuth)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/auth/google` | Inicia fluxo OAuth Google |
| `GET` | `/auth/callback` | Callback do Supabase após OAuth |
| `POST` | `/api/auth/signout` | Logout da conta HIVI |

### Stripe

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/stripe/checkout` | Cria sessão de checkout (`plan: basic\|pro`) para novos restaurantes pagos |
| `POST` | `/api/stripe/subscribe` | Cria Stripe Checkout Session para restaurante free existente (upgrade free → pago) |
| `POST` | `/api/stripe/webhook` | Recebe eventos Stripe: cria restaurante, salva plano, ativa/desativa, envia e-mail |
| `POST` | `/api/stripe/portal` | Abre portal de gerenciamento do cliente |
| `POST` | `/api/stripe/upgrade` | Upgrade Basic → Pro via subscription update (`proration_behavior: 'none'`) |
| `POST` | `/api/stripe/downgrade` | Downgrade Pro → Básico (`proration_behavior: 'none'`) |

### Restaurantes

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/restaurants/free` | Cria restaurante no plano Gratuito (sem Stripe). Gera slug, define plan='free', trial_ends_at=now()+7d, auto-gera cookie ADM para primeiro acesso. |
| `PATCH` | `/api/restaurants/[id]` | Pausar/ativar (`is_active`) |
| `DELETE` | `/api/restaurants/[id]` | Excluir restaurante e cancelar assinatura Stripe automaticamente |
| `POST` | `/api/restaurants/[id]/adm-password` | Definir/resetar senha ADM do dono |

### Pedidos

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/orders` | Cliente cria pedido (entrega ou mesa). Rate limit: 10/IP/min. Dispara WhatsApp para entregas. |
| `PATCH` | `/api/orders/[id]/status` | Altera status do pedido. Requer token ADM. |
| `PATCH` | `/api/orders/[id]/payment-status` | Alterna `paid`/`unpaid`. Requer token ADM. |

### QR Code

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/qrcode/session` | Cliente cria sessão QR com itens do carrinho (TTL 15 min). Rate limit: 5/IP/5min. |
| `POST` | `/api/qrcode/confirm` | Garçom confirma sessão → cria pedido no banco. |

### ADM do Restaurante

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/adm/[slug]/login` | Login com e-mail + senha ADM. Retorna cookie HMAC. |
| `POST` | `/api/adm/[slug]/logout` | Logout do painel ADM. |
| `GET` | `/api/adm/[slug]/funcionarios` | Lista membros da equipe. |
| `POST` | `/api/adm/[slug]/funcionarios` | Convida membro (Supabase invite) ou atualiza cargo. |
| `DELETE` | `/api/adm/[slug]/funcionarios` | Remove membro da equipe. |
| `POST` | `/api/adm/[slug]/member-password` | Define/reseta senha ADM de um membro específico. |
| `PATCH` | `/api/adm/[slug]/settings` | Atualiza configurações do restaurante (whatsapp, instagram, status, delivery_enabled, horários, logo, delivery_fee, address). Requer token ADM + service role. delivery_fee e address requerem role owner ou manager. |
| `PATCH` | `/api/adm/[slug]/theme` | Upsert completo do tema visual. Requer token ADM + service role. |

### WhatsApp

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/whatsapp/notify` | Envia mensagem via UltraMSG (uso interno). |
| `POST` | `/api/whatsapp/test` | Testa a configuração de WhatsApp do restaurante. Requer token ADM. |

### Outros

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/feedback` | Envia feedback de usuário. |

---

## Autenticação

O projeto tem **dois sistemas de autenticação independentes**:

### 1. Conta HIVI (Google OAuth via Supabase)
- Usado em `/conta`, `/criar-loja`, `/entrar`
- Cookie gerenciado pelo Supabase SSR
- Protegido via middleware (`saasProtected = ['/conta', '/criar-loja']`)

### 2. ADM do Restaurante (HMAC + PBKDF2 — `lib/adm-auth.ts`)
- Funcionários não precisam de conta HIVI
- Senha por membro: hash PBKDF2 (120.000 iterações, salt aleatório 16 bytes)
- Token: `base64url(JSON payload) + "." + HMAC-SHA256`
- Payload: `{ slug, role, name, memberId, ts }` — RBAC sem consulta extra ao banco
- Cookie `hivi_adm_{slug}`, HttpOnly, Path=`/`, TTL 8h
- Verificado no `adm/layout.tsx` (Node.js runtime, não Edge)
- **Regra crítica:** todas as rotas ADM usam `adminClient()` (service role key) após verificar o token. O `createClient()` (anon key) seria bloqueado silenciosamente pelo RLS pois funcionários não têm sessão Supabase Auth
- Dono pode ter senha em `restaurants.adm_password_hash` (legado via /conta) **ou** em `restaurant_users.adm_password_hash` (senha individual mais recente)
- Sessão expirada → redirecionamento automático para login ao receber 401
- **Login único por dispositivo (Plano Gratuito):** login gera novo `session_id`, persiste em DB; `adm/layout.tsx` compara `session_id` do token com o do banco a cada page load. Mismatch → redirect `/login?reason=session_expired`

---

## Variáveis de Ambiente

Crie `.env.local` com as seguintes variáveis:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_BASIC=price_...       # R$ 59,99/mês (BRL)
STRIPE_PRICE_PRO=price_...         # R$ 99,99/mês (BRL)
STRIPE_PRICE_BASIC_EUR=price_...   # € 24,99/mês (EUR — Portugal)
STRIPE_PRICE_PRO_EUR=price_...     # € 39,99/mês (EUR — Portugal)

# Resend (e-mails)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@hivi-web.com

# UltraMSG (WhatsApp)
ULTRAMSG_INSTANCE_ID=instance12345
ULTRAMSG_TOKEN=xxxxx

# App
NEXT_PUBLIC_APP_URL=https://hivi-web.com

# Template de restaurante (ID do restaurante usado como base para novos cadastros)
TEMPLATE_RESTAURANT_ID=uuid-do-restaurante-template

# Segredo interno para comunicação entre API Routes
INTERNAL_API_SECRET=segredo_aleatorio
```

### Status de configuração em produção

| Variável | Status |
|---|---|
| Supabase (URL, Anon Key, Service Role) | ✅ Configurado |
| Stripe (Secret, Webhook, Price Basic BRL/EUR, Price Pro BRL/EUR) | ✅ Configurado |
| UltraMSG (Instance ID, Token) | ✅ Configurado |
| Google OAuth | ✅ Configurado no painel Supabase |
| Resend (API Key, From Email) | ✅ Configurado |
| `NEXT_PUBLIC_APP_URL` | ✅ `https://hivi-web.com` |
| `TEMPLATE_RESTAURANT_ID` | ✅ Configurado |
| `INTERNAL_API_SECRET` | ✅ Configurado |

---

## Como Rodar Localmente

```bash
# Instalar dependências
npm install

# Rodar em dev (localhost)
npm run dev

# Rodar acessível na rede local (testes em celular)
npm run dev:host

# Build de produção
npm run build

# Lint
npm run lint
```

> Certifique-se de ter o `.env.local` com todas as variáveis antes de rodar.

---

## Migrations

Execute as migrations em ordem no **SQL Editor do Supabase** (Dashboard → SQL Editor):

| Arquivo | Conteúdo |
|---|---|
| `001_initial_schema.sql` | Todas as tabelas base + RLS inicial |
| `002_theme_extra_colors.sql` | Colunas extras de tema |
| `003_adm_password.sql` | Coluna `adm_password_hash` em `restaurants` |
| `004_storage_policies.sql` | Bucket `restaurant-images` + 4 RLS policies de storage |
| `005_label_columns_and_role_fix.sql` | Colunas `label_*` em `restaurant_themes` + constraint de role corrigida |
| `006_qr_session_order_id_and_rls_fixes.sql` | Coluna `order_id` em `qr_sessions` + correções de políticas |
| `007_member_auth_and_rbac.sql` | Colunas `name` + `adm_password_hash` em `restaurant_users`, `status_changed_by` em `orders`, constraint 5 cargos |
| `008_delivery_hours.sql` | Coluna `delivery_hours` jsonb em `restaurants` |
| `009_payment_changed_by.sql` | Coluna `payment_changed_by` em `orders` |
| `010_product_options.sql` | Tabelas `product_option_groups`, `product_option_items` + `selected_options` em `order_items` |
| `011_pro_plan.sql` | Coluna `plan TEXT DEFAULT 'basic' CHECK (basic\|pro)` em `restaurants` |
| `012_whatsapp_notify_enabled.sql` | Coluna `whatsapp_notify_enabled BOOLEAN DEFAULT true` em `restaurants` |
| `013_delivery_enabled.sql` | Coluna `delivery_enabled BOOLEAN DEFAULT true` em `restaurants` |
| `014_free_plan.sql` | `trial_ends_at TIMESTAMPTZ` em `restaurants`, `session_id TEXT` em `restaurant_users`, `plan` default alterado para `'free'` |
| `015_email_queue.sql` | Tabela `email_queue` para fila de e-mails de onboarding (welcome, dia 3, dia 6) |
| `016_pix_key.sql` | Colunas `pix_key TEXT` e `pix_key_type TEXT CHECK (cpf\|cnpj\|email\|phone\|evp)` em `restaurants` |
| `017_currency.sql` | Coluna `currency TEXT NOT NULL DEFAULT 'BRL' CHECK (BRL\|EUR)` em `restaurants` |
| `018_delivery_fee_and_address.sql` | Coluna `delivery_fee NUMERIC(10,2) DEFAULT 0` em `restaurants` (taxa configurável) + `address TEXT` em `restaurants` (endereço público); coluna `delivery_fee NUMERIC(10,2) DEFAULT 0` em `orders` (snapshot da taxa no momento do pedido) |

**Status em produção: todas as 18 migrations executadas.**

---

## Deploy

O projeto está hospedado na **Vercel** com deploy automático via push na branch `main`.

### Configurações necessárias (já feitas)

- **Vercel**: todas as env vars configuradas, domínio `hivi-web.com` conectado
- **Supabase**: Site URL e Redirect URLs atualizados para `https://hivi-web.com`
- **Stripe**: webhook apontando para `https://hivi-web.com/api/stripe/webhook`
- **Resend**: domínio `hivi-web.com` verificado
- **Supabase Realtime**: ativado na tabela `orders`
- **Supabase Storage**: bucket `restaurant-images` criado com políticas públicas de leitura

### Validação E2E — concluída em 2026-05-20

Todos os fluxos testados e validados em produção:
- [x] Cadastro → pagamento Stripe → criação automática de cardápio (com template)
- [x] Login ADM, temas, equipe (RBAC completo), pedidos (entrega + mesa + QR code)
- [x] WhatsApp automático, pausa/reativação, exclusão, múltiplos cardápios
- [x] Cancelamento de assinatura via Stripe Billing Portal
- [x] Upgrade Basic → Pro e downgrade Pro → Basic via /conta
- [x] Analytics (gráficos, KPIs, CSV, PDF) — exclusivo Pro
- [x] Impressão térmica (Via sistema + USB + Bluetooth + Rede TCP)
- [x] Adicionais (grupos e itens, seleção no cardápio, persistência no pedido)
- [x] Plano Gratuito: criação sem Stripe, trial de 7 dias, soft-lock de pratos, login único por dispositivo
- [x] Exclusão de cardápio cancela assinatura Stripe automaticamente
- [x] Toggle de entregas (restaurantes só mesa) — oculta botão de entrega no cardápio
- [x] Configurações ADM (tema, settings) salvas via API routes com service role (fix de RLS)

---

## Estado Atual — 2026-05-24

**Plataforma em produção em [hivi-web.com](https://hivi-web.com)**. Fases 0–14 concluídas.

### Implementado e funcionando
- ✅ Três planos: Gratuito (com trial de 7 dias), Básico e Pro
- ✅ Preços em BRL (R$59,99 / R$99,99) e EUR (€24,99 / €39,99) — detectados por locale automático
- ✅ Plano Gratuito: criação sem Stripe, soft-lock, login único por dispositivo (session_id)
- ✅ Upgrade free→pago e upgrade/downgrade Basic↔Pro via Stripe (sem cancelar assinatura)
- ✅ Internacionalização EUR/PT: locale por IP (Vercel Edge), cookie `hivi_locale`, todos os preços dinâmicos
- ✅ Cardápio digital público com temas, adicionais, horário de entregas
- ✅ Telefone internacional com código de país editável (+55 BR / +351 PT padrão)
- ✅ PIX: chave configurável no ADM, QR code por pedido (apenas restaurantes BRL)
- ✅ Painel ADM completo: pedidos, pratos, categorias, funcionários (RBAC 5 cargos)
- ✅ Analytics com gráficos, KPIs, CSV e PDF (Plano Pro) — usa orders.total (itens-only, exclui taxa)
- ✅ Impressão térmica: USB, Bluetooth, Rede TCP (agente local), Via sistema; charset Latin-1; cut mode configurável
- ✅ Impressão com breakdown Subtotal + Taxa de entrega + TOTAL quando taxa > 0
- ✅ WhatsApp automático com toggle de notificação (Planos Básico e Pro)
- ✅ Taxa de entrega configurável no ADM (owner/manager); snapshot em orders.delivery_fee; exibida no recibo mas excluída dos analytics
- ✅ Endereço do restaurante configurável no ADM; exibido com ícone de pin no rodapé do cardápio público
- ✅ Exclusão de cardápio cancela assinatura Stripe automaticamente
- ✅ Banner Trial Pro corrigido: exibido apenas para planos free e basic (não exibe para pro)
- ✅ Todas as 18 migrations aplicadas em produção

### Próximas funcionalidades planejadas
- 🔲 PIX dinâmico (gateway — MercadoPago/Asaas)
- 🔲 Cupons e descontos
- 🔲 Fidelidade e histórico de clientes
- 🔲 Multi-unidade (filiais)

---

## Documentação Interna

| Arquivo | Conteúdo |
|---|---|
| [`Contextos/PROJECT.md`](./Contextos/PROJECT.md) | Visão geral, objetivos, fluxos principais |
| [`Contextos/ARCHITECTURE.md`](./Contextos/ARCHITECTURE.md) | Estrutura de pastas, schema do banco, rotas de API |
| [`Contextos/FEATURES.md`](./Contextos/FEATURES.md) | Especificações detalhadas de cada tela e funcionalidade |
| [`Contextos/PHASES.md`](./Contextos/PHASES.md) | Fases de desenvolvimento com checklists |
| [`Contextos/TASKS.md`](./Contextos/TASKS.md) | Registro de tarefas concluídas, em andamento e pendentes |

---

*2026 HIVI Tecnologia — Todos os direitos reservados*
