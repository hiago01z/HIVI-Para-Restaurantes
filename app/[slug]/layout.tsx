import { createClient } from '@/lib/supabase/server'
import { CartProvider } from '@/contexts/cart-context'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PreviewListener } from './_components/preview-listener'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('restaurants')
    .select('name')
    .eq('slug', slug)
    .single()
  return {
    title: data?.name ?? 'Cardápio',
  }
}

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
    .select('primary_color, secondary_color, background_color, font_family, font_size_base, text_color, icon_color')
    .eq('restaurant_id', restaurant.id)
    .single()

  const primary    = theme?.primary_color    ?? '#FF6B00'
  const secondary  = theme?.secondary_color  ?? '#1A0A00'
  const bg         = theme?.background_color ?? '#2C1A0E'
  const textColor  = theme?.text_color       ?? '#FFFFFF'
  const iconColor  = theme?.icon_color       ?? primary   // fallback = primary
  const fontSize   = theme?.font_size_base   ?? '16px'

  // Mapeia font_family genérica para web fonts carregadas no root layout
  const rawFont    = theme?.font_family ?? 'serif'
  const fontMap: Record<string, string> = {
    'serif':      "'Playfair Display', Georgia, serif",
    'sans-serif': "var(--font-sans, 'Inter', system-ui, sans-serif)",
    'monospace':  "'Courier New', monospace",
    'cursive':    "Georgia, 'Playfair Display', cursive",
  }
  const font = fontMap[rawFont] ?? rawFont

  const cssVars = [
    `--menu-primary: ${primary}`,
    `--menu-secondary: ${secondary}`,
    `--menu-bg: ${bg}`,
    `--menu-font: ${font}`,
    `--menu-font-size: ${fontSize}`,
    `--menu-text: ${textColor}`,
    `--menu-text-muted: ${textColor}99`,           // 60% opacity da cor do texto
    `--menu-icon: ${iconColor}`,
    `--menu-card: color-mix(in srgb, ${bg} 70%, ${textColor} 8%)`,
  ].join('; ')

  return (
    <div id="menu-root" style={{ background: bg, fontFamily: font, fontSize, minHeight: '100vh', color: textColor }}>
      <style>{`:root { ${cssVars} }`}</style>
      <PreviewListener />
      <CartProvider slug={slug}>
        {children}
      </CartProvider>
    </div>
  )
}
