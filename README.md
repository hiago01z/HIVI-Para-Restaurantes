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
| Criar cardápio (`/criar-loja`) | Checkout Stripe → webhook cria restaurante + copia template |
| Billing portal | Gerenciar assinatura via Stripe Customer Portal |
| Banners de feedback | Sucesso em `/conta?success=1`, cancelamento em `/criar-loja?cancelled=1` |

### Cardápio Público (`/[slug]`)

| Funcionalidade | Detalhe |
|---|---|
| Home | Carrossel de destaques + grid de categorias com imagens |
| Categorias | Listagem de pratos com ordenação (preço, nome) |
| Carrinho | Persistido em `localStorage`, acessível em qualquer página |
| Pré-preenchimento de entrega | Nome, endereço e telefone salvos do último pedido (sem login) |
| Pedido de mesa via QR | Gera QR code → garçom escaneia e confirma |
| Pedido de entrega | Formulário completo → WhatsApp automático para o restaurante |
| Observações | Campo de obs em ambos os fluxos (mesa e entrega) |
| Horário de entregas | Bloqueio automático do botão de entrega fora do horário configurado |
| Acompanhamento em tempo real | `/meu-pedido/[id]` com status via Supabase Realtime |
| Banner ativo | Exibe o pedido em andamento em todas as páginas do cardápio |
| Temas dinâmicos | CSS vars por restaurante (4 temas pré-definidos + personalização) |
| Página pausada | Tela específica quando restaurante está inativo (não 404) |
| SEO | `generateMetadata` por restaurante, OG tags, Twitter card |
| Favicon dinâmico | Garfo laranja via `app/icon.tsx` (Next.js OG) |

### Painel Administrativo (`/[slug]/adm`)

| Área | Funcionalidades |
|---|---|
| **Dashboard** | Métricas do dia (pedidos, em andamento, receita), acesso rápido, lista dos últimos pedidos |
| **Pedidos** | Tabs por tipo (entrega / mesa / QR code), filtro por período (hoje/ontem/7 dias), realtime, alterar status, badge de pagamento (Pago/Não Pago), observações, audit trail "Alterado por" |
| **Leitor de QR Code** | Scanner via câmera (jsQR + canvas, iOS/Android) + fallback por foto |
| **Pratos** | CRUD completo, marcar/desmarcar destaque, upload de imagem com crop |
| **Categorias** | CRUD + reordenação drag-like, upload de imagem com crop |
| **Funcionários** | Convidar por e-mail, definir cargo, definir nome de exibição, remover |
| **Configurações** | Status do cardápio, redes sociais, WhatsApp + teste de notificação, logo, banner, tema completo, prévia ao vivo via iframe, horário de entregas, QR code da loja (download PNG), link para gerenciar equipe |
| **Senha ADM** | Cada membro define sua própria senha via `/conta` ou pelo dono |
| **Notificação sonora** | Beep duplo via Web Audio API ao chegar novo pedido (hoje) |

### RBAC — Controle de Acesso por Cargo

| Cargo | Permissões |
|---|---|
| `owner` | Acesso total |
| `manager` | Acesso total, exceto pausar/excluir o restaurante |
| `cook` | Pedidos (mesa + entrega), pode avançar status até "Pronto" |
| `waiter` | Pedidos de mesa + leitor de QR code, pode confirmar pedidos |
| `delivery` | Apenas pedidos de entrega, pode marcar saiu/entregue |

---

## Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js (App Router) | 14.x | Framework principal — SSR, API Routes, middleware |
| React | 18 | UI |
| TypeScript | 5 | Tipagem estática |
| Tailwind CSS | 3 | Estilização |
| Supabase | — | PostgreSQL, Auth (Google OAuth), Storage, Realtime |
| Stripe | — | Checkout, webhooks, Customer Portal |
| Resend | — | E-mails transacionais (boas-vindas, fatura) |
| UltraMSG | — | WhatsApp automático para pedidos de entrega |
| Vercel | — | Hospedagem, deploy automático via GitHub |
| Zod | — | Validação de schemas nas API Routes |
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
├── color-utils.ts              # getContrastColor, computeLabelShadow
├── delivery-hours.ts           # Tipos e lógica de horário de entregas
├── rate-limit.ts               # Rate limiting in-memory
└── ultramsg.ts                 # Cliente WhatsApp UltraMSG

supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_storage_policies.sql (ou similar)
    ├── 003_...
    ├── 004_storage_policies.sql
    ├── 005_label_columns.sql
    ├── 006_order_id_qr_sessions.sql
    ├── 007_payment_status.sql
    └── 008_delivery_hours.sql
```

---

## Banco de Dados

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `restaurants` | Dados do restaurante (slug, nome, logo, status, whatsapp, stripe_customer_id, delivery_hours) |
| `restaurant_users` | Membros da equipe (role, name, adm_password_hash, user_id) |
| `restaurant_themes` | Tema visual (cores, fonte, tamanho, banner, CSS vars do label) |
| `categories` | Categorias do cardápio (nome, imagem, ordem) |
| `products` | Pratos/bebidas (nome, preço, imagem, destaque, categoria) |
| `orders` | Pedidos (type, status, payment_status, customer_*, notes, total) |
| `order_items` | Itens de cada pedido |
| `qr_sessions` | Sessões QR de mesa (TTL 15 min, order_data JSON, confirmed, order_id) |

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
| `POST` | `/api/stripe/checkout` | Cria sessão de checkout (plano básico R$ 59,99/mês) |
| `POST` | `/api/stripe/webhook` | Recebe eventos Stripe (cria restaurante, ativa/desativa) |
| `POST` | `/api/stripe/portal` | Abre portal de gerenciamento do cliente |

### Restaurantes

| Método | Rota | Descrição |
|---|---|---|
| `PATCH` | `/api/restaurants/[id]` | Pausar/ativar (`is_active`) |
| `DELETE` | `/api/restaurants/[id]` | Excluir restaurante e cancelar assinatura Stripe |
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

### 2. ADM do Restaurante (HMAC + PBKDF2)
- Funcionários não precisam de conta HIVI
- Senha definida por membro (hash PBKDF2, 120.000 iterações)
- Token: `base64url(JSON payload) + "." + HMAC-SHA256`
- Payload: `{ slug, role, name, memberId, ts }` — RBAC sem consulta extra ao banco
- Cookie httpOnly no path `/`, nome `hivi_adm_{slug}`, TTL 8h
- Verificado no `adm/layout.tsx` a cada request (Node.js runtime, não Edge)

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
STRIPE_BASIC_PRICE_ID=price_...

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
| Stripe (Secret, Webhook, Price ID) | ✅ Configurado |
| UltraMSG (Instance ID, Token) | ✅ Configurado |
| Google OAuth | ✅ Configurado no painel Supabase |
| Resend (API Key) | ✅ Configurado |
| `NEXT_PUBLIC_APP_URL` | ✅ `https://hivi-web.com` |
| `TEMPLATE_RESTAURANT_ID` | ✅ Configurado |

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
| `002` – `004` | Storage policies, ajustes de RLS |
| `005_label_columns.sql` | Colunas `label_*` em `restaurant_themes` + correção de constraint de role |
| `006_order_id_qr_sessions.sql` | Coluna `order_id` em `qr_sessions` + correções de políticas |
| `007_payment_status.sql` | Coluna `payment_status` em `orders` (`paid`/`unpaid`, default `unpaid`) |
| `008_delivery_hours.sql` | Coluna `delivery_hours` jsonb em `restaurants` |

Status das migrations em produção: **todas executadas**.

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

### Pendente

- [ ] Configurar Stripe Billing Portal em `dashboard.stripe.com/settings/billing/portal`
- [ ] Testes E2E completos em produção (ver checklist em `Contextos/TASKS.md`)

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
