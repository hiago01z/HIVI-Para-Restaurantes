# Feature: Adicionais (Product Add-ons)

> Status: **✅ Concluído** (2026-05-22)  
> Migration 010 executada no Supabase.

---

## Visão geral

Permite que o dono do restaurante configure **grupos de opções** para cada prato/bebida.  
O cliente, ao pedir, escolhe os itens desejados dentro de cada grupo antes de adicionar ao carrinho.

**Exemplos práticos:**
- "Carne" → Frango / Carne / Vegano (obrigatório, 1 escolha)
- "Ponto da carne" → Mal passado / Ao ponto / Bem passado (opcional, 1 escolha)
- "Adicionais" → Queijo extra (+R$2) / Bacon (+R$3) (opcional, até 3 escolhas)
- "Bebida inclusa" → Coca-Cola / Guaraná / Suco (obrigatório, 1 escolha)
- "Tamanho" → P / M / G com preços diferentes (obrigatório, 1 escolha)

---

## Schema do banco de dados

### Migration `010_product_options.sql`

```sql
-- Grupos de opções por produto
CREATE TABLE product_option_groups (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  min_selections   INT  NOT NULL DEFAULT 0,   -- 0 = opcional, > 0 = obrigatório
  max_selections   INT  NOT NULL DEFAULT 1,   -- 1 = rádio, > 1 = checkbox
  sort_order       INT  NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itens dentro de cada grupo
CREATE TABLE product_option_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id         UUID NOT NULL REFERENCES product_option_groups(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  price_addition   NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_available     BOOLEAN NOT NULL DEFAULT true,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coluna em order_items para persistir as opções escolhidas
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_options JSONB;
```

### Estrutura do JSONB `selected_options`

```json
[
  {
    "group_id": "uuid",
    "group_name": "Proteína",
    "item_id": "uuid",
    "item_name": "Carne dupla",
    "price_addition": 5.00
  }
]
```

---

## Fluxo ADM (gerenciar adicionais)

**Onde:** `app/[slug]/adm/pratos/_pratos-client.tsx`

1. Cada produto na lista tem botão **"Adicionais"** (ícone de lista)
2. Clicar abre modal dedicado para aquele produto
3. No modal:
   - Lista os grupos existentes com seus itens
   - Botão "+ Novo grupo" → formulário inline (nome, min/max seleções)
   - Dentro de cada grupo, botão "+ Novo item" → nome + preço adicional
   - Cada grupo/item tem botão de excluir
   - Operações salvas diretamente no Supabase (sem botão "Salvar" global)

---

## Fluxo cliente (escolher opções)

**Onde:** `app/[slug]/_components/product-options-modal.tsx`

1. Cliente clica "Pedir" ou "Adicionar ao prato" em um produto
2. Se o produto **não tem opções** → adiciona direto ao carrinho (comportamento atual)
3. Se o produto **tem opções** → abre `ProductOptionsModal`
4. Modal exibe:
   - Foto + nome + preço base do produto
   - Cada grupo de opções com seus itens
   - Grupos obrigatórios marcados com asterisco vermelho
   - Seleção única (radio) ou múltipla (checkbox) conforme `max_selections`
   - Preço total atualizado em tempo real (base + adicionais selecionados)
5. Botão "Adicionar ao prato" ou "Pedir agora" finaliza a ação
6. Validação: grupos obrigatórios precisam de pelo menos `min_selections` escolhas

---

## Cart Context

### Tipos novos

```typescript
export type SelectedOption = {
  group_id: string
  group_name: string
  item_id: string
  item_name: string
  price_addition: number
}

export type CartItem = {
  id: string                        // product_id
  cartKey?: string                  // product_id + opções hash — chave única no carrinho
  name: string
  price: number                     // preço base do produto
  quantity: number
  image_url?: string | null
  selectedOptions?: SelectedOption[]
}
```

### cartKey

Para permitir o mesmo produto com opções diferentes no carrinho:
```typescript
function makeCartKey(productId: string, selectedOptions?: SelectedOption[]) {
  if (!selectedOptions?.length) return productId
  const ids = [...selectedOptions].sort((a, b) => a.item_id.localeCompare(b.item_id)).map(o => o.item_id).join('_')
  return `${productId}__${ids}`
}
```

### totalPrice

```typescript
const totalPrice = items.reduce((sum, i) => {
  const extra = (i.selectedOptions ?? []).reduce((s, o) => s + o.price_addition, 0)
  return sum + (i.price + extra) * i.quantity
}, 0)
```

---

## API de Pedidos (`/api/orders`)

O schema Zod aceita `selected_options` em cada item:

```typescript
items: z.array(z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  product_price: z.number(),
  quantity: z.number().int().min(1),
  notes: z.string().optional().nullable(),
  selected_options: z.array(z.object({
    group_id: z.string(),
    group_name: z.string(),
    item_id: z.string(),
    item_name: z.string(),
    price_addition: z.number(),
  })).optional().nullable(),
})).min(1),
```

---

## Exibição no ADM Pedidos

Em cada item do pedido, abaixo do nome do produto, exibir as opções selecionadas:

```
1x X-Burguer
   └ Proteína: Carne dupla (+R$ 5,00)
   └ Adicionais: Queijo extra (+R$ 2,00), Bacon (+R$ 3,00)
```

---

## Detecção de opções no cardápio público

As queries de produto incluem `product_option_groups(id)` para saber se o produto tem opções sem fetch extra.

```typescript
// category page + main page query
.select('id, name, description, price, image_url, product_option_groups(id)')
```

`has_options = (product.product_option_groups ?? []).length > 0`

---

## Arquivos modificados / criados

| Arquivo | Tipo |
|---------|------|
| `supabase/migrations/010_product_options.sql` | NOVO |
| `contexts/cart-context.tsx` | MODIFICADO |
| `app/[slug]/adm/pratos/_pratos-client.tsx` | MODIFICADO |
| `app/[slug]/_components/product-options-modal.tsx` | NOVO |
| `app/[slug]/_components/add-to-cart-button.tsx` | MODIFICADO |
| `app/[slug]/_components/featured-carousel.tsx` | MODIFICADO |
| `app/[slug]/categoria/[id]/_product-card-client.tsx` | MODIFICADO |
| `app/[slug]/categoria/[id]/page.tsx` | MODIFICADO |
| `app/[slug]/page.tsx` | MODIFICADO |
| `app/api/orders/route.ts` | MODIFICADO |
| `app/api/qrcode/session/route.ts` | MODIFICADO |
| `app/api/qrcode/confirm/route.ts` | MODIFICADO |
| `app/[slug]/adm/pedidos/_pedidos-client.tsx` | MODIFICADO |
| `app/[slug]/adm/pedidos/page.tsx` | MODIFICADO |
| `app/[slug]/meu-pedido/[id]/_meu-pedido-client.tsx` | MODIFICADO |
| `app/[slug]/meu-pedido/[id]/page.tsx` | MODIFICADO |

---

## Edição inline (implementada em 2026-05-22)

O modal `OptionsManageModal` em `_pratos-client.tsx` inclui edição completa:

- **Editar grupo**: botão lápis (azul) → formulário inline com nome, descrição, min/max seleções → salvar via `supabase.from('product_option_groups').update()`
- **Editar item**: botão lápis (azul) → formulário inline com nome e preço → salvar via `supabase.from('product_option_items').update()`
- Ao editar, os botões de excluir ficam ocultos para evitar clique acidental
- Cancel volta para o estado de leitura sem fazer request

---

## RLS Policies

```sql
-- Leitura pública (anon pode ler opções para o cardápio)
CREATE POLICY "public read option groups" ON product_option_groups FOR SELECT USING (true);
CREATE POLICY "public read option items"  ON product_option_items  FOR SELECT USING (true);

-- Escrita: dono do restaurante via produto
CREATE POLICY "owner manage option groups" ON product_option_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.id = product_option_groups.product_id
        AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY "owner manage option items" ON product_option_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM product_option_groups g
      JOIN products p ON p.id = g.product_id
      JOIN restaurants r ON r.id = p.restaurant_id
      WHERE g.id = product_option_items.group_id
        AND r.owner_id = auth.uid()
    )
  );
```
