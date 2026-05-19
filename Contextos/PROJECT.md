# HIVI Para Restaurantes — Visão Geral do Projeto

## O que é

SaaS multi-tenant de cardápio digital online para restaurantes. O restaurante contrata um plano, recebe acesso ao painel administrativo próprio e um link público de cardápio para os clientes. Tudo em um único template de interface, customizável por restaurante (cores, fontes, logo, tema).

## Nome do Produto

**HIVI Para Restaurantes**

## Domínio e URLs

| Área | URL |
|---|---|
| Landing page / SaaS | `hivi.com.br` |
| Área de conta (dono do restaurante) | `hivi.com.br/conta` |
| Cardápio público do restaurante | `hivi.com.br/[slug]` |
| Painel administrativo do restaurante | `hivi.com.br/[slug]/adm` |

## Stack Tecnológica

| Tecnologia | Uso |
|---|---|
| **Next.js 15** (App Router) | Framework principal (frontend + backend) |
| **Supabase** | Banco de dados (PostgreSQL), Auth, Storage de imagens |
| **Stripe** | Pagamento de planos e assinaturas |
| **Google OAuth** | Login na plataforma HIVI (via Supabase Auth) |
| **Resend** | E-mails transacionais (boas-vindas, faturas, alertas) |
| **UltraMSG** | Mensagens automáticas WhatsApp para clientes de entrega |
| **Vercel** | Hospedagem e deploy contínuo |
| **qrcode / react-qr-code** | Geração de QR codes (cardápio e pedidos) |
| **Tailwind CSS** | Estilização |
| **Shadcn/ui** | Componentes de UI base |

## Três Grandes Áreas

### 1. Template Inicial (HIVI SaaS)
A vitrine da HIVI. Onde o dono de restaurante conhece o produto, cria conta com Google, escolhe um plano e paga via Stripe. Após contratar, acessa a área de conta para gerenciar suas lojas.

- Landing page: Como funciona, Preços, FAQ, Depoimentos, Rodapé com links legais
- Criar conta (Google OAuth)
- Área de conta: listar lojas, criar nova loja, ver loja, painel adm, pausar loja, excluir loja

### 2. Área Administrativa do Restaurante (`/[slug]/adm`)
Exclusiva para o dono e funcionários do restaurante. Protegida por autenticação própria do restaurante — **não é a conta HIVI**. Funcionários acessam com e-mail e senha vinculados ao restaurante.

- **Pedidos**: visualizar pedidos de entrega e de mesa, ler QR code do garçom, alterar status
- **Pratos/Bebidas**: CRUD completo, definir destaques (exibidos na home do cardápio)
- **Categorias**: CRUD, definir ordem de exibição no cardápio
- **Configurações**: links de Instagram/WhatsApp, temas (cores, fontes, logo, background, preview ao vivo), QR code da loja
- **QR Code da loja**: gerar QR code para colocar nas mesas (aponta para o cardápio público)

### 3. Cardápio Público do Restaurante (`/[slug]`)
A vitrine do restaurante para os clientes. Acesso público, sem login.

- Home com destaques e grid de categorias
- Listagem por categoria com ordenação
- Busca de pratos
- Carrinho de pedidos
- Finalizar pedido: gerar QR code (para garçom) ou entrega (formulário + WhatsApp automático)
- Tela "Meu Pedido" com status em tempo real

## Multi-Tenancy

Cada restaurante é um **tenant**. Todos os dados são isolados por `restaurant_id`. O mesmo código Next.js serve todos os restaurantes via roteamento dinâmico `[slug]`.

- Um dono pode ter múltiplos restaurantes (planos adicionais pagos)
- Cada restaurante tem slug único, painel adm próprio, tema próprio
- Funcionários são vinculados ao restaurante, não à conta HIVI

## Fluxo Principal do Garçom

1. Cliente faz pedido no cardápio e clica em "Gerar QR Code"
2. QR code é exibido na tela do cliente
3. Garçom abre a aba **"Ler QR Code"** no painel adm do restaurante e escaneia
4. Sistema exibe os itens do pedido com botão **"Confirmar Pedido"**
5. Garçom confirma → pedido entra na fila de pedidos na mesa
6. Status pode ser atualizado pelo funcionário no painel adm

## Fluxo de Entrega com WhatsApp

1. Cliente preenche formulário de entrega (nome, endereço, contato, forma de pagamento)
2. Pedido é registrado no banco com status `aguardando`
3. Quando funcionário altera o status do pedido → UltraMSG dispara mensagem automática no WhatsApp do cliente informando o novo status
