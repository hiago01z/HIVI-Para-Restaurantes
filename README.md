# HIVI Para Restaurantes

SaaS multi-tenant de cardápio digital online para restaurantes. O restaurante contrata um plano, recebe acesso ao painel administrativo próprio e um link de cardápio público com QR code para os clientes.

---

## Documentação do Projeto

| Arquivo | Conteúdo |
|---|---|
| [`Contextos/PROJECT.md`](./Contextos/PROJECT.md) | Visão geral, objetivos, stack, fluxos principais |
| [`Contextos/ARCHITECTURE.md`](./Contextos/ARCHITECTURE.md) | Estrutura de pastas, schema do banco, rotas de API |
| [`Contextos/FEATURES.md`](./Contextos/FEATURES.md) | Especificações detalhadas de cada funcionalidade e tela |
| [`Contextos/PHASES.md`](./Contextos/PHASES.md) | Fases de desenvolvimento com checklists |
| [`Contextos/TASKS.md`](./Contextos/TASKS.md) | Registro de tarefas concluídas e pendentes |
| [`RULES.md`](./RULES.md) | Regras obrigatórias do projeto |

---

## As Três Grandes Áreas

```
hivi.com.br/               → Landing page HIVI + área de conta (login Google + Stripe)
hivi.com.br/[slug]         → Cardápio público do restaurante (clientes)
hivi.com.br/[slug]/adm     → Painel administrativo do restaurante (dono e funcionários)
```

---

## Stack

| Tecnologia | Uso |
|---|---|
| Next.js 15 (App Router) | Framework principal |
| Supabase | Banco (PostgreSQL), Auth, Storage |
| Stripe | Pagamento de planos e assinaturas |
| Google OAuth | Login na plataforma HIVI |
| Resend | E-mails transacionais |
| UltraMSG | WhatsApp automático para clientes de entrega |
| Vercel | Hospedagem e deploy |
| Tailwind CSS + Shadcn/ui | Estilização e componentes |

---

## Status do Projeto

**Fase atual**: Fase 1 — Template Inicial (HIVI SaaS)

| Fase | Status |
|---|---|
| 0 — Setup e Infraestrutura | ✅ Concluído |
| 1 — Template Inicial (HIVI SaaS) | ⬜ Pendente |
| 2 — Cardápio Público | ⬜ Pendente |
| 3 — Pedidos e QR Code | ⬜ Pendente |
| 4 — Painel Administrativo do Restaurante | ⬜ Pendente |
| 5 — Integrações (WhatsApp + Email) | ⬜ Pendente |
| 6 — Temas e Personalização | ⬜ Pendente |
| 7 — Billing e Gestão de Conta | ⬜ Pendente |
| 8 — Testes e Deploy | ⬜ Pendente |

---

## Variáveis de Ambiente

Crie `.env.local` baseado em `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

RESEND_API_KEY=

ULTRAMSG_INSTANCE_ID=
ULTRAMSG_TOKEN=

NEXT_PUBLIC_APP_URL=https://hivi.com.br
```

---

## Como Rodar Localmente

```bash
npm install
npm run dev
```

---

## Regras Importantes

Ver [`RULES.md`](./RULES.md). Em resumo:

1. **Sempre ler os contextos antes de qualquer tarefa**
2. **Sempre atualizar `Contextos/TASKS.md` após concluir uma tarefa**
3. **Sempre atualizar este README após mudanças estruturais**

---

*2026 HIVI Tecnologia — Todos os direitos reservados*
