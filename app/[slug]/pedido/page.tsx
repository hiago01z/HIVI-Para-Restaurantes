import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PedidoClient } from './_pedido-client'
import { DEFAULT_DELIVERY_HOURS, type DeliveryHoursConfig } from '@/lib/delivery-hours'

export default async function PedidoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, is_active, delivery_enabled, delivery_hours')
    .eq('slug', slug)
    .single()

  if (!restaurant || !restaurant.is_active) notFound()

  const deliveryHours: DeliveryHoursConfig =
    (restaurant.delivery_hours as DeliveryHoursConfig | null) ?? DEFAULT_DELIVERY_HOURS

  return (
    <PedidoClient
      slug={slug}
      restaurantId={restaurant.id}
      deliveryEnabled={(restaurant.delivery_enabled as boolean | null) ?? true}
      deliveryHours={deliveryHours}
    />
  )
}
