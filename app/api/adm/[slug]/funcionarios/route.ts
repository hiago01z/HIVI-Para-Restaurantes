// ============================================================
// HIVI — API de Funcionários do ADM
// GET    → listar membros da equipe
// POST   → adicionar membro (cria conta HIVI via Supabase Admin)
// DELETE → remover membro da equipe
// ============================================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verifyAdmToken, admCookieName } from '@/lib/adm-auth'
import { getEffectiveLimits } from '@/lib/plan-limits'
import { z } from 'zod'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function authorize(slug: string): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(admCookieName(slug))?.value
  if (!token) return false
  return verifyAdmToken(slug, token)
}

// ── GET /api/adm/[slug]/funcionarios ─────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!(await authorize(slug))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = adminClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
  }

  // Inclui name e adm_password_hash para exibir badge "senha ✓"
  const { data: members, error } = await supabase
    .from('restaurant_users')
    .select('id, role, name, adm_password_hash, created_at, user_id')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar funcionários' }, { status: 500 })
  }

  // Enriquecer com email/nome do auth.users (como fallback)
  const enriched = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data: { user } } = await supabase.auth.admin.getUserById(m.user_id)
      return {
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        name: m.name ?? null,                                        // nome definido pelo dono
        auth_name: (user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null) as string | null,
        created_at: m.created_at,
        email: user?.email ?? '—',
        avatar_url: (user?.user_metadata?.avatar_url ?? null) as string | null,
        has_adm_password: !!m.adm_password_hash,
      }
    })
  )

  return NextResponse.json({ members: enriched, restaurantId: restaurant.id })
}

// ── POST /api/adm/[slug]/funcionarios ────────────────────────
const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).nullable().optional(),
  role: z.enum(['owner', 'manager', 'cook', 'waiter', 'delivery']),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!(await authorize(slug))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const supabase = adminClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
  }

  // Verifica limite de equipe do plano
  const { data: restaurantPlan } = await supabase
    .from('restaurants')
    .select('plan, trial_ends_at')
    .eq('id', restaurant.id)
    .single()

  const planLimits = getEffectiveLimits(
    ((restaurantPlan?.plan ?? 'free') as 'free' | 'basic' | 'pro'),
    restaurantPlan?.trial_ends_at
  )

  if (planLimits.maxTeamMembers !== null) {
    const { count } = await supabase
      .from('restaurant_users')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
    if ((count ?? 0) >= planLimits.maxTeamMembers) {
      return NextResponse.json(
        { error: `Limite de ${planLimits.maxTeamMembers} membros atingido no plano gratuito. Assine um plano para equipe ilimitada.` },
        { status: 403 }
      )
    }
  }

  // Verificar se usuário já existe
  const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const existingUser = existingUsers?.users?.find((u) => u.email === parsed.data.email)

  let userId: string

  if (existingUser) {
    userId = existingUser.id
  } else {
    // Criar usuário via invite (Supabase envia e-mail de convite)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hivi-web.com'
    const { data: newUser, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      parsed.data.email,
      { redirectTo: `${appUrl}/auth/callback` }
    )
    if (inviteError || !newUser.user) {
      return NextResponse.json({ error: 'Erro ao enviar convite' }, { status: 500 })
    }
    userId = newUser.user.id
  }

  // Verificar se já é membro
  const { data: existing } = await supabase
    .from('restaurant_users')
    .select('id, role')
    .eq('restaurant_id', restaurant.id)
    .eq('user_id', userId)
    .single()

  if (existing) {
    // Atualizar role e nome se já existe
    await supabase
      .from('restaurant_users')
      .update({ role: parsed.data.role, name: parsed.data.name ?? null })
      .eq('id', existing.id)
    return NextResponse.json({ ok: true, updated: true })
  }

  // Inserir como novo membro
  const { error: insertError } = await supabase
    .from('restaurant_users')
    .insert({
      restaurant_id: restaurant.id,
      user_id: userId,
      role: parsed.data.role,
      name: parsed.data.name ?? null,
    })

  if (insertError) {
    return NextResponse.json({ error: 'Erro ao adicionar funcionário' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, invited: !existingUser })
}

// ── DELETE /api/adm/[slug]/funcionarios ──────────────────────
const removeSchema = z.object({
  memberId: z.string().uuid(),
})

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!(await authorize(slug))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = removeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const supabase = adminClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
  }

  const { data: member } = await supabase
    .from('restaurant_users')
    .select('role')
    .eq('id', parsed.data.memberId)
    .eq('restaurant_id', restaurant.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
  }

  if (member.role === 'owner') {
    return NextResponse.json({ error: 'Não é possível remover o dono do restaurante' }, { status: 403 })
  }

  const { error } = await supabase
    .from('restaurant_users')
    .delete()
    .eq('id', parsed.data.memberId)
    .eq('restaurant_id', restaurant.id)

  if (error) {
    return NextResponse.json({ error: 'Erro ao remover funcionário' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
