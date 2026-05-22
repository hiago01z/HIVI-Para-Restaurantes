import type { PrintOrder } from './escpos'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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

/** Builds an HTML receipt suitable for printing via window.print() */
export function buildReceiptHtml(
  order: PrintOrder,
  restaurantName?: string,
  /** 58 = 58 mm / 32 col, 80 = 80 mm / 48 col */
  width: number = 32,
): string {
  const pageMm  = width === 48 ? '80mm' : '58mm'
  const bodyMm  = width === 48 ? '74mm' : '52mm'

  const typeLabel = order.type === 'table'
    ? `Mesa ${order.table_number ?? '-'}`
    : 'Delivery'

  const itemRows = order.order_items.map((item) => {
    const lineTotal = item.product_price * item.quantity
    const optionsHtml = item.selected_options?.length
      ? item.selected_options.map((o) =>
          `<div class="option">+ ${esc(o.item_name)}${o.price_addition > 0 ? ` (+${formatPrice(o.price_addition)})` : ''}</div>`
        ).join('')
      : ''

    return `
      <div class="row bold">
        <span class="l">${item.quantity}x ${esc(item.product_name)}</span>
        <span class="r">${formatPrice(lineTotal)}</span>
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
    size: ${pageMm} auto;
    margin: 2mm 3mm;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 9pt;
    line-height: 1.45;
    color: #000;
    background: #fff;
    width: ${bodyMm};
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .big  { font-size: 13pt; font-weight: 700; text-align: center; margin: 2px 0; }
  .row  { display: flex; justify-content: space-between; gap: 4px; }
  .row .l { flex: 1; word-break: break-word; }
  .row .r { flex-shrink: 0; white-space: nowrap; }
  .option  { padding-left: 6mm; font-size: 8pt; color: #444; }
  hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
  .total { font-size: 11pt; }
  .notes { font-size: 8pt; margin-top: 4px; background: #f5f5f5; padding: 3px 4px; border-radius: 2px; }
  .footer { text-align: center; font-size: 8pt; color: #666; margin-top: 6px; }
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
  <hr>
  ${itemRows}
  <hr>
  <div class="row total bold">
    <span class="l">TOTAL</span>
    <span class="r">${formatPrice(order.total)}</span>
  </div>
  ${notesHtml}
  <div class="footer">HIVI - Cardapio Digital</div>
</body>
</html>`
}

/**
 * Prints an HTML receipt via a hidden iframe (uses the OS print dialog).
 * Does NOT trigger popup-blocker since it writes to an existing iframe.
 */
export function printViaBrowser(html: string): void {
  const iframe = document.createElement('iframe')
  iframe.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;visibility:hidden;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument!
  doc.open()
  doc.write(html)
  doc.close()

  // Give the browser a tick to lay out the content, then print
  setTimeout(() => {
    try {
      iframe.contentWindow?.print()
    } finally {
      // Remove iframe after the dialog closes (afterprint fires on close)
      const cleanup = () => {
        try { document.body.removeChild(iframe) } catch { /* already removed */ }
      }
      iframe.contentWindow?.addEventListener('afterprint', cleanup, { once: true })
      // Fallback cleanup in case afterprint doesn't fire
      setTimeout(cleanup, 30_000)
    }
  }, 150)
}
