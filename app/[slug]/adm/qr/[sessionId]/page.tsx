import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { QrConfirmClient } from './_qr-confirm-client'

export default async function QrConfirmPage({
  params,
}: {
  params: Promise<{ slug: string; sessionId: string }>
}) {
  const { slug, sessionId } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('qr_sessions')
    .select('id, restaurant_id, order_data, confirmed, expires_at')
    .eq('id', sessionId)
    .single()

  if (!session) notFound()

  // Verificar que o restaurante corresponde ao slug
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug')
    .eq('id', session.restaurant_id)
    .single()

  if (!restaurant || restaurant.slug !== slug) notFound()

  const expired = new Date(session.expires_at) < new Date()

  return (
    <QrConfirmClient
      session={{
        id: session.id,
        confirmed: session.confirmed,
        expired,
        orderData: session.order_data as {
          items: { product_id: string; product_name: string; product_price: number; quantity: number }[]
          total: number
        },
      }}
      restaurantName={restaurant.name}
    />
  )
}
