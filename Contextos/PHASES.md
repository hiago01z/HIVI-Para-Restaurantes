# HIVI Para Restaurantes — Fases de Desenvolvimento

## Visão Geral

| Fase | Nome | Status |
|---|---|---|
| 0 | Setup e Infraestrutura | ✅ Concluído |
| 1 | Template Inicial (HIVI SaaS) | ✅ Concluído |
| 2 | Cardápio Público do Restaurante | ✅ Concluído |
| 3 | Sistema de Pedidos e QR Code | ✅ Concluído |
| 4 | Painel Administrativo do Restaurante | ✅ Concluído |
| 5 | Integrações (WhatsApp + Email) | ✅ Concluído |
| 6 | Temas e Personalização | ✅ Concluído |
| 7 | Billing e Gestão de Conta | ✅ Concluído |
| 8 | Testes, Polimento e Deploy | 🔄 Em andamento |

---

## Fase 0 — Setup e Infraestrutura ✅

- [x] Criar projeto Next.js 14 com App Router + TypeScript
- [x] Configurar Tailwind CSS + Shadcn/ui
- [x] Criar projeto no Supabase (banco, auth, storage)
- [x] Configurar Google OAuth no Supabase Auth
- [x] Criar migrations iniciais do banco (todas as tabelas)
- [x] Configurar Row Level Security (RLS) em todas as tabelas
- [x] Configurar projeto no Vercel + variáveis de ambiente
- [x] Configurar conta Stripe (produtos/planos)
- [x] Configurar conta UltraMSG (instância WhatsApp)
- [x] Criar `middleware.ts` para proteção das rotas `/[slug]/adm`
- [x] Criar `lib/supabase/client.ts` e `lib/supabase/server.ts`
- [x] Criar `.env.example` com todas as variáveis
- [ ] Configurar conta Resend (domínio de e-mail) — API key pendente

---

## Fase 1 — Template Inicial (HIVI SaaS) ✅

- [x] Landing page: Hero, Como funciona, Benefícios, Depoimentos, Preços, Rodapé
- [x] Header com logo HiviLogo (iconmark SVG de garfo + HIVI text)
- [x] Favicon dinâmico via app/icon.tsx
- [x] Autenticação Google OAuth + callback `/auth/callback`
- [x] Área de conta `/conta`: listar cardápios, ações por cardápio
- [x] Fluxo "Criar novo cardápio" com checkout Stripe
- [x] Preview ao vivo na landing: iframe do primeiro restaurante ativo

---

## Fase 2 — Cardápio Público do Restaurante ✅

- [x] Home do cardápio: header, carrossel de destaques, grid de categorias, busca
- [x] Listagem por categoria com ordenação por preço
- [x] Carrinho de pedidos (estado global via CartContext)
- [x] Tela de pedido: resumo, botões QR Code e Entrega
- [x] Modal QR Code de mesa
- [x] Modal Dados para Entrega com formulário completo
- [x] Tela "Meu Pedido" com status em realtime (Supabase Realtime)
- [x] Rodapé com identidade do restaurante + redes sociais
- [x] Página de restaurante pausado (PausedPage)
- [x] OG meta tags por restaurante (title, description, openGraph, twitter card)
- [x] Título da aba: nome do restaurante (generateMetadata)

---

## Fase 3 — Sistema de Pedidos e QR Code ✅

- [x] `POST /api/orders` — cliente cria pedido
- [x] `POST /api/qrcode/confirm` — garçom confirma pedido QR
- [x] `PATCH /api/orders/[id]/status` — funcionário altera status
- [x] Rota `/[slug]/adm/qr/[session_id]` — tela de confirmação do garçom

---

## Fase 4 — Painel Administrativo do Restaurante ✅

- [x] Login do restaurante (e-mail + senha via Supabase Auth)
- [x] Guard de rota ADM (middleware por JWT/cookie)
- [x] Layout e navegação do ADM (header + menu hambúrguer)
- [x] **Dashboard ADM** com métricas do dia (pedidos, receita, em andamento)
- [x] Pedidos: lista com tabs (Entrega / Mesa / QR Code)
- [x] Pedidos: filtros, cards completos, alterar status, "Ver itens"
- [x] Pedidos: aba "Ler QR Code" com câmera + scanner
- [x] Pedidos: **notificação sonora** de novo pedido (Web Audio API)
- [x] Pratos/Bebidas: listagem, filtros, toggle destaques, CRUD + upload
- [x] Categorias: listagem, reordenação, CRUD + upload
- [x] Configurações: redes sociais, temas, QR code da loja, funcionários
- [x] Configurações: **preview ao vivo** via iframe real + postMessage

---

## Fase 5 — Integrações (WhatsApp + Email) ✅

- [x] `lib/ultramsg.ts` — cliente UltraMSG
- [x] Mensagens automáticas WhatsApp por status (pedidos de entrega apenas)
- [x] `lib/resend.ts` — e-mail de boas-vindas no webhook Stripe
- [ ] Configurar Resend API key + domínio verificado

---

## Fase 6 — Temas e Personalização ✅

- [x] CSS variables por restaurante (`--menu-primary`, `--menu-bg`, etc.)
- [x] Aplicar tema no layout do cardápio público via `restaurant_themes`
- [x] **Preview ao vivo** via iframe real com postMessage
- [x] Temas pré-definidos (Rústico, Moderno, Claro, Verde)
- [x] Logo e banner aplicados na home do cardápio
- [x] Cor dos ícones customizável por restaurante

---

## Fase 7 — Billing e Gestão de Conta ✅

- [x] Webhook Stripe: ativar restaurante após pagamento confirmado
- [x] Webhook Stripe: pausar/cancelar se assinatura vencer
- [x] Checkout de novo cardápio (plano adicional)
- [x] Portal do cliente Stripe (gerenciar assinatura)
- [x] Lógica de pausar cardápio (página de aviso para clientes)
- [x] Lógica de excluir cardápio
- [ ] Configurar Stripe Billing Portal no dashboard

---

## Fase 8 — Testes, Polimento e Deploy 🔄

- [x] Página 404 personalizada HIVI (app/not-found.tsx)
- [x] Página de restaurante pausado (PausedPage com design neutro)
- [x] SEO básico por restaurante (meta tags, OG, Twitter card)
- [x] Favicon + ícone do navegador
- [x] Dashboard ADM com métricas
- [x] Notificação sonora de novo pedido
- [x] Rate limiting nas APIs públicas (/api/orders, /api/qrcode/session)
- [x] Loading/skeleton states em todas as páginas do ADM
- [x] Gerenciamento de funcionários (convidar via e-mail, remover, alterar role)
- [x] **Upload de imagens com `ImageCropPicker`** — drag, zoom (roda do mouse + botões), recorte canvas 800×800 JPEG; integrado em Categorias e Pratos
- [x] **Infra de Storage** — migration `004_storage_policies.sql` com RLS para bucket `restaurant-images`
- [x] **Sistema de restaurante template** — webhook Stripe copia categorias, pratos e tema ao criar novo restaurante
- [ ] Testar fluxo completo: cadastro → pagamento → ADM → cardápio público
- [ ] Testar pedido de mesa com QR Code (câmera real)
- [ ] Testar pedido de entrega + WhatsApp automático
- [ ] Testar upload de imagens (logo, banner, categorias, pratos) em produção
- [ ] Responsividade mobile em todas as telas (375px — testes reais)
- [ ] Página de cardápio vazio (sem pratos cadastrados)
- [ ] Configurar domínio customizado na Vercel (hivi.com.br)
