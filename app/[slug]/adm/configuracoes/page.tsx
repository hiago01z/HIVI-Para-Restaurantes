import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ConfiguracoesClient } from './_configuracoes-client'

export default async function ConfiguracoesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, instagram_url, whatsapp_number')
    .eq('slug', slug)
    .single()

  if (!restaurant) notFound()

  const { data: theme } = await supabase
    .from('restaurant_themes')
    .select('primary_color, secondary_color, background_color, font_family, banner_url, text_color, icon_color')
    .eq('restaurant_id', restaurant.id)
    .single()

  const { data: staff } = await supabase
    .from('restaurant_users')
    .select('id, role, user_id')
    .eq('restaurant_id', restaurant.id)

  return (
    <ConfiguracoesClient
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logo_url: restaurant.logo_url,
        instagram_url: restaurant.instagram_url,
        whatsapp_number: restaurant.whatsapp_number,
      }}
      theme={theme ?? {
        primary_color: '#FF6B00',
        secondary_color: '#1A0A00',
        background_color: '#2C1A0E',
        font_family: 'serif',
        banner_url: null,
        text_color: '#FFFFFF',
        icon_color: '#FF6B00',
      }}
      staffCount={staff?.length ?? 0}
    />
  )
}
