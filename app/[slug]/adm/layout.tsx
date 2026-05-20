import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AdmNav } from './_components/adm-nav'
import { getContrastColor } from '@/lib/color-utils'

// Força busca no servidor a cada navegação — impede que o Next.js
// sirva páginas ADM do cache client-side após logout.
export const dynamic = 'force-dynamic'

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

  // Restaurante não existe → 404. Se pausado, ainda permite acesso ADM (dono precisa reativar).
  if (!restaurant) notFound()

  // Buscar cor primária do restaurante para usar como accent no ADM
  const { data: theme } = await supabase
    .from('restaurant_themes')
    .select('primary_color')
    .eq('restaurant_id', restaurant.id)
    .single()

  const primary         = theme?.primary_color ?? '#FF6B00'
  const textOnPrimary   = getContrastColor(primary)

  // Variáveis CSS do ADM — reseta completamente o tema do cardápio público
  // e injeta apenas a cor primária do restaurante como accent
  const admCssVars = [
    `--adm-primary: ${primary}`,
    `--adm-primary-light: ${primary}18`,
    `--adm-primary-muted: ${primary}30`,
    `--adm-text-on-primary: ${textOnPrimary}`,
    // Reset das vars do cardápio para garantir contraste no ADM
    '--menu-bg: #f9fafb',
    '--menu-text: #111827',
    '--menu-text-muted: #6b7280',
    '--menu-primary: ' + primary,
  ].join('; ')

  return (
    // Reset total: fundo claro, texto escuro, fonte do sistema
    <div
      style={{
        background: '#f9fafb',
        color: '#111827',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        minHeight: '100vh',
      }}
    >
      <style>{`:root { ${admCssVars} }`}</style>
      <AdmNav
        slug={slug}
        restaurantName={restaurant.name}
        logoUrl={restaurant.logo_url}
        primaryColor={primary}
      />
      <main className="pt-14">
        {children}
      </main>
    </div>
  )
}
