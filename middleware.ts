import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { verifyAdmToken, admCookieName } from '@/lib/adm-auth'

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

  // ── Proteger rotas ADM (/[slug]/adm/**) ───────────────────
  const isAdmRoute = pathParts.length >= 2 && pathParts[1] === 'adm'
  const isAdmLogin = pathParts[2] === 'login'
  const isAdmQr = pathParts[2] === 'qr'
  const isAdmApiLogin = url.pathname.startsWith('/api/adm/')

  if (isAdmRoute && !isAdmLogin && !isAdmQr && !isAdmApiLogin) {
    const slug = pathParts[0]
    const cookieName = admCookieName(slug)
    const token = request.cookies.get(cookieName)?.value

    const valid = token ? await verifyAdmToken(slug, token) : false

    if (!valid) {
      const loginUrl = new URL(`/${slug}/adm/login`, request.url)
      loginUrl.searchParams.set('redirect', url.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Injeta pathname nos headers para que layouts server-side possam lê-lo
  supabaseResponse.headers.set('x-pathname', url.pathname)

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
