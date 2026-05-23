import { createClient as createServiceClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { AdmNav } from './_components/adm-nav'
import { AlreadyLoggedIn } from './login/_already-logged-in'
import { getContrastColor } from '@/lib/color-utils'
import { getAdmTokenPayload, admCookieName } from '@/lib/adm-auth'
import { getEffectiveLimits } from '@/lib/plan-limits'

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
  const pathname = (await headers()).get('x-pathname') ?? ''
  const isLoginPage = pathname.endsWith('/adm/login')

  const cookieStore = await cookies()
  const token = cookieStore.get(admCookieName(slug))?.value
  const payload = token ? await getAdmTokenPayload(slug, token) : null
  const valid = payload !== null

  if (isLoginPage) {
    // Não autenticado: renderiza só o formulário de login, sem nav ADM.
    if (!valid) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: '#111827', zIndex: 50, overflowY: 'auto' }}>
          {children}
        </div>
      )
    }

    // Já autenticado: mostra quem está logado com opção de continuar ou trocar
    const ROLE_LABEL: Record<string, string> = {
      owner: 'Dono', manager: 'Gerente', cook: 'Cozinheiro',
      waiter: 'Garçom', delivery: 'Entregador',
    }
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#111827', zIndex: 50, overflowY: 'auto' }}>
        <AlreadyLoggedIn
          slug={slug}
          memberName={payload!.name}
          roleLabel={ROLE_LABEL[payload!.role] ?? payload!.role}
          panelUrl={`/${slug}/adm/pedidos`}
        />
      </div>
    )
  }

  // Página protegida: não autenticado → manda para login
  if (!valid) {
    redirect(`/${slug}/adm/login?redirect=${encodeURIComponent(pathname || `/${slug}/adm/pedidos`)}`)
  }

  // Usa service role para bypassar RLS — o ADM deve ser acessível mesmo
  // quando is_active=false (restaurante pausado)
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, logo_url, plan, trial_ends_at')
    .eq('slug', slug)
    .single()

  if (!restaurant) notFound()

  // Verifica session_id para single-device (apenas planos free ou trial expirado)
  const limits = getEffectiveLimits(
    (restaurant.plan ?? 'free') as 'free' | 'basic' | 'pro',
    restaurant.trial_ends_at
  )
  if (limits.singleDevice && payload!.sessionId) {
    const { data: memberData } = await supabase
      .from('restaurant_users')
      .select('session_id')
      .eq('id', payload!.memberId)
      .single()
    if (memberData?.session_id !== payload!.sessionId) {
      redirect(`/${slug}/adm/login?reason=session_expired`)
    }
  }

  const { data: theme } = await supabase
    .from('restaurant_themes')
    .select('primary_color')
    .eq('restaurant_id', restaurant.id)
    .single()

  const primary       = theme?.primary_color ?? '#FF6B00'
  const textOnPrimary = getContrastColor(primary)

  const admCssVars = [
    `--adm-primary: ${primary}`,
    `--adm-primary-light: ${primary}18`,
    `--adm-primary-muted: ${primary}30`,
    `--adm-text-on-primary: ${textOnPrimary}`,
    '--menu-bg: #f9fafb',
    '--menu-text: #111827',
    '--menu-text-muted: #6b7280',
    '--menu-primary: ' + primary,
  ].join('; ')

  return (
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
        memberRole={payload!.role}
        memberName={payload!.name}
        plan={(restaurant.plan ?? 'free') as 'free' | 'basic' | 'pro'}
        trialEndsAt={restaurant.trial_ends_at ?? null}
      />
      <main className="pt-14">
        {children}
      </main>
    </div>
  )
}
