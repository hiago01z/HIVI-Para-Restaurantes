import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { AdmMasterClient } from './_adm-master-client'

const OWNER_EMAIL = 'hiagoalmeida852@gmail.com'

export default async function AdmMasterPage() {
  // ── Autenticação: apenas o dono da HIVI ────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== OWNER_EMAIL) redirect('/')

  // ── Dados via service role (lê tudo sem RLS) ───────────────────────────────
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurants } = await service
    .from('restaurants')
    .select(`
      id, name, slug, plan, is_active, created_at, trial_ends_at,
      delivery_enabled, whatsapp_notify_enabled, currency
    `)
    .order('created_at', { ascending: false })

  if (!restaurants) redirect('/')

  // ── Métricas por restaurante ───────────────────────────────────────────────
  const ids = restaurants.map((r) => r.id)

  const [
    { data: productCounts },
    { data: orderCounts },
    { data: staffCounts },
  ] = await Promise.all([
    service
      .from('products')
      .select('restaurant_id')
      .in('restaurant_id', ids),
    service
      .from('orders')
      .select('restaurant_id, created_at')
      .in('restaurant_id', ids)
      .order('created_at', { ascending: false }),
    service
      .from('restaurant_users')
      .select('restaurant_id')
      .in('restaurant_id', ids),
  ])

  type RestaurantRow = {
    id: string
    name: string
    slug: string
    plan: string | null
    is_active: boolean | null
    created_at: string
    trial_ends_at: string | null
    delivery_enabled: boolean | null
    whatsapp_notify_enabled: boolean | null
    currency: string | null
  }

  // Agrega as contagens por restaurant_id
  function countBy(rows: { restaurant_id: string }[] | null) {
    const map: Record<string, number> = {}
    for (const r of rows ?? []) {
      map[r.restaurant_id] = (map[r.restaurant_id] ?? 0) + 1
    }
    return map
  }

  const prodMap   = countBy(productCounts as { restaurant_id: string }[] | null)
  const orderMap  = countBy(orderCounts  as { restaurant_id: string }[] | null)
  const staffMap  = countBy(staffCounts  as { restaurant_id: string }[] | null)

  // Última ordem por restaurante
  const lastOrderMap: Record<string, string> = {}
  for (const o of (orderCounts ?? []) as { restaurant_id: string; created_at: string }[]) {
    if (!lastOrderMap[o.restaurant_id]) lastOrderMap[o.restaurant_id] = o.created_at
  }

  const enriched = (restaurants as RestaurantRow[]).map((r) => ({
    ...r,
    pratos:     prodMap[r.id]  ?? 0,
    pedidos:    orderMap[r.id] ?? 0,
    staff:      staffMap[r.id] ?? 0,
    last_order: lastOrderMap[r.id] ?? null,
  }))

  // ── Totais globais ─────────────────────────────────────────────────────────
  const totals = {
    total:   enriched.length,
    free:    enriched.filter((r) => r.plan === 'free').length,
    basic:   enriched.filter((r) => r.plan === 'basic').length,
    pro:     enriched.filter((r) => r.plan === 'pro').length,
    active:  enriched.filter((r) => r.is_active).length,
    pedidos: (orderCounts ?? []).length,
    pratos:  (productCounts ?? []).length,
  }

  return <AdmMasterClient restaurants={enriched} totals={totals} />
}
