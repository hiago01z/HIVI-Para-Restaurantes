# HIVI Para Restaurantes — Registro de Tarefas

> Atualizar sempre que uma tarefa for concluída.
> Mover de "Pendente" para "Concluído" com a data.

---

## Concluído

| Data | Tarefa |
|---|---|
| 2026-05-18 | Criação da documentação base do projeto (PROJECT, ARCHITECTURE, PHASES, FEATURES, TASKS, RULES, README) |
| 2026-05-18 | Fase 0 — Setup do projeto: Next.js 15 + TypeScript + Tailwind + shadcn/ui + Supabase client + middleware + migrations SQL + estrutura completa de pastas + APIs base (orders, qrcode, whatsapp, stripe) + build passando sem erros |

---

## Em Andamento

| Tarefa | Fase |
|---|---|
| — | — |

---

## Pendente

### Fase 0 — Setup e Infraestrutura
- [ ] Criar projeto Next.js 14 com App Router + TypeScript
- [ ] Configurar Tailwind CSS + Shadcn/ui
- [ ] Criar projeto no Supabase
- [ ] Configurar Google OAuth no Supabase Auth
- [ ] Criar migrations iniciais do banco (todas as tabelas)
- [ ] Configurar RLS em todas as tabelas
- [ ] Configurar projeto no Vercel + variáveis de ambiente
- [ ] Configurar conta Stripe
- [ ] Configurar conta Resend
- [ ] Configurar conta UltraMSG
- [ ] Criar `middleware.ts` para proteção de rotas ADM
- [ ] Criar `lib/supabase/client.ts` e `lib/supabase/server.ts`
- [ ] Criar `.env.example`

### Fase 1 — Template Inicial (HIVI SaaS)
- [ ] Landing page completa (todas as seções)
- [ ] Autenticação Google OAuth + callback
- [ ] Área de conta `/conta`
- [ ] Fluxo "Criar nova loja" com checkout Stripe

### Fase 2 — Cardápio Público
- [ ] Home do cardápio `/[slug]`
- [ ] Listagem por categoria
- [ ] Carrinho de pedidos
- [ ] Tela de pedido
- [ ] Modal QR Code de mesa
- [ ] Modal Dados para Entrega
- [ ] Tela "Meu Pedido" com realtime

### Fase 3 — Pedidos e QR Code
- [ ] `POST /api/orders`
- [ ] `POST /api/qrcode/confirm`
- [ ] `PATCH /api/orders/[id]/status`
- [ ] Tela de confirmação do garçom `/[slug]/adm/qr/[session_id]`

### Fase 4 — Painel Administrativo do Restaurante
- [ ] Login do restaurante
- [ ] Guard de rota ADM
- [ ] Layout e navegação do ADM
- [ ] Pedidos: tabs, filtros, cards, alterar status, "Ver itens"
- [ ] Pedidos: aba "Ler QR Code" com câmera
- [ ] Pratos/Bebidas: CRUD + toggle destaques + upload
- [ ] Categorias: CRUD + reordenação + upload
- [ ] Configurações: redes sociais, temas, QR code da loja, funcionários

### Fase 5 — Integrações
- [ ] UltraMSG: mensagens automáticas por status (entrega)
- [ ] Resend: e-mails transacionais

### Fase 6 — Temas e Personalização
- [ ] CSS variables por restaurante
- [ ] Preview ao vivo no ADM
- [ ] Temas pré-definidos

### Fase 7 — Billing
- [ ] Webhooks Stripe (ativar/pausar restaurante)
- [ ] Portal do cliente Stripe
- [ ] Lógica pausar/excluir loja

### Fase 8 — Testes e Deploy
- [ ] Testes dos fluxos críticos
- [ ] Responsividade mobile
- [ ] SEO + meta tags
- [ ] Rate limiting
- [ ] Deploy produção

---

## Bugs Conhecidos

| Data | Bug | Status |
|---|---|---|
| — | — | — |

---

## Decisões Técnicas

| Data | Decisão | Motivo |
|---|---|---|
| 2026-05-18 | Path-based routing `/[slug]` | Mais simples que subdomínios, sem configuração de DNS por restaurante |
| 2026-05-18 | QR code do pedido usa `qr_sessions` com TTL 15 min | Evita pedidos fantasma de sessões antigas |
| 2026-05-18 | WhatsApp apenas para pedidos de entrega | Pedidos de mesa são gerenciados presencialmente pelo garçom |
| 2026-05-18 | ADM do restaurante tem auth separada da conta HIVI | Funcionários não precisam de conta HIVI |
| 2026-05-18 | Plano único inicial — Básico R$ 59,99/mês | Simplificar o lançamento; novos planos serão criados conforme features forem entregues |
