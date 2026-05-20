import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DashboardClient } from './_components/dashboard-client'
import { getAdmRestaurant } from '@/lib/supabase/adm-restaurant'

export default async function AdmDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const restaurant = await getAdmRestaurant(slug)
  if (!restaurant) notFound()

  const supabase = await createClient()

  // Pedidos de hoje
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: todayOrders } = await supabase
    .from('orders')
    .select('id, order_number, type, status, customer_name, total, created_at')
    .eq('restaurant_id', restaurant.id)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })

  // Total de pratos e categorias
  const [{ count: totalProducts }, { count: totalCategories }] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id),
    supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id),
  ])

  return (
    <DashboardClient
      slug={slug}
      restaurantName={restaurant.name}
      todayOrders={(todayOrders ?? []) as Parameters<typeof DashboardClient>[0]['todayOrders']}
      totalProducts={totalProducts ?? 0}
      totalCategories={totalCategories ?? 0}
    />
  )
}
