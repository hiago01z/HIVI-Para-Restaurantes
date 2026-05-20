import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const confirmSchema = z.object({
  session_id: z.string().uuid(),
  customer_name: z.string().min(1),
  table_number: z.string().min(1),
})

export async function POST(request: Request) {
  // Rate limit: 20 confirmações por IP por minuto (proteção contra spam de pedidos mesa)
  const ip = getClientIp(request)
  if (!rateLimit(`qr-confirm:${ip}`, 20, 60_000)) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde um momento e tente novamente.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const parsed = confirmSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: session, error: sessionError } = await supabase
      .from('qr_sessions')
      .select('*')
      .eq('id', parsed.data.session_id)
      .eq('confirmed', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 400 })
    }

    const orderData = session.order_data as {
      items: Array<{ product_id: string; product_name: string; product_price: number; quantity: number }>
      total: number
      notes?: string | null
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: session.restaurant_id,
        type: 'table',
        status: 'confirmed',
        customer_name: parsed.data.customer_name,
        table_number: parsed.data.table_number,
        total: orderData.total,
        notes: orderData.notes ?? null,
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
    }

    const { error: itemsError } = await supabase.from('order_items').insert(
      orderData.items.map(item => ({ ...item, order_id: order.id }))
    )

    if (itemsError) {
      // Deletar o pedido órfão (sem itens) para evitar inconsistência
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Erro ao salvar itens do pedido' }, { status: 500 })
    }

    // Salva order_id na sessão — o cliente escuta via Realtime e redireciona
    await supabase
      .from('qr_sessions')
      .update({ confirmed: true, confirmed_at: new Date().toISOString(), order_id: order.id })
      .eq('id', session.id)

    return NextResponse.json({ order }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
