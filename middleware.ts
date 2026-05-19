import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
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

  // Proteger rotas /[slug]/adm/**
  const isAdmRoute = pathParts.length >= 2 && pathParts[1] === 'adm'
  const isQrRoute = pathParts[2] === 'qr'
  const isLoginRoute = pathParts[2] === 'login'

  if (isAdmRoute && !isQrRoute && !isLoginRoute) {
    if (!user) {
      const slug = pathParts[0]
      const loginUrl = new URL(`/${slug}/adm/login`, request.url)
      loginUrl.searchParams.set('redirect', url.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verificar se o usuário pertence ao restaurante
    const slug = pathParts[0]
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (restaurant) {
      const { data: restaurantUser } = await supabase
        .from('restaurant_users')
        .select('id, role')
        .eq('restaurant_id', restaurant.id)
        .eq('user_id', user.id)
        .single()

      if (!restaurantUser) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
