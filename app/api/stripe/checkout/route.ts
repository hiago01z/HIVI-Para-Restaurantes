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
    // .maybeSingle() não lança erro quando não há resultados (diferente de .single())
    const { data: existing } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', parsed.data.slug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Este endereço já está em uso. Escolha outro.' }, { status: 409 })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      console.error('[checkout] STRIPE_SECRET_KEY não configurada')
      return NextResponse.json({ error: 'Configuração de pagamento ausente.' }, { status: 500 })
    }

    const stripe = new Stripe(stripeKey)

    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/conta?success=1`,
        cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/criar-loja?cancelled=1`,
        customer_email: user.email ?? undefined,
        metadata: {
          user_id:         user.id,
          restaurant_name: parsed.data.restaurantName,
          slug:            parsed.data.slug,
        },
      })
    } catch (stripeErr) {
      const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr)
      console.error('[checkout] Stripe error:', msg)
      return NextResponse.json(
        { error: `Erro no pagamento: ${msg}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[checkout] Unexpected error:', msg)
    return NextResponse.json({ error: `Erro inesperado: ${msg}` }, { status: 500 })
  }
}
