import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
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

  // Usa service role para verificar o slug do restaurante, independente de is_active.
  // O QR code pode ser escaneado mesmo quando o restaurante está pausado.
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: restaurant } = await serviceSupabase
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
