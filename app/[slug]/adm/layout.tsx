import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
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

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, logo_url, is_active')
    .eq('slug', slug)
    .single()

  if (!restaurant || !restaurant.is_active) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <AdmNav
        slug={slug}
        restaurantName={restaurant.name}
        logoUrl={restaurant.logo_url}
        role="owner"
      />
      <main className="pt-14">
        {children}
      </main>
    </div>
  )
}
