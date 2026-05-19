# HIVI Para Restaurantes — Especificações de Funcionalidades

## 1. Template Inicial HIVI (Landing Page)

### Landing Page (`/`)
A vitrine pública da HIVI para atrair donos de restaurante.

**Seções (em ordem vertical):**
- **Header**: Logo HIVI, links de navegação (Como funciona, Preços, FAQ, Feedback), botões "Criar conta" e "Entrar"
- **Hero**: Headline principal + preview do cardápio digital
- **Informações importantes**: texto explicativo sobre QR code nas mesas
- **Benefícios**: cards com vantagens do cardápio online
- **Quem usa aprova**: depoimentos de clientes HIVI
- **Como funciona**: passo a passo (contratar → configurar → publicar)
- **Preços**: card do plano Básico (R$ 59,99/mês) com CTA "Contratar"
- **Rodapé**: Como funciona, Preços, FAQ, Feedback, Entrar, Privacidade, Termos, Exclusão de dados, Copyright

### Área de Conta (`/conta`)
Painel do dono do restaurante na plataforma HIVI (não é o ADM do restaurante).

**Funcionalidades:**
- Listar todas as lojas do usuário (nome, status, slug)
- Ações por loja:
  - **Ver loja** → abre `/[slug]` (cardápio público)
  - **Painel Administrativo** → vai para `/[slug]/adm`
  - **Pausar/Ativar loja** → toggle de `is_active`
  - **Excluir loja** → confirmação → soft delete
- **Criar nova loja** → fluxo de checkout Stripe
- Configurações de conta: nome, e-mail

---

## 2. Cardápio Público (`/[slug]`)

### Home do Cardápio
**Header (fixo):**
- Logo do restaurante (clicável → volta para home)
- Campo de busca
- Ícone de carrinho (com contador de itens)
- Ícone de menu (abre drawer de categorias)

**Destaques:**
- Exibe produtos com `is_featured = true` em grid (2 colunas mobile)
- Cada card: foto, nome, descrição resumida
- Clique → tela de detalhe do produto

**Grid de Categorias:**
- Ordenadas por `display_order` (definido no ADM do restaurante)
- Cada categoria: imagem de fundo, nome em destaque
- Clique → `/[slug]/categoria/[id]`

**Busca:**
- Filtra produtos por nome em tempo real

### Listagem por Categoria (`/[slug]/categoria/[id]`)
- Header com foto de fundo da categoria + nome grande
- Ordenação por preço (maior → menor / menor → maior)
- Cards verticais: foto à esquerda, nome + descrição + preço à direita
- Botão "Pedir agora" → adiciona ao carrinho

### Tela de Pedido (`/[slug]/pedido`)
- Lista de itens do carrinho: foto, nome, preço, quantidade
- Total geral
- **Botão "Gerar QR Code"** → inicia fluxo de mesa
- **Botão "Entrega"** → inicia fluxo de entrega

### Modal: QR Code de Mesa
- Texto "Mostre o QR code ao garçom"
- QR code gerado com URL `/[slug]/adm/qr/[session_id]`

### Modal: Dados para Entrega
- Campos: Nome, Endereço (rua, número), Ponto de referência, Telefone (WhatsApp), Forma de pagamento (dinheiro/cartão/pix), Troco para
- Botão "Confirmar entrega" → cria pedido, redireciona para Meu Pedido

### Meu Pedido (`/[slug]/meu-pedido/[id]`)
- Status atual em destaque (ex: "Sendo preparado")
- Lista de itens com fotos, nomes e preços
- Total e número do pedido
- Logo do restaurante
- Links de Instagram e WhatsApp do restaurante
- Atualização automática do status via Supabase Realtime

---

## 3. Painel Administrativo do Restaurante (`/[slug]/adm`)

> Esta área pertence exclusivamente ao restaurante. Acessada pelos funcionários (dono, admin, garçom) com login de e-mail e senha próprios — **não usa a conta HIVI**.

### Autenticação do Restaurante
- Login via e-mail + senha (Supabase Auth)
- Roles: `owner` (acesso total), `admin` (acesso total), `waiter` (somente aba "Ler QR Code")

### Header do ADM
- Logo do restaurante + texto "Administração"
- Menu hambúrguer (drawer com navegação)

### Menu de Navegação
- Pedidos
- Categorias
- Pratos/Bebidas
- Configurações

---

### Pedidos (`/[slug]/adm/pedidos`)

**Tabs:**
1. **Entrega** — pedidos `type = delivery`
2. **Pedido na mesa** — pedidos `type = table`
3. **Ler QR Code** — scanner de câmera

**Filtros:**
- Data: Hoje (default) / Período customizado
- Ordenar por: Ordem do pedido, Mais recente

**Card de Pedido (Entrega):**
- Data e hora, status com badge colorido
- Cliente: nome
- Endereço: rua, bairro, ponto de referência, número, município
- Contato: telefone
- Forma de pagamento + troco
- Botão ✏️ → modal alterar status

**Card de Pedido (Mesa):**
- Data e hora, status com badge
- Cliente: nome
- Mesa: número
- Pedido: número + "Ver itens" (expande itens do pedido)
- Botão ✏️ → modal alterar status

**Status disponíveis:**
- `pending` — Aguardando
- `confirmed` — Confirmado
- `preparing` — Sendo preparado
- `ready` — Pronto
- `out_for_delivery` — Saiu para entrega *(entrega apenas)*
- `delivered` — Entregue
- `cancelled` — Cancelado

> Ao alterar status em pedidos de **entrega**, WhatsApp automático é disparado para o cliente via UltraMSG.

**Aba "Ler QR Code":**
- Abre câmera do dispositivo
- Escaneia QR code gerado pelo cliente
- Exibe tela de confirmação com itens + total
- Botão "Confirmar Pedido" → pedido vai para lista "Pedido na mesa"

---

### Pratos/Bebidas (`/[slug]/adm/pratos`)

**Filtros:**
- Filtrar por categoria (dropdown)
- Ordenar por preço

**Card de produto:**
- Foto, nome, categoria (badge), preço
- Toggle **"Exibir nos destaques"** → liga/desliga `is_featured` (aparece/some da home do cardápio)
- Botões: **Editar** | **Excluir**

**Modal Criar/Editar:**
- Upload de imagem via **ImageCropPicker**: arrastar para reposicionar, zoom com roda do mouse ou botões −/+ (50%–300%), recorte automático para 800×800 px JPEG ao salvar
- Nome, descrição, preço, categoria, disponível, is_featured

---

### Categorias (`/[slug]/adm/categorias`)

**Listagem:**
- Número de ordem ("Ordem 1", "Ordem 2"...), miniatura da imagem (quadrada), nome
- Botões: **Editar** | **Excluir**

**Reordenação:**
- Drag-and-drop ou botões ↑↓
- A ordem aqui define diretamente a ordem das categorias na home do cardápio público

**Criar/Editar categoria:**
- Nome
- Upload de imagem via **ImageCropPicker**: arrastar para reposicionar, zoom com roda do mouse ou botões −/+ (50%–300%), recorte automático para 800×800 px JPEG ao salvar
- Imagem existente é pré-carregada como blob para permitir reposicionamento sem precisar trocar o arquivo

---

### Configurações (`/[slug]/adm/configuracoes`)

**Redes Sociais:**
- Link do Instagram, Número do WhatsApp
- Exibidos no rodapé do cardápio público

**Temas:**
- Cor primária, cor de background (color picker)
- Família de fonte, tamanho base de fonte
- Upload de logo do restaurante
- Upload de imagem de banner
- Preview ao vivo das alterações
- Temas pré-definidos: Rústico, Moderno, Claro, Colorido

**QR Code da Loja:**
- Gerar QR code apontando para `/[slug]`
- Botão "Baixar QR Code" (PNG) para imprimir e colocar nas mesas

**Gerenciar Funcionários:**
- Listar funcionários (nome, e-mail, role)
- Convidar novo funcionário via e-mail (Resend)
- Remover funcionário, alterar role

---

## 4. Fluxos Críticos

### Fluxo 1: Novo restaurante se cadastra
1. Dono acessa `hivi.com.br` → clica "Criar conta" → Google OAuth
2. Redirecionado para `/conta`
3. Clica "Criar nova loja" → preenche nome e slug → checkout Stripe
4. Pagamento confirmado → webhook ativa o restaurante
5. E-mail de boas-vindas via Resend
6. Dono acessa `/[slug]/adm` e configura a loja

### Fluxo 2: Cliente faz pedido de mesa com QR Code
1. Escaneia QR code da mesa → `/[slug]`
2. Adiciona itens ao carrinho → tela de pedido → "Gerar QR Code"
3. Sistema cria `qr_session`, exibe QR code
4. Garçom abre aba "Ler QR Code" no ADM, escaneia
5. Vê itens + clica "Confirmar Pedido"
6. Pedido criado em `orders` com `type = table`
7. Aparece na aba "Pedido na mesa" do ADM

### Fluxo 3: Cliente faz pedido de entrega com WhatsApp
1. Cliente acessa `/[slug]` → adiciona itens → "Entrega"
2. Preenche formulário com endereço e WhatsApp → confirma
3. Pedido criado com `status = pending`
4. Cliente acompanha em "Meu Pedido" (realtime)
5. Funcionário altera status no ADM → WhatsApp disparado automaticamente

### Fluxo 4: Garçom usa "Ler QR Code"
1. Garçom acessa `/[slug]/adm/pedidos` → aba "Ler QR Code"
2. Câmera abre → aponta para QR code do cliente
3. Rota `/[slug]/adm/qr/[session_id]` carrega
4. Exibe itens + botão "Confirmar Pedido"
5. Garçom confirma → pedido registrado na lista
