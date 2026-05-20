import { createClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyAdmToken, admCookieName } from '@/lib/adm-auth'
import { FuncionariosClient } from './_funcionarios-client'

export default async function FuncionariosPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get(admCookieName(slug))?.value

  if (!token || !(await verifyAdmToken(slug, token))) {
    redirect(`/${slug}/adm/login`)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!restaurant) notFound()

  const { data: members } = await supabase
    .from('restaurant_users')
    .select('id, role, name, adm_password_hash, created_at, user_id')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: true })

  // Enriquecer com dados do Supabase Auth (email, avatar, nome Google)
  const enriched = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data: { user } } = await supabase.auth.admin.getUserById(m.user_id)
      return {
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        name: m.name ?? null,
        auth_name: (user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null) as string | null,
        created_at: m.created_at,
        email: user?.email ?? '—',
        avatar_url: (user?.user_metadata?.avatar_url ?? null) as string | null,
        has_adm_password: !!m.adm_password_hash,
      }
    })
  )

  return <FuncionariosClient slug={slug} initialMembers={enriched} />
}
