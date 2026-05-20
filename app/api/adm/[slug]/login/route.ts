import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdmPassword, createAdmToken, admCookieName, COOKIE_MAX_AGE } from '@/lib/adm-auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({
  password: z.string().min(1),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Rate limit: 5 tentativas por IP por minuto por slug
  const ip = getClientIp(request)
  const allowed = rateLimit(`adm-login:${slug}:${ip}`, 5, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde 1 minuto e tente novamente.' },
      { status: 429 }
    )
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Senha inválida' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, adm_password_hash, is_active')
    .eq('slug', slug)
    .single()

  if (!restaurant || !restaurant.is_active) {
    return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
  }

  if (!restaurant.adm_password_hash) {
    return NextResponse.json({ error: 'Senha ADM não configurada. O dono deve defini-la em hivi-web.com/conta' }, { status: 403 })
  }

  const valid = await verifyAdmPassword(parsed.data.password, restaurant.adm_password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const token = await createAdmToken(slug)
  const cookieName = admCookieName(slug)

  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: `/${slug}/adm`,
  })

  return response
}
