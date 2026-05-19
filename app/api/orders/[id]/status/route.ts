import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const statusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']),
})

const ORDER_STATUS_MESSAGES: Record<string, string> = {
  confirmed: '✅ Seu pedido foi confirmado! Em breve começaremos a preparar.',
  preparing: '👨‍🍳 Seu pedido está sendo preparado com carinho!',
  ready: '✅ Seu pedido está pronto!',
  out_for_delivery: '🛵 Seu pedido saiu para entrega! Aguarde em breve.',
  delivered: '😊 Pedido entregue! Obrigado pela preferência.',
  cancelled: '❌ Infelizmente seu pedido foi cancelado. Entre em contato conosco.',
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = statusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, restaurants(name, whatsapp_number)')
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Disparar WhatsApp apenas para pedidos de entrega
    if (order.type === 'delivery' && order.customer_phone && ORDER_STATUS_MESSAGES[parsed.data.status]) {
      const restaurantName = (order.restaurants as { name: string })?.name ?? 'Restaurante'
      const message = `*${restaurantName}*\n\nPedido #${order.order_number}\n\n${ORDER_STATUS_MESSAGES[parsed.data.status]}`

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: order.customer_phone, message }),
      })
    }

    return NextResponse.json({ order })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
