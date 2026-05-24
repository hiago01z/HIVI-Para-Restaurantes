'use client'

import Link from 'next/link'
import { ShoppingBag, Bike, LayoutDashboard, UtensilsCrossed, Tag, Settings, Users } from 'lucide-react'
import { formatCurrency, type SupportedCurrency } from '@/lib/currency'

type Order = {
  id: string
  order_number: number
  type: 'table' | 'delivery'
  status: string
  customer_name: string | null
  total: number
  delivery_fee?: number | null
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  pending:          'Aguardando',
  confirmed:        'Confirmado',
  preparing:        'Preparando',
  ready:            'Pronto',
  out_for_delivery: 'Saindo',
  delivered:        'Entregue',
  cancelled:        'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-700',
  confirmed:        'bg-blue-100 text-blue-700',
  preparing:        'bg-purple-100 text-purple-700',
  ready:            'bg-green-100 text-green-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered:        'bg-gray-100 text-gray-600',
  cancelled:        'bg-red-100 text-red-600',
}

// formatPrice é gerado no componente com base na currency do restaurante

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

interface Props {
  slug: string
  restaurantName: string
  todayOrders: Order[]
  totalProducts: number
  totalCategories: number
  currency?: SupportedCurrency
}

export function DashboardClient({ slug, restaurantName, todayOrders, totalProducts, totalCategories, currency = 'BRL' }: Props) {
  const formatPrice = (v: number) => formatCurrency(v, currency)
  const pending   = todayOrders.filter(o => o.status === 'pending').length
  const active    = todayOrders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length
  const revenue   = todayOrders
    .filter(o => ['delivered', 'ready', 'out_for_delivery'].includes(o.status))
    .reduce((s, o) => s + o.total, 0)

  const recent = todayOrders.slice(0, 8)

  const nav = [
    { href: `/${slug}/adm/pedidos`,        icon: ShoppingBag,      label: 'Pedidos',       badge: active > 0 ? active : null },
    { href: `/${slug}/adm/pratos`,         icon: UtensilsCrossed,  label: 'Pratos',        badge: null },
    { href: `/${slug}/adm/categorias`,     icon: Tag,              label: 'Categorias',    badge: null },
    { href: `/${slug}/adm/funcionarios`,   icon: Users,            label: 'Equipe',        badge: null },
    { href: `/${slug}/adm/configuracoes`,  icon: Settings,         label: 'Configurações', badge: null },
  ]

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">

      {/* Saudação */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Olá, {restaurantName.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Aqui está o resumo de hoje.</p>
      </div>

      {/* Métricas do dia */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label="Pedidos hoje"
          value={todayOrders.length}
          sub={`${pending} aguardando`}
          accent={pending > 0}
        />
        <MetricCard
          label="Em andamento"
          value={active}
          sub="abertos agora"
          accent={active > 0}
        />
        <MetricCard
          label="Receita"
          value={formatPrice(revenue)}
          sub="pedidos concluídos"
          small
        />
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-3">
        {nav.map(({ href, icon: Icon, label, badge }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow transition-all"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'color-mix(in srgb, var(--adm-primary) 12%, white)' }}
            >
              <Icon className="w-5 h-5" style={{ color: 'var(--adm-primary)' }} />
            </div>
            <span className="font-semibold text-gray-800 text-sm flex-1">{label}</span>
            {badge !== null && (
              <span
                className="w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--adm-primary)', color: 'var(--adm-text-on-primary, #fff)' }}
              >
                {badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Últimos pedidos */}
      {recent.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Pedidos de hoje</h2>
            <Link
              href={`/${slug}/adm/pedidos`}
              className="text-xs font-medium hover:underline"
              style={{ color: 'var(--adm-primary)' }}
            >
              Ver todos
            </Link>
          </div>
          <ul className="divide-y divide-gray-50">
            {recent.map((order) => (
              <li key={order.id} className="flex items-center gap-3 px-5 py-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--adm-primary) 10%, white)' }}
                >
                  {order.type === 'delivery'
                    ? <Bike className="w-4 h-4" style={{ color: 'var(--adm-primary)' }} />
                    : <LayoutDashboard className="w-4 h-4" style={{ color: 'var(--adm-primary)' }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    #{order.order_number} · {order.customer_name ?? 'Mesa'}
                  </p>
                  <p className="text-xs text-gray-400">{formatTime(order.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <span className="text-xs font-medium text-gray-700">{formatPrice(order.total + (order.delivery_fee ?? 0))}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Estado vazio */}
      {todayOrders.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-semibold text-gray-800 mb-1">Nenhum pedido hoje ainda</p>
          <p className="text-sm text-gray-500">Os pedidos aparecerão aqui em tempo real.</p>
        </div>
      )}

      {/* Resumo do cardápio */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-black text-gray-900">{totalProducts}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pratos cadastrados</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-black text-gray-900">{totalCategories}</p>
          <p className="text-xs text-gray-500 mt-0.5">Categorias</p>
        </div>
      </div>

    </div>
  )
}

function MetricCard({
  label, value, sub, accent = false, small = false,
}: {
  label: string
  value: string | number
  sub: string
  accent?: boolean
  small?: boolean
}) {
  return (
    <div
      className="rounded-2xl p-4 shadow-sm border flex flex-col gap-1"
      style={{
        background: accent ? 'var(--adm-primary-light, #fff7ed)' : 'white',
        borderColor: accent ? 'var(--adm-primary-muted, #fed7aa)' : '#f3f4f6',
      }}
    >
      <p className="text-xs text-gray-500 leading-tight">{label}</p>
      <p className={`font-black text-gray-900 leading-tight ${small ? 'text-base' : 'text-2xl'}`}>
        {value}
      </p>
      <p className="text-[11px] text-gray-400 leading-tight">{sub}</p>
    </div>
  )
}
