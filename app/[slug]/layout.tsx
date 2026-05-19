import { createClient } from '@/lib/supabase/server'
import { CartProvider } from '@/contexts/cart-context'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { PreviewListener } from './_components/preview-listener'
import { PausedPage } from './_components/paused-page'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('restaurants')
    .select('name, logo_url')
    .eq('slug', slug)
    .single()

  const name   = data?.name    ?? 'Cardápio'
  const logo   = data?.logo_url ?? null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hivi-web.com'

  return {
    title: name,
    description: `Acesse o cardápio de ${name} e faça seu pedido online.`,
    openGraph: {
      title:       name,
      description: `Acesse o cardápio de ${name} e faça seu pedido online.`,
      url:         `${appUrl}/${slug}`,
      siteName:    'HIVI',
      locale:      'pt_BR',
      type:        'website',
      ...(logo ? { images: [{ url: logo, width: 512, height: 512, alt: name }] } : {}),
    },
    twitter: {
      card:        'summary',
      title:       name,
      description: `Acesse o cardápio de ${name} e faça seu pedido online.`,
      ...(logo ? { images: [logo] } : {}),
    },
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
    .select('id, name, logo_url, is_active')
    .eq('slug', slug)
    .single()

  if (!restaurant) notFound()

  // Se o restaurante estiver pausado, verifica se é rota ADM (dono ainda precisa acessar)
  if (!restaurant.is_active) {
    const hdrs = await headers()
    const pathname = hdrs.get('x-pathname') ?? ''
    const isAdmPath = pathname.split('/').filter(Boolean).includes('adm')

    if (!isAdmPath) {
      return <PausedPage name={restaurant.name} logoUrl={restaurant.logo_url} />
    }
  }

  const { data: theme } = await supabase
    .from('restaurant_themes')
    .select('primary_color, secondary_color, background_color, font_family, font_size_base, text_color, icon_color')
    .eq('restaurant_id', restaurant.id)
    .single()

  const primary    = theme?.primary_color    ?? '#FF6B00'
  const secondary  = theme?.secondary_color  ?? '#1A0A00'
  const bg         = theme?.background_color ?? '#2C1A0E'
  const textColor  = theme?.text_color       ?? '#FFFFFF'
  const iconColor  = theme?.icon_color       ?? primary
  const fontSize   = theme?.font_size_base   ?? '16px'

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
    `--menu-text-muted: ${textColor}99`,
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
