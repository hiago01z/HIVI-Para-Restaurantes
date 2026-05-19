import { createClient } from '@/lib/supabase/server'
import { CartProvider } from '@/contexts/cart-context'
import { notFound } from 'next/navigation'

export default async function SlugLayout({
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
    .select('id, is_active')
    .eq('slug', slug)
    .single()

  if (!restaurant || !restaurant.is_active) notFound()

  const { data: theme } = await supabase
    .from('restaurant_themes')
    .select('primary_color, secondary_color, background_color, font_family')
    .eq('restaurant_id', restaurant.id)
    .single()

  const primary = theme?.primary_color ?? '#FF6B00'
  const secondary = theme?.secondary_color ?? '#1A0A00'
  const bg = theme?.background_color ?? '#2C1A0E'
  const font = theme?.font_family ?? 'serif'

  const cssVars = [
    `--menu-primary: ${primary}`,
    `--menu-secondary: ${secondary}`,
    `--menu-bg: ${bg}`,
    `--menu-card: color-mix(in srgb, ${bg} 60%, white 10%)`,
    `--menu-font: ${font}`,
  ].join('; ')

  return (
    <div style={{ background: bg, fontFamily: font, minHeight: '100vh' }}>
      <style>{`:root { ${cssVars} }`}</style>
      <CartProvider slug={slug}>
        {children}
      </CartProvider>
    </div>
  )
}
