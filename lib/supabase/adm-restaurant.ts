/**
 * HIVI — ADM restaurant lookup (bypasses RLS)
 *
 * ADM pages use this to look up the restaurant by slug regardless of
 * is_active status. The standard Supabase client (with user's session)
 * would block paused restaurants for staff members who only have an
 * ADM password (no Supabase OAuth session).
 *
 * Call this only after verifying the ADM token (done in the layout).
 */
import { createClient } from '@supabase/supabase-js'

function admSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Returns { id, name, plan } for any restaurant by slug, regardless of is_active. */
export async function getAdmRestaurant(slug: string) {
  const { data } = await admSupabase()
    .from('restaurants')
    .select('id, name, plan')
    .eq('slug', slug)
    .single()

  return data ?? null
}

/** Returns just the restaurant ID for pages that only need it for further queries. */
export async function getAdmRestaurantId(slug: string): Promise<string | null> {
  const restaurant = await getAdmRestaurant(slug)
  return restaurant?.id ?? null
}
