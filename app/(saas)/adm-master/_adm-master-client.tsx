'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Store, ShoppingBag, UtensilsCrossed, Users, TrendingUp,
  CheckCircle2, XCircle, Clock, ExternalLink, Search,
  ChevronUp, ChevronDown, Mail, Loader2, MessageSquare,
  Phone, X, Plus, Trash2, Send, StickyNote,
} from 'lucide-react'

// ── Tipos ──────────────────────────────────────────────────────────────────────

type Restaurant = {
  id: string
  name: string
  slug: string
  plan: string | null
  is_active: boolean | null
  created_at: string
  trial_ends_at: string | null
  currency: string | null
  pratos: number
  pedidos: number
  staff: number
  last_order: string | null
  owner_name: string
  last_contact: string | null
  contact_count: number
}

type Totals = {
  total: number; free: number; basic: number; pro: number
  active: number; pedidos: number; pratos: number
}

type Contact = {
  id: string
  type: 'welcome_email' | 'manual_email' | 'note' | 'whatsapp' | 'call'
  content: string | null
  created_at: string
}

type SortKey = 'created_at' | 'name' | 'plan' | 'pratos' | 'pedidos' | 'last_contact'

// ── Constantes ────────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  free:  { label: 'Free',  bg: '#f3f4f6', color: '#6b7280' },
  basic: { label: 'Basic', bg: '#dbeafe', color: '#1d4ed8' },
  pro:   { label: 'Pro',   bg: '#fef3c7', color: '#d97706' },
}

const CONTACT_TYPE: Record<Contact['type'], { label: string; icon: React.ReactNode; color: string }> = {
  welcome_email: { label: 'E-mail boas-vindas', icon: <Mail className="w-3.5 h-3.5" />,          color: '#f97316' },
  manual_email:  { label: 'E-mail manual',       icon: <Send className="w-3.5 h-3.5" />,          color: '#6366f1' },
  note:          { label: 'Nota interna',         icon: <StickyNote className="w-3.5 h-3.5" />,   color: '#eab308' },
  whatsapp:      { label: 'WhatsApp',             icon: <MessageSquare className="w-3.5 h-3.5" />,color: '#22c55e' },
  call:          { label: 'Ligação',              icon: <Phone className="w-3.5 h-3.5" />,         color: '#3b82f6' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeDate(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 60)  return `${mins}min`
  if (hours < 24)  return `${hours}h`
  if (days  === 1) return 'ontem'
  if (days  < 30)  return `${days}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function trialStatus(trial_ends_at: string | null, plan: string | null) {
  if (plan && plan !== 'free') return null
  if (!trial_ends_at) return { label: 'sem trial', color: '#9ca3af' }
  const days = Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / 86_400_000)
  if (days < 0)   return { label: 'trial expirado', color: '#ef4444' }
  if (days === 0) return { label: 'expira hoje',    color: '#f97316' }
  if (days <= 3)  return { label: `${days}d restantes`, color: '#f97316' }
  return           { label: `${days}d restantes`,   color: '#22c55e' }
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AdmMasterClient({ restaurants, totals }: { restaurants: Restaurant[]; totals: Totals }) {
  const [search,      setSearch]    = useState('')
  const [planFilter,  setPlan]      = useState('all')
  const [sortKey,     setSortKey]   = useState<SortKey>('created_at')
  const [sortDir,     setSortDir]   = useState<'asc' | 'desc'>('desc')
  const [selected,    setSelected]  = useState<Restaurant | null>(null)
  const [sending,     setSending]   = useState<string | null>(null)
  const [sentIds,     setSentIds]   = useState<Set<string>>(new Set())
  const [localRestaurants, setLocalRestaurants] = useState(restaurants)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    let list = [...localRestaurants]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q))
    }
    if (planFilter !== 'all') list = list.filter(r => r.plan === planFilter)
    list.sort((a, b) => {
      const va = a[sortKey] ?? ''
      const vb = b[sortKey] ?? ''
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })
    return list
  }, [localRestaurants, search, planFilter, sortKey, sortDir])

  async function sendWelcome(r: Restaurant) {
    if (sending || sentIds.has(r.id)) return
    setSending(r.id)
    try {
      const res  = await fetch('/api/adm-master/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: r.id, slug: r.slug,
          restaurantName: r.name, ownerName: r.owner_name,
        }),
      })
      if (!res.ok) throw new Error()
      setSentIds(prev => new Set(prev).add(r.id))
      // Atualiza last_contact localmente
      const now = new Date().toISOString()
      setLocalRestaurants(prev => prev.map(x =>
        x.id === r.id
          ? { ...x, last_contact: now, contact_count: x.contact_count + 1 }
          : x
      ))
      if (selected?.id === r.id) setSelected(s => s ? { ...s, last_contact: now, contact_count: s.contact_count + 1 } : s)
    } catch {
      alert('Erro ao enviar e-mail.')
    } finally {
      setSending(null)
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 opacity-20" />
    return sortDir === 'asc'
      ? <ChevronUp   className="w-3 h-3 text-orange-500" />
      : <ChevronDown className="w-3 h-3 text-orange-500" />
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-gray-900">HIVI</span>
          <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Master</span>
        </div>
        <Link href="/conta" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">← Minha conta</Link>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {([
            { icon: Store,           label: 'Restaurantes', value: totals.total   },
            { icon: CheckCircle2,    label: 'Ativos',       value: totals.active  },
            { icon: TrendingUp,      label: 'Free',         value: totals.free    },
            { icon: TrendingUp,      label: 'Basic',        value: totals.basic   },
            { icon: TrendingUp,      label: 'Pro',          value: totals.pro     },
            { icon: ShoppingBag,     label: 'Pedidos',      value: totals.pedidos },
            { icon: UtensilsCrossed, label: 'Pratos',       value: totals.pratos  },
          ] as const).map(({ icon: Icon, label, value }, i) => {
            const colors = ['#6366f1','#22c55e','#9ca3af','#3b82f6','#f59e0b','#f97316','#8b5cf6']
            return (
              <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <Icon className="w-4 h-4 mb-1" style={{ color: colors[i] }} />
                <p className="text-2xl font-black text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            )
          })}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar restaurante..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex gap-2">
            {(['all','free','basic','pro'] as const).map(p => (
              <button key={p} onClick={() => setPlan(p)}
                className="px-3 py-2 rounded-xl text-xs font-bold border transition-colors"
                style={{
                  background:  planFilter === p ? '#f97316' : 'white',
                  color:       planFilter === p ? 'white'   : '#6b7280',
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
                    { key: 'name',         label: 'Restaurante'  },
                    { key: 'plan',         label: 'Plano'        },
                    { key: 'pratos',       label: 'Pratos'       },
                    { key: 'pedidos',      label: 'Pedidos'      },
                    { key: 'created_at',   label: 'Criado'       },
                    { key: 'last_contact', label: 'Último contato'},
                  ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
                    <th key={key} onClick={() => toggleSort(key)}
                      className="text-left px-4 py-3 cursor-pointer hover:text-gray-700 select-none whitespace-nowrap">
                      <span className="flex items-center gap-1">{label}<SortIcon k={key} /></span>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">Nenhum restaurante encontrado</td></tr>
                )}
                {filtered.map(r => {
                  const plan  = PLAN_BADGE[r.plan ?? 'free'] ?? PLAN_BADGE.free
                  const trial = trialStatus(r.trial_ends_at, r.plan)
                  return (
                    <tr key={r.id}
                      onClick={() => setSelected(r)}
                      className="hover:bg-orange-50/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 leading-tight">{r.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold w-fit"
                            style={{ background: plan.bg, color: plan.color }}>{plan.label}</span>
                          {trial && <span className="text-xs font-medium" style={{ color: trial.color }}>{trial.label}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-700">{r.pratos}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${r.pedidos > 0 ? 'text-orange-500' : 'text-gray-300'}`}>{r.pedidos}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{relativeDate(r.created_at)}</td>
                      <td className="px-4 py-3">
                        {r.last_contact ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                            <span className="text-xs text-gray-500">{relativeDate(r.last_contact)}</span>
                            {r.contact_count > 1 && (
                              <span className="text-xs text-gray-400">({r.contact_count})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 italic">sem contato</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.is_active
                          ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Ativo</span>
                          : <span className="flex items-center gap-1 text-red-400 text-xs font-medium"><XCircle className="w-3.5 h-3.5" />Pausado</span>
                        }
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <Link href={`/${r.slug}`} target="_blank"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Ver cardápio">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link href={`/${r.slug}/adm`} target="_blank"
                            className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors" title="Abrir ADM">
                            <Store className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => sendWelcome(r)} disabled={!!sending || sentIds.has(r.id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: sentIds.has(r.id) ? '#16a34a' : '#9ca3af' }}
                            title={sentIds.has(r.id) ? 'Enviado' : 'Enviar boas-vindas'}>
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
          <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
            {filtered.length} de {totals.total} restaurante{totals.total !== 1 ? 's' : ''}
          </div>
        </div>
      </main>

      {/* Painel lateral */}
      {selected && (
        <RestaurantPanel
          restaurant={selected}
          sending={sending === selected.id}
          sent={sentIds.has(selected.id)}
          onSendWelcome={() => sendWelcome(selected)}
          onClose={() => setSelected(null)}
          onContactAdded={(c) => {
            setLocalRestaurants(prev => prev.map(r =>
              r.id === selected.id
                ? { ...r, last_contact: c.created_at, contact_count: r.contact_count + 1 }
                : r
            ))
            setSelected(s => s ? { ...s, last_contact: c.created_at, contact_count: s.contact_count + 1 } : s)
          }}
        />
      )}
    </div>
  )
}

// ── Painel lateral de gestão ──────────────────────────────────────────────────

function RestaurantPanel({
  restaurant, sending, sent, onSendWelcome, onClose, onContactAdded,
}: {
  restaurant: Restaurant
  sending: boolean
  sent: boolean
  onSendWelcome: () => void
  onClose: () => void
  onContactAdded: (c: Contact) => void
}) {
  const [contacts,     setContacts]     = useState<Contact[]>([])
  const [loading,      setLoading]      = useState(true)
  const [noteType,     setNoteType]     = useState<Contact['type']>('note')
  const [noteContent,  setNoteContent]  = useState('')
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState<string | null>(null)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/adm-master/contacts?restaurantId=${restaurant.id}`)
      const data = await res.json()
      setContacts(data.contacts ?? [])
    } finally {
      setLoading(false)
    }
  }, [restaurant.id])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  async function addContact() {
    if (!noteContent.trim() && noteType === 'note') return
    setSaving(true)
    try {
      const res = await fetch('/api/adm-master/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          type:          noteType,
          content:       noteContent.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.contact) {
        setContacts(prev => [data.contact, ...prev])
        onContactAdded(data.contact)
        setNoteContent('')
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteContact(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/adm-master/contacts?id=${id}`, { method: 'DELETE' })
      setContacts(prev => prev.filter(c => c.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const plan  = PLAN_BADGE[restaurant.plan ?? 'free'] ?? PLAN_BADGE.free
  const trial = trialStatus(restaurant.trial_ends_at, restaurant.plan)

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-30 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header do painel */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">{restaurant.slug}</p>
            <h2 className="font-black text-gray-900 text-lg leading-tight truncate">{restaurant.name}</h2>
            {restaurant.owner_name && (
              <p className="text-sm text-gray-500 mt-0.5">{restaurant.owner_name}</p>
            )}
          </div>
          <button onClick={onClose} className="ml-3 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info rápida */}
        <div className="px-5 py-4 border-b border-gray-100 grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Plano</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: plan.bg, color: plan.color }}>{plan.label}</span>
            {trial && <p className="text-xs mt-1 font-medium" style={{ color: trial.color }}>{trial.label}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Pratos · Pedidos</p>
            <p className="text-sm font-bold text-gray-700">{restaurant.pratos} · <span className={restaurant.pedidos > 0 ? 'text-orange-500' : ''}>{restaurant.pedidos}</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Status</p>
            {restaurant.is_active
              ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 className="w-3 h-3" />Ativo</span>
              : <span className="flex items-center gap-1 text-red-400 text-xs font-medium"><XCircle className="w-3 h-3" />Pausado</span>
            }
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="px-5 py-3 border-b border-gray-100 flex gap-2 flex-wrap">
          <button onClick={onSendWelcome} disabled={sending || sent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            style={{ background: sent ? '#f0fdf4' : '#fff7ed', color: sent ? '#16a34a' : '#ea580c' }}>
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : sent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
            {sent ? 'Boas-vindas enviado' : 'Enviar boas-vindas'}
          </button>
          <Link href={`/${restaurant.slug}`} target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />Cardápio
          </Link>
          <Link href={`/${restaurant.slug}/adm`} target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
            <Store className="w-3.5 h-3.5" />ADM
          </Link>
        </div>

        {/* Adicionar contato */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Registrar contato</p>
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {(Object.entries(CONTACT_TYPE) as [Contact['type'], typeof CONTACT_TYPE[Contact['type']]][]).map(([t, meta]) => (
              <button key={t} onClick={() => setNoteType(t)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-colors"
                style={{
                  background:  noteType === t ? meta.color + '18' : 'white',
                  color:       noteType === t ? meta.color : '#9ca3af',
                  borderColor: noteType === t ? meta.color + '44' : '#e5e7eb',
                }}>
                {meta.icon}{meta.label}
              </button>
            ))}
          </div>
          <textarea
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            placeholder="Conteúdo / observação (opcional para ligação/whatsapp)..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl text-sm border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button onClick={addContact} disabled={saving || (noteType === 'note' && !noteContent.trim())}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-40"
            style={{ background: '#f97316', color: 'white' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Registrar
          </button>
        </div>

        {/* Timeline de contatos */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
            Histórico
            {contacts.length > 0 && (
              <span className="bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 text-xs font-bold">{contacts.length}</span>
            )}
          </p>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            </div>
          )}

          {!loading && contacts.length === 0 && (
            <div className="text-center py-10">
              <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhum contato registrado</p>
            </div>
          )}

          <div className="space-y-3">
            {contacts.map(c => {
              const meta = CONTACT_TYPE[c.type]
              return (
                <div key={c.id} className="flex gap-3 group">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: meta.color + '18', color: meta.color }}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold" style={{ color: meta.color }}>{meta.label}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{fullDate(c.created_at)}
                        </span>
                        <button onClick={() => deleteContact(c.id)} disabled={deleting === c.id}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-300 hover:text-red-400 transition-all">
                          {deleting === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    {c.content && (
                      <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{c.content}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
