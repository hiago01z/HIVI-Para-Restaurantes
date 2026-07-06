import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Valida que o next é um caminho relativo seguro (previne open redirect via //evil.com)
  const nextParam = searchParams.get('next') ?? ''
  const next = (nextParam.startsWith('/') && !nextParam.startsWith('//')) ? nextParam : '/conta'

  if (code) {
    // Cria o response de redirect antes de instanciar o Supabase client,
    // para que o setAll possa setar os cookies de sessão diretamente nele.
    // Usar cookies() do next/headers não propaga cookies para NextResponse.redirect().
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
  } else {
    console.error('[auth/callback] sem code na URL — params:', Object.fromEntries(searchParams))
  }

  return NextResponse.redirect(`${origin}/entrar?error=auth`)
}
