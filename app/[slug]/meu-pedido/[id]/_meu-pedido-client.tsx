'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, CheckCircle2, ChefHat, Package, Bike, Check, XCircle } from 'lucide-react'

type OrderItem = {
  id: string
  product_name: string
  product_price: number
  quantity: number
}

type Order = {
  id: string
  order_number: number
  type: string
  status: string
  customer_name: string | null
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

export function MeuPedidoClient({ order: initialOrder, restaurant, slug }: Props) {
  const [status, setStatus] = useState(initialOrder.status)
  const supabase = createClient()

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
            setStatus(payload.new.status as string)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialOrder.id, supabase])

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending']
  const StatusIcon = config.icon
  const steps = initialOrder.type === 'delivery' ? STATUS_STEPS_DELIVERY : STATUS_STEPS_TABLE
  const currentStepIndex = steps.indexOf(status)

  return (
    <div className="min-h-screen pb-24" style={{ color: 'white' }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 sticky top-0 z-10"
        style={{ background: 'var(--menu-bg)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          {restaurant.logo_url ? (
            <Image src={restaurant.logo_url} alt={restaurant.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm"
              style={{ background: 'var(--menu-primary)' }}
            >
              {restaurant.name.charAt(0)}
            </div>
          )}
          <span className="text-white font-bold text-sm">{restaurant.name}</span>
        </div>
        <span className="text-white/40 text-sm">Pedido #{initialOrder.order_number}</span>
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
          <h1 className="text-2xl font-black text-white">{config.label}</h1>
          <p className="text-white/50 text-sm mt-2 leading-relaxed">{config.description}</p>
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
                      background: isDone || isCurrent ? config.color : 'rgba(255,255,255,0.15)',
                      transform: isCurrent ? 'scale(1.4)' : 'scale(1)',
                    }}
                  />
                  {idx < steps.length - 1 && (
                    <div
                      className="h-0.5 w-6 mx-0.5 flex-shrink-0"
                      style={{ background: isDone ? config.color : 'rgba(255,255,255,0.10)' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Itens do pedido */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <p className="text-white/40 text-xs mb-3 uppercase tracking-wide font-bold">Itens</p>
          <div className="space-y-2">
            {initialOrder.order_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--menu-primary)' }}
                  >
                    {item.quantity}
                  </span>
                  <span className="text-white/80 text-sm">{item.product_name}</span>
                </div>
                <span className="text-white/60 text-sm">{formatPrice(item.product_price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 mt-3 pt-3 flex justify-between font-black text-white">
            <span>Total</span>
            <span>{formatPrice(initialOrder.total)}</span>
          </div>
        </div>

        {/* Info do cliente */}
        {initialOrder.customer_name && (
          <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-white/40 text-xs mb-1">Nome</p>
            <p className="text-white/80 text-sm">{initialOrder.customer_name}</p>
          </div>
        )}

        {/* Redes sociais */}
        {(restaurant.instagram_url || restaurant.whatsapp_number) && (
          <div className="text-center mt-8">
            <p className="text-white/30 text-xs mb-3">Fique por dentro das novidades</p>
            <div className="flex justify-center gap-4">
              {restaurant.instagram_url && (
                <a
                  href={restaurant.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors text-sm"
                >
                  Instagram
                </a>
              )}
              {restaurant.whatsapp_number && (
                <a
                  href={`https://wa.me/${restaurant.whatsapp_number.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors text-sm"
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
              className="inline-block px-8 py-3 rounded-2xl font-bold text-white text-sm"
              style={{ background: 'var(--menu-primary)' }}
            >
              Ver cardápio
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
