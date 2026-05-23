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
| 8 | Polimento, RBAC e Deploy | ✅ Concluído |
| 9 | Analytics e Relatórios | ✅ Concluído |
| 10 | Adicionais (Product Add-ons) | ✅ Concluído |
| 11 | Impressão Térmica | ✅ Concluído |
| 12 | Plano Pro + Billing Multi-plano | ✅ Concluído |
| 13 | Plano Gratuito + Trial | ✅ Concluído |
| 14 | PIX e Pagamentos Online | 🔲 Pendente |
| 15 | Cupons e Descontos | 🔲 Pendente |
| 16 | Fidelidade e Clientes | 🔲 Pendente |
| 17 | Multi-unidade | 🔲 Pendente |

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
- [x] Configurar conta Resend (domínio de e-mail verificado)

---

## Fase 1 — Template Inicial (HIVI SaaS) ✅

- [x] Landing page: Hero, Como funciona, Benefícios, Depoimentos, Preços, Rodapé
- [x] Header com logo HiviLogo (iconmark SVG de garfo + HIVI text)
- [x] Favicon dinâmico via app/icon.tsx
- [x] Autenticação Google OAuth + callback `/auth/callback`
- [x] Área de conta `/conta`: listar cardápios, ações por cardápio
- [x] Fluxo "Criar novo cardápio" com checkout Stripe
- [x] Preview ao vivo na landing: iframe do primeiro restaurante ativo
- [x] Seção QR Code: "Do QR code à cozinha em segundos" — 4 passos com destaque para confirmação do garçom e saída para cozinha

---

## Fase 2 — Cardápio Público do Restaurante ✅

- [x] Home do cardápio: header, carrossel de destaques, grid de categorias, busca
- [x] Listagem por categoria com ordenação por preço
- [x] Carrinho de pedidos (estado global via CartContext)
- [x] Tela de pedido: resumo, botões QR Code e Entrega
- [x] Modal QR Code de mesa
- [x] Modal Dados para Entrega com formulário completo
- [x] Pré-preenchimento automático de dados de entrega (localStorage)
- [x] Tela "Meu Pedido" com status em realtime (Supabase Realtime)
- [x] Rodapé com identidade do restaurante + redes sociais
- [x] Página de restaurante pausado (PausedPage)
- [x] OG meta tags por restaurante (title, description, openGraph, twitter card)
- [x] Título da aba: nome do restaurante (generateMetadata)

---

## Fase 3 — Sistema de Pedidos e QR Code ✅

- [x] `POST /api/orders` — cliente cria pedido de entrega
- [x] `POST /api/qrcode/session` — cliente inicia sessão de mesa
- [x] `POST /api/qrcode/confirm` — garçom confirma pedido QR
- [x] `PATCH /api/orders/[id]/status` — funcionário altera status
- [x] Rota `/[slug]/adm/qr/[session_id]` — tela de confirmação do garçom

---

## Fase 4 — Painel Administrativo do Restaurante ✅

- [x] Login do restaurante (e-mail + senha via Supabase Auth)
- [x] Guard de rota ADM (middleware por JWT/cookie)
- [x] Layout e navegação do ADM (header + menu hambúrguer)
- [x] **Dashboard ADM** com métricas do dia (pedidos, receita, em andamento)
- [x] Pedidos: lista com tabs (Entrega / Mesa / QR Code), filtros de período (Hoje / Ontem / 7 dias)
- [x] Pedidos: cards completos, alterar status, badge Pago/Não Pago, audit trail "Alterado por [nome]"
- [x] Pedidos: aba "Ler QR Code" com câmera + scanner (jsQR)
- [x] Pedidos: **notificação sonora** de novo pedido (Web Audio API)
- [x] Pratos/Bebidas: listagem, filtros, toggle destaques, CRUD + upload + **Adicionais**
- [x] Categorias: listagem, reordenação, CRUD + upload
- [x] Configurações: redes sociais, temas, QR code, funcionários, horário de entregas, **impressora térmica**
- [x] Configurações: **preview ao vivo** via iframe real + postMessage

---

## Fase 5 — Integrações (WhatsApp + Email) ✅

- [x] `lib/ultramsg.ts` — cliente UltraMSG
- [x] Mensagens automáticas WhatsApp por status (pedidos de entrega apenas)
- [x] WhatsApp inclui adicionais selecionados (↳ item +preço)
- [x] `lib/resend.ts` — e-mail de boas-vindas no webhook Stripe
- [x] Resend API key + domínio verificado

---

## Fase 6 — Temas e Personalização ✅

- [x] CSS variables por restaurante (`--menu-primary`, `--menu-bg`, etc.)
- [x] Aplicar tema no layout do cardápio público via `restaurant_themes`
- [x] **Preview ao vivo** via iframe real com postMessage
- [x] Temas pré-definidos (Rústico, Moderno, Claro, Verde)
- [x] Logo e banner aplicados na home do cardápio
- [x] Cor dos ícones customizável por restaurante
- [x] Texto sobre imagens: fonte decorativa, cor, efeito (contorno/fundo/desalinhado), sliders de espessura e direção

---

## Fase 7 — Billing e Gestão de Conta ✅

- [x] Webhook Stripe: ativar restaurante após pagamento confirmado
- [x] Webhook Stripe: pausar/cancelar se assinatura vencer
- [x] Checkout de novo cardápio (plano adicional)
- [x] Portal do cliente Stripe (gerenciar assinatura)
- [x] Lógica de pausar cardápio (página de aviso para clientes)
- [x] Lógica de excluir cardápio
- [x] Stripe Billing Portal configurado

---

## Fase 8 — Polimento, RBAC e Deploy ✅

- [x] Página 404 personalizada HIVI
- [x] Página de restaurante pausado
- [x] SEO básico por restaurante (meta tags, OG, Twitter card)
- [x] Favicon + ícone do navegador
- [x] Dashboard ADM com métricas
- [x] Notificação sonora de novo pedido (toggle 🔔)
- [x] Rate limiting nas APIs públicas
- [x] Loading/skeleton states em todas as páginas do ADM
- [x] **RBAC completo**: 5 cargos (Dono/Gerente/Cozinheiro/Garçom/Entregador), senhas individuais por membro, tabs e status filtrados por cargo
- [x] Gerenciamento de equipe (convidar via e-mail, remover, alterar role, ver cargo)
- [x] **Upload com `ImageCropPicker`** — drag, zoom, recorte canvas 800×800 JPEG
- [x] Sistema de restaurante template (webhook copia categorias, pratos e tema)
- [x] Horário de funcionamento das entregas (por dia da semana ou igual para todos)
- [x] Campo "Observações" em pedidos (badge amarelo no ADM)
- [x] Badge Pago/Não Pago por pedido com nome do funcionário
- [x] Filtros de período nos pedidos (Hoje/Ontem/7 dias)
- [x] QR scanner real na aba "Ler QR Code" (jsQR + canvas)
- [x] Pré-preenchimento de entrega (localStorage com dados do último pedido)
- [x] Migrations 005–013 executadas no Supabase
- [x] Toggle "Notificar novo pedido" via WhatsApp nas configurações (migration 012)
- [x] Toggle para desativar entregas — restaurantes só mesa (migration 013)
- [x] Tutorial de convite de membro de equipe no formulário de convite
- [x] Link WhatsApp "Enviar confirmação ao cliente" com mensagem pré-preenchida
- [x] **Fix crítico pré-produção:** todas as escritas ADM (status, pagamento, configurações, tema) migradas para service role key — RLS bloqueava silenciosamente funcionários sem sessão Supabase Auth

---

## Fase 9 — Analytics e Relatórios ✅

> Concluído em 2026-05-22. Exclusivo do Plano Pro.

- [x] Página `/[slug]/adm/analytics` — gateada por `plan === 'pro'`
- [x] Gráfico de receita por dia (AreaChart — recharts) — últimos 7 ou 30 dias
- [x] Gráfico de pedidos por dia (BarChart)
- [x] Top 5 produtos mais pedidos (barras CSS + qtd + receita)
- [x] Pedidos por tipo: mesa vs entrega (PieChart donut)
- [x] Distribuição por horário do dia (BarChart 06h–23h)
- [x] KPIs: receita total, total de pedidos, ticket médio, horário de pico
- [x] Comparativo semanal (semana atual vs anterior) com variação %
- [x] Seletor de período: 7 dias / 30 dias
- [x] Exportação CSV (todos os pedidos do período, com BOM UTF-8 para Excel)
- [x] Exportação PDF (`lib/analytics-pdf.ts`) — jsPDF + jspdf-autotable (dynamic import); seções: header laranja, KPIs, comparativo semanal, top 10, pedidos por tipo, receita por dia, distribuição horária, rodapé paginado

---

## Fase 12 — Plano Pro + Billing Multi-plano ✅

> Concluído em 2026-05-22.

- [x] Migration `011_pro_plan.sql` — coluna `plan TEXT DEFAULT 'basic' CHECK (basic|pro)` em restaurants
- [x] `STRIPE_PRICE_PRO` — novo price no Stripe (R$ 99,99/mês)
- [x] Checkout: aceita `plan` (basic|pro), usa price correto, persiste em metadata
- [x] Webhook `checkout.session.completed`: salva `plan` ao criar restaurante
- [x] Webhook `customer.subscription.updated`: detecta troca de price (basic↔pro) e atualiza `plan`
- [x] API `POST /api/stripe/upgrade` — upgrade Basic → Pro via Stripe subscription update com proration
- [x] `AdmNav`: link "Analytics" visível somente para `plan === 'pro'`
- [x] `getAdmRestaurant` retorna `plan`
- [x] ADM Layout passa `plan` para `AdmNav`
- [x] `/criar-loja`: seletor de plano (Basic R$59,99 vs Pro R$99,99 — Recomendado)
- [x] `/precos`: dois cards de plano com feature list completa
- [x] Landing page `/`: seção de preços com dois planos side-by-side
- [x] `/conta`: badge de plano por restaurante + botão "Fazer upgrade para Pro"
- [x] API `POST /api/stripe/downgrade` — downgrade Pro → Básico (`proration_behavior: 'none'`)
- [x] Botão "Voltar para Básico" em `/conta` com confirm() e aviso de perda do Analytics
- [x] Fix: upgrade exibia R$135,78 — `proration_behavior` corrigido para `'none'` em ambas as rotas

---

## Fase 10 — Adicionais (Product Add-ons) ✅

- [x] Migration `010_product_options.sql` — tabelas `product_option_groups` e `product_option_items`, coluna `selected_options JSONB` em `order_items`
- [x] ADM Pratos: botão "Adicionais" por produto → modal `OptionsManageModal`
- [x] Modal: criar grupos (nome, descrição, min/max seleções, obrigatório/opcional)
- [x] Modal: criar itens dentro de cada grupo (nome, preço adicional, disponível)
- [x] Modal: editar grupos e itens inline (botão lápis → formulário em linha)
- [x] Modal: excluir grupos e itens (com Supabase DELETE)
- [x] Cardápio público: `ProductOptionsModal` — busca grupos ao abrir produto, mostra opções com comportamento rádio/checkbox, valida obrigatórios, calcula total com adicionais em tempo real
- [x] CartContext: `SelectedOption`, `cartKey` (`productId__item1_item2`), total com adicionais
- [x] API `POST /api/orders`: persiste `selected_options` por item
- [x] API `POST /api/qrcode/session` + `POST /api/qrcode/confirm`: inclui `selected_options`
- [x] WhatsApp: mensagem inclui adicionais (↳ nome +preço)
- [x] ADM Pedidos: exibe adicionais abaixo do item no detalhe expandido
- [x] Meu Pedido: exibe adicionais escolhidos

---

## Fase 11 — Impressão Térmica ✅

- [x] `lib/thermal-printer/escpos.ts` — encoder ESC/POS puro (sem dependências): inicializar, alinhar, negrito, tamanho duplo, cortar papel; normaliza acentos para compatibilidade com codepage da impressora
- [x] `lib/thermal-printer/printer.ts` — gerenciamento de conexão + impressão unificada:
  - **USB** via WebUSB API (Chrome desktop) — pareia uma vez, zero instalação
  - **Bluetooth** via Web Bluetooth API (Chrome mobile/desktop) — pareia uma vez, zero instalação
  - **Via sistema** via `window.print()` + iframe oculto + CSS `@page` — usa qualquer impressora já configurada no OS, zero instalação
  - Configuração persistida em `localStorage` (tipo + auto-print + largura do papel)
  - Migração automática de configs legadas (`'network'` → `'browser'`)
- [x] `lib/thermal-printer/receipt-html.ts` — gera HTML de cupom para modo "Via sistema": layout responsivo, CSS `@page` para 58 mm ou 80 mm, fonte monospace, colunas alinhadas, suporte a adicionais
- [x] ADM Configurações: seção "Impressora Térmica"
  - Seletor de tipo: 🔌 Cabo USB / 📶 Bluetooth / 🖨️ Via sistema
  - Seletor de largura: 58 mm (32 col) / 80 mm (48 col)
  - Toggle auto-imprimir ao confirmar pedido
  - Botão "Conectar" (USB/BT) ou sempre pronto (Via sistema)
  - Botão "Imprimir teste"
  - Botão "Remover impressora"
- [x] ADM Pedidos:
  - Botão 🖨️ por card de pedido — reimprimir manualmente a qualquer momento
  - Badge "Impr. ativa / pausada / Reconectar" no header (ao lado do som)
  - Auto-impressão via Realtime: dispara quando novo pedido chega (se conectado e ativo)
  - Toast verde/vermelho confirmando sucesso ou exibindo erro

---

## Fase 13 — Plano Gratuito + Trial ✅

> Concluído em 2026-05-23.

- [x] Migration `014_free_plan.sql` — `trial_ends_at TIMESTAMPTZ` em `restaurants`, `session_id TEXT` em `restaurant_users`, `plan` default alterado para `'free'`
- [x] `lib/plan-limits.ts` — `getEffectiveLimits(plan, trial_ends_at)` retorna `PRO_LIMITS` durante trial, limites do plano Free após
- [x] Limites do Plano Gratuito: 16 pratos, 4 categorias, 1 grupo de adicionais por prato, equipe de 4 (1 owner + 3), sem WhatsApp automático, sem Analytics
- [x] `POST /api/restaurants/free` — cria restaurante sem Stripe: plan='free', trial_ends_at=now()+7d, auto-gera cookie ADM para primeiro acesso
- [x] `POST /api/stripe/subscribe` — Stripe Checkout Session para restaurante free existente (upgrade free → pago)
- [x] Trial de 7 dias: todos os novos restaurantes free recebem PRO_LIMITS por 7 dias
- [x] Soft-lock: ao expirar trial, pratos em excesso são auto-pausados (`is_available=false`) no carregamento do server component `pratos/page.tsx` — nunca deletados
- [x] Login único por dispositivo (session_id): login route gera novo `session_id`, persiste em DB e inclui no HMAC token; `adm/layout.tsx` compara a cada page load; mismatch → redirect `login?reason=session_expired`
- [x] Banner de trial no ADM (pratos e categorias) — mostra dias restantes e link de upgrade
- [x] Trial countdown exibido em `/conta` por card de restaurante
- [x] `/criar-loja`: card do Plano Gratuito adicionado (sem Stripe, criação imediata)
- [x] `/precos` e landing page: seção de preços com 3 planos (Gratuito, Básico, Pro)
- [x] Texto "Painel administrativo" (não "completo") em todos os planos

---

## Fase 14 — PIX e Pagamentos Online 🔲

- [ ] Geração de QR Code PIX estático por restaurante (chave PIX configurada no ADM)
- [ ] Geração de QR Code PIX dinâmico por pedido (valor exato)
- [ ] Integração com gateway (MercadoPago / PagSeguro / Asaas)
- [ ] Confirmação automática de pagamento via webhook
- [ ] Status "Pago via PIX" no ADM

---

## Fase 15 — Cupons e Descontos 🔲 (era Fase 13)

- [ ] ADM: criação de cupons (código, valor fixo ou percentual, validade, limite de usos)
- [ ] Cardápio público: campo de cupom na tela de pedido
- [ ] Validação + aplicação do desconto no total
- [ ] Relatório de uso de cupons no ADM

---

## Fase 16 — Fidelidade e Clientes 🔲

- [ ] Cadastro opcional do cliente (nome, WhatsApp, histórico)
- [ ] Programa de pontos: X pedidos = desconto
- [ ] Histórico de pedidos por cliente no ADM
- [ ] Push notification via WhatsApp para clientes recorrentes (promoções)

---

## Fase 17 — Multi-unidade 🔲

- [ ] Restaurante com múltiplas filiais sob o mesmo dono
- [ ] Cardápio base compartilhado + customizações por unidade
- [ ] Funcionários com acesso a unidades específicas
- [ ] Dashboard consolidado com métricas por unidade e total
