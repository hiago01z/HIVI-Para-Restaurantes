import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MeuPedidoClient } from './_meu-pedido-client'

export default async function MeuPedidoPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      type,
      status,
      customer_name,
      total,
      created_at,
      restaurant_id,
      order_items (
        id,
        product_name,
        product_price,
        quantity
      )
    `)
    .eq('id', id)
    .single()

  if (!order) notFound()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, instagram_url, whatsapp_number')
    .eq('id', order.restaurant_id)
    .single()

  if (!restaurant || restaurant.slug !== slug) notFound()

  return (
    <MeuPedidoClient
      order={order}
      restaurant={restaurant}
      slug={slug}
    />
  )
}
