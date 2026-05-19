import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PedidosClient } from './_pedidos-client'

export default async function PedidosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!restaurant) notFound()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

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
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })

  return (
    <PedidosClient
      restaurantId={restaurant.id}
      initialOrders={orders ?? []}
    />
  )
}
