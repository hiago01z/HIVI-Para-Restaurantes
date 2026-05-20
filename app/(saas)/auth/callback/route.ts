import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Valida que o next é um caminho relativo seguro (previne open redirect via //evil.com)
  const nextParam = searchParams.get('next') ?? ''
  const next = (nextParam.startsWith('/') && !nextParam.startsWith('//')) ? nextParam : '/conta'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/entrar?error=auth`)
}
