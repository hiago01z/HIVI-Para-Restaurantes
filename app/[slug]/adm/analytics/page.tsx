import { notFound } from 'next/navigation'
import { getAdmRestaurant } from '@/lib/supabase/adm-restaurant'
import { createClient } from '@supabase/supabase-js'
import { AnalyticsClient } from './_analytics-client'
import { getEffectiveLimits } from '@/lib/plan-limits'
import type { SupportedCurrency } from '@/lib/currency'

function admSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const restaurant = await getAdmRestaurant(slug)
  if (!restaurant) notFound()

  // Gating: somente plano Pro ou em trial
  const limits = getEffectiveLimits(
    (restaurant.plan ?? 'free') as 'free' | 'basic' | 'pro',
    restaurant.trial_ends_at
  )
  if (!limits.analyticsEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-5 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-5">
          <span className="text-3xl">📊</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Analytics é exclusivo do Plano Pro</h1>
        <p className="text-gray-500 max-w-sm mb-6 leading-relaxed">
          Gráficos de receita, produtos mais vendidos, horário de pico e exportação CSV — tudo em um só lugar.
        </p>
        <a
          href="/conta"
          className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
        >
          Fazer upgrade para o Pro →
        </a>
      </div>
    )
  }

  const supabase = admSupabase()

  // Últimos 30 dias
  const since = new Date()
  since.setDate(since.getDate() - 29)
  since.setHours(0, 0, 0, 0)

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      type,
      status,
      total,
      created_at,
      order_items (
        product_name,
        product_price,
        quantity,
        selected_options
      )
    `)
    .eq('restaurant_id', restaurant.id)
    .neq('status', 'cancelled')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  const currency = ((restaurant as Record<string, unknown>).currency as SupportedCurrency | undefined) ?? 'BRL'

  return (
    <AnalyticsClient
      slug={slug}
      restaurantName={restaurant.name}
      orders={(orders ?? []) as Parameters<typeof AnalyticsClient>[0]['orders']}
      since={since.toISOString()}
      currency={currency}
    />
  )
}
