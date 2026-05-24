import type { PrintOrder } from './escpos'
import type { SupportedCurrency } from '@/lib/currency'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatPrice(v: number, currency: SupportedCurrency = 'BRL'): string {
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

/** Builds an HTML receipt suitable for printing via window.print() */
export function buildReceiptHtml(
  order: PrintOrder,
  restaurantName?: string,
  /** 58 = 58 mm / 32 col, 80 = 80 mm / 48 col */
  width: number = 32,
): string {
  const pageMm  = width === 48 ? '80mm' : '58mm'
  const bodyMm  = width === 48 ? '74mm' : '52mm'
  const curr    = order.currency ?? 'BRL'

  const typeLabel = order.type === 'table'
    ? `Mesa ${order.table_number ?? '-'}`
    : 'Delivery'

  const deliveryHtml = order.type === 'delivery' ? [
    order.address        ? `<div>End: ${esc(order.address)}</div>` : '',
    order.customer_phone ? `<div>Tel: ${esc(order.customer_phone)}</div>` : '',
    order.payment_method ? (() => {
      const pm = order.payment_method
      const payLabel = pm === 'dinheiro'
        ? `Pgto: Dinheiro${order.change_for ? ` (troco p/ ${formatPrice(order.change_for, curr)})` : ''}`
        : pm === 'cartao' ? 'Pgto: Cartao' : 'Pgto: Pix'
      return `<div>${esc(payLabel)}</div>`
    })() : '',
  ].join('') : ''

  const itemRows = order.order_items.map((item) => {
    const lineTotal = item.product_price * item.quantity
    const optionsHtml = item.selected_options?.length
      ? item.selected_options.map((o) =>
          `<div class="option">+ ${esc(o.item_name)}${o.price_addition > 0 ? ` (+${formatPrice(o.price_addition, curr)})` : ''}</div>`
        ).join('')
      : ''

    return `
      <div class="row bold">
        <span class="l">${item.quantity}x ${esc(item.product_name)}</span>
        <span class="r">${formatPrice(lineTotal, curr)}</span>
      </div>
      ${optionsHtml}`
  }).join('')

  const notesHtml = order.notes
    ? `<div class="notes">Obs: ${esc(order.notes)}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: ${pageMm} 2000mm;
    margin: 0mm 2mm;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; overflow-wrap: break-word; word-break: break-word; }
  html { width: ${pageMm}; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    font-weight: 600;
    line-height: 1.5;
    color: #000;
    background: #fff;
    width: ${bodyMm};
    max-width: ${bodyMm};
    overflow: hidden;
    padding: 2mm 0;
  }
  .center { text-align: center; }
  .bold { font-weight: 800; }
  .big  { font-size: 17pt; font-weight: 800; text-align: center; margin: 3px 0; letter-spacing: 0.5px; }
  .row  { display: flex; justify-content: space-between; gap: 4px; page-break-inside: avoid; }
  .row .l { flex: 1; word-break: break-word; overflow-wrap: break-word; }
  .row .r { flex-shrink: 0; white-space: nowrap; }
  .option  { padding-left: 4mm; font-size: 10pt; font-weight: 600; color: #000; }
  hr { border: none; border-top: 1.5px solid #000; margin: 4px 0; }
  .total { font-size: 13pt; }
  .notes { font-size: 10pt; font-weight: 600; margin-top: 4px; padding: 2px 0; }
  .footer { text-align: center; font-size: 9pt; font-weight: 600; color: #000; margin-top: 6px; }
  @media print {
    body { width: ${bodyMm}; max-width: ${bodyMm}; }
  }
</style>
</head>
<body>
  ${restaurantName ? `<div class="center bold">${esc(restaurantName)}</div>` : ''}
  <div class="big">PEDIDO #${String(order.order_number).padStart(4, '0')}</div>
  <hr>
  <div class="row">
    <span class="l bold">${esc(typeLabel)}</span>
    <span class="r">${formatDateTime(order.created_at)}</span>
  </div>
  ${order.customer_name ? `<div>Cliente: ${esc(order.customer_name)}</div>` : ''}
  ${deliveryHtml}
  <hr>
  ${itemRows}
  <hr>
  ${order.delivery_fee && order.delivery_fee > 0 ? `
  <div class="row">
    <span class="l">Subtotal</span>
    <span class="r">${formatPrice(order.total, curr)}</span>
  </div>
  <div class="row bold">
    <span class="l">Taxa de entrega</span>
    <span class="r">${formatPrice(order.delivery_fee, curr)}</span>
  </div>
  <hr>` : ''}
  <div class="row total bold">
    <span class="l">TOTAL</span>
    <span class="r">${formatPrice(order.total + (order.delivery_fee ?? 0), curr)}</span>
  </div>
  ${notesHtml}
  <div class="footer">HIVI - Cardapio Digital</div>
</body>
</html>`
}

/** 1 mm in CSS pixels at 96 dpi */
const MM_TO_PX = 96 / 25.4

/**
 * Prints an HTML receipt via a hidden iframe (uses the OS print dialog).
 * Does NOT trigger popup-blocker since it writes to an existing iframe.
 * @param paperMm  Physical paper roll width in mm (58 or 80). Used to size
 *                 the hidden iframe so scrollHeight reflects the real layout,
 *                 then injects a precise @page size before triggering print.
 */
export function printViaBrowser(html: string, paperMm: 58 | 80 = 58): void {
  const iframe = document.createElement('iframe')
  // Width must match the actual roll so scrollHeight gives the correct value
  const paperPx = Math.round(paperMm * MM_TO_PX)
  iframe.style.cssText =
    `position:fixed;top:-9999px;left:-9999px;width:${paperPx}px;height:2000px;border:none;visibility:hidden;`
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument!
  doc.open()
  doc.write(html)
  doc.close()

  // Wait for layout to settle, measure real content height, then print
  setTimeout(() => {
    try {
      const contentDoc = iframe.contentDocument!
      const heightPx = contentDoc.documentElement.scrollHeight
      const heightMm = Math.ceil(heightPx / MM_TO_PX) + 10  // 10 mm tail buffer
      const style = contentDoc.createElement('style')
      style.textContent =
        `@page{size:${paperMm}mm ${heightMm}mm !important;margin:0mm 2mm}`
      contentDoc.head.appendChild(style)

      iframe.contentWindow?.print()
    } finally {
      const cleanup = () => {
        try { document.body.removeChild(iframe) } catch { /* already removed */ }
      }
      iframe.contentWindow?.addEventListener('afterprint', cleanup, { once: true })
      setTimeout(cleanup, 30_000)
    }
  }, 400)
}
