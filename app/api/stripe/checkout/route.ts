import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'

const checkoutSchema = z.object({
  priceId: z.string(),
  restaurantName: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: parsed.data.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/conta?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/conta?cancelled=1`,
      metadata: {
        user_id: user.id,
        restaurant_name: parsed.data.restaurantName,
        slug: parsed.data.slug,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500 })
  }
}
