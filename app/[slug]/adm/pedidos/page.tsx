import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PedidosClient } from './_pedidos-client'
import { getAdmRestaurantId } from '@/lib/supabase/adm-restaurant'

type Periodo = 'hoje' | 'ontem' | '7dias'

function getDateRange(periodo: Periodo): { start: Date; end: Date; isToday: boolean } {
  const now = new Date()

  const startOfDay = (d: Date) => {
    const r = new Date(d); r.setHours(0, 0, 0, 0); return r
  }
  const endOfDay = (d: Date) => {
    const r = new Date(d); r.setHours(23, 59, 59, 999); return r
  }

  switch (periodo) {
    case 'ontem': {
      const d = new Date(now); d.setDate(now.getDate() - 1)
      return { start: startOfDay(d), end: endOfDay(d), isToday: false }
    }
    case '7dias': {
      const d = new Date(now); d.setDate(now.getDate() - 6)
      return { start: startOfDay(d), end: endOfDay(now), isToday: false }
    }
    case 'hoje':
    default:
      return { start: startOfDay(now), end: endOfDay(now), isToday: true }
  }
}

export default async function PedidosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ periodo?: string }>
}) {
  const { slug } = await params
  const { periodo: periodoParam } = await searchParams
  const periodo: Periodo = (periodoParam as Periodo) ?? 'hoje'

  const restaurantId = await getAdmRestaurantId(slug)
  if (!restaurantId) notFound()

  const restaurant = { id: restaurantId }
  const supabase = await createClient()

  const { start, end, isToday } = getDateRange(periodo)

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      type,
      status,
      customer_name,
      customer_phone,
      address,
      table_number,
      payment_method,
      change_for,
      notes,
      total,
      created_at,
      order_items (
        id,
        product_name,
        product_price,
        quantity
      )
    `)
    .eq('restaurant_id', restaurant.id)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: false })

  return (
    <PedidosClient
      restaurantId={restaurant.id}
      initialOrders={orders ?? []}
      isToday={isToday}
      slug={slug}
      activePeriodo={periodo}
    />
  )
}
