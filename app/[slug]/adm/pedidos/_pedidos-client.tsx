'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Pencil, ChevronDown, ChevronUp, X, Loader2, QrCode, Camera } from 'lucide-react'

type OrderItem = {
  id: string
  product_name: string
  product_price: number
  quantity: number
}

type Order = {
  id: string
  order_number: number
  type: 'table' | 'delivery'
  status: string
  customer_name: string | null
  customer_phone: string | null
  address: string | null
  table_number: string | null
  payment_method: string | null
  change_for: number | null
  total: number
  created_at: string
  order_items: OrderItem[]
}

const STATUS_OPTIONS = [
  { value: 'pending',          label: 'Aguardando',       color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed',        label: 'Confirmado',        color: 'bg-blue-100 text-blue-800' },
  { value: 'preparing',        label: 'Sendo preparado',   color: 'bg-purple-100 text-purple-800' },
  { value: 'ready',            label: 'Pronto',            color: 'bg-green-100 text-green-800' },
  { value: 'out_for_delivery', label: 'Saiu p/ entrega',   color: 'bg-orange-100 text-orange-800' },
  { value: 'delivered',        label: 'Entregue',          color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled',        label: 'Cancelado',         color: 'bg-red-100 text-red-800' },
]

function getStatusConfig(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0]
}

function formatPrice(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

type Props = {
  restaurantId: string
  initialOrders: Order[]
}

export function PedidosClient({ restaurantId, initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [tab, setTab] = useState<'delivery' | 'table' | 'qr'>('delivery')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)

  const supabase = createClient()

  // Realtime: escuta novos pedidos e atualizações
  useEffect(() => {
    const channel = supabase
      .channel(`restaurant-orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          // Buscar o pedido completo com itens
          const { data } = await supabase
            .from('orders')
            .select(`
              id, order_number, type, status, customer_name, customer_phone,
              address, table_number, payment_method, change_for, total, created_at,
              order_items (id, product_name, product_price, quantity)
            `)
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setOrders((prev) => [data as Order, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) => o.id === payload.new.id ? { ...o, ...payload.new } as Order : o)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId, supabase])

  async function handleStatusChange() {
    if (!editingOrder || !newStatus) return
    setStatusLoading(true)
    try {
      const res = await fetch(`/api/orders/${editingOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => o.id === editingOrder.id ? { ...o, status: newStatus } : o)
        )
        setEditingOrder(null)
      }
    } finally {
      setStatusLoading(false)
    }
  }

  const deliveryOrders = orders.filter((o) => o.type === 'delivery')
  const tableOrders = orders.filter((o) => o.type === 'table')

  const tabs = [
    { key: 'delivery', label: 'Entrega', count: deliveryOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length },
    { key: 'table',    label: 'Mesa',    count: tableOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length },
    { key: 'qr',       label: 'Ler QR Code', count: 0 },
  ]

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-black text-gray-900 mb-5">Pedidos de hoje</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.key === 'qr' && <QrCode className="w-4 h-4" />}
            {t.label}
            {t.count > 0 && (
              <span className="bg-orange-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Aba Ler QR Code */}
      {tab === 'qr' && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-lg font-black text-gray-900 mb-2">Escanear QR Code do cliente</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed max-w-xs mx-auto">
            O cliente gera um QR code com o pedido. Escaneie para confirmar.
          </p>
          <p className="text-xs text-gray-400">
            Use a câmera do dispositivo para escanear o QR code.<br />
            O link redirecionará para a tela de confirmação.
          </p>
        </div>
      )}

      {/* Lista de pedidos */}
      {tab !== 'qr' && (
        <div className="space-y-3">
          {(tab === 'delivery' ? deliveryOrders : tableOrders).length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-400 text-sm">Nenhum pedido de {tab === 'delivery' ? 'entrega' : 'mesa'} hoje.</p>
            </div>
          ) : (
            (tab === 'delivery' ? deliveryOrders : tableOrders).map((order) => {
              const sc = getStatusConfig(order.status)
              const expanded = expandedId === order.id

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Header do card */}
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-gray-900 text-base">
                            #{order.order_number}
                          </span>
                          {order.customer_name && (
                            <span className="text-gray-600 text-sm">— {order.customer_name}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{formatTime(order.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.color}`}>
                          {sc.label}
                        </span>
                        <button
                          onClick={() => { setEditingOrder(order); setNewStatus(order.status) }}
                          className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Info do pedido */}
                    {order.type === 'delivery' && (
                      <div className="space-y-1 text-sm">
                        {order.address && (
                          <p className="text-gray-600 text-xs"><span className="font-medium">Endereço:</span> {order.address}</p>
                        )}
                        {order.customer_phone && (
                          <p className="text-gray-600 text-xs"><span className="font-medium">WhatsApp:</span> {order.customer_phone}</p>
                        )}
                        {order.payment_method && (
                          <p className="text-gray-600 text-xs">
                            <span className="font-medium">Pagamento:</span> {order.payment_method}
                            {order.change_for && ` (troco p/ ${formatPrice(order.change_for)})`}
                          </p>
                        )}
                      </div>
                    )}

                    {order.type === 'table' && order.table_number && (
                      <p className="text-sm text-gray-600"><span className="font-medium">Mesa:</span> {order.table_number}</p>
                    )}
                  </div>

                  {/* Toggle itens */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 border-t border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs font-bold text-gray-500">
                      {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'itens'} — {formatPrice(order.total)}
                    </span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {/* Itens expandidos */}
                  {expanded && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-1.5">
                          <span className="text-sm text-gray-700">
                            <span className="font-bold text-orange-500">{item.quantity}x</span> {item.product_name}
                          </span>
                          <span className="text-sm text-gray-500">{formatPrice(item.product_price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-black text-gray-900 text-sm">
                        <span>Total</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Modal alterar status */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900 text-lg">Alterar status</h3>
              <button onClick={() => setEditingOrder(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Pedido #{editingOrder.order_number}</p>
            <div className="space-y-2 mb-6">
              {STATUS_OPTIONS
                .filter((s) => editingOrder.type === 'delivery' || s.value !== 'out_for_delivery')
                .map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setNewStatus(s.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left ${
                      newStatus === s.value
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-100 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color.replace('text-', 'bg-').split(' ')[0]}`} />
                    <span className={`text-sm font-medium ${newStatus === s.value ? 'text-orange-700' : 'text-gray-700'}`}>
                      {s.label}
                    </span>
                  </button>
                ))}
            </div>
            <button
              onClick={handleStatusChange}
              disabled={statusLoading || newStatus === editingOrder.status}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              {statusLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {statusLoading ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
