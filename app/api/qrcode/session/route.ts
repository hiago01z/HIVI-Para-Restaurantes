import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const sessionSchema = z.object({
  restaurantId: z.string().uuid(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    product_name: z.string(),
    product_price: z.number().positive(),
    quantity: z.number().int().positive(),
  })).min(1),
  total: z.number().positive(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = sessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { restaurantId, items, total } = parsed.data

    const supabase = await createClient()

    // Verificar que o restaurante existe e está ativo
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurantId)
      .eq('is_active', true)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    const { data: session, error } = await supabase
      .from('qr_sessions')
      .insert({
        restaurant_id: restaurantId,
        order_data: { items, total },
      })
      .select('id')
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Erro ao criar sessão QR' }, { status: 500 })
    }

    return NextResponse.json({ sessionId: session.id })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
