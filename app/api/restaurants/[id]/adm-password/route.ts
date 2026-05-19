import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { hashAdmPassword } from '@/lib/adm-auth'
import { z } from 'zod'

const schema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Confirmar que o restaurante pertence ao dono logado
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const hash = await hashAdmPassword(parsed.data.password)

  const { error } = await supabase
    .from('restaurants')
    .update({ adm_password_hash: hash })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
