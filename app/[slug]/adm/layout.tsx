import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { AdmNav } from './_components/adm-nav'
import { getContrastColor } from '@/lib/color-utils'
import { verifyAdmToken, admCookieName } from '@/lib/adm-auth'

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

  // ── Proteção ADM (Node.js runtime — mesmo runtime que o login API) ──
  // Fica aqui e não no middleware para garantir que o HMAC usa o mesmo
  // process.env.SUPABASE_SERVICE_ROLE_KEY tanto na criação quanto na
  // verificação do token.
  const pathname = (await headers()).get('x-pathname') ?? ''
  const isLoginPage = pathname.endsWith('/adm/login')

  const cookieStore = await cookies()
  const token = cookieStore.get(admCookieName(slug))?.value
  const valid = token ? await verifyAdmToken(slug, token) : false

  if (isLoginPage) {
    // Já autenticado: vai direto para o painel (sem mostrar login de novo)
    if (valid) redirect(`/${slug}/adm/pedidos`)
    // Não autenticado: renderiza só o formulário de login, sem nav ADM
    return <>{children}</>
  }

  // Página protegida: não autenticado → manda para login
  if (!valid) {
    redirect(`/${slug}/adm/login?redirect=${encodeURIComponent(pathname || `/${slug}/adm/pedidos`)}`)
  }
  // ────────────────────────────────────────────────────────────────────

  // Usa service role para bypassar RLS — o ADM deve ser acessível mesmo
  // quando is_active=false (restaurante pausado), e staff sem sessão Supabase
  // não teria permissão via políticas públicas.
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, logo_url')
    .eq('slug', slug)
    .single()

  // Restaurante não existe → 404. Acesso ADM é sempre permitido independente do status do cardápio.
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
