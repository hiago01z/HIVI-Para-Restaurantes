import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'

const checkoutSchema = z.object({
  restaurantName: z.string().min(1, 'Nome obrigatório'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug inválido'),
})

export async function POST(request: Request) {
  try {
    const priceId = process.env.STRIPE_PRICE_BASIC
    if (!priceId) {
      return NextResponse.json({ error: 'Plano não configurado' }, { status: 500 })
    }

    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verifica se o slug já está em uso
    const { data: existing } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', parsed.data.slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Este endereço já está em uso. Escolha outro.' }, { status: 409 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/conta?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/criar-loja?cancelled=1`,
      customer_email: user.email,
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
