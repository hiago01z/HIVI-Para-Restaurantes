# HIVI Para Restaurantes — Regras do Projeto

## Regras Obrigatórias

### 1. Sempre ler os contextos antes de qualquer tarefa

Antes de iniciar qualquer implementação, ler obrigatoriamente:

- [`README.md`](./README.md)
- [`Contextos/PROJECT.md`](./Contextos/PROJECT.md)
- [`Contextos/ARCHITECTURE.md`](./Contextos/ARCHITECTURE.md)
- [`Contextos/FEATURES.md`](./Contextos/FEATURES.md)
- [`Contextos/PHASES.md`](./Contextos/PHASES.md)
- [`Contextos/TASKS.md`](./Contextos/TASKS.md)

**Motivo**: o projeto é complexo e multi-área. Trabalhar sem contexto gera inconsistências e bugs de integração.

---

### 2. Atualizar `Contextos/TASKS.md` após cada tarefa concluída

Toda vez que uma tarefa for concluída:
1. Abrir `Contextos/TASKS.md`
2. Mover a tarefa de "Pendente" para "Concluído" com a data
3. Adicionar breve descrição do que foi feito

**Motivo**: manter histórico de progresso e facilitar retomada em novas sessões.

---

### 3. Atualizar `README.md` após mudanças estruturais

Atualizar o README sempre que:
- Uma nova fase for concluída
- A stack tecnológica mudar
- Novos comandos/scripts forem adicionados
- A estrutura de pastas mudar significativamente
- Novas variáveis de ambiente forem adicionadas

**Motivo**: o README é a primeira referência para qualquer pessoa ou IA que abra o projeto.

---

## Regras de Código

### Multi-tenancy
- **Nunca** fazer queries sem filtrar por `restaurant_id`
- Sempre validar no servidor se o `restaurant_id` pertence ao usuário autenticado
- Nunca expor dados de um restaurante para outro

### Área Administrativa do Restaurante
- A área `/[slug]/adm` pertence ao **restaurante** (dono/funcionários), não à HIVI
- Autenticação do ADM é separada da autenticação da conta HIVI
- Roles: `owner` > `admin` > `waiter` — respeitar permissões

### Segurança
- Todas as mutations passam por API Routes
- RLS ativo em todas as tabelas do Supabase
- Validar inputs em todas as APIs (zod)
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no cliente

### WhatsApp (UltraMSG)
- Disparar mensagem **apenas** para pedidos de **entrega** (`type = delivery`)
- Nunca disparar para pedidos de mesa
- Sempre incluir nome do restaurante e número do pedido na mensagem

### Stripe
- Nunca criar/cancelar assinaturas sem passar pelo webhook
- O restaurante só fica ativo se `stripe_subscription_id` estiver ativo
- Sempre validar assinatura do webhook Stripe

### Imagens
- Usar Supabase Storage para todas as imagens
- Bucket `restaurant-images` com leitura pública

---

## Convenções de Código

- Arquivos e pastas: `kebab-case`
- Componentes React: `PascalCase`
- Funções e variáveis: `camelCase`
- Tabelas do banco: `snake_case`
- Componentes do cardápio público: `components/menu/`
- Componentes do ADM do restaurante: `components/adm/`
- Componentes da landing HIVI: `components/saas/`
- Componentes compartilhados: `components/ui/`

---

## Checklist Antes de Commitar

- [ ] Leu os contextos antes de implementar?
- [ ] `Contextos/TASKS.md` foi atualizado?
- [ ] `README.md` foi atualizado (se necessário)?
- [ ] RLS está correto para novas tabelas?
- [ ] Inputs estão sendo validados?
- [ ] Não há `console.log` de dados sensíveis?
- [ ] Testou em mobile (375px)?
