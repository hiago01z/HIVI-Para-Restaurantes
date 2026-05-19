import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdmNav } from './_components/adm-nav'

export default async function AdmLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${slug}/adm/login`)
  }

  // Buscar restaurante pelo slug
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, logo_url, is_active')
    .eq('slug', slug)
    .single()

  if (!restaurant || !restaurant.is_active) {
    redirect('/')
  }

  // Verificar se o usuário pertence ao restaurante
  const { data: restaurantUser } = await supabase
    .from('restaurant_users')
    .select('id, role')
    .eq('restaurant_id', restaurant.id)
    .eq('user_id', user.id)
    .single()

  if (!restaurantUser) {
    redirect(`/${slug}/adm/login`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdmNav
        slug={slug}
        restaurantName={restaurant.name}
        logoUrl={restaurant.logo_url}
        role={restaurantUser.role}
      />
      <main className="pt-14">
        {children}
      </main>
    </div>
  )
}
