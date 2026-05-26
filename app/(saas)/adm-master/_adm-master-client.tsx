'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Store, ShoppingBag, UtensilsCrossed, Users,
  TrendingUp, CheckCircle2, XCircle, Clock,
  ExternalLink, Search, ChevronUp, ChevronDown,
  Mail, Loader2,
} from 'lucide-react'

type Restaurant = {
  id: string
  name: string
  slug: string
  plan: string | null
  is_active: boolean | null
  created_at: string
  trial_ends_at: string | null
  delivery_enabled: boolean | null
  currency: string | null
  pratos: number
  pedidos: number
  staff: number
  last_order: string | null
  owner_name: string
}

type Totals = {
  total: number
  free: number
  basic: number
  pro: number
  active: number
  pedidos: number
  pratos: number
}

type SortKey = 'created_at' | 'name' | 'plan' | 'pratos' | 'pedidos' | 'staff'
type SortDir = 'asc' | 'desc'

const PLAN_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  free:  { label: 'Free',  bg: '#f3f4f6', color: '#6b7280' },
  basic: { label: 'Basic', bg: '#dbeafe', color: '#1d4ed8' },
  pro:   { label: 'Pro',   bg: '#fef3c7', color: '#d97706' },
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days  = Math.floor(diff / 86_400_000)
  const hours = Math.floor(diff / 3_600_000)
  const mins  = Math.floor(diff / 60_000)
  if (mins < 60)  return `${mins}min atrás`
  if (hours < 24) return `${hours}h atrás`
  if (days === 1) return 'ontem'
  if (days < 30)  return `${days}d atrás`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function trialStatus(trial_ends_at: string | null, plan: string | null) {
  if (plan && plan !== 'free') return null
  if (!trial_ends_at) return { label: 'sem trial', color: '#9ca3af' }
  const days = Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / 86_400_000)
  if (days < 0)  return { label: 'trial expirado', color: '#ef4444' }
  if (days === 0) return { label: 'expira hoje', color: '#f97316' }
  if (days <= 3)  return { label: `${days}d restantes`, color: '#f97316' }
  return { label: `${days}d restantes`, color: '#22c55e' }
}

export function AdmMasterClient({ restaurants, totals }: { restaurants: Restaurant[]; totals: Totals }) {
  const [search, setSearch]       = useState('')
  const [planFilter, setPlan]     = useState<string>('all')
  const [sortKey, setSortKey]     = useState<SortKey>('created_at')
  const [sortDir, setSortDir]     = useState<SortDir>('desc')
  const [sending, setSending]     = useState<string | null>(null)   // restaurantId em envio
  const [sentIds, setSentIds]     = useState<Set<string>>(new Set()) // já enviados nesta sessão
  const [sendError, setSendError] = useState<string | null>(null)

  async function sendWelcome(r: Restaurant) {
    if (sending || sentIds.has(r.id)) return
    setSending(r.id)
    setSendError(null)
    try {
      const res = await fetch('/api/adm-master/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId:   r.id,
          slug:           r.slug,
          restaurantName: r.name,
          ownerName:      r.owner_name,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar')
      setSentIds((prev) => new Set(prev).add(r.id))
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Erro ao enviar e-mail')
    } finally {
      setSending(null)
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    let list = [...restaurants]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((r) =>
        r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q)
      )
    }
    if (planFilter !== 'all') list = list.filter((r) => r.plan === planFilter)
    list.sort((a, b) => {
      let va: string | number = a[sortKey] ?? ''
      let vb: string | number = b[sortKey] ?? ''
      if (sortKey === 'pratos' || sortKey === 'pedidos' || sortKey === 'staff') {
        va = a[sortKey]; vb = b[sortKey]
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [restaurants, search, planFilter, sortKey, sortDir])

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 opacity-20" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-orange-500" />
      : <ChevronDown className="w-3 h-3 text-orange-500" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-gray-900">HIVI</span>
          <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
            Master
          </span>
        </div>
        <Link href="/conta" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Minha conta
        </Link>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Erro de envio */}
        {sendError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-center justify-between">
            {sendError}
            <button onClick={() => setSendError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {[
            { icon: Store,          label: 'Restaurantes', value: totals.total,   color: '#6366f1' },
            { icon: CheckCircle2,   label: 'Ativos',       value: totals.active,  color: '#22c55e' },
            { icon: TrendingUp,     label: 'Free',         value: totals.free,    color: '#9ca3af' },
            { icon: TrendingUp,     label: 'Basic',        value: totals.basic,   color: '#3b82f6' },
            { icon: TrendingUp,     label: 'Pro',          value: totals.pro,     color: '#f59e0b' },
            { icon: ShoppingBag,    label: 'Pedidos',      value: totals.pedidos, color: '#f97316' },
            { icon: UtensilsCrossed,label: 'Pratos',       value: totals.pratos,  color: '#8b5cf6' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-1">
              <Icon className="w-4 h-4 mb-1" style={{ color }} />
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar restaurante..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'free', 'basic', 'pro'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className="px-3 py-2 rounded-xl text-xs font-bold border transition-colors"
                style={{
                  background: planFilter === p ? '#f97316' : 'white',
                  color:      planFilter === p ? 'white'   : '#6b7280',
                  borderColor: planFilter === p ? '#f97316' : '#e5e7eb',
                }}
              >
                {p === 'all' ? 'Todos' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  {([
                    { key: 'name',       label: 'Restaurante' },
                    { key: 'plan',       label: 'Plano' },
                    { key: 'pratos',     label: 'Pratos' },
                    { key: 'pedidos',    label: 'Pedidos' },
                    { key: 'staff',      label: 'Staff' },
                    { key: 'created_at', label: 'Criado' },
                  ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                    <th
                      key={key}
                      className="text-left px-4 py-3 cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => toggleSort(key)}
                    >
                      <span className="flex items-center gap-1">
                        {label} <SortIcon k={key} />
                      </span>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Último pedido</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-400">
                      Nenhum restaurante encontrado
                    </td>
                  </tr>
                )}
                {filtered.map((r) => {
                  const plan    = PLAN_BADGE[r.plan ?? 'free'] ?? PLAN_BADGE.free
                  const trial   = trialStatus(r.trial_ends_at, r.plan)
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      {/* Nome */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 leading-tight">{r.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.slug}</p>
                      </td>
                      {/* Plano */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold w-fit"
                            style={{ background: plan.bg, color: plan.color }}
                          >
                            {plan.label}
                          </span>
                          {trial && (
                            <span className="text-xs font-medium" style={{ color: trial.color }}>
                              {trial.label}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Pratos */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-700">{r.pratos}</span>
                      </td>
                      {/* Pedidos */}
                      <td className="px-4 py-3">
                        <span className={`font-bold ${r.pedidos > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
                          {r.pedidos}
                        </span>
                      </td>
                      {/* Staff */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Users className="w-3.5 h-3.5" />
                          <span>{r.staff}</span>
                        </div>
                      </td>
                      {/* Criado */}
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {relativeDate(r.created_at)}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        {r.is_active ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Pausado
                          </span>
                        )}
                      </td>
                      {/* Último pedido */}
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {r.last_order ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {relativeDate(r.last_order)}
                          </span>
                        ) : (
                          <span className="text-gray-200">—</span>
                        )}
                      </td>
                      {/* Links + ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/${r.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                            title="Ver cardápio"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/${r.slug}/adm`}
                            target="_blank"
                            className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors"
                            title="Abrir ADM"
                          >
                            <Store className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => sendWelcome(r)}
                            disabled={!!sending || sentIds.has(r.id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{
                              background: sentIds.has(r.id) ? '#f0fdf4' : undefined,
                              color: sentIds.has(r.id) ? '#16a34a' : '#9ca3af',
                            }}
                            title={sentIds.has(r.id) ? 'E-mail enviado' : 'Enviar boas-vindas'}
                          >
                            {sending === r.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : sentIds.has(r.id)
                              ? <CheckCircle2 className="w-3.5 h-3.5" />
                              : <Mail className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer da tabela */}
          <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
            {filtered.length} de {totals.total} restaurante{totals.total !== 1 ? 's' : ''}
          </div>
        </div>
      </main>
    </div>
  )
}
