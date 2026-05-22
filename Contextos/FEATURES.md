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
- **Preços**: dois cards de plano (Básico R$ 59,99 e Pro R$ 99,99 — destacado como Recomendado) com feature lists completas
- **Rodapé**: Como funciona, Preços, FAQ, Feedback, Entrar, Privacidade, Termos, Exclusão de dados, Copyright

### Área de Conta (`/conta`)
Painel do dono do restaurante na plataforma HIVI (não é o ADM do restaurante).

**Funcionalidades:**
- Listar todas as lojas do usuário com **badge de plano** (Básico / Pro ★) e status (Ativa / Pausada)
- Ações por loja:
  - **Ver loja** → abre `/[slug]` (cardápio público)
  - **Painel Administrativo** → vai para `/[slug]/adm`
  - **Pausar/Ativar loja** → toggle de `is_active`
  - **Excluir loja** → confirmação → soft delete
  - **Fazer upgrade para Pro** → botão visível para cardápios no plano Básico → checkout Stripe ou upgrade via subscription update
- **Criar nova loja** → seletor de plano (Básico R$59,99 / Pro R$99,99) → fluxo de checkout Stripe
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

**Tabs (filtradas por cargo):**
1. **Entrega** — pedidos `type = delivery`
2. **Mesa** — pedidos `type = table`
3. **Ler QR Code** — scanner de câmera

**Filtros de período:**
- Hoje (default) / Ontem / 7 dias — server-side com date range

**Card de Pedido:**
- Número do pedido, hora, nome do cliente
- Badge de status colorido + "Alterado por [nome]" (audit trail)
- Badge Pago ✓ / Não Pago ✗ (clicável) + "Alterado por [nome]"
- Botão ✏️ → modal alterar status (filtrado por cargo)
- Botão 🖨️ → imprimir cupom deste pedido (se impressora configurada)
- Expandir: lista de itens, adicionais selecionados, total
- Campo "Observações" com badge amarelo 💬

**Status disponíveis:**
- `pending` — Aguardando
- `confirmed` — Confirmado
- `preparing` — Sendo preparado
- `ready` — Pronto
- `out_for_delivery` — Saiu para entrega *(entrega apenas)*
- `delivered` — Entregue
- `cancelled` — Cancelado

> Ao alterar status em pedidos de **entrega**, WhatsApp automático é disparado para o cliente via UltraMSG.

**Notificação de novo pedido:**
- Som (dois beeps via Web Audio API) — toggle 🔔 no header
- Auto-impressão (se impressora configurada e ativa) — toggle 🖨️ no header

**Aba "Ler QR Code":**
- Abre câmera do dispositivo (jsQR + canvas)
- Escaneia QR code gerado pelo cliente
- Exibe tela de confirmação com itens + adicionais + total
- Botão "Confirmar Pedido" → pedido vai para lista "Mesa"

**RBAC — o que cada cargo vê/pode:**

| Cargo | Tabs visíveis | Status selecionáveis |
|---|---|---|
| Dono / Gerente | Entrega + Mesa + QR | Todos |
| Cozinheiro | Entrega + Mesa | pending, confirmed, preparing, ready, cancelled |
| Garçom | Mesa + QR | pending, confirmed |
| Entregador | Entrega | out_for_delivery, delivered, cancelled |

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

### Pratos — Adicionais (Product Add-ons)

Cada prato pode ter múltiplos **grupos de opções**. O cliente escolhe antes de adicionar ao carrinho.

**Exemplos:**
- "Carne" → Frango / Carne / Vegano (obrigatório, 1 escolha)
- "Adicionais" → Queijo +R$2 / Bacon +R$3 (opcional, até 3)
- "Tamanho" → P / M / G (obrigatório, 1 escolha)

**ADM (botão "Adicionais" por produto):**
- Criar grupo: nome, descrição, obrigatório/opcional, máx. seleções
- Criar itens dentro do grupo: nome + preço adicional
- Editar inline grupos e itens (lápis → formulário em linha → salvar)
- Excluir grupos e itens individualmente
- Toggle "Ativo" por item

**Cardápio público:**
- Modal abre automaticamente ao clicar em produto com adicionais
- Grupos obrigatórios marcados com `*` e badge vermelho "Obrigatório"
- Comportamento rádio (máx. 1) ou checkbox (máx. N)
- Total unitário atualiza em tempo real com adicionais
- Mesmo produto com opções diferentes = entradas separadas no carrinho

**Pedidos e ADM:**
- `selected_options` salvo em JSONB em `order_items`
- Adicionais exibidos abaixo do item no detalhe do pedido
- WhatsApp inclui adicionais (↳ nome +preço)
- Meu Pedido do cliente exibe adicionais escolhidos

---

### Configurações (`/[slug]/adm/configuracoes`)

**Redes Sociais:**
- Link do Instagram, Número do WhatsApp
- Exibidos no rodapé do cardápio público
- Botão "Testar notificação" envia mensagem WhatsApp de teste

**Horário de Entregas:**
- Toggle habilitar/desabilitar controle de horário
- Modo "mesmo horário todos os dias" ou "horários diferentes por dia"
- Fora do horário: botão de entrega bloqueado no cardápio com mensagem de reabertura

**Temas:**
- Cor primária, fundo, texto, ícones, secundária (color picker)
- Família de fonte, tamanho base de fonte
- Upload de logo do restaurante (com remoção)
- Upload de imagem de banner (com remoção)
- Texto sobre imagens: fonte decorativa, cor, efeito (contorno/fundo/desalinhado), espessura e direção
- Preview ao vivo via iframe real + postMessage
- Temas pré-definidos: Rústico, Moderno, Claro, Verde

**QR Code da Loja:**
- Gerar QR code apontando para `/[slug]`
- Botão "Baixar QR Code" (PNG) para imprimir e colocar nas mesas

**Impressora Térmica:**
- Tipo de conexão: 🔌 Cabo USB (WebUSB) / 📶 Bluetooth (Web Bluetooth) / 🖨️ Via sistema (window.print)
- Largura do papel: 58 mm (32 col) ou 80 mm (48 col)
- Toggle auto-imprimir ao confirmar pedido
- Botão "Conectar" (USB/BT abre seletor do Chrome; Via sistema sempre pronto)
- Botão "Imprimir teste" (envia cupom de teste para a impressora)
- Configuração salva em `localStorage` — persiste entre sessões

**Gerenciar Funcionários:**
- Listar funcionários (nome, e-mail, cargo)
- Convidar novo funcionário via e-mail (Resend)
- Remover funcionário, alterar cargo

---

## 4. Impressão Térmica

> Zero instalação em qualquer modo.

### Modos de conexão

| Modo | Como funciona | Requisito |
|---|---|---|
| 🔌 Cabo USB | WebUSB API — Chrome abre seletor de dispositivos USB | Chrome desktop, impressora USB |
| 📶 Bluetooth | Web Bluetooth API — Chrome abre seletor BT | Chrome desktop/mobile, BT ativo |
| 🖨️ Via sistema | `window.print()` + iframe oculto + CSS `@page` | Qualquer browser, impressora configurada no OS |

### Formato do cupom

- Cabeçalho: nome do restaurante + número do pedido (fonte dupla)
- Corpo: tipo (Mesa N / Delivery) + data/hora + nome do cliente
- Itens: `Nx Nome` alinhado com preço à direita
- Adicionais: `  + Nome` com preço adicional
- Rodapé: TOTAL em negrito + observações + assinatura HIVI
- Corte de papel automático (ESC/POS `GS V 01`)

### Configuração (ADM → Configurações → Impressora Térmica)

1. Selecionar tipo de conexão
2. Selecionar largura do papel (58 mm / 80 mm)
3. Para USB/BT: clicar "Conectar" → browser abre seletor
4. Para Via sistema: já pronto — testar direto
5. Clicar "Imprimir teste" para confirmar
6. Habilitar "Auto-imprimir ao confirmar pedido"

### Comportamento no painel de pedidos

- Header: badge 🖨️ mostra estado (Impr. ativa / pausada / Reconectar)
- Novo pedido via Realtime → auto-imprime se conectado e ativo
- Botão 🖨️ por card → reimprimir manualmente a qualquer momento
- Toast verde/vermelho confirma sucesso ou exibe erro de impressão

---

## 5. Planos e Billing

### Plano Básico — R$ 59,99/mês

Tudo que o restaurante precisa para operar:
- Cardápio digital público, QR code de mesa, pedidos em tempo real
- Adicionais e grupos de opções por prato
- Impressão térmica (USB, Bluetooth, sistema)
- Personalização de tema, logo, banner, fonte
- Gerenciamento de equipe com RBAC (5 cargos)
- Integração WhatsApp automática
- Horário de funcionamento de entregas

### Plano Pro — R$ 99,99/mês

Tudo do Básico + **Analytics e Relatórios**:
- Gráfico de receita por dia (últimos 7 ou 30 dias)
- Gráfico de pedidos por dia
- Top 5 produtos mais vendidos (quantidade + receita)
- Pedidos por tipo: mesa vs entrega (gráfico donut)
- Distribuição de pedidos por horário (06h–23h)
- KPIs: receita total, nº pedidos, ticket médio, horário de pico
- Comparativo semanal com variação percentual
- Exportação de todos os pedidos em CSV

### Upgrade Basic → Pro

Via `/conta`: botão "Fazer upgrade para Pro" por restaurante.
- Se já tem assinatura Stripe: atualiza subscription (troca de price + proration)
- Se não tem: novo checkout Stripe com price Pro

### Ambiente Stripe

| Variável | Descrição |
|---|---|
| `STRIPE_PRICE_BASIC` | Price ID do plano Básico R$59,99/mês |
| `STRIPE_PRICE_PRO` | Price ID do plano Pro R$99,99/mês |

---

## 6. Analytics e Relatórios (`/[slug]/adm/analytics`)

> Exclusivo do Plano Pro.

### Gráficos disponíveis

| Gráfico | Tipo | Dados |
|---|---|---|
| Receita por dia | AreaChart | Soma de `total` por dia (sem cancelados) |
| Pedidos por dia | BarChart | Contagem de pedidos por dia |
| Top 5 produtos | Barras CSS | Ordenado por quantidade, mostra qtd + receita |
| Pedidos por tipo | PieChart donut | Mesa vs Entrega |
| Distribuição horária | BarChart | Pedidos por hora 06h–23h |

### KPIs

- **Receita total** — soma de todos os pedidos não cancelados no período
- **Total de pedidos** — contagem
- **Ticket médio** — receita / pedidos
- **Horário de pico** — hora com mais pedidos (ex: "19h–20h")

### Comparativo semanal

Compara a receita dos últimos 7 dias com os 7 dias anteriores. Mostra variação % com badge verde (▲) ou vermelho (▼).

### Seletor de período

Toggle "7 dias" / "30 dias" — filtra todos os gráficos e KPIs.

### Exportação CSV

Botão "Exportar CSV" — gera arquivo `[restaurante]-pedidos-[data].csv` com colunas: Pedido, Data, Tipo, Status, Total, Itens. BOM UTF-8 para compatibilidade com Excel.

---

## 7. Fluxos Críticos

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
