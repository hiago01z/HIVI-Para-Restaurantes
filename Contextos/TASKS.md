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

---

## Em Andamento

| Tarefa | Fase |
|---|---|
| Testes dos fluxos críticos em produção | Fase 8 |

---

## Pendente

### Configurações externas (requer ação manual)
- [x] Resend: API key + domínio hivi-web.com verificado + RESEND_FROM_EMAIL configurado
- [x] NEXT_PUBLIC_APP_URL atualizado para https://hivi-web.com na Vercel
- [x] Domínio hivi-web.com conectado na Vercel
- [x] Supabase: Site URL e Redirect URLs atualizados para hivi-web.com
- [x] Stripe webhook atualizado para hivi-web.com/api/stripe/webhook
- [ ] Configurar Stripe Billing Portal em dashboard.stripe.com/settings/billing/portal
- [ ] **CRÍTICO**: Executar migration 005 no Supabase (SQL Editor): `supabase/migrations/005_label_columns_and_role_fix.sql` — sem isso, label customization não persiste e convite de funcionários falha
- [ ] **CRÍTICO**: Executar migration 006 no Supabase (SQL Editor): `supabase/migrations/006_qr_session_order_id_and_rls_fixes.sql` — sem isso, fluxo QR code de mesa quebrado e cardápio de restaurantes novos retorna 404

### Fase 8 — Polimento e Testes
- [ ] Testar fluxo completo: cadastro → pagamento → ADM → cardápio público
- [ ] Testar pedido de mesa com QR Code (câmera real)
- [ ] Testar pedido de entrega + WhatsApp automático
- [ ] Testar upload de imagens (logo, banner, categorias, pratos)
- [ ] Responsividade mobile em todas as telas (375px — testes reais no dispositivo)

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
| 2026-05-19 | preview ao vivo via postMessage (iframe → PreviewListener) | Sem URL params, sem nova rota — atualiza CSS vars diretamente no iframe já carregado |
| 2026-05-19 | Restaurante pausado → página específica (não 404) | UX: cliente entende que o restaurante existe mas está temporariamente fechado |
| 2026-05-19 | ADM acessível mesmo quando restaurante pausado | Dono precisa poder reativar sem contato com suporte |
| 2026-05-19 | Som de novo pedido via Web Audio API | Sem arquivo de áudio externo, zero dependência adicional |
