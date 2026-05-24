'use client'

import { useMemo, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Download, FileText, TrendingUp, ShoppingBag, Clock, Users } from 'lucide-react'
import type { PdfOrder } from '@/lib/analytics-pdf'
import { formatCurrency as libFormatCurrency, type SupportedCurrency } from '@/lib/currency'

// ── Tipos ────────────────────────────────────────────────────────────────────

type SelectedOption = {
  price_addition: number
}

type OrderItem = {
  product_name: string
  product_price: number
  quantity: number
  selected_options?: SelectedOption[] | null
}

type Order = {
  id: string
  order_number: number
  type: 'delivery' | 'table'
  status: string
  total: number
  created_at: string
  order_items: OrderItem[]
}

type Props = {
  slug: string
  restaurantName: string
  orders: Order[]
  since: string
  currency?: SupportedCurrency
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// formatCurrency é gerado no componente com base na currency do restaurante

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function isoDay(iso: string) {
  return iso.slice(0, 10)
}

// Gera array de datas dos últimos N dias (YYYY-MM-DD)
function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AnalyticsClient({ restaurantName, orders, currency = 'BRL' }: Props) {
  const formatCurrency = (v: number) => libFormatCurrency(v, currency)
  const [period, setPeriod] = useState<'7d' | '30d'>('30d')
  const [pdfLoading, setPdfLoading] = useState(false)

  // Filtra pedidos conforme período selecionado
  const filteredOrders = useMemo(() => {
    if (period === '7d') {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 6)
      cutoff.setHours(0, 0, 0, 0)
      return orders.filter((o) => new Date(o.created_at) >= cutoff)
    }
    return orders
  }, [orders, period])

  // ── 1. Receita por dia ──────────────────────────────────────────────────────
  const revenueByDay = useMemo(() => {
    const days = lastNDays(period === '7d' ? 7 : 30)
    const map: Record<string, number> = {}
    days.forEach((d) => (map[d] = 0))
    filteredOrders.forEach((o) => {
      const day = isoDay(o.created_at)
      if (day in map) map[day] = (map[day] ?? 0) + o.total
    })
    return days.map((d) => ({ date: formatDate(d), receita: map[d] ?? 0, fullDate: d }))
  }, [filteredOrders, period])

  // ── 2. Pedidos por dia ─────────────────────────────────────────────────────
  const ordersByDay = useMemo(() => {
    const days = lastNDays(period === '7d' ? 7 : 30)
    const map: Record<string, number> = {}
    days.forEach((d) => (map[d] = 0))
    filteredOrders.forEach((o) => {
      const day = isoDay(o.created_at)
      if (day in map) map[day] = (map[day] ?? 0) + 1
    })
    return days.map((d) => ({ date: formatDate(d), pedidos: map[d] ?? 0 }))
  }, [filteredOrders, period])

  // ── 3. Top 5 produtos ──────────────────────────────────────────────────────
  const topProducts = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {}
    filteredOrders.forEach((o) => {
      o.order_items.forEach((item) => {
        if (!map[item.product_name]) map[item.product_name] = { qty: 0, revenue: 0 }
        const extra = (item.selected_options ?? []).reduce((s, op) => s + op.price_addition, 0)
        map[item.product_name].qty += item.quantity
        map[item.product_name].revenue += (item.product_price + extra) * item.quantity
      })
    })
    return Object.entries(map)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 5)
      .map(([name, v]) => ({ name, ...v }))
  }, [filteredOrders])

  // ── 4. Pedidos por tipo ────────────────────────────────────────────────────
  const byType = useMemo(() => {
    const delivery = filteredOrders.filter((o) => o.type === 'delivery').length
    const table = filteredOrders.filter((o) => o.type === 'table').length
    return [
      { name: 'Entrega', value: delivery, color: '#FF6B00' },
      { name: 'Mesa', value: table, color: '#6366f1' },
    ]
  }, [filteredOrders])

  // ── 5. KPIs ────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = filteredOrders.reduce((s, o) => s + o.total, 0)
    const count = filteredOrders.length
    const avgTicket = count > 0 ? total / count : 0

    // Horário de pico (agrupado por hora)
    const hourMap: Record<number, number> = {}
    filteredOrders.forEach((o) => {
      const h = new Date(o.created_at).getHours()
      hourMap[h] = (hourMap[h] ?? 0) + 1
    })
    const peakEntry = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]
    const peakHour = peakEntry ? `${peakEntry[0]}h–${String(Number(peakEntry[0]) + 1)}h` : '—'

    // Comparativo semana passada vs atual (últimos 7 dias vs 7 dias anteriores)
    const now = new Date()
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0, 0, 0, 0)
    const prevStart = new Date(now); prevStart.setDate(now.getDate() - 13); prevStart.setHours(0, 0, 0, 0)
    const prevEnd = new Date(now); prevEnd.setDate(now.getDate() - 7); prevEnd.setHours(23, 59, 59, 999)

    const thisWeekRev = orders
      .filter((o) => new Date(o.created_at) >= weekStart)
      .reduce((s, o) => s + o.total, 0)
    const prevWeekRev = orders
      .filter((o) => new Date(o.created_at) >= prevStart && new Date(o.created_at) <= prevEnd)
      .reduce((s, o) => s + o.total, 0)

    const weekGrowth = prevWeekRev === 0
      ? null
      : ((thisWeekRev - prevWeekRev) / prevWeekRev) * 100

    return { total, count, avgTicket, peakHour, weekGrowth, thisWeekRev, prevWeekRev }
  }, [filteredOrders, orders])

  // ── 6. Horário de pico (gráfico de barras) ─────────────────────────────────
  const hourlyData = useMemo(() => {
    const map: Record<number, number> = {}
    for (let h = 0; h < 24; h++) map[h] = 0
    filteredOrders.forEach((o) => {
      const h = new Date(o.created_at).getHours()
      map[h] = (map[h] ?? 0) + 1
    })
    return Object.entries(map)
      .filter(([h]) => Number(h) >= 6 && Number(h) <= 23) // 06h–23h
      .map(([h, count]) => ({ hora: `${h}h`, pedidos: count }))
  }, [filteredOrders])

  // ── 7. CSV Export ──────────────────────────────────────────────────────────
  function exportCSV() {
    const rows: string[][] = [
      ['Pedido', 'Data', 'Tipo', 'Status', 'Cliente', 'Total', 'Itens'],
    ]
    orders.forEach((o) => {
      const itens = o.order_items
        .map((i) => `${i.quantity}x ${i.product_name}`)
        .join(' | ')
      rows.push([
        String(o.order_number),
        new Date(o.created_at).toLocaleString('pt-BR'),
        o.type === 'delivery' ? 'Entrega' : 'Mesa',
        o.status,
        '',
        formatCurrency(o.total).replace('R$ ', 'R$ '),
        itens,
      ])
    })
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${restaurantName}-pedidos-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportPDF() {
    setPdfLoading(true)
    try {
      const { generateAnalyticsPdf } = await import('@/lib/analytics-pdf')
      await generateAnalyticsPdf(restaurantName, orders as unknown as PdfOrder[], period, currency)
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const ORANGE = '#FF6B00'

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dados dos últimos {period === '7d' ? '7' : '30'} dias</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Seletor de período */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
            {(['7d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${
                  period === p
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {p === '7d' ? '7 dias' : '30 dias'}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={exportPDF}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 border border-orange-500 rounded-xl text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {pdfLoading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {pdfLoading ? 'Gerando...' : 'Relatório PDF'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Receita total"
          value={formatCurrency(kpis.total)}
          color="orange"
        />
        <KpiCard
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Pedidos"
          value={String(kpis.count)}
          color="blue"
        />
        <KpiCard
          icon={<Users className="w-5 h-5" />}
          label="Ticket médio"
          value={formatCurrency(kpis.avgTicket)}
          color="green"
        />
        <KpiCard
          icon={<Clock className="w-5 h-5" />}
          label="Horário de pico"
          value={kpis.peakHour}
          color="purple"
        />
      </div>

      {/* Comparativo semanal */}
      {kpis.weekGrowth !== null && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Comparativo semanal</h2>
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-xs text-gray-400">Semana atual</p>
              <p className="text-xl font-black text-gray-900">{formatCurrency(kpis.thisWeekRev)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Semana anterior</p>
              <p className="text-xl font-black text-gray-900">{formatCurrency(kpis.prevWeekRev)}</p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
              kpis.weekGrowth >= 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              <span>{kpis.weekGrowth >= 0 ? '▲' : '▼'}</span>
              <span>{Math.abs(kpis.weekGrowth).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Receita por dia */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-700 mb-4">Receita por dia</h2>
        {filteredOrders.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueByDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ORANGE} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} width={55} />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v)), 'Receita']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Area type="monotone" dataKey="receita" stroke={ORANGE} strokeWidth={2.5} fill="url(#gradOrange)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pedidos por dia */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-700 mb-4">Pedidos por dia</h2>
        {filteredOrders.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ordersByDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
              <Tooltip
                formatter={(v) => [Number(v), 'Pedidos']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Bar dataKey="pedidos" fill={ORANGE} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Linha inferior: Top produtos + Tipo de pedido */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Top 5 produtos */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Top 5 produtos</h2>
          {topProducts.length === 0 ? (
            <EmptyChart small />
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const max = topProducts[0].qty
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800 truncate max-w-[65%]">
                        <span className="text-gray-400 font-bold mr-1.5">#{i + 1}</span>
                        {p.name}
                      </span>
                      <span className="text-gray-500 text-xs">{p.qty}× · {formatCurrency(p.revenue)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(p.qty / max) * 100}%`, background: ORANGE }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pedidos por tipo */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Pedidos por tipo</h2>
          {filteredOrders.length === 0 ? (
            <EmptyChart small />
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={byType}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {byType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [Number(v), 'pedidos']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
                  />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-6 text-sm">
                {byType.map((t) => (
                  <div key={t.name} className="text-center">
                    <p className="font-black text-gray-900 text-lg">{t.value}</p>
                    <p className="text-gray-400 text-xs">{t.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Horário de pico */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-700 mb-4">Distribuição por horário</h2>
        {filteredOrders.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="hora" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} width={25} />
              <Tooltip
                formatter={(v) => [Number(v), 'pedidos']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Bar dataKey="pedidos" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: 'orange' | 'blue' | 'green' | 'purple'
}) {
  const colors = {
    orange: 'bg-orange-50 text-orange-500',
    blue:   'bg-blue-50 text-blue-500',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-lg font-black text-gray-900 leading-tight">{value}</p>
    </div>
  )
}

function EmptyChart({ small }: { small?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${small ? 'h-32' : 'h-40'} text-gray-400 text-sm`}>
      Sem dados no período
    </div>
  )
}
