import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PratosClient } from './_pratos-client'

export default async function PratosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!restaurant) notFound()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, description, price, image_url, is_featured, is_available, category_id')
      .eq('restaurant_id', restaurant.id)
      .order('name'),
    supabase
      .from('categories')
      .select('id, name')
      .eq('restaurant_id', restaurant.id)
      .order('display_order'),
  ])

  return (
    <PratosClient
      restaurantId={restaurant.id}
      initialProducts={products ?? []}
      categories={categories ?? []}
    />
  )
}
