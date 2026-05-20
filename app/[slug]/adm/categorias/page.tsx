import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CategoriasClient } from './_categorias-client'
import { getAdmRestaurantId } from '@/lib/supabase/adm-restaurant'

export default async function CategoriasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const restaurantId = await getAdmRestaurantId(slug)
  if (!restaurantId) notFound()

  const restaurant = { id: restaurantId }
  const supabase = await createClient()

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
