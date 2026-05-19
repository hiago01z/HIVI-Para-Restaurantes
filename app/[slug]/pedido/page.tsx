import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PedidoClient } from './_pedido-client'

export default async function PedidoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, is_active')
    .eq('slug', slug)
    .single()

  if (!restaurant || !restaurant.is_active) notFound()

  return <PedidoClient slug={slug} restaurantId={restaurant.id} />
}
