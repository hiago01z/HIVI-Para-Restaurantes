import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const orderSchema = z.object({
  restaurant_id: z.string().uuid(),
  type: z.enum(['table', 'delivery']),
  customer_name: z.string().min(1),
  customer_phone: z.string().optional(),
  table_number: z.string().optional(),
  address: z.string().optional(),
  payment_method: z.string().optional(),
  change_for: z.number().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    product_name: z.string(),
    product_price: z.number(),
    quantity: z.number().int().min(1),
    notes: z.string().optional(),
  })).min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = orderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
    }

    const { items, ...orderData } = parsed.data
    const total = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0)

    const supabase = await createClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ ...orderData, total })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(items.map(item => ({ ...item, order_id: order.id })))

    if (itemsError) {
      return NextResponse.json({ error: 'Erro ao salvar itens do pedido' }, { status: 500 })
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
