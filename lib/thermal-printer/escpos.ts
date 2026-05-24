// ─── ESC/POS Command Constants ───────────────────────────────────────────────
const ESC = 0x1b
const GS  = 0x1d
const LF  = 0x0a

const CMD_INIT       = [ESC, 0x40]       // Initialize printer
const CMD_LEFT       = [ESC, 0x61, 0x00] // Left align
const CMD_CENTER     = [ESC, 0x61, 0x01] // Center align
const CMD_BOLD_ON    = [ESC, 0x45, 0x01] // Bold on
const CMD_BOLD_OFF   = [ESC, 0x45, 0x00] // Bold off
const CMD_DBL_ON     = [ESC, 0x21, 0x30] // Double height + width
const CMD_DBL_OFF    = [ESC, 0x21, 0x00] // Normal size
const CMD_CUT_PARTIAL = [GS, 0x56, 0x01] // Partial cut (most printers)
const CMD_CUT_FULL    = [GS, 0x56, 0x00] // Full cut (some printers)
/** ESC t 16 — Windows-1252 / WPC1252 codepage (preserves ã ç é á etc.) */
const CMD_CODEPAGE_WIN1252 = [ESC, 0x74, 0x10]

// ─── Types ───────────────────────────────────────────────────────────────────

export type CutMode = 'partial' | 'full' | 'none'
export type Charset  = 'ascii' | 'latin1'

export type PrintOrder = {
  order_number: number
  type: 'table' | 'delivery'
  customer_name: string | null
  table_number: string | null
  address?: string | null
  customer_phone?: string | null
  payment_method?: string | null
  change_for?: number | null
  notes: string | null
  total: number
  created_at: string
  /** Moeda do restaurante — determina o símbolo impresso (R$ ou €) */
  currency?: import('@/lib/currency').SupportedCurrency
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

// ─── Encoding ────────────────────────────────────────────────────────────────

/**
 * ASCII mode: strips diacritics so the output works on ANY ESC/POS printer
 * regardless of codepage. Safe but loses Portuguese accents.
 */
function normalizeAscii(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-̯]/g, '')
    .replace(/[^\x00-\x7F]/g, '?')
}

/**
 * Latin-1 / Windows-1252 mapping for common Portuguese characters.
 * These byte values are correct when the printer is set to codepage WPC1252
 * (ESC t 16). Falls back to ASCII for anything outside Latin-1.
 */
function encodeWin1252(s: string): number[] {
  const out: number[] = []
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 63
    if (code <= 0x7e) {
      out.push(code)
    } else if (code >= 0xa0 && code <= 0xff) {
      // Latin-1 supplement — byte-identical to Windows-1252 in this range
      out.push(code)
    } else {
      // Windows-1252 extras (0x80–0x9f range that Latin-1 leaves undefined)
      const win1252extras: Record<number, number> = {
        0x20ac: 0x80, // €
        0x201a: 0x82, // ‚
        0x0192: 0x83, // ƒ
        0x201e: 0x84, // „
        0x2026: 0x85, // …
        0x2020: 0x86, // †
        0x2021: 0x87, // ‡
        0x02c6: 0x88, // ˆ
        0x2030: 0x89, // ‰
        0x0160: 0x8a, // Š
        0x2018: 0x91, // '
        0x2019: 0x92, // '
        0x201c: 0x93, // "
        0x201d: 0x94, // "
        0x2013: 0x96, // –
        0x2014: 0x97, // —
        0x02dc: 0x98, // ˜
        0x2122: 0x99, // ™
      }
      out.push(win1252extras[code] ?? 0x3f) // fallback '?'
    }
  }
  return out
}

function encodeString(s: string, charset: Charset): number[] {
  if (charset === 'latin1') return encodeWin1252(s)
  return Array.from(normalizeAscii(s)).map((c) => c.charCodeAt(0))
}

function line(text: number[]): number[] {
  return [...text, LF]
}

function lineStr(s: string, charset: Charset): number[] {
  return line(encodeString(s, charset))
}

function dashes(n = 32): number[] {
  return line(Array(n).fill(0x2d)) // '-'
}

/** Two-column row: left text + right text aligned to `width` columns */
function row(left: string, right: string, width = 32, charset: Charset = 'ascii'): number[] {
  // Use ASCII for column calculation (length is byte-count, not glyph)
  const rAscii = normalizeAscii(right)
  const lAscii = normalizeAscii(left).substring(0, Math.max(0, width - rAscii.length - 1))
  const padCount = Math.max(1, width - lAscii.length - rAscii.length)

  // Encode with the chosen charset
  const lBytes = encodeString(left.substring(0, Math.max(0, width - rAscii.length - 1)), charset)
  const rBytes = encodeString(right, charset)
  const padBytes = Array(padCount).fill(0x20)

  return line([...lBytes, ...padBytes, ...rBytes])
}

function formatPrice(v: number, currency: import('@/lib/currency').SupportedCurrency = 'BRL'): string {
  const symbol = currency === 'EUR' ? '€' : 'R$'
  const formatted = v.toFixed(2).replace('.', ',')
  return currency === 'EUR' ? `${formatted}${symbol}` : `${symbol}${formatted}`
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

export function encodeOrder(
  order: PrintOrder,
  restaurantName?: string,
  width: number = 32,
  cutMode: CutMode = 'partial',
  charset: Charset = 'ascii',
): Uint8Array {
  const b: number[] = []

  // Init
  b.push(...CMD_INIT)

  // Set codepage BEFORE any text when using Latin-1
  if (charset === 'latin1') {
    b.push(...CMD_CODEPAGE_WIN1252)
  }

  // Restaurant name header
  b.push(...CMD_CENTER)
  if (restaurantName) {
    const nameBytes = encodeString(restaurantName.substring(0, width), charset)
    b.push(...CMD_BOLD_ON, ...line(nameBytes), ...CMD_BOLD_OFF)
  }

  // Big order number (double size — ASCII only for compatibility)
  const orderNum = `PEDIDO #${String(order.order_number).padStart(4, '0')}`
  b.push(...CMD_DBL_ON, ...lineStr(orderNum, 'ascii'), ...CMD_DBL_OFF, LF)

  // Type + datetime (bold)
  b.push(...CMD_LEFT)
  const typeLabel = order.type === 'table'
    ? `Mesa ${order.table_number ?? '-'}`
    : 'Delivery'
  b.push(...CMD_BOLD_ON, ...row(typeLabel, formatDateTime(order.created_at), width, charset), ...CMD_BOLD_OFF)

  if (order.customer_name) {
    b.push(...CMD_BOLD_ON, ...lineStr(`Cliente: ${order.customer_name}`, charset), ...CMD_BOLD_OFF)
  }

  // Delivery details (bold)
  if (order.type === 'delivery') {
    if (order.address)        b.push(...CMD_BOLD_ON, ...lineStr(`End: ${order.address}`, charset), ...CMD_BOLD_OFF)
    if (order.customer_phone) b.push(...CMD_BOLD_ON, ...lineStr(`Tel: ${order.customer_phone}`, charset), ...CMD_BOLD_OFF)
    if (order.payment_method) {
      const payStr = order.payment_method === 'dinheiro'
        ? `Pgto: Dinheiro${order.change_for ? ` (troco p/ ${formatPrice(order.change_for, order.currency)})` : ''}`
        : order.payment_method === 'cartao' ? 'Pgto: Cartao' : 'Pgto: Pix'
      b.push(...CMD_BOLD_ON, ...lineStr(payStr, charset), ...CMD_BOLD_OFF)
    }
  }

  b.push(...dashes(width))

  // Items
  for (const item of order.order_items) {
    const lineTotal = item.product_price * item.quantity
    const itemLabel = `${item.quantity}x ${item.product_name}`
    b.push(...CMD_BOLD_ON, ...row(itemLabel, formatPrice(lineTotal, order.currency), width, charset), ...CMD_BOLD_OFF)

    if (item.selected_options?.length) {
      for (const opt of item.selected_options) {
        const optPrice = opt.price_addition > 0 ? `+${formatPrice(opt.price_addition, order.currency)}` : ''
        b.push(...row(`  + ${opt.item_name}`, optPrice, width, charset))
      }
    }
  }

  b.push(...dashes(width))

  // Total
  b.push(...CMD_BOLD_ON, ...row('TOTAL', formatPrice(order.total, order.currency), width, charset), ...CMD_BOLD_OFF)

  // Notes (bold)
  if (order.notes) {
    b.push(LF, ...CMD_BOLD_ON, ...lineStr(`Obs: ${order.notes}`, charset), ...CMD_BOLD_OFF)
  }

  // Footer
  b.push(LF, ...CMD_CENTER, ...CMD_BOLD_ON, ...lineStr('HIVI - Cardapio Digital', 'ascii'), ...CMD_BOLD_OFF, LF, LF)

  // Cut
  if (cutMode === 'partial') b.push(...CMD_CUT_PARTIAL)
  else if (cutMode === 'full') b.push(...CMD_CUT_FULL)
  // cutMode === 'none': no cut command

  return new Uint8Array(b)
}

/** Quick test receipt to verify printer is working */
export function encodeTestReceipt(
  restaurantName?: string,
  width = 32,
  cutMode: CutMode = 'partial',
  charset: Charset = 'ascii',
): Uint8Array {
  return encodeOrder(
    {
      order_number: 1,
      type: 'delivery',
      customer_name: 'Cliente Teste',
      table_number: null,
      address: 'Rua Exemplo, 123',
      customer_phone: '5595999990000',
      payment_method: 'dinheiro',
      change_for: 50,
      notes: charset === 'latin1' ? 'Impressão de teste HIVI — ã ç é á' : 'Impressao de teste HIVI',
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
    cutMode,
    charset,
  )
}
