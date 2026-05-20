import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  // Valida que o next é um caminho relativo seguro (previne open redirect via //evil.com)
  const nextParam = searchParams.get('next') ?? ''
  const next = (nextParam.startsWith('/') && !nextParam.startsWith('//')) ? nextParam : '/conta'

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=${next}`,
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/entrar?error=oauth`)
  }

  return NextResponse.redirect(data.url)
}
