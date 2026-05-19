# HIVI Para Restaurantes — Registro de Tarefas

> Atualizar sempre que uma tarefa for concluída.
> Mover de "Pendente" para "Concluído" com a data.

---

## Concluído

| Data | Tarefa |
|---|---|
| 2026-05-18 | Criação da documentação base do projeto (PROJECT, ARCHITECTURE, PHASES, FEATURES, TASKS, RULES, README) |
| 2026-05-18 | Fase 0 — Setup do projeto: Next.js 15 + TypeScript + Tailwind + shadcn/ui + Supabase client + middleware + migrations SQL + estrutura completa de pastas + APIs base (orders, qrcode, whatsapp, stripe) + build passando sem erros |
| 2026-05-19 | Fase 1 — Template Inicial HIVI: landing page, /entrar, /criar-conta, /conta (real auth + Supabase), /criar-loja (Stripe checkout), /api/auth/google (OAuth), /api/auth/signout, proteção de rotas no middleware |
| 2026-05-19 | Fase 2 — Cardápio Público: CartContext (localStorage), layout com tema dinâmico CSS vars, home com destaques + categorias, página de categoria com ordenação, página de pedido com modal QR Code + modal Entrega, meu-pedido com Supabase Realtime, /api/qrcode/session, /api/orders atualizada |
| 2026-05-19 | Fase 3 — Pedidos e QR Code: /api/qrcode/confirm, /api/orders, tela de confirmação QR do garçom (/[slug]/adm/qr/[sessionId]) |
| 2026-05-19 | Fase 4 — Painel ADM: login e-mail+senha, layout com AdmNav, pedidos realtime, pratos CRUD, categorias CRUD com reordenação, configurações com tema + color picker + QR code download |
| 2026-05-19 | Fase 5 — Integrações: Resend email via webhook Stripe, WhatsApp UltraMSG no PATCH status, tema criado automaticamente no webhook |
| 2026-05-19 | Fase 6 — Temas: CSS vars dinâmicos, 4 temas pré-definidos, color picker com preview ao vivo |
| 2026-05-19 | Fase 7 — Billing: /api/stripe/portal, /api/restaurants/[id] (PATCH/DELETE), ContaActions com pausar/ativar/excluir/portal |
| 2026-05-19 | Deploy inicial na Vercel: variáveis de ambiente configuradas, webhook Stripe apontando para produção |
| 2026-05-19 | Fix: callback OAuth corrigido (/api/auth/callback → /auth/callback) |
| 2026-05-19 | Fix: webhook agora insere dono em restaurant_users (role=owner) após criar restaurante |
| 2026-05-19 | Infra: migration SQL executada no Supabase (todas as tabelas + RLS) |
| 2026-05-19 | Infra: Supabase Realtime ativado na tabela orders |
| 2026-05-19 | Infra: bucket restaurant-images criado no Supabase Storage |

---

## Em Andamento

| Tarefa | Fase |
|---|---|
| Testes dos fluxos críticos em produção | Fase 8 |

---

## Pendente

### Fase 8 — Testes e Deploy
- [ ] Testar fluxo completo: cadastro → pagamento → ADM → cardápio público
- [ ] Testar pedido de mesa com QR Code
- [ ] Testar pedido de entrega + WhatsApp
- [ ] Testar upload de imagens (produtos, categorias, logo, banner)
- [ ] Testar troca de tema com preview ao vivo
- [ ] Responsividade mobile (cardápio público + ADM)
- [ ] SEO + meta tags por restaurante
- [ ] Rate limiting nas APIs públicas
- [ ] Configurar Resend (API key + domínio verificado)
- [ ] Configurar Stripe Billing Portal (dashboard.stripe.com/settings/billing/portal)
- [ ] Atualizar NEXT_PUBLIC_APP_URL para domínio final quando hivi.com.br estiver ativo

---

## Bugs Conhecidos

| Data | Bug | Status |
|---|---|---|
| 2026-05-19 | Callback OAuth apontava para /api/auth/callback em vez de /auth/callback | ✅ Corrigido |
| 2026-05-19 | Webhook não inseria dono em restaurant_users → bloqueava acesso ao ADM | ✅ Corrigido |
| 2026-05-19 | Migration SQL não havia sido executada → tabelas não existiam | ✅ Corrigido |

---

## Decisões Técnicas

| Data | Decisão | Motivo |
|---|---|---|
| 2026-05-18 | Path-based routing `/[slug]` | Mais simples que subdomínios, sem configuração de DNS por restaurante |
| 2026-05-18 | QR code do pedido usa `qr_sessions` com TTL 15 min | Evita pedidos fantasma de sessões antigas |
| 2026-05-18 | WhatsApp apenas para pedidos de entrega | Pedidos de mesa são gerenciados presencialmente pelo garçom |
| 2026-05-18 | ADM do restaurante tem auth separada da conta HIVI | Funcionários não precisam de conta HIVI |
| 2026-05-18 | Plano único inicial — Básico R$ 59,99/mês | Simplificar o lançamento; novos planos serão criados conforme features forem entregues |
| 2026-05-19 | Dono do restaurante adicionado em restaurant_users no webhook | Permite acesso direto ao ADM com a sessão Google OAuth sem login separado |
