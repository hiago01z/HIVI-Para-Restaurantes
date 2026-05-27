import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdmPassword, createAdmToken, admCookieName, COOKIE_MAX_AGE } from '@/lib/adm-auth'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
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
    return NextResponse.json({ error: 'E-mail ou senha inválidos' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Busca o restaurante pelo slug
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, adm_password_hash, owner_id')
    .eq('slug', slug)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
  }

  // 2. Localiza o usuário pelo e-mail via Admin API
  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const authUser = usersData?.users?.find((u) => u.email === parsed.data.email)

  if (!authUser) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  // 3. Busca o vínculo na equipe do restaurante
  const { data: member } = await supabase
    .from('restaurant_users')
    .select('id, role, name, adm_password_hash')
    .eq('restaurant_id', restaurant.id)
    .eq('user_id', authUser.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  // 4. Determina qual hash verificar
  //    Membros não-dono: restaurant_users.adm_password_hash (senha individual)
  //    Dono: restaurant_users.adm_password_hash (se existir) ou restaurants.adm_password_hash (legado)
  let passwordHash: string | null = member.adm_password_hash ?? null

  if (!passwordHash && restaurant.owner_id === authUser.id) {
    // Dono ainda usa a senha legada definida em /conta
    passwordHash = restaurant.adm_password_hash ?? null
  }

  if (!passwordHash) {
    return NextResponse.json(
      { error: 'Senha ADM não configurada. Acesse hivi-web.com/conta para criar sua senha.' },
      { status: 403 }
    )
  }

  const valid = await verifyAdmPassword(parsed.data.password, passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  // 5. Monta nome de exibição para o token
  const displayName =
    member.name ??
    authUser.user_metadata?.full_name ??
    authUser.user_metadata?.name ??
    parsed.data.email.split('@')[0]

  // Gera novo sessionId e invalida sessões anteriores (single-device)
  const sessionId = crypto.randomUUID()
  await supabase.from('restaurant_users').update({ session_id: sessionId }).eq('id', member.id)
  const token = await createAdmToken(slug, member.role, displayName, member.id, sessionId)
  const cookieName = admCookieName(slug)
  const secure = process.env.NODE_ENV === 'production'
  const secureFlag = secure ? '; Secure' : ''

  const response = NextResponse.json({ ok: true })

  // Usar headers.append para que os dois Set-Cookie coexistam.
  // response.cookies.set() usa um Map<name> internamente — chamar duas vezes
  // com o mesmo nome sobrescreve o primeiro, então usamos a API de baixo nível.

  // 1) Cookie válido em path '/' (sessão real)
  response.headers.append(
    'Set-Cookie',
    `${cookieName}=${token}; Path=/; HttpOnly; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secureFlag}`
  )
  // 2) Expira cookie legado que podia estar em path '/${slug}/adm'
  response.headers.append(
    'Set-Cookie',
    `${cookieName}=; Path=/${slug}/adm; HttpOnly; Max-Age=0; SameSite=Lax${secureFlag}`
  )

  return response
}
