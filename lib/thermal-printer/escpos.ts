// ─── ESC/POS Command Constants ───────────────────────────────────────────────
const ESC = 0x1b
const GS  = 0x1d
const LF  = 0x0a

const CMD_INIT     = [ESC, 0x40]       // Initialize printer
const CMD_LEFT     = [ESC, 0x61, 0x00] // Left align
const CMD_CENTER   = [ESC, 0x61, 0x01] // Center align
const CMD_BOLD_ON  = [ESC, 0x45, 0x01] // Bold on
const CMD_BOLD_OFF = [ESC, 0x45, 0x00] // Bold off
const CMD_DBL_ON   = [ESC, 0x21, 0x30] // Double height + width
const CMD_DBL_OFF  = [ESC, 0x21, 0x00] // Normal size
const CMD_CUT      = [GS,  0x56, 0x01] // Partial cut

// ─── Types ───────────────────────────────────────────────────────────────────
export type PrintOrder = {
  order_number: number
  type: 'table' | 'delivery'
  customer_name: string | null
  table_number: string | null
  notes: string | null
  total: number
  created_at: string
  order_items: Array<{
    product_name: string
    product_price: number
    quantity: number
    selected_options?: Array<{
      group_name: string
      item_name: string
      price_addition: number
    }> | null
  }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalizes Portuguese accented chars to ASCII for thermal printer codepage compatibility */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x00-\x7F]/g, '?')
}

function encode(s: string): number[] {
  return Array.from(normalize(s)).map((c) => c.charCodeAt(0))
}

function line(text: string): number[] {
  return [...encode(text), LF]
}

function dashes(n = 32): number[] {
  return line('-'.repeat(n))
}

/** Two-column row: left text + right text aligned to `width` columns */
function row(left: string, right: string, width = 32): number[] {
  const r = normalize(right)
  const l = normalize(left).substring(0, Math.max(0, width - r.length - 1))
  const pad = ' '.repeat(Math.max(1, width - l.length - r.length))
  return line(`${l}${pad}${r}`)
}

function formatPrice(v: number): string {
  return `R$${v.toFixed(2).replace('.', ',')}`
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return `${date} ${time}`
  } catch {
    return '--'
  }
}

// ─── Main encoder ─────────────────────────────────────────────────────────────
// push() concatenates each number[] argument into `b`
function makeEncoder() {
  const b: number[] = []
  function push(...parts: number[][]) {
    for (const p of parts) b.push(...p)
  }
  return { b, push }
}

export function encodeOrder(
  order: PrintOrder,
  restaurantName?: string,
  width = 32,
): Uint8Array {
  const { b, push } = makeEncoder()

  push(CMD_INIT)

  // Restaurant name header
  push(CMD_CENTER)
  if (restaurantName) {
    push(CMD_BOLD_ON, line(normalize(restaurantName).substring(0, width)), CMD_BOLD_OFF)
  }

  // Big order number
  push(
    CMD_DBL_ON,
    line(`PEDIDO #${String(order.order_number).padStart(4, '0')}`),
    CMD_DBL_OFF,
    [LF],
  )

  // Type + datetime
  push(CMD_LEFT)
  const typeLabel = order.type === 'table'
    ? `Mesa ${order.table_number ?? '-'}`
    : 'Delivery'
  push(row(typeLabel, formatDateTime(order.created_at), width))

  if (order.customer_name) {
    push(line(`Cliente: ${normalize(order.customer_name)}`))
  }

  push(dashes(width))

  // Items
  for (const item of order.order_items) {
    const lineTotal = item.product_price * item.quantity
    push(CMD_BOLD_ON, row(`${item.quantity}x ${item.product_name}`, formatPrice(lineTotal), width), CMD_BOLD_OFF)

    if (item.selected_options?.length) {
      for (const opt of item.selected_options) {
        const optPrice = opt.price_addition > 0 ? `+${formatPrice(opt.price_addition)}` : ''
        push(row(`  + ${opt.item_name}`, optPrice, width))
      }
    }
  }

  push(dashes(width))

  // Total
  push(CMD_BOLD_ON, row('TOTAL', formatPrice(order.total), width), CMD_BOLD_OFF)

  // Notes
  if (order.notes) {
    push([LF], line(`Obs: ${normalize(order.notes)}`))
  }

  // Footer + cut
  push([LF], CMD_CENTER, line('HIVI - Cardapio Digital'), [LF], [LF], CMD_CUT)

  return new Uint8Array(b)
}

/** Quick test receipt to verify printer is working */
export function encodeTestReceipt(restaurantName?: string, width = 32): Uint8Array {
  return encodeOrder(
    {
      order_number: 1,
      type: 'table',
      customer_name: 'Cliente Teste',
      table_number: '5',
      notes: 'Impressao de teste HIVI',
      total: 45.50,
      created_at: new Date().toISOString(),
      order_items: [
        {
          product_name: 'Item de Teste',
          product_price: 32.50,
          quantity: 1,
          selected_options: [
            { group_name: 'Adicional', item_name: 'Queijo extra', price_addition: 3.00 },
          ],
        },
        { product_name: 'Bebida', product_price: 5.00, quantity: 2 },
      ],
    },
    restaurantName,
    width,
  )
}
