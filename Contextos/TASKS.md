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
| 2026-05-19 | Design: tipografia Playfair Display + Inter, font-display utility class, antialiasing |
| 2026-05-19 | Design: cores ADM → var(--adm-primary) em todos os 5 arquivos client do ADM |
| 2026-05-19 | Fix: build error `<a href="/conta">` → `<Link>` em _login-form.tsx (ESLint) |
| 2026-05-19 | Fix: badge "Pendente" de senha ADM atualiza localmente após salvar (localHasPassword state) |
| 2026-05-19 | Design: heading "Destaques" removido do carrossel na home do cardápio público |
| 2026-05-19 | Design: rodapé da loja pública com identidade do restaurante + redes sociais + copyright HIVI |
| 2026-05-19 | Design: prévia do ADM configurações → iframe real do cardápio com postMessage em tempo real |
| 2026-05-19 | Design: logo HIVI → font-black straight uppercase + translate="no" em todos os headers/footers |
| 2026-05-19 | Rename: "loja/lojas" → "cardápio/cardápios" em todas as interfaces SAAS |
| 2026-05-19 | SEO: título da aba do navegador exibe nome do restaurante (generateMetadata em [slug]/layout.tsx) |
| 2026-05-19 | Feature: prévia ao vivo via iframe nos dois locais (ADM configurações + landing SAAS) com PostMessage |
| 2026-05-19 | Design: logo HIVI com iconmark SVG de garfo de 3 dentes (componente HiviLogo reutilizável) |
| 2026-05-19 | Design: favicon dinâmico via app/icon.tsx (next/og) — garfo laranja 32x32 |
| 2026-05-19 | Feature: página "restaurante pausado" em vez de 404 quando is_active=false (ADM ainda acessível) |
| 2026-05-19 | Feature: página 404 personalizada HIVI (app/not-found.tsx) |
| 2026-05-19 | SEO: OG meta tags completos por restaurante (title, description, openGraph, twitter card, logo) |
| 2026-05-19 | Feature: dashboard ADM com métricas do dia (pedidos, em andamento, receita, últimos pedidos, totais) |
| 2026-05-19 | Feature: notificação sonora de novo pedido no ADM (Web Audio API — dois beeps, sem arquivo externo) |
| 2026-05-19 | Infra: middleware injeta x-pathname header para layouts server-side detectarem rota ADM |
| 2026-05-19 | Fase 8: rate limiting nas APIs públicas (orders: 10/min, qrcode/session: 5/5min) via lib/rate-limit.ts |
| 2026-05-19 | Fase 8: loading skeletons em todas as páginas do ADM (dashboard, pedidos, pratos, categorias, configurações, funcionários) |
| 2026-05-19 | Fase 8: gerenciamento de equipe (/adm/funcionarios) — listar, convidar por e-mail (Supabase invite), remover, cargos (dono/gerente/funcionário) |
| 2026-05-19 | Fix: icon.tsx com force-dynamic para evitar erro de prerender local com @vercel/og |
| 2026-05-19 | Infra: domínio hivi-web.com conectado na Vercel, Resend configurado, Supabase e Stripe atualizados |
| 2026-05-19 | Infra: migration 004_storage_policies.sql — bucket `restaurant-images` + 4 RLS policies (INSERT/UPDATE/DELETE para autenticados; SELECT público) |
| 2026-05-19 | Fix: imagens de categorias exibidas corretamente no cardápio público (object-fit: cover + next/image fill) |
| 2026-05-19 | Feature: componente `ImageCropPicker` — upload com drag-to-reposition, zoom via roda do mouse e botões −/+ (50%–300%), recorte canvas 800×800 JPEG ao salvar; integrado em Categorias e Pratos do ADM |
| 2026-05-19 | Feature: sistema de restaurante template no webhook Stripe — copia categorias (imagem + ordem), pratos (com mapeamento de categoria) e tema ao criar novo restaurante (env `TEMPLATE_RESTAURANT_ID`) |
| 2026-05-20 | Fix: `is_active === null` causava 404 para restaurantes novos — todas as verificações agora usam `=== false` |
| 2026-05-20 | Fix: vazamento de memória Supabase — padrão `useRef(createClient())` aplicado em pedidos, pratos e categorias clients |
| 2026-05-20 | Fix: notificação WhatsApp bloqueava resposta de status route — convertido para fire-and-forget com `.catch(() => {})` |
| 2026-05-20 | Fix: feedback de erro em `handleDelete` de pratos e categorias (anteriormente silencioso) |
| 2026-05-20 | Feature: upload e exibição de banner — UI de upload em configurações, exibição com gradiente no cardápio público |
| 2026-05-20 | Feature: filtro de período em pedidos ADM (`?periodo=hoje|ontem|7dias`) — server-side com date range correto; Realtime desabilitado para períodos históricos |
| 2026-05-20 | Feature: seletor de tamanho de fonte em configurações (Pequena/Normal/Grande → 14px/16px/18px) |
| 2026-05-20 | Fix: ícones do dashboard flotando fora dos containers — padrão absolute sem relative fixado com color-mix() |
| 2026-05-20 | Fix: bypass de auth em status route quando slug era falsy — agora retorna 404 em vez de pular verificação |
| 2026-05-20 | Fix: integridade de dados no qrcode/confirm — order_items sem erro = cleanup do pedido órfão |
| 2026-05-20 | Fix: catch block em handleInvite (funcionários) e feedback de erro em handleRemove |
| 2026-05-20 | Fix: mensagem de estado vazio em pedidos reflete período selecionado (não sempre "hoje") |
| 2026-05-20 | Security: open redirect em login form — valida que ?redirect= começa com / |
| 2026-05-20 | Fix: catch blocks adicionados em adm-password-form e conta-actions (silently swallowing errors) |
| 2026-05-20 | Security: PreviewListener valida origem do postMessage (same-origin only) |
| 2026-05-20 | Security: open redirect //evil.com via ?next= no Google OAuth e auth callback corrigido |
| 2026-05-20 | Fix: arquivos Dropbox "Cópia em conflito" em app/[slug]/adm/pedidos/ causando erros TypeScript — removidos |
| 2026-05-20 | Fix: pedido órfão em /api/orders quando order_items insert falha — cleanup adicionado (igual ao qrcode/confirm) |
| 2026-05-20 | Fix: migration 005 — colunas label_* em restaurant_themes ausentes nas migrations (label customization não persistia) |
| 2026-05-20 | Fix: migration 005 — constraint de role em restaurant_users corrigida ('admin'/'waiter' → 'manager'/'staff') — invite de funcionários falhava silenciosamente |
| 2026-05-20 | Fix: migration 006 — order_id em qr_sessions (coluna ausente quebrava fluxo QR de mesa), public_read_active policy corrigida para is_active IS NOT FALSE, políticas de escrita de categorias/produtos/temas corrigidas para role 'manager' |
| 2026-05-20 | Fix: ADM layout e todas as páginas ADM usam service role para lookup do restaurante — garante acesso mesmo com is_active=false e para staff sem sessão Supabase |
| 2026-05-20 | Fix: login ADM não entrava — `response.cookies.set()` sobrescrevia cookie válido com cookie expirado (mesmo nome, paths diferentes). Fix: `response.headers.append('Set-Cookie', ...)` em login e logout routes |
| 2026-05-20 | Feature: CSS vars aplicadas em todas as páginas públicas (categoria, pedido, meu-pedido, sort buttons, featured-carousel, product-card) — 4 temas agora renderizam corretamente |
| 2026-05-20 | Feature: QR scanner real na aba "Ler QR Code" do ADM pedidos (jsQR + canvas, iOS/Android, fallback por foto) |
| 2026-05-20 | Feature: banners de feedback pós-Stripe — sucesso em /conta?success=1 e cancelamento em /criar-loja?cancelled=1 |
| 2026-05-20 | Fix: todas as chamadas alert() substituídas por estados de erro inline (pratos, categorias, funcionários, pedido, conta-actions) |
| 2026-05-20 | Feature: campo "Observações" em pedidos de entrega e mesa (QR) — armazenado na coluna notes já existente; exibido no ADM com badge amarelo e na tela meu-pedido do cliente |
| 2026-05-20 | Feature: RBAC completo — 5 cargos (Dono/Gerente/Cozinheiro/Garçom/Entregador), senhas ADM individuais por membro, tabs e status filtrados por cargo, "Alterado por [nome]" no audit trail, membros vêem seus cardápios em /conta com badge de cargo e botões desabilitados apropriadamente |
| 2026-05-20 | Fix: tela de login ADM em branco/crash — `<Suspense>` sem fallback gerava null no SSR; adicionado fallback spinner + overlay `position:fixed; inset:0; background:#111827` no layout ADM para a rota de login |
| 2026-05-20 | Feature: pré-preencher dados de entrega sem login — nome, endereço, complemento e telefone salvos em `localStorage('hivi-delivery-info')` após pedido bem-sucedido; banner "Preenchido com seu último pedido · limpar" exibido quando há dados salvos |
| 2026-05-20 | Feature: horário de funcionamento das entregas — migration 008 (coluna `delivery_hours` jsonb), `lib/delivery-hours.ts` (tipos + `checkDeliveryOpen()`), seção no ADM Configurações (toggle enable/disable, modo igual-para-todos ou por dia, inputs de time por dia), bloqueio do botão Entrega fora do horário com mensagem de abertura e exibição dos horários de funcionamento |
| 2026-05-20 | Fix: migration 007 — colunas `name` e `adm_password_hash` em `restaurant_users`, `status_changed_by` em `orders`, constraint de role atualizada (5 cargos: owner/manager/cook/waiter/delivery) |
| 2026-05-20 | Docs: README.md completamente reescrito com documentação profissional cobrindo todas as funcionalidades, stack, schema do banco, API reference, autenticação, variáveis de ambiente, migrations e deploy |
| 2026-05-20 | Fix: filtros de período (Ontem/7 dias) não atualizavam pedidos — `key={periodo}` no PedidosClient força remount com dados frescos do servidor |
| 2026-05-20 | Fix: badge Pago/Não Pago agora exibe nome do funcionário que alterou — migration 009 (coluna `payment_changed_by`), rota atualizada para usar `getAdmTokenPayload` |
| 2026-05-20 | Fix: som de novo pedido — botão 🔔 Som no header de pedidos; clique ativa/desativa e toca beep de confirmação; resolve restrição de autoplay do browser |

---

## Pendente

### Configurações externas (requer ação manual)
- [x] Resend: API key + domínio hivi-web.com verificado + RESEND_FROM_EMAIL configurado
- [x] NEXT_PUBLIC_APP_URL atualizado para https://hivi-web.com na Vercel
- [x] Domínio hivi-web.com conectado na Vercel
- [x] Supabase: Site URL e Redirect URLs atualizados para hivi-web.com
- [x] Stripe webhook atualizado para hivi-web.com/api/stripe/webhook
- [x] Configurar Stripe Billing Portal em dashboard.stripe.com/settings/billing/portal — cancelamento no fim do período, troca de plano desativada, retorno para /conta
- [x] **EXECUTADO 2026-05-20**: Migration 005 — colunas label_* em restaurant_themes + constraint de role em restaurant_users
- [x] **EXECUTADO 2026-05-20**: Migration 006 — order_id em qr_sessions + public_read_active policy (IS NOT FALSE) + políticas de escrita para role 'manager'
- [x] **EXECUTADO 2026-05-20**: Migration 007 — name + adm_password_hash em restaurant_users, status_changed_by em orders, constraint de role atualizada ('owner'|'manager'|'cook'|'waiter'|'delivery')
- [x] **EXECUTADO 2026-05-20**: Migration 008 — coluna `delivery_hours` jsonb em restaurants

### Fase 8 — Polimento e Testes
- [x] **2026-05-20**: Testar fluxo completo: cadastro → pagamento → ADM → cardápio público
- [x] **2026-05-20**: Testar pedido de mesa com QR Code
- [x] **2026-05-20**: Testar pedido de entrega + WhatsApp automático (mensagens chegando corretamente)
- [x] **2026-05-20**: Testar temas, membro de equipe, múltiplos cardápios
- [x] **2026-05-20**: Testar checkout Stripe, cancelamento de assinatura, pausa e exclusão de cardápios
- [x] **2026-05-20**: Notificação WhatsApp de novo pedido inclui observações (obs: ...) quando presentes
- [x] **2026-05-20**: Upload de imagens (logo, banner, categorias, pratos com crop) — funcional
- [x] **2026-05-20**: Responsividade mobile (375px) — funcional
- [x] **2026-05-20**: "Gerenciar Assinatura" em /conta → Stripe Billing Portal — funcional
- [x] **2026-05-20**: Pré-preenchimento de entrega (localStorage) — funcional
- [x] **2026-05-20**: Horário de funcionamento das entregas — funcional
- [x] **2026-05-20**: Badge Pago/Não Pago com nome do funcionário — funcional (Fix: migration 009 + payment_changed_by)
- [x] **2026-05-20**: Filtros de período (Ontem / 7 dias) — funcional (Fix: key={periodo} no PedidosClient)
- [x] **2026-05-20**: Tela de restaurante pausado — exibe página específica (não 404)
- [x] **2026-05-20**: Download QR code da loja — funcional
- [x] **2026-05-20**: Observações em pedidos — badge amarelo no ADM funcional
- [x] **2026-05-20**: Som de novo pedido — funcional (botão 🔔 Som ativo por padrão, volume +70%)

| 2026-05-20 | Fix: "Painel ADM" em /conta causava crash para novas contas — link apontava para `/adm` sem `page.tsx`. Fix: link alterado para `/{slug}/adm/login` |
| 2026-05-20 | Fix: notificação WhatsApp de entrega não chegava — causa 1: anon client bloqueado por RLS; causa 2: fire-and-forget cancelado pela Vercel antes de completar. Fix: service role + await |
| 2026-05-22 | Feature: Adicionais (product add-ons) — grupos de opções por produto no ADM, modal de seleção no cardápio público, opções salvas no pedido, exibidas no ADM pedidos e meu-pedido. Migration 010 executada. |

---

## Pendente (Próximas Fases)

### Fase 9 — Analytics e Relatórios
- [ ] Dashboard com gráficos: receita por dia/semana, produtos mais vendidos, pedidos por período
- [ ] Exportação de dados (CSV)

### Fase 10 — Impressão Automática
- [ ] Integração com impressora térmica via WebUSB / ESC/POS
- [ ] Configuração de formato do cupom

---

## ✅ Projeto em produção — validação completa em 2026-05-20

Todos os fluxos validados em produção. Plataforma operacional em hivi-web.com.

---

## Bugs Conhecidos

| Data | Bug | Status |
|---|---|---|
| 2026-05-19 | Callback OAuth apontava para /api/auth/callback em vez de /auth/callback | ✅ Corrigido |
| 2026-05-19 | Webhook não inseria dono em restaurant_users → bloqueava acesso ao ADM | ✅ Corrigido |
| 2026-05-19 | Migration SQL não havia sido executada → tabelas não existiam | ✅ Corrigido |
| 2026-05-20 | Login ADM não entrava: `response.cookies.set()` chamado duas vezes com o mesmo nome sobrescreve (Map interno por nome) — cookie válido era descartado. Fix: `response.headers.append('Set-Cookie', …)` para que ambos os Set-Cookie coexistam. | ✅ Corrigido |

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
| 2026-05-19 | preview ao vivo via postMessage (iframe → PreviewListener) | Sem URL params, sem nova rota — atualiza CSS vars diretamente no iframe já carregado |
| 2026-05-19 | Restaurante pausado → página específica (não 404) | UX: cliente entende que o restaurante existe mas está temporariamente fechado |
| 2026-05-19 | ADM acessível mesmo quando restaurante pausado | Dono precisa poder reativar sem contato com suporte |
| 2026-05-19 | Som de novo pedido via Web Audio API | Sem arquivo de áudio externo, zero dependência adicional |
