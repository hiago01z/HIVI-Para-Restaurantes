import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Países europeus → preços em EUR
const EU_COUNTRIES = new Set([
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR',
  'HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK',
  'GB','CH','NO','IS','LI','AL','BA','ME','MK','RS','UA','AM','AZ','GE',
])

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl
  const pathParts = url.pathname.split('/').filter(Boolean)

  // ── Proteger rotas HIVI (/conta, /criar-loja) ─────────────
  const saasProtected = ['/conta', '/criar-loja']
  if (!user && saasProtected.some((p) => url.pathname.startsWith(p))) {
    const loginUrl = new URL('/entrar', request.url)
    loginUrl.searchParams.set('next', url.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Nota: a proteção das rotas ADM (/[slug]/adm/**) é feita no layout.tsx
  // (Node.js runtime), não aqui no middleware (Edge Runtime), para garantir
  // que o mesmo runtime seja usado na criação e verificação do token HMAC.

  // Injeta pathname nos headers para que layouts server-side possam lê-lo
  supabaseResponse.headers.set('x-pathname', url.pathname)

  // ── Detecção de locale por IP (Vercel Edge geo) ───────────────────────────
  // Só define o cookie se o usuário ainda não escolheu manualmente (hivi_locale_manual)
  if (!request.cookies.has('hivi_locale_manual')) {
    const country = request.geo?.country ?? request.headers.get('x-vercel-ip-country') ?? ''
    const locale = EU_COUNTRIES.has(country) ? 'PT' : 'BR'
    supabaseResponse.cookies.set('hivi_locale', locale, {
      path: '/',
      maxAge: 60 * 60 * 24, // 24h — renova a cada visita
      sameSite: 'lax',
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
