import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

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
  // Rate limit: 5 sessões QR por IP por 5 minutos
  const ip = getClientIp(request)
  if (!rateLimit(`qr:${ip}`, 5, 5 * 60_000)) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde alguns minutos e tente novamente.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const parsed = sessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { restaurantId, items, total } = parsed.data

    const supabase = await createClient()

    // Verificar que o restaurante existe
    // Não filtramos is_active aqui porque: (a) o cliente já passou pela página
    // do cardápio (que bloqueia is_active===false) e (b) is_active pode ser null
    // em restaurantes novos (tratamos null como ativo).
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, is_active')
      .eq('id', restaurantId)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    // Bloquear apenas se explicitamente pausado
    if (restaurant.is_active === false) {
      return NextResponse.json({ error: 'Cardápio pausado' }, { status: 403 })
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
