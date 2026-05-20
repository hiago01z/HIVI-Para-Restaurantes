import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
