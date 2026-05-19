import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  const next = searchParams.get('next') ?? '/conta'

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/callback?next=${next}`,
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/entrar?error=oauth`)
  }

  return NextResponse.redirect(data.url)
}
