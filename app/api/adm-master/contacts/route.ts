import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'

const OWNER_EMAIL = 'hiagoalmeida852@gmail.com'

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function authorize() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === OWNER_EMAIL ? user : null
}

// ── GET /api/adm-master/contacts?restaurantId=xxx ─────────────────────────────
export async function GET(request: Request) {
  if (!await authorize()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('restaurantId')
  if (!restaurantId) return NextResponse.json({ error: 'restaurantId obrigatório' }, { status: 400 })

  const { data, error } = await service()
    .from('adm_contacts')
    .select('id, type, content, created_at')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 })
  return NextResponse.json({ contacts: data })
}

// ── POST /api/adm-master/contacts ─────────────────────────────────────────────
const postSchema = z.object({
  restaurant_id: z.string().uuid(),
  type:          z.enum(['welcome_email', 'manual_email', 'note', 'whatsapp', 'call']),
  content:       z.string().max(2000).optional().nullable(),
})

export async function POST(request: Request) {
  if (!await authorize()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { data, error } = await service()
    .from('adm_contacts')
    .insert(parsed.data)
    .select('id, type, content, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Erro ao salvar contato' }, { status: 500 })
  return NextResponse.json({ contact: data }, { status: 201 })
}

// ── DELETE /api/adm-master/contacts?id=xxx ────────────────────────────────────
export async function DELETE(request: Request) {
  if (!await authorize()) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await service().from('adm_contacts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
