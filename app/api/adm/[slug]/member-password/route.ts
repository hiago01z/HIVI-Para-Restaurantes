// ============================================================
// HIVI — API: definir senha ADM pessoal do membro
// POST — requer sessão SAAS (Supabase auth cookie)
//        salva restaurant_users.adm_password_hash
// ============================================================

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { hashAdmPassword } from '@/lib/adm-auth'
import { z } from 'zod'

const schema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Requer sessão SAAS para identificar quem é o membro
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Senha inválida' }, { status: 400 })
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Localiza o restaurante
  const { data: restaurant } = await serviceClient
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
  }

  // Verifica que o usuário é membro deste restaurante
  const { data: member } = await serviceClient
    .from('restaurant_users')
    .select('id, role')
    .eq('restaurant_id', restaurant.id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Você não é membro desta equipe' }, { status: 403 })
  }

  // Hash e salva
  const hash = await hashAdmPassword(parsed.data.password)

  const { error } = await serviceClient
    .from('restaurant_users')
    .update({ adm_password_hash: hash })
    .eq('id', member.id)

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar senha' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
