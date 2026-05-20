import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { ConfiguracoesClient } from './_configuracoes-client'

export default async function ConfiguracoesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Usa service role para bypassar RLS — ADM deve funcionar mesmo quando pausado
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurant } = await serviceSupabase
    .from('restaurants')
    .select('id, name, slug, logo_url, instagram_url, whatsapp_number, is_active')
    .eq('slug', slug)
    .single()

  if (!restaurant) notFound()

  // is_active disponível diretamente na query acima
  const activeData = { is_active: restaurant.is_active as boolean | null }
  const supabase = await createClient()

  const { data: theme } = await supabase
    .from('restaurant_themes')
    .select('primary_color, secondary_color, background_color, font_family, font_size_base, banner_url, text_color, icon_color, label_font, label_color, label_effect, label_stroke_color, label_stroke_size, label_offset_distance, label_offset_angle')
    .eq('restaurant_id', restaurant.id)
    .single()

  // Usa service role para restaurant_users — a policy pública restringe por user_id = auth.uid()
  // então staff sem sessão Supabase veriam 0 membros
  const { data: staff } = await serviceSupabase
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
        is_active: activeData?.is_active ?? true,
      }}
      theme={{
        primary_color:        theme?.primary_color        ?? '#FF6B00',
        secondary_color:      theme?.secondary_color      ?? '#1A0A00',
        background_color:     theme?.background_color     ?? '#2C1A0E',
        font_family:          theme?.font_family          ?? 'serif',
        font_size_base:       theme?.font_size_base       ?? '16px',
        banner_url:           theme?.banner_url           ?? null,
        text_color:           theme?.text_color           ?? '#FFFFFF',
        icon_color:           theme?.icon_color           ?? '#FF6B00',
        label_font:           theme?.label_font           ?? 'dancing-script',
        label_color:          theme?.label_color          ?? '#ffffff',
        label_effect:         theme?.label_effect         ?? 'offset',
        label_stroke_color:   theme?.label_stroke_color   ?? '#000000',
        label_stroke_size:    (theme?.label_stroke_size   ?? 50) as number,
        label_offset_distance:(theme?.label_offset_distance ?? 50) as number,
        label_offset_angle:   (theme?.label_offset_angle  ?? -45) as number,
      }}
      staffCount={staff?.length ?? 0}
    />
  )
}
