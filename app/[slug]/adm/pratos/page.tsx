import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { PratosClient } from './_pratos-client'
import { getAdmRestaurantId } from '@/lib/supabase/adm-restaurant'
import { getEffectiveLimits } from '@/lib/plan-limits'
import type { SupportedCurrency } from '@/lib/currency'

export default async function PratosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const restaurantId = await getAdmRestaurantId(slug)
  if (!restaurantId) notFound()

  const restaurant = { id: restaurantId }
  const supabase = await createClient()
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: products }, { data: categories }, { data: restaurantData }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, description, price, image_url, is_featured, is_available, category_id, created_at')
      .eq('restaurant_id', restaurant.id)
      .order('name'),
    supabase
      .from('categories')
      .select('id, name')
      .eq('restaurant_id', restaurant.id)
      .order('display_order'),
    serviceSupabase
      .from('restaurants')
      .select('id, plan, trial_ends_at, currency')
      .eq('id', restaurant.id)
      .single(),
  ])

  const limits = getEffectiveLimits(
    (restaurantData?.plan ?? 'free') as 'free' | 'basic' | 'pro',
    restaurantData?.trial_ends_at
  )

  // Auto-pause produtos em excesso (soft lock ao expirar trial)
  if (limits.maxProducts !== null && (products?.length ?? 0) > limits.maxProducts) {
    const sorted = [...(products ?? [])].sort((a, b) =>
      new Date((b as { created_at?: string }).created_at ?? 0).getTime() -
      new Date((a as { created_at?: string }).created_at ?? 0).getTime()
    )
    const excess = sorted.slice(limits.maxProducts)
    if (excess.length > 0) {
      await serviceSupabase.from('products')
        .update({ is_available: false })
        .in('id', excess.map((p) => p.id))
    }
  }

  return (
    <PratosClient
      restaurantId={restaurant.id}
      initialProducts={products ?? []}
      categories={categories ?? []}
      limits={limits}
      plan={restaurantData?.plan ?? 'free'}
      trialEndsAt={restaurantData?.trial_ends_at ?? null}
      currency={((restaurantData as Record<string, unknown>)?.currency as SupportedCurrency | undefined) ?? 'BRL'}
    />
  )
}
