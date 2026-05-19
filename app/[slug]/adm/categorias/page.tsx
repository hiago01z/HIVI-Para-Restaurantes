import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CategoriasClient } from './_categorias-client'

export default async function CategoriasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!restaurant) notFound()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, image_url, display_order')
    .eq('restaurant_id', restaurant.id)
    .order('display_order', { ascending: true })

  return (
    <CategoriasClient
      restaurantId={restaurant.id}
      initialCategories={categories ?? []}
    />
  )
}
