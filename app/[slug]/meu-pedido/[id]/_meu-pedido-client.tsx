'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, CheckCircle2, ChefHat, Package, Bike, Check, XCircle } from 'lucide-react'

type SelectedOption = {
  group_id: string
  group_name: string
  item_id: string
  item_name: string
  price_addition: number
}

type OrderItem = {
  id: string
  product_name: string
  product_price: number
  quantity: number
  selected_options?: SelectedOption[] | null
}

type Order = {
  id: string
  order_number: number
  type: string
  status: string
  customer_name: string | null
  notes: string | null
  total: number
  created_at: string
  order_items: OrderItem[]
}

type Restaurant = {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  instagram_url?: string | null
  whatsapp_number?: string | null
}

type Props = {
  order: Order
  restaurant: Restaurant
  slug: string
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; description: string }> = {
  pending:          { label: 'Aguardando',        icon: Clock,         color: '#F59E0B', description: 'Seu pedido foi recebido e aguarda confirmação.' },
  confirmed:        { label: 'Confirmado',         icon: CheckCircle2,  color: '#3B82F6', description: 'O restaurante confirmou seu pedido!' },
  preparing:        { label: 'Sendo preparado',    icon: ChefHat,       color: '#8B5CF6', description: 'Sua comida está sendo preparada com carinho.' },
  ready:            { label: 'Pronto',             icon: Package,       color: '#10B981', description: 'Seu pedido está pronto!' },
  out_for_delivery: { label: 'Saiu para entrega',  icon: Bike,          color: '#F97316', description: 'Seu pedido está a caminho!' },
  delivered:        { label: 'Entregue',           icon: Check,         color: '#22C55E', description: 'Pedido entregue. Bom apetite! 🎉' },
  cancelled:        { label: 'Cancelado',          icon: XCircle,       color: '#EF4444', description: 'Seu pedido foi cancelado.' },
}

const STATUS_STEPS_DELIVERY = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
const STATUS_STEPS_TABLE    = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']
const TERMINAL_STATUSES     = ['delivered', 'cancelled']

export function MeuPedidoClient({ order: initialOrder, restaurant, slug }: Props) {
  const [status, setStatus] = useState(initialOrder.status)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Limpa o localStorage quando o pedido já está finalizado ao abrir a página
  useEffect(() => {
    if (TERMINAL_STATUSES.includes(initialOrder.status)) {
      try { localStorage.removeItem(`hivi-active-order-${slug}`) } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function formatPrice(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // Realtime: escuta mudanças no pedido
  useEffect(() => {
    const channel = supabase
      .channel(`order-${initialOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${initialOrder.id}`,
        },
        (payload) => {
          if (payload.new?.status) {
            const newStatus = payload.new.status as string
            setStatus(newStatus)
            if (TERMINAL_STATUSES.includes(newStatus)) {
              try { localStorage.removeItem(`hivi-active-order-${slug}`) } catch {}
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrder.id])

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending']
  const StatusIcon = config.icon
  const steps = initialOrder.type === 'delivery' ? STATUS_STEPS_DELIVERY : STATUS_STEPS_TABLE
  const currentStepIndex = steps.indexOf(status)

  return (
    <div className="min-h-screen pb-24" style={{ color: 'var(--menu-text)' }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 sticky top-0 z-10"
        style={{ background: 'var(--menu-bg)', borderBottom: '1px solid rgba(128,128,128,0.15)' }}
      >
        <div className="flex items-center gap-3">
          {restaurant.logo_url ? (
            <Image src={restaurant.logo_url} alt={restaurant.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm"
              style={{ background: 'var(--menu-primary)', color: 'var(--menu-text-on-primary)' }}
            >
              {restaurant.name.charAt(0)}
            </div>
          )}
          <span className="font-bold text-sm" style={{ color: 'var(--menu-text)' }}>{restaurant.name}</span>
        </div>
        <span className="text-sm" style={{ color: 'var(--menu-text-muted)' }}>Pedido #{initialOrder.order_number}</span>
      </div>

      <div className="px-4 pt-8">

        {/* Status principal */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: `${config.color}20`, border: `2px solid ${config.color}` }}
          >
            <StatusIcon className="w-10 h-10" style={{ color: config.color }} />
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--menu-text)' }}>{config.label}</h1>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--menu-text-muted)' }}>{config.description}</p>
        </div>

        {/* Stepper */}
        {status !== 'cancelled' && (
          <div className="flex items-center justify-center mb-8 px-2">
            {steps.map((step, idx) => {
              const isDone    = currentStepIndex > idx
              const isCurrent = currentStepIndex === idx
              return (
                <div key={step} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 transition-all"
                    style={{
                      background: isDone || isCurrent ? config.color : 'rgba(128,128,128,0.25)',
                      transform: isCurrent ? 'scale(1.4)' : 'scale(1)',
                    }}
                  />
                  {idx < steps.length - 1 && (
                    <div
                      className="h-0.5 w-6 mx-0.5 flex-shrink-0"
                      style={{ background: isDone ? config.color : 'rgba(128,128,128,0.20)' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Itens do pedido */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--menu-card)' }}>
          <p className="text-xs mb-3 uppercase tracking-wide font-bold" style={{ color: 'var(--menu-text-muted)' }}>Itens</p>
          <div className="space-y-2">
            {initialOrder.order_items.map((item) => {
              const optionsExtra = (item.selected_options ?? []).reduce((s, o) => s + o.price_addition, 0)
              return (
              <div key={item.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--menu-primary)', color: 'var(--menu-text-on-primary)' }}
                    >
                      {item.quantity}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--menu-text)' }}>{item.product_name}</span>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--menu-text-muted)' }}>{formatPrice((item.product_price + optionsExtra) * item.quantity)}</span>
                </div>
                {item.selected_options && item.selected_options.length > 0 && (
                  <div className="pl-8 mt-0.5 space-y-0.5">
                    {item.selected_options.map((o) => (
                      <p key={o.item_id} className="text-xs" style={{ color: 'var(--menu-text-muted)', opacity: 0.75 }}>
                        {o.group_name}: <span style={{ opacity: 1, fontWeight: 600 }}>{o.item_name}</span>
                        {o.price_addition > 0 && ` (+${formatPrice(o.price_addition)})`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 flex justify-between font-black" style={{ borderTop: '1px solid rgba(128,128,128,0.15)', color: 'var(--menu-text)' }}>
            <span>Total</span>
            <span>{formatPrice(initialOrder.total)}</span>
          </div>
        </div>

        {/* Observações */}
        {initialOrder.notes && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--menu-card)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--menu-text-muted)' }}>Observações</p>
            <p className="text-sm italic" style={{ color: 'var(--menu-text)' }}>{initialOrder.notes}</p>
          </div>
        )}

        {/* Info do cliente */}
        {initialOrder.customer_name && (
          <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--menu-card)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--menu-text-muted)' }}>Nome</p>
            <p className="text-sm" style={{ color: 'var(--menu-text)' }}>{initialOrder.customer_name}</p>
          </div>
        )}

        {/* Redes sociais */}
        {(restaurant.instagram_url || restaurant.whatsapp_number) && (
          <div className="text-center mt-8">
            <p className="text-xs mb-3" style={{ color: 'var(--menu-text-muted)', opacity: 0.6 }}>Fique por dentro das novidades</p>
            <div className="flex justify-center gap-4">
              {restaurant.instagram_url && (
                <a
                  href={restaurant.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-opacity hover:opacity-100 opacity-60"
                  style={{ color: 'var(--menu-text)' }}
                >
                  Instagram
                </a>
              )}
              {restaurant.whatsapp_number && (
                <a
                  href={`https://wa.me/${restaurant.whatsapp_number.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-opacity hover:opacity-100 opacity-60"
                  style={{ color: 'var(--menu-text)' }}
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {/* Voltar para cardápio */}
        {(status === 'delivered' || status === 'cancelled') && (
          <div className="text-center mt-8">
            <Link
              href={`/${slug}`}
              className="inline-block px-8 py-3 rounded-2xl font-bold text-sm"
              style={{ background: 'var(--menu-primary)', color: 'var(--menu-text-on-primary)' }}
            >
              Ver cardápio
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
