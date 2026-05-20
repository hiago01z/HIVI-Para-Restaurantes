import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendWhatsAppMessage } from '@/lib/ultramsg'

const orderSchema = z.object({
  restaurantId: z.string().uuid(),
  type: z.enum(['table', 'delivery']),
  customer_name: z.string().min(1),
  customer_phone: z.string().optional().nullable(),
  table_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  change_for: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  total: z.number().positive(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    product_name: z.string(),
    product_price: z.number(),
    quantity: z.number().int().min(1),
    notes: z.string().optional().nullable(),
  })).min(1),
})

export async function POST(request: Request) {
  // Rate limit: 10 pedidos por IP por minuto
  const ip = getClientIp(request)
  if (!rateLimit(`orders:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde um momento e tente novamente.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const parsed = orderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { restaurantId, items, total, ...rest } = parsed.data

    const supabase = await createClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ restaurant_id: restaurantId, total, ...rest })
      .select('id, order_number, type, customer_name, total')
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          notes: item.notes ?? null,
        }))
      )

    if (itemsError) {
      // Limpar o pedido órfão antes de retornar erro
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Erro ao salvar itens do pedido' }, { status: 500 })
    }

    // Notificar o restaurante via WhatsApp quando um novo pedido de entrega chegar
    if (order.type === 'delivery') {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('name, whatsapp_number')
        .eq('id', restaurantId)
        .single()

      if (restaurant?.whatsapp_number) {
        const totalFormatted = (order.total as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        const customerName = (order.customer_name as string | null) ?? 'Cliente'
        const message = `🛵 *Novo pedido de entrega!*\n\nPedido #${order.order_number}\nCliente: ${customerName}\nTotal: ${totalFormatted}\n\nAcesse o painel para ver os detalhes e confirmar.`
        // Fire-and-forget: não bloqueia a resposta ao cliente
        sendWhatsAppMessage(restaurant.whatsapp_number, message).catch(() => {})
      }
    }

    return NextResponse.json({ orderId: order.id, orderNumber: order.order_number }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
