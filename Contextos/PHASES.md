# HIVI Para Restaurantes — Fases de Desenvolvimento

## Visão Geral

| Fase | Nome | Status |
|---|---|---|
| 0 | Setup e Infraestrutura | ✅ Concluído |
| 1 | Template Inicial (HIVI SaaS) | ⬜ Pendente |
| 2 | Cardápio Público do Restaurante | ⬜ Pendente |
| 3 | Sistema de Pedidos e QR Code | ⬜ Pendente |
| 4 | Painel Administrativo do Restaurante | ⬜ Pendente |
| 5 | Integrações (WhatsApp + Email) | ⬜ Pendente |
| 6 | Temas e Personalização | ⬜ Pendente |
| 7 | Billing e Gestão de Conta | ⬜ Pendente |
| 8 | Testes, Polimento e Deploy | ⬜ Pendente |

---

## Fase 0 — Setup e Infraestrutura

**Objetivo**: Base técnica do projeto antes de qualquer feature.

- [ ] Criar projeto Next.js 14 com App Router + TypeScript
- [ ] Configurar Tailwind CSS + Shadcn/ui
- [ ] Criar projeto no Supabase (banco, auth, storage)
- [ ] Configurar Google OAuth no Supabase Auth
- [ ] Criar migrations iniciais do banco (todas as tabelas)
- [ ] Configurar Row Level Security (RLS) em todas as tabelas
- [ ] Configurar projeto no Vercel + variáveis de ambiente
- [ ] Configurar conta Stripe (produtos/planos)
- [ ] Configurar conta Resend (domínio de e-mail)
- [ ] Configurar conta UltraMSG (instância WhatsApp)
- [ ] Criar `middleware.ts` para proteção das rotas `/[slug]/adm`
- [ ] Criar `lib/supabase/client.ts` e `lib/supabase/server.ts`
- [ ] Criar `.env.example` com todas as variáveis

---

## Fase 1 — Template Inicial (HIVI SaaS)

**Objetivo**: Vitrine da HIVI onde donos de restaurante conhecem e contratam o produto.

- [ ] Landing page: Hero, Como funciona, Benefícios, Depoimentos, Preços, Rodapé
- [ ] Header com links de navegação, "Criar conta" e "Entrar"
- [ ] Autenticação Google OAuth + callback `/auth/callback`
- [ ] Área de conta `/conta`: listar lojas, ações por loja
- [ ] Fluxo "Criar nova loja" com checkout Stripe

---

## Fase 2 — Cardápio Público do Restaurante

**Objetivo**: O cliente escaneia o QR code e navega pelo cardápio.

- [ ] Home do cardápio: header, destaques, grid de categorias, busca
- [ ] Listagem por categoria com ordenação por preço
- [ ] Carrinho de pedidos (estado global)
- [ ] Tela de pedido: resumo, botões QR Code e Entrega
- [ ] Modal QR Code de mesa
- [ ] Modal Dados para Entrega com formulário completo
- [ ] Tela "Meu Pedido" com status em realtime (Supabase Realtime)

---

## Fase 3 — Sistema de Pedidos e QR Code

**Objetivo**: Fluxo completo do garçom escanear QR code e confirmar pedido.

- [ ] `POST /api/orders` — cliente cria pedido
- [ ] `POST /api/qrcode/confirm` — garçom confirma pedido QR
- [ ] `PATCH /api/orders/[id]/status` — funcionário altera status
- [ ] Rota `/[slug]/adm/qr/[session_id]` — tela de confirmação do garçom

---

## Fase 4 — Painel Administrativo do Restaurante

**Objetivo**: Dono e funcionários gerenciam a loja pelo painel adm.

- [ ] Login do restaurante (e-mail + senha via Supabase Auth)
- [ ] Guard de rota ADM (middleware por role)
- [ ] Layout e navegação do ADM (header + menu hambúrguer)
- [ ] Pedidos: lista com tabs (Entrega / Mesa / QR Code)
- [ ] Pedidos: filtros, cards completos, alterar status, "Ver itens"
- [ ] Pedidos: aba "Ler QR Code" com câmera + scanner
- [ ] Pratos/Bebidas: listagem, filtros, toggle destaques, CRUD + upload
- [ ] Categorias: listagem, reordenação, CRUD + upload
- [ ] Configurações: redes sociais, temas, QR code da loja, funcionários

---

## Fase 5 — Integrações (WhatsApp + Email)

**Objetivo**: Automações de comunicação.

- [ ] `lib/ultramsg.ts` — cliente UltraMSG
- [ ] Mensagens automáticas por status (apenas pedidos de entrega):
  - `confirmed` → "Seu pedido foi confirmado!"
  - `preparing` → "Seu pedido está sendo preparado"
  - `ready` → "Seu pedido está pronto!"
  - `out_for_delivery` → "Seu pedido saiu para entrega!"
  - `delivered` → "Pedido entregue! Obrigado."
  - `cancelled` → "Seu pedido foi cancelado."
- [ ] `lib/resend.ts` — e-mail de boas-vindas, confirmação, pagamento

---

## Fase 6 — Temas e Personalização

**Objetivo**: Cada restaurante tem aparência única no cardápio.

- [ ] CSS variables por restaurante (`--primary`, `--background`, etc.)
- [ ] Aplicar tema no layout do cardápio público via `restaurant_themes`
- [ ] Preview ao vivo no painel de configurações
- [ ] Temas pré-definidos (Rústico, Moderno, Claro, Colorido)
- [ ] Logo e banner aplicados na home do cardápio

---

## Fase 7 — Billing e Gestão de Conta

**Objetivo**: Ciclo completo de pagamento e gestão de lojas.

- [ ] Webhook Stripe: ativar restaurante após pagamento confirmado
- [ ] Webhook Stripe: pausar/cancelar se assinatura vencer
- [ ] Checkout de nova loja (plano adicional)
- [ ] Portal do cliente Stripe (gerenciar assinatura)
- [ ] Lógica de pausar loja (página de aviso para clientes)
- [ ] Lógica de excluir loja (soft delete)

---

## Fase 8 — Testes, Polimento e Deploy

**Objetivo**: Produto pronto para produção.

- [ ] Testes dos fluxos críticos (pedido, QR code, WhatsApp)
- [ ] Responsividade mobile-first em todas as telas (375px)
- [ ] SEO básico na landing page (meta tags, OG)
- [ ] Páginas de erro 404 e restaurante pausado
- [ ] Loading states e skeleton screens
- [ ] Rate limiting nas APIs públicas
- [ ] Configurar domínio customizado na Vercel
- [ ] Revisar todas as políticas RLS do Supabase
- [ ] Documentar variáveis de ambiente e processo de deploy
