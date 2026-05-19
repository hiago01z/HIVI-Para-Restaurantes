import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function CardapioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, is_active, instagram_url, whatsapp_number')
    .eq('slug', slug)
    .single()

  if (!restaurant || !restaurant.is_active) notFound()

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b">
        <span className="text-xl font-bold">{restaurant.name}</span>
      </header>
      <div className="p-4">
        <p className="text-muted-foreground">Cardápio em construção.</p>
      </div>
    </main>
  )
}
