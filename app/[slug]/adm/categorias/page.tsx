import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { CategoriasClient } from './_categorias-client'
import { getAdmRestaurantId } from '@/lib/supabase/adm-restaurant'
import { getEffectiveLimits } from '@/lib/plan-limits'

export default async function CategoriasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const restaurantId = await getAdmRestaurantId(slug)
  if (!restaurantId) notFound()

  const restaurant = { id: restaurantId }
  const supabase = await createClient()
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: categories }, { data: restaurantData }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, image_url, display_order')
      .eq('restaurant_id', restaurant.id)
      .order('display_order', { ascending: true }),
    serviceSupabase
      .from('restaurants')
      .select('id, plan, trial_ends_at')
      .eq('id', restaurant.id)
      .single(),
  ])

  const limits = getEffectiveLimits(
    (restaurantData?.plan ?? 'free') as 'free' | 'basic' | 'pro',
    restaurantData?.trial_ends_at
  )

  return (
    <CategoriasClient
      restaurantId={restaurant.id}
      initialCategories={categories ?? []}
      limits={limits}
      plan={restaurantData?.plan ?? 'free'}
      trialEndsAt={restaurantData?.trial_ends_at ?? null}
    />
  )
}
