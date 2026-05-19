# HIVI — Guia de Configuração das API Keys

> Status das chaves no `.env.local`:
> - ✅ **Configurada** — já inserida no projeto
> - ⬜ **Pendente** — ainda precisa ser obtida e inserida

---

## Status Geral das Chaves

| Serviço | Variável | Status |
|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL` | ✅ Configurada |
| Supabase | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Configurada |
| Supabase | `SUPABASE_SERVICE_ROLE_KEY` | ✅ Configurada |
| Stripe | `STRIPE_SECRET_KEY` | ✅ Configurada |
| Stripe | `STRIPE_WEBHOOK_SECRET` | ✅ Configurada |
| Stripe | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Configurada |
| Stripe | `STRIPE_PRICE_BASIC` | ✅ Configurada |
| UltraMSG | `ULTRAMSG_INSTANCE_ID` | ✅ Configurada |
| UltraMSG | `ULTRAMSG_TOKEN` | ✅ Configurada |
| Google OAuth | Configurar no painel Supabase | ✅ Configurado |
| Resend | `RESEND_API_KEY` | ⬜ Pendente |
| App | `NEXT_PUBLIC_APP_URL` | ✅ Configurado (`https://hivi.vercel.app`) |

---

## 1. Google OAuth — Passo a Passo Completo

O Google OAuth **não usa variável no `.env.local`** — as credenciais são inseridas diretamente no painel do Supabase. Ele gera um Client ID e um Client Secret que o Supabase usa internamente.

### 1.1 — Criar projeto no Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. No topo da página, clique em **"Selecionar projeto"** → **"Novo projeto"**
3. Dê o nome **HIVI** (ou qualquer nome)
4. Clique em **"Criar"** e aguarde alguns segundos

---

### 1.2 — Configurar a Tela de Consentimento OAuth

> Obrigatório antes de criar as credenciais.

1. No menu lateral esquerdo, vá em **"APIs e serviços"** → **"Tela de consentimento OAuth"**
2. Selecione **"Externo"** → clique **"Criar"**
3. Preencha os campos obrigatórios:
   - **Nome do app:** `HIVI`
   - **E-mail de suporte:** seu e-mail
   - **Logotipo:** opcional
   - **Domínio do app:** `hivi.com.br` (em produção) ou deixe em branco para testes
   - **E-mail do desenvolvedor:** seu e-mail
4. Clique **"Salvar e continuar"**
5. Em "Escopos" → clique **"Salvar e continuar"** (sem adicionar escopos extras)
6. Em "Usuários de teste" → clique **"Salvar e continuar"**
7. Clique **"Voltar para o painel"**

---

### 1.3 — Criar as Credenciais OAuth 2.0

1. No menu lateral, vá em **"APIs e serviços"** → **"Credenciais"**
2. Clique em **"+ Criar credenciais"** → **"ID do cliente OAuth"**
3. Em **"Tipo de aplicativo"**, selecione **"Aplicativo da Web"**
4. Em **"Nome"**, coloque `HIVI Web`
5. Em **"Origens JavaScript autorizadas"**, clique **"+ Adicionar URI"** e adicione:
   ```
   https://hivi.com.br
   ```
   *(para desenvolvimento local, adicione também: `http://localhost:3000`)*

6. Em **"URIs de redirecionamento autorizados"**, clique **"+ Adicionar URI"** e adicione o callback do Supabase:
   ```
   https://SEU_PROJETO.supabase.co/auth/v1/callback
   ```
   > Substitua `SEU_PROJETO` pelo ID do seu projeto Supabase.
   > O ID aparece na URL do painel: `https://supabase.com/dashboard/project/SEU_PROJETO`

7. Clique **"Criar"**
8. Uma janela abrirá com:
   - **ID do cliente** — começa com `...apps.googleusercontent.com`
   - **Chave secreta do cliente** — string aleatória
   
   **Anote os dois valores. Você usará no próximo passo.**

---

### 1.4 — Inserir no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) → seu projeto HIVI
2. No menu lateral, vá em **"Authentication"** → **"Providers"**
3. Clique em **"Google"**
4. Ative o toggle **"Enable Google provider"**
5. Cole:
   - **Client ID (for OAuth)** → o "ID do cliente" do passo anterior
   - **Client Secret (for OAuth)** → a "Chave secreta do cliente"
6. Copie a **"Callback URL (for OAuth)"** que o Supabase mostra — ela tem o formato:
   ```
   https://SEU_PROJETO.supabase.co/auth/v1/callback
   ```
   Confirme que esse URL já está cadastrado nas credenciais do Google (passo 1.3.6)
7. Clique **"Save"**

✅ **Google OAuth está configurado.** O fluxo `/api/auth/google` → Supabase → Google → callback já funciona.

---

## 2. Resend — E-mails Transacionais

### Como obter

1. Acesse [resend.com](https://resend.com) → crie uma conta gratuita
2. No painel, clique em **"API Keys"** → **"Create API Key"**
3. Dê um nome (ex: `HIVI Production`) e clique **"Add"**
4. Copie a chave gerada — começa com `re_`
5. Cole no `.env.local`:
   ```env
   RESEND_API_KEY=re_xxxxxxxx
   RESEND_FROM_EMAIL=noreply@hivi.com.br
   ```

### Verificar domínio (produção)

Para enviar de `@hivi.com.br` (em vez de `@resend.dev`):
1. Em **"Domains"** no painel Resend → **"Add Domain"**
2. Adicione `hivi.com.br`
3. O Resend mostrará registros DNS (TXT, MX) para adicionar no seu provedor de domínio
4. Após verificação, emails saem de `noreply@hivi.com.br`

> **Em desenvolvimento**: use qualquer endereço `@resend.dev` — não precisa verificar domínio.

---

## 3. Variável `NEXT_PUBLIC_APP_URL`

Em desenvolvimento, já está em `.env.local` como `http://localhost:3000`.

Para produção, atualizar para:
```env
NEXT_PUBLIC_APP_URL=https://hivi.com.br
```

---

## 4. Stripe — Webhook em Produção

O `STRIPE_WEBHOOK_SECRET` local (para testes com `stripe listen`) é diferente do de produção.

### Para produção (Vercel/deploy):
1. Acesse [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Clique **"+ Add endpoint"**
3. URL: `https://hivi.com.br/api/stripe/webhook`
4. Eventos a escutar:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copie o **"Signing secret"** (começa com `whsec_`)
6. Atualize `STRIPE_WEBHOOK_SECRET` no painel de variáveis de ambiente da Vercel

### Para testes locais:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
O comando imprime o `whsec_...` local para colocar no `.env.local`.

---

## 5. UltraMSG — Instância WhatsApp

Já configurado. Para referência, as credenciais ficam em:
- [ultramsg.com](https://ultramsg.com) → sua instância → **"API & Tokens"**
  - `ULTRAMSG_INSTANCE_ID` = ID da instância (ex: `instance12345`)
  - `ULTRAMSG_TOKEN` = Token de autenticação

> O número de WhatsApp precisa estar conectado e ativo na instância do UltraMSG para os disparos funcionarem.

---

## 6. Supabase — Configurações Adicionais

### Habilitar Realtime nas tabelas

Para o `meu-pedido` (status em tempo real) e pedidos do ADM:
1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) → **"Database"** → **"Replication"**
2. Ative as tabelas `orders` para receber eventos de `INSERT` e `UPDATE`

### Criar bucket de Storage

Para upload de imagens (logo, banner, produtos, categorias):
1. **"Storage"** → **"New bucket"**
2. Nome: `restaurant-images`
3. Marque **"Public bucket"** ✅
4. Clique **"Create bucket"**

### Executar a Migration SQL

1. **"SQL Editor"** → **"New query"**
2. Cole o conteúdo de `supabase/migrations/001_initial_schema.sql`
3. Clique **"Run"**

---

## 7. Variáveis de Ambiente na Vercel

> **Resposta direta:** Nenhuma chave do Google vai para a Vercel.
> As credenciais Google OAuth (Client ID + Client Secret) ficam **exclusivamente dentro do painel do Supabase** (Authentication → Providers → Google). O Supabase faz toda a ponte com o Google internamente. A Vercel não precisa saber nada sobre o Google.

### Como inserir as variáveis

1. Acesse [vercel.com](https://vercel.com) → seu projeto HIVI
2. Vá em **"Settings"** → **"Environment Variables"**
3. Para cada variável abaixo, clique **"Add"**, preencha o nome e o valor, marque **"Production"** (e "Preview" se quiser), e salve

### Variáveis que vão para a Vercel

| Variável | Valor | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://seu-projeto.supabase.co` | Mesmo do `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Mesmo do `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Mesmo do `.env.local` |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Use a chave **live** em produção |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ⚠️ Ver nota abaixo |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Use a chave **live** em produção |
| `STRIPE_PRICE_BASIC` | `price_...` | Mesmo do `.env.local` |
| `ULTRAMSG_INSTANCE_ID` | `instance...` | Mesmo do `.env.local` |
| `ULTRAMSG_TOKEN` | `...` | Mesmo do `.env.local` |
| `RESEND_API_KEY` | `re_...` | Quando obtido |
| `RESEND_FROM_EMAIL` | `noreply@hivi.com.br` | Após verificar domínio no Resend |
| `NEXT_PUBLIC_APP_URL` | `https://hivi.vercel.app` | ✅ Configurado — atualizar para `https://hivi.com.br` quando o domínio estiver ativo |

### ⚠️ STRIPE_WEBHOOK_SECRET — atenção especial

O `STRIPE_WEBHOOK_SECRET` que você usa localmente (gerado pelo `stripe listen`) é **diferente** do de produção. Para produção:

1. Acesse [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Clique **"+ Add endpoint"**
3. URL: `https://hivi.com.br/api/stripe/webhook`
4. Eventos:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Após criar, clique no endpoint → **"Signing secret"** → **"Reveal"**
6. Copie o `whsec_...` e coloque **esse novo valor** na Vercel (não o do `.env.local`)

### O que NÃO vai para a Vercel

| O que é | Por que não vai |
|---|---|
| Google Client ID | Está dentro do Supabase Dashboard — Supabase já usa internamente |
| Google Client Secret | Idem acima |
| Qualquer outro segredo do Google | Não existe integração direta Google ↔ Vercel neste projeto |

---

## Checklist Final de Deploy

```
[x] Google OAuth configurado no Supabase (Client ID + Secret)
[x] Supabase: migration SQL executada (todas as tabelas + RLS)
[x] Supabase: tabela orders com Realtime ativado
[x] Supabase: bucket restaurant-images criado (público)
[x] Stripe webhook criado para domínio de produção (hivi.vercel.app/api/stripe/webhook)
[x] Variáveis de ambiente inseridas na Vercel
[x] NEXT_PUBLIC_APP_URL configurado (https://hivi.vercel.app)
[ ] Resend API key inserida + domínio verificado
[ ] Stripe: Billing Portal configurado (dashboard.stripe.com/settings/billing/portal)
[ ] NEXT_PUBLIC_APP_URL atualizado para https://hivi.com.br (quando domínio estiver ativo)
```
