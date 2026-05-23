import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { getAdmTokenPayload, admCookieName } from '@/lib/adm-auth'

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const schema = z.object({
  payment_status: z.enum(['paid', 'unpaid']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    // Usa service role — funcionários ADM não têm sessão Supabase Auth,
    // então o RLS bloquearia silenciosamente o UPDATE com createClient()
    const supabase = adminClient()

    // Busca o slug do restaurante para verificar autenticação ADM
    const { data: orderCheck } = await supabase
      .from('orders')
      .select('id, restaurant_id, restaurants(slug)')
      .eq('id', id)
      .single()

    if (!orderCheck) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    const slug = (orderCheck.restaurants as unknown as { slug: string } | null)?.slug
    if (!slug) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    // Verifica autenticação ADM e extrai nome para audit trail
    const cookieStore = await cookies()
    const token = cookieStore.get(admCookieName(slug))?.value
    const admPayload = token ? await getAdmTokenPayload(slug, token) : null
    if (!admPayload) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({
        payment_status: parsed.data.payment_status,
        payment_changed_by: admPayload.name || null,
      })
      .eq('id', id)
      .select('id, payment_status, payment_changed_by')
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 })
    }

    return NextResponse.json({ order })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
