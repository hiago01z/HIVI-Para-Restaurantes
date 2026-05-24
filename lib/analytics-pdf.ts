/**
 * HIVI — Gerador de PDF de Analytics
 * Usa jsPDF + jspdf-autotable (client-side only)
 */
import { formatCurrency as libFormatCurrency, type SupportedCurrency } from '@/lib/currency'

// ── Tipos (copiados de _analytics-client para evitar import cruzado) ──────────

export type PdfSelectedOption = { price_addition: number }
export type PdfOrderItem = {
  product_name: string
  product_price: number
  quantity: number
  selected_options?: PdfSelectedOption[] | null
}
export type PdfOrder = {
  id: string
  order_number: number
  type: 'delivery' | 'table'
  status: string
  total: number
  created_at: string
  order_items: PdfOrderItem[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// currency() é definido dentro de generateAnalyticsPdf para respeitar a moeda do restaurante
function pct(v: number, total: number) {
  if (total === 0) return '0%'
  return `${((v / total) * 100).toFixed(1)}%`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}
function isoDay(iso: string) { return iso.slice(0, 10) }

function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

// ── Função principal ──────────────────────────────────────────────────────────

export async function generateAnalyticsPdf(
  restaurantName: string,
  orders: PdfOrder[],
  period: '7d' | '30d',
  restaurantCurrency: SupportedCurrency = 'BRL'
) {
  // Sobrescreve o helper local com a moeda correta do restaurante
  const currency = (v: number) => libFormatCurrency(v, restaurantCurrency)
  // Dynamic import para evitar SSR
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const days = lastNDays(period === '7d' ? 7 : 30)
  const periodLabel = period === '7d' ? 'Últimos 7 dias' : 'Últimos 30 dias'
  const startDate = fmtDate(days[0] + 'T12:00:00')
  const endDate   = fmtDate(days[days.length - 1] + 'T12:00:00')
  const generated = new Date().toLocaleString('pt-BR')

  // ── Cores e fontes ──────────────────────────────────────────────────────────
  const ORANGE   = [255, 107, 0]    as [number, number, number]
  const ORANGE_L = [255, 243, 230]  as [number, number, number]
  const GRAY_900 = [17, 24, 39]     as [number, number, number]
  const GRAY_600 = [75, 85, 99]     as [number, number, number]
  const GRAY_200 = [229, 231, 235]  as [number, number, number]
  const GRAY_50  = [249, 250, 251]  as [number, number, number]
  const GREEN    = [22, 163, 74]    as [number, number, number]
  const RED      = [220, 38, 38]    as [number, number, number]
  const PURPLE   = [99, 102, 241]   as [number, number, number]

  // ── Cálculos ────────────────────────────────────────────────────────────────

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
  const totalOrders  = orders.length
  const avgTicket    = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Horário de pico
  const hourMap: Record<number, number> = {}
  orders.forEach((o) => { const h = new Date(o.created_at).getHours(); hourMap[h] = (hourMap[h] ?? 0) + 1 })
  const peakEntry = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]
  const peakHour  = peakEntry ? `${peakEntry[0]}h–${String(Number(peakEntry[0]) + 1)}h` : '—'

  // Top produtos
  const prodMap: Record<string, { qty: number; revenue: number }> = {}
  orders.forEach((o) => {
    o.order_items.forEach((item) => {
      if (!prodMap[item.product_name]) prodMap[item.product_name] = { qty: 0, revenue: 0 }
      const extra = (item.selected_options ?? []).reduce((s, op) => s + op.price_addition, 0)
      prodMap[item.product_name].qty     += item.quantity
      prodMap[item.product_name].revenue += (item.product_price + extra) * item.quantity
    })
  })
  const topProducts = Object.entries(prodMap)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 10)
    .map(([name, v], i) => [String(i + 1), name, String(v.qty), currency(v.revenue), pct(v.revenue, totalRevenue)])

  // Pedidos por tipo
  const delivery = orders.filter((o) => o.type === 'delivery')
  const table    = orders.filter((o) => o.type === 'table')
  const deliveryRev = delivery.reduce((s, o) => s + o.total, 0)
  const tableRev    = table.reduce((s, o) => s + o.total, 0)

  // Receita por dia
  const dayRevMap: Record<string, { revenue: number; orders: number }> = {}
  days.forEach((d) => (dayRevMap[d] = { revenue: 0, orders: 0 }))
  orders.forEach((o) => {
    const day = isoDay(o.created_at)
    if (dayRevMap[day]) {
      dayRevMap[day].revenue += o.total
      dayRevMap[day].orders  += 1
    }
  })
  const revenueRows = days.map((d) => [
    fmtDate(d + 'T12:00:00'),
    currency(dayRevMap[d].revenue),
    String(dayRevMap[d].orders),
    dayRevMap[d].orders > 0 ? currency(dayRevMap[d].revenue / dayRevMap[d].orders) : '—',
  ])

  // Comparativo semanal
  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0,0,0,0)
  const prevStart = new Date(now); prevStart.setDate(now.getDate() - 13); prevStart.setHours(0,0,0,0)
  const prevEnd   = new Date(now); prevEnd.setDate(now.getDate() - 7); prevEnd.setHours(23,59,59,999)
  const thisWeekRev = orders.filter((o) => new Date(o.created_at) >= weekStart).reduce((s, o) => s + o.total, 0)
  const prevWeekRev = orders.filter((o) => {
    const d = new Date(o.created_at); return d >= prevStart && d <= prevEnd
  }).reduce((s, o) => s + o.total, 0)
  const weekGrowth = prevWeekRev > 0 ? ((thisWeekRev - prevWeekRev) / prevWeekRev) * 100 : null

  // Distribuição horária
  const hourRows = Array.from({ length: 18 }, (_, i) => i + 6).map((h) => {
    const count = hourMap[h] ?? 0
    return [`${h}h–${h + 1}h`, String(count), pct(count, totalOrders)]
  })

  // ── Documento PDF ───────────────────────────────────────────────────────────

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()   // 210mm
  const margin = 14
  let y = 0

  // ── Helper: adicionar nova página se necessário ────────────────────────────
  function checkPageBreak(needed = 30) {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      y = 18
    }
  }

  // ── Helper: título de seção ────────────────────────────────────────────────
  function sectionTitle(text: string) {
    checkPageBreak(18)
    y += 6
    doc.setFillColor(...ORANGE_L)
    doc.roundedRect(margin, y - 4, W - margin * 2, 9, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...ORANGE)
    doc.text(text.toUpperCase(), margin + 3, y + 2)
    doc.setTextColor(...GRAY_900)
    y += 9
  }

  // ── CAPA / HEADER ──────────────────────────────────────────────────────────

  // Faixa laranja no topo
  doc.setFillColor(...ORANGE)
  doc.rect(0, 0, W, 28, 'F')

  // HIVI (brand)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.text('HIVI', margin, 13)

  // Tag "Relatório de Analytics"
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(255, 230, 200)
  doc.text('Relatório de Analytics', margin, 20)

  // Nome do restaurante (direita)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(restaurantName, W - margin, 13, { align: 'right' })

  // Período (direita)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(255, 230, 200)
  doc.text(`${periodLabel}  ·  ${startDate} – ${endDate}`, W - margin, 20, { align: 'right' })

  y = 36

  // Gerado em
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY_600)
  doc.text(`Gerado em: ${generated}`, margin, y)
  y += 10

  // ── KPIs ──────────────────────────────────────────────────────────────────

  sectionTitle('Resumo do Período')
  y += 2

  const kpis = [
    { label: 'Receita Total', value: currency(totalRevenue), color: ORANGE },
    { label: 'Total de Pedidos', value: String(totalOrders), color: PURPLE },
    { label: 'Ticket Médio', value: currency(avgTicket), color: GREEN as [number, number, number] },
    { label: 'Horário de Pico', value: peakHour, color: GRAY_600 },
  ]
  const boxW = (W - margin * 2 - 6) / 4
  kpis.forEach((kpi, i) => {
    const bx = margin + i * (boxW + 2)
    doc.setFillColor(...GRAY_50)
    doc.roundedRect(bx, y, boxW, 22, 2, 2, 'F')
    doc.setDrawColor(...GRAY_200)
    doc.roundedRect(bx, y, boxW, 22, 2, 2, 'S')
    // label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY_600)
    doc.text(kpi.label, bx + boxW / 2, y + 6, { align: 'center' })
    // value
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(kpi.value.length > 10 ? 9 : 11)
    doc.setTextColor(...kpi.color)
    doc.text(kpi.value, bx + boxW / 2, y + 16, { align: 'center' })
  })
  y += 28

  // ── COMPARATIVO SEMANAL ────────────────────────────────────────────────────

  if (weekGrowth !== null) {
    sectionTitle('Comparativo Semanal')
    y += 2

    const growthColor = weekGrowth >= 0 ? GREEN : RED
    const growthSymbol = weekGrowth >= 0 ? '▲' : '▼'

    // 3 boxes
    const cboxW = (W - margin * 2 - 4) / 3
    const comparisons = [
      { label: 'Semana Atual (7 dias)', value: currency(thisWeekRev), color: GRAY_900 as [number, number, number] },
      { label: 'Semana Anterior', value: currency(prevWeekRev), color: GRAY_600 },
      { label: 'Variação', value: `${growthSymbol} ${Math.abs(weekGrowth).toFixed(1)}%`, color: growthColor as [number, number, number] },
    ]
    comparisons.forEach((c, i) => {
      const bx = margin + i * (cboxW + 2)
      doc.setFillColor(...GRAY_50)
      doc.roundedRect(bx, y, cboxW, 20, 2, 2, 'F')
      doc.setDrawColor(...GRAY_200)
      doc.roundedRect(bx, y, cboxW, 20, 2, 2, 'S')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(...GRAY_600)
      doc.text(c.label, bx + cboxW / 2, y + 6, { align: 'center' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...c.color)
      doc.text(c.value, bx + cboxW / 2, y + 15, { align: 'center' })
    })
    y += 26
  }

  // ── TOP PRODUTOS ───────────────────────────────────────────────────────────

  sectionTitle('Top Produtos Mais Vendidos')

  autoTable(doc, {
    startY: y + 2,
    head: [['#', 'Produto / Prato / Bebida', 'Qtd', 'Receita', '% da receita']],
    body: topProducts.length > 0 ? topProducts : [['—', 'Sem dados no período', '', '', '']],
    margin: { left: margin, right: margin },
    styles: { fontSize: 8.5, cellPadding: 3.5, textColor: GRAY_900, lineColor: GRAY_200, lineWidth: 0.2 },
    headStyles: { fillColor: ORANGE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: GRAY_50 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 24, halign: 'right' },
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ── PEDIDOS POR TIPO ───────────────────────────────────────────────────────

  checkPageBreak(40)
  sectionTitle('Pedidos por Tipo')

  autoTable(doc, {
    startY: y + 2,
    head: [['Tipo', 'Quantidade', '% do total', 'Receita', '% da receita']],
    body: [
      ['🛵 Entrega', String(delivery.length), pct(delivery.length, totalOrders), currency(deliveryRev), pct(deliveryRev, totalRevenue)],
      ['🪑 Mesa',    String(table.length),    pct(table.length, totalOrders),    currency(tableRev),    pct(tableRev, totalRevenue)],
      ['TOTAL',      String(totalOrders),     '100%',                            currency(totalRevenue), '100%'],
    ],
    margin: { left: margin, right: margin },
    styles: { fontSize: 8.5, cellPadding: 3.5, textColor: GRAY_900, lineColor: GRAY_200, lineWidth: 0.2 },
    headStyles: { fillColor: ORANGE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: GRAY_50 },
    bodyStyles: {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      if (data.row.index === 2) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = ORANGE_L
      }
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ── RECEITA POR DIA ────────────────────────────────────────────────────────

  checkPageBreak(40)
  sectionTitle('Receita por Dia')

  autoTable(doc, {
    startY: y + 2,
    head: [['Data', 'Receita', 'Pedidos', 'Ticket Médio']],
    body: revenueRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 3, textColor: GRAY_900, lineColor: GRAY_200, lineWidth: 0.2 },
    headStyles: { fillColor: ORANGE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: GRAY_50 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 40, halign: 'right' },
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ── DISTRIBUIÇÃO HORÁRIA ───────────────────────────────────────────────────

  checkPageBreak(40)
  sectionTitle('Distribuição de Pedidos por Horário')

  // Divide em 3 colunas para economizar espaço
  const col1 = hourRows.slice(0, 6)
  const col2 = hourRows.slice(6, 12)
  const col3 = hourRows.slice(12, 18)
  const maxRows = Math.max(col1.length, col2.length, col3.length)
  const hourTableBody = Array.from({ length: maxRows }, (_, i) => [
    ...(col1[i] ?? ['', '', '']),
    ...(col2[i] ?? ['', '', '']),
    ...(col3[i] ?? ['', '', '']),
  ])

  autoTable(doc, {
    startY: y + 2,
    head: [['Hora', 'Pedidos', '%', 'Hora', 'Pedidos', '%', 'Hora', 'Pedidos', '%']],
    body: hourTableBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 3, textColor: GRAY_900, lineColor: GRAY_200, lineWidth: 0.2 },
    headStyles: { fillColor: ORANGE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: GRAY_50 },
    columnStyles: {
      0: { cellWidth: 22 }, 1: { cellWidth: 18, halign: 'center' }, 2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 22 }, 4: { cellWidth: 18, halign: 'center' }, 5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 22 }, 7: { cellWidth: 18, halign: 'center' }, 8: { cellWidth: 18, halign: 'center' },
    },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ── RODAPÉ EM TODAS AS PÁGINAS ─────────────────────────────────────────────

  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const pageH = doc.internal.pageSize.getHeight()
    doc.setFillColor(...GRAY_200)
    doc.rect(0, pageH - 10, W, 10, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY_600)
    doc.text(`HIVI · ${restaurantName} · ${periodLabel} · ${startDate}–${endDate}`, margin, pageH - 3.5)
    doc.text(`Página ${p} de ${totalPages}`, W - margin, pageH - 3.5, { align: 'right' })
  }

  // ── SALVAR ─────────────────────────────────────────────────────────────────

  const filename = `${restaurantName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-analytics-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
