import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ConfiguracoesClient } from './_configuracoes-client'
import { DEFAULT_DELIVERY_HOURS, type DeliveryHoursConfig } from '@/lib/delivery-hours'
import { getAdmTokenPayload, admCookieName } from '@/lib/adm-auth'
import type { PixKeyType } from '@/lib/pix'
import type { SupportedCurrency } from '@/lib/currency'

export default async function ConfiguracoesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Usa service role para bypassar RLS — ADM deve funcionar mesmo quando pausado
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Lê role do token ADM para controle de acesso no client
  const cookieStore = await cookies()
  const token = cookieStore.get(admCookieName(slug))?.value
  const admPayload = token ? await getAdmTokenPayload(slug, token) : null
  const currentRole = admPayload?.role ?? 'waiter'

  const { data: restaurant } = await serviceSupabase
    .from('restaurants')
    .select('id, name, slug, logo_url, instagram_url, whatsapp_number, whatsapp_notify_enabled, is_active, delivery_enabled, delivery_hours, pix_key, pix_key_type, currency, delivery_fee, address, address_url, table_order_auto_approve')
    .eq('slug', slug)
    .single()

  if (!restaurant) notFound()

  const whatsappNotifyEnabled = (restaurant.whatsapp_notify_enabled as boolean | null) ?? true

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
      currentRole={currentRole}
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logo_url: restaurant.logo_url,
        instagram_url: restaurant.instagram_url,
        whatsapp_number: restaurant.whatsapp_number,
        whatsapp_notify_enabled: whatsappNotifyEnabled,
        is_active: activeData?.is_active ?? true,
        delivery_enabled: (restaurant.delivery_enabled as boolean | null) ?? true,
        delivery_hours: (restaurant.delivery_hours as DeliveryHoursConfig | null) ?? DEFAULT_DELIVERY_HOURS,
        pix_key: (restaurant.pix_key as string | null) ?? null,
        pix_key_type: (restaurant.pix_key_type as PixKeyType | null) ?? null,
        currency: ((restaurant.currency as SupportedCurrency | null) ?? 'BRL'),
        delivery_fee: (restaurant.delivery_fee as number | null) ?? 0,
        address: (restaurant.address as string | null) ?? null,
        address_url: (restaurant.address_url as string | null) ?? null,
        table_order_auto_approve: (restaurant.table_order_auto_approve as boolean | null) ?? false,
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
